import { useEffect, useRef, useState } from 'react';
import type { Point } from '@/hooks/useWebGazer';

interface MobileHeatmapProps {
  points: Point[];
}

export default function MobileHeatmap({ points }: MobileHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 360, height: 640 });

  useEffect(() => {
    // Resize observer to keep canvas perfectly matched to the mobile wireframe inner size
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw aggregated heatmap points using normalized coordinates
    points.forEach((p) => {
      // Convert normalized (0-1) to physical canvas pixels
      const px = p.normalizedX * dimensions.width;
      const py = p.normalizedY * dimensions.height;
      
      const radius = 40; 
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
      
      // Clinical static gradient (a bit more intense since it's aggregated)
      gradient.addColorStop(0, 'rgba(244, 63, 94, 0.08)');   // Coral (Hot)
      gradient.addColorStop(0.3, 'rgba(234, 179, 8, 0.04)'); // Yellow
      gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.02)'); // Cyan
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');      // Transparent
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points, dimensions]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px'
    }}>
      {/* Mobile Wireframe */}
      <div style={{
        position: 'relative',
        height: '100%',
        width: 'auto',
        aspectRatio: '9/16',
        borderRadius: '36px',
        border: '8px solid #1E293B',
        backgroundColor: '#0B0E14',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)',
        padding: '4px', // Inner bezel
        overflow: 'hidden'
      }}>
        
        {/* Notch / Dynamic Island */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80px',
          height: '24px',
          backgroundColor: '#1E293B',
          borderRadius: '12px',
          zIndex: 30,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0B0E14', marginRight: '8px' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Screen Area */}
        <div 
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#0F172A',
            borderRadius: '28px',
            overflow: 'hidden',
            backgroundImage: 'linear-gradient(45deg, #0F172A 25%, #111827 25%, #111827 50%, #0F172A 50%, #0F172A 75%, #111827 75%, #111827 100%)',
            backgroundSize: '20px 20px' // Grid background to represent "blank pitch"
          }}
        >
          {points.length === 0 && (
            <div style={{ position: 'absolute', top: '50%', width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No gaze data collected yet.
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              mixBlendMode: 'screen',
            }}
          />
        </div>
      </div>
    </div>
  );
}
