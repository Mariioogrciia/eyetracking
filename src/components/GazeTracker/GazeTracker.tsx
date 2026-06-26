import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import HeatmapOverlay from './HeatmapOverlay';
import type { Point } from '@/hooks/useWebGazer';

interface GazeTrackerProps {
  isMeasuring: boolean;
  getPoints: () => Point[];
  canvasWidth?: number;
  canvasHeight?: number;
}

const GazeTracker = forwardRef<HTMLDivElement, GazeTrackerProps>(
  ({ isMeasuring, getPoints, canvasWidth = 360, canvasHeight = 640 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState('');

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    useEffect(() => {
      const timer = setInterval(() => {
        const now = new Date();
        setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}:${now.getMilliseconds().toString().padStart(3, '0')}`);
      }, 50);
      return () => clearInterval(timer);
    }, []);

    return (
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxHeight: 'calc(100vh - 112px)', // minus header and padding
          aspectRatio: '9/16',
          margin: '0 auto',
          backgroundColor: '#000',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#666',
        }}
      >
        <div style={{ zIndex: 0, padding: '20px', textAlign: 'center' }}>
          Coloca video.mp4 en la carpeta public para la demo.
        </div>
        
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            opacity: isMeasuring ? 1 : 0.6,
            transition: 'opacity 0.5s ease',
            filter: 'contrast(1.1) saturate(1.1)',
          }}
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>

        {/* Viewport UI Overlays */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
          {/* Corner marks */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', width: '20px', height: '20px', borderTop: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)' }} />
          <div style={{ position: 'absolute', top: '20px', right: '20px', width: '20px', height: '20px', borderTop: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)' }} />
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)' }} />
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '20px', height: '20px', borderBottom: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)' }} />
          
          {/* Top Info Bar */}
          <div style={{ position: 'absolute', top: '24px', left: '48px', right: '48px', display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <span className="mono">{currentTime}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isMeasuring && <span className="recording-dot" style={{ width: '6px', height: '6px' }}></span>}
              <span style={{ color: isMeasuring ? 'var(--accent-coral)' : 'var(--text-muted)' }}>LIVE OCULOMOTOR CAPTURE</span>
            </div>
          </div>

          {/* Crosshairs */}
          <div style={{ position: 'absolute', top: '50%', left: '48px', right: '48px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '48px', bottom: '48px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '30px', height: '30px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%' }} />
        </div>

        {/* Note: In a real implementation we would dynamically resize canvas width/height to match container, but for this MVP 360x640 is hardcoded in the parent hook, so we pass it explicitly here if needed. To be responsive we scale it via CSS. */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
           <HeatmapOverlay 
             width={canvasWidth} 
             height={canvasHeight} 
             getPoints={getPoints} 
             isMeasuring={isMeasuring} 
           />
        </div>
      </div>
    );
  }
);

GazeTracker.displayName = 'GazeTracker';

export default GazeTracker;
