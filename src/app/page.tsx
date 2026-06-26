'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import GazeTracker from '@/components/GazeTracker/GazeTracker';
import CalibrationOverlay from '@/components/GazeTracker/CalibrationOverlay';
import Header from '@/components/Dashboard/Header';
import SystemStatus from '@/components/Dashboard/SystemStatus';
import ClinicalMetrics from '@/components/Dashboard/ClinicalMetrics';
import Biomarkers from '@/components/Dashboard/Biomarkers';
import { useWebGazer } from '@/hooks/useWebGazer';
import styles from './page.module.css';

// Mock Dataset
const DATASET = [
  { id: 'v_001', name: 'Stimulus A - Standard', src: '/video.mp4' },
  { id: 'v_002', name: 'Stimulus B - High Contrast', src: '/video2.mp4' },
  { id: 'v_003', name: 'Stimulus C - Dynamic', src: '/video3.mp4' },
];

export default function Dashboard() {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [hasCalibrated, setHasCalibrated] = useState(false);
  const [metrics, setMetrics] = useState({ top: 0, bottom: 0 });
  const [selectedStimulus, setSelectedStimulus] = useState(DATASET[0].id);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoRef, setVideoRef] = useState<React.RefObject<HTMLVideoElement | null>>({ current: null });

  const { isReady, getPoints, clearPoints } = useWebGazer({
    isMeasuring,
    containerRef,
    videoRef,
    canvasWidth: 360,
    canvasHeight: 640,
    videoId: selectedStimulus
  });

  const currentVideoSrc = DATASET.find(d => d.id === selectedStimulus)?.src || '';

  // Clean data when changing stimulus
  useEffect(() => {
    if (isMeasuring) {
      setIsMeasuring(false);
    }
    clearPoints();
    setMetrics({ top: 0, bottom: 0 });
  }, [selectedStimulus, clearPoints]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMeasuring) {
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
  }, [isMeasuring, getPoints]);

  const handleCalibrate = () => {
    setIsMeasuring(false);
    clearPoints();
    setIsCalibrating(true);
    setHasCalibrated(false);
  };

  const handleCalibrationComplete = () => {
    setIsCalibrating(false);
    setHasCalibrated(true);
  };

  const handleStart = () => {
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
      stimuli: DATASET,
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
          
          <SystemStatus 
            isReady={isReady}
            isCalibrating={isCalibrating}
            isMeasuring={isMeasuring}
            hasCalibrated={hasCalibrated}
          />

          <div className={`${styles.card} panel`}>
            <h2 className={styles.sectionTitle}>Stimulus Setup</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Dataset Video</label>
              <select 
                value={selectedStimulus} 
                onChange={(e) => setSelectedStimulus(e.target.value)}
                disabled={isMeasuring}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  cursor: isMeasuring ? 'not-allowed' : 'pointer'
                }}
              >
                {DATASET.map(d => (
                  <option key={d.id} value={d.id} style={{ background: '#111827' }}>
                    {d.id} - {d.name}
                  </option>
                ))}
              </select>
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
                  disabled={!hasCalibrated}
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
          
          <Biomarkers />

        </aside>

        {/* Right Column: Viewport */}
        <section className={styles.viewportArea}>
          <div className={styles.viewportContainer}>
            <GazeTracker 
              ref={containerRef}
              isMeasuring={isMeasuring}
              getPoints={getPoints}
              videoSrc={currentVideoSrc}
              onVideoRef={handleVideoRef}
            />
          </div>
          
          {/* Bottom Summary Bar */}
          <div className={`${styles.bottomSummary} panel`}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session Progress</span>
                <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{isMeasuring ? 'In Progress' : 'Idle'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Capture FPS</span>
                <span className="mono" style={{ fontSize: '0.85rem', color: isMeasuring ? 'var(--accent-teal)' : 'var(--text-muted)' }}>{isMeasuring ? '60.0' : '--'}</span>
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
              disabled={isMeasuring || getPoints().length === 0}
            >
              Export Clinical Report (JSON)
            </button>
          </div>
        </section>

      </main>

      {isCalibrating && (
        <CalibrationOverlay onComplete={handleCalibrationComplete} />
      )}
    </div>
  );
}
