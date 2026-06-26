import styles from '@/app/page.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div style={{ color: 'var(--accent-teal)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" style={{ display: 'none' }}/>
            <path d="M2 12h4l3-9 5 18 3-9h5" />
          </svg>
        </div>
        <div className={styles.logoText}>NeuroScribe AI</div>
        <div className={styles.subtitle}>| Live Oculomotor Biomarker Screening</div>
      </div>
      
      <div className={styles.metadata}>
        <div className={styles.metadataItem}>
          <span className={styles.metadataLabel}>Patient ID</span>
          <span className={`${styles.metadataValue} mono`}>PT-8492-X</span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.metadataLabel}>Session ID</span>
          <span className={`${styles.metadataValue} mono`}>SN-2026-06</span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.metadataLabel}>Mode</span>
          <span className={styles.metadataValue} style={{ color: 'var(--accent-cyan)' }}>Visual Fixation</span>
        </div>
      </div>
    </header>
  );
}
