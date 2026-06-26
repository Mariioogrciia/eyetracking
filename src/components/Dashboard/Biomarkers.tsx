import styles from '@/app/page.module.css';

export default function Biomarkers() {
  return (
    <div className={`${styles.card} panel`} style={{ flex: 1 }}>
      <h2 className={styles.sectionTitle}>Biomarker Highlights</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', marginTop: '6px' }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>Pursuit stability within normal range</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Smooth tracking detected consistently.</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-coral)', marginTop: '6px' }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>Fixation variance elevated</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Micro-saccades observed during center focus.</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', marginTop: '6px' }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>Lower-field attention reduced</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Primary visual clustering in upper quadrants.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
