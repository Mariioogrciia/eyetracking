'use client';

import { useState, useRef, useEffect } from 'react';
import GazeTracker from '@/components/GazeTracker/GazeTracker';
import CalibrationOverlay from '@/components/GazeTracker/CalibrationOverlay';
import Header from '@/components/Dashboard/Header';
import SystemStatus from '@/components/Dashboard/SystemStatus';
import ClinicalMetrics from '@/components/Dashboard/ClinicalMetrics';
import Biomarkers from '@/components/Dashboard/Biomarkers';
import { useWebGazer } from '@/hooks/useWebGazer';
import styles from './page.module.css';

export default function Dashboard() {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [hasCalibrated, setHasCalibrated] = useState(false);
  const [metrics, setMetrics] = useState({ top: 0, bottom: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { isReady, getPoints, clearPoints } = useWebGazer({
    isMeasuring,
    containerRef,
    canvasWidth: 360,
    canvasHeight: 640
  });

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
            </div>
            
            <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ width: 'auto', padding: '8px 16px', fontSize: '0.75rem' }} disabled={isMeasuring || !hasCalibrated}>
              Export Clinical Report
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
