import styles from '@/app/page.module.css';

interface SystemStatusProps {
  isReady: boolean;
  isCalibrating: boolean;
  isMeasuring: boolean;
  hasCalibrated: boolean;
}

export default function SystemStatus({ isReady, isCalibrating, isMeasuring, hasCalibrated }: SystemStatusProps) {
  
  const getStatusDisplay = () => {
    if (!isReady) return { text: 'Initializing...', color: 'var(--text-muted)' };
    if (isCalibrating) return { text: 'Calibrating...', color: 'var(--accent-violet)' };
    if (isMeasuring) return { text: 'Active Recording', color: 'var(--accent-coral)' };
    if (hasCalibrated) return { text: 'System Ready', color: 'var(--accent-teal)' };
    return { text: 'Awaiting Calibration', color: 'var(--accent-cyan)' };
  };

  const status = getStatusDisplay();

  return (
    <div className={`${styles.card} panel`}>
      <h2 className={styles.sectionTitle}>System Status</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isMeasuring && <span className="recording-dot"></span>}
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: status.color }}>
              {status.text}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Camera Feed</span>
          <span style={{ fontSize: '0.85rem', color: isReady ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {isReady ? 'Active' : 'Offline'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Eye Tracking</span>
          <span style={{ fontSize: '0.85rem', color: hasCalibrated ? 'var(--accent-teal)' : 'var(--text-muted)' }}>
            {hasCalibrated ? 'Locked' : 'Uncalibrated'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Signal Confidence</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <div style={{ width: '12px', height: '4px', background: hasCalibrated ? 'var(--accent-teal)' : 'var(--border-light)', borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '4px', background: hasCalibrated ? 'var(--accent-teal)' : 'var(--border-light)', borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '4px', background: hasCalibrated ? 'var(--accent-teal)' : 'var(--border-light)', borderRadius: '2px' }} />
            <div style={{ width: '12px', height: '4px', background: isMeasuring ? 'var(--accent-teal)' : 'var(--border-light)', borderRadius: '2px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calibration Quality</span>
          <span className="mono" style={{ fontSize: '0.85rem', color: hasCalibrated ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            {hasCalibrated ? '96%' : '--'}
          </span>
        </div>

      </div>
    </div>
  );
}
