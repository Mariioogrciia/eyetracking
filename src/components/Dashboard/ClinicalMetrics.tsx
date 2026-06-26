import styles from '@/app/page.module.css';

interface ClinicalMetricsProps {
  metrics: { top: number; bottom: number };
  isMeasuring: boolean;
}

export default function ClinicalMetrics({ metrics, isMeasuring }: ClinicalMetricsProps) {
  
  // Simulated derived metrics for clinical feel
  const leftRightSymmetry = isMeasuring && metrics.top > 0 ? Math.min(100, Math.max(0, 50 + (Math.random() * 10 - 5))) : 0;
  const fixationStability = isMeasuring && metrics.top > 0 ? 82 + (Math.random() * 5) : 0;
  const blinkRate = isMeasuring ? 14 + Math.floor(Math.random() * 3) : 0;

  return (
    <div className={`${styles.card} panel`}>
      <h2 className={styles.sectionTitle}>Live Metrics</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Upper / Lower Attention */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vertical Attention Split</span>
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
              {metrics.top}% / {metrics.bottom}%
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ height: '100%', width: `${metrics.top}%`, background: 'var(--accent-cyan)', transition: 'width 0.5s ease' }} />
            <div style={{ height: '100%', width: `${metrics.bottom}%`, background: 'var(--accent-teal)', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Symmetry */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>L-R Symmetry</span>
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
              {leftRightSymmetry ? leftRightSymmetry.toFixed(1) + '%' : '--'}
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%', background: 'rgba(255,255,255,0.5)', zIndex: 1 }} />
            <div style={{ height: '100%', width: `${leftRightSymmetry}%`, background: 'var(--accent-violet)', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Fixation Stability */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fixation Stability</span>
            <span className="mono" style={{ fontSize: '0.8rem', color: fixationStability > 80 ? 'var(--accent-teal)' : 'var(--text-primary)' }}>
              {fixationStability ? fixationStability.toFixed(1) + '%' : '--'}
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${fixationStability}%`, background: fixationStability > 80 ? 'var(--accent-teal)' : 'var(--accent-cyan)', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Blink Rate */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Blink Rate</span>
          <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            {blinkRate ? `${blinkRate} / min` : '--'}
          </span>
        </div>

      </div>
    </div>
  );
}
