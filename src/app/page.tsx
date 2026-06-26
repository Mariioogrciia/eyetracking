'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import GazeTracker from '@/components/GazeTracker/GazeTracker';
import CalibrationOverlay from '@/components/GazeTracker/CalibrationOverlay';
import MobileHeatmap from '@/components/Analysis/MobileHeatmap';
import Header from '@/components/Dashboard/Header';
import SystemStatus from '@/components/Dashboard/SystemStatus';
import ClinicalMetrics from '@/components/Dashboard/ClinicalMetrics';
import Biomarkers from '@/components/Dashboard/Biomarkers';
import { useEyeTracker } from '@/hooks/useEyeTracker';
import styles from './page.module.css';

// Mock Dataset
const INITIAL_DATASET = [
  { id: 'v_001', name: 'Stimulus A - Standard', src: '/video.mp4' },
  { id: 'v_002', name: 'Stimulus B - High Contrast', src: '/video2.mp4' },
  { id: 'v_003', name: 'Stimulus C - Dynamic', src: '/video3.mp4' },
];

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<'capture' | 'analysis'>('capture');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [hasCalibrated, setHasCalibrated] = useState(false);
  const [metrics, setMetrics] = useState({ top: 0, bottom: 0 });
  const [dataset, setDataset] = useState(INITIAL_DATASET);
  const [selectedStimulus, setSelectedStimulus] = useState(INITIAL_DATASET[0].id);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoRef, setVideoRef] = useState<React.RefObject<HTMLVideoElement | null>>({ current: null });

  const {
    isReady,
    error: trackingError,
    getPoints,
    clearPoints,
    recordCalibrationPoint,
    resetCalibration
  } = useEyeTracker({
    isMeasuring: isMeasuring && viewMode === 'capture',
    containerRef,
    videoRef,
    canvasWidth: 360,
    canvasHeight: 640,
    videoId: selectedStimulus
  });

  const currentVideoSrc = dataset.find(d => d.id === selectedStimulus)?.src || '';

  // Fetch videos from public directory on mount
  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        if (data.videos && data.videos.length > 0) {
          setDataset(data.videos);
          // Only update selected if current is not in the new list (or on first load)
          setSelectedStimulus(data.videos[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const handleStimulusChange = (nextStimulus: string) => {
    setSelectedStimulus(nextStimulus);
    setIsMeasuring(false);
    clearPoints();
    setMetrics({ top: 0, bottom: 0 });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMeasuring && viewMode === 'capture') {
      interval = setInterval(() => {
        const points = getPoints();
        if (points.length === 0) {
          setMetrics({ top: 0, bottom: 0 });
          return;
        }

        let topCount = 0;
        const midY = 640 / 2;

        points.forEach(p => {
          if (p.y < midY) topCount++;
        });

        const topPercent = Math.round((topCount / points.length) * 100);
        setMetrics({ top: topPercent, bottom: 100 - topPercent });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isMeasuring, viewMode, getPoints]);

  const handleCalibrate = () => {
    setIsMeasuring(false);
    resetCalibration();
    setIsCalibrating(true);
    setHasCalibrated(false);
  };

  const handleCalibrationComplete = () => {
    setIsCalibrating(false);
    setHasCalibrated(true);
  };

  const handleStart = () => {
    videoRef.current?.play().catch(console.error);
    setIsMeasuring(true);
  };

  const handlePause = () => {
    setIsMeasuring(false);
  };

  const handleClear = () => {
    clearPoints();
    setMetrics({ top: 0, bottom: 0 });
  };

  const handleExport = () => {
    const points = getPoints();
    const payload = {
      patientId: 'PT-8492-X',
      sessionId: 'SN-2026-06',
      exportDate: new Date().toISOString(),
      calibrationQuality: hasCalibrated ? 0.96 : 0,
      totalSamples: points.length,
      stimuli: dataset,
      data: points
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_PT-8492-X_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVideoRef = useCallback((ref: React.RefObject<HTMLVideoElement | null>) => {
    setVideoRef(ref);
  }, []);

  return (
    <div className={styles.layout}>
      <Header />

      <main className={styles.main}>
        
        {/* Left Column: Control Panel */}
        <aside className={styles.sidebar}>
          
          {/* View Mode Toggle */}
          <div className={`${styles.card} panel`} style={{ padding: '8px', display: 'flex', gap: '8px' }}>
            <button 
              className={styles.btn} 
              style={{ flex: 1, background: viewMode === 'capture' ? 'var(--bg-panel)' : 'transparent', border: viewMode === 'capture' ? '1px solid var(--border-light)' : '1px solid transparent', color: viewMode === 'capture' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onClick={() => setViewMode('capture')}
            >
              Live Capture
            </button>
            <button 
              className={styles.btn} 
              style={{ flex: 1, background: viewMode === 'analysis' ? 'var(--bg-panel)' : 'transparent', border: viewMode === 'analysis' ? '1px solid var(--border-light)' : '1px solid transparent', color: viewMode === 'analysis' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              onClick={() => setViewMode('analysis')}
            >
              Analysis Report
            </button>
          </div>

          <SystemStatus 
            isReady={isReady}
            error={trackingError}
            isCalibrating={isCalibrating}
            isMeasuring={isMeasuring && viewMode === 'capture'}
            hasCalibrated={hasCalibrated}
          />

          {viewMode === 'capture' ? (
            <>
              <div className={`${styles.card} panel`}>
                <h2 className={styles.sectionTitle}>Stimulus Setup</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Dataset Video</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      value={selectedStimulus} 
                      onChange={(e) => handleStimulusChange(e.target.value)}
                      disabled={isMeasuring}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        cursor: isMeasuring ? 'not-allowed' : 'pointer',
                        width: '100%'
                      }}
                    >
                      {dataset.map(d => (
                        <option key={d.id} value={d.id} style={{ background: '#111827' }}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={`${styles.card} panel`}>
                <h2 className={styles.sectionTitle}>Session Controls</h2>
                <div className={styles.btnGroup}>
                  <button 
                    className={`${styles.btn} ${styles.btnPrimary}`} 
                    onClick={handleCalibrate}
                    disabled={!isReady || isMeasuring}
                  >
                    1. Initial Calibration
                  </button>
                  
                  {!isMeasuring ? (
                    <button 
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={handleStart}
                      disabled={!isReady}
                      title={isReady && !hasCalibrated ? 'Calibration is recommended before collecting clinical data.' : undefined}
                    >
                      2. Start Live Capture
                    </button>
                  ) : (
                    <button 
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={handlePause}
                    >
                      Pause Capture
                    </button>
                  )}
                  
                  <button 
                    className={`${styles.btn} ${styles.btnDanger}`}
                    onClick={handleClear}
                    disabled={isMeasuring}
                  >
                    Reset Visual Data
                  </button>
                </div>
              </div>

              <ClinicalMetrics metrics={metrics} isMeasuring={isMeasuring} />
            </>
          ) : (
            /* Analysis Controls */
            <div className={`${styles.card} panel`}>
              <h2 className={styles.sectionTitle}>Session Data Summary</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Stimulus</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{dataset.find(d => d.id === selectedStimulus)?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Data Points</span>
                  <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{getPoints().length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Quality Score</span>
                  <span className="mono" style={{ fontSize: '0.85rem', color: hasCalibrated ? 'var(--accent-teal)' : 'var(--accent-coral)' }}>
                    {hasCalibrated ? '96%' : 'Untracked'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Biomarkers />

        </aside>

        {/* Right Column: Viewport */}
        <section className={styles.viewportArea}>
          <div className={styles.viewportContainer}>
            {viewMode === 'capture' ? (
              <GazeTracker 
                ref={containerRef}
                isMeasuring={isMeasuring}
                getPoints={getPoints}
                videoSrc={currentVideoSrc}
                onVideoRef={handleVideoRef}
              />
            ) : (
              <MobileHeatmap points={getPoints()} />
            )}
          </div>
          
          {/* Bottom Summary Bar */}
          <div className={`${styles.bottomSummary} panel`}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session Progress</span>
                <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {viewMode === 'analysis' ? 'Analysis Mode' : (isMeasuring ? 'In Progress' : 'Idle')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data Points</span>
                <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{getPoints().length}</span>
              </div>
            </div>
            
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`} 
              style={{ width: 'auto', padding: '8px 16px', fontSize: '0.75rem', background: 'var(--accent-violet)' }} 
              onClick={handleExport}
              disabled={(isMeasuring && viewMode === 'capture') || getPoints().length === 0}
            >
              Export Clinical Report (JSON)
            </button>
          </div>
        </section>

      </main>

      {isCalibrating && (
        <CalibrationOverlay
          onComplete={handleCalibrationComplete}
          onPointClick={recordCalibrationPoint}
          calibrationTargetRef={containerRef}
        />
      )}
    </div>
  );
}
