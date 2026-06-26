import { useEffect, useRef } from 'react';
import type { Point } from '@/hooks/useWebGazer';

interface HeatmapOverlayProps {
  width: number;
  height: number;
  getPoints: () => Point[];
  isMeasuring: boolean;
}

export default function HeatmapOverlay({ width, height, getPoints, isMeasuring }: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (isMeasuring) {
        const points = getPoints();
        // Use a very faint clear to leave a slight trail, or clear entirely for sharp updates
        ctx.clearRect(0, 0, width, height);

        points.forEach((p) => {
          // Premium medical heatmap gradient
          const radius = 35; // slightly larger for smoother blending
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          
          gradient.addColorStop(0, 'rgba(244, 63, 94, 0.4)');   // Coral (Hot)
          gradient.addColorStop(0.3, 'rgba(234, 179, 8, 0.2)'); // Yellow
          gradient.addColorStop(0.6, 'rgba(6, 182, 212, 0.1)'); // Cyan (Cold)
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');     // Transparent
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [getPoints, isMeasuring, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        mixBlendMode: 'screen', // clinical tech feel
      }}
    />
  );
}
