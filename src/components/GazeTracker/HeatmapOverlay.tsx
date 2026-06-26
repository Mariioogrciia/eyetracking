import { useEffect, useRef } from 'react';
import type { Point } from '@/hooks/useEyeTracker';

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
        const points = getPoints().slice(-180);
        ctx.clearRect(0, 0, width, height);

        points.forEach((p, index) => {
          const ageWeight = (index + 1) / points.length;
          // Premium medical heatmap gradient
          const radius = 24 + ageWeight * 18;
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
          
          gradient.addColorStop(0, `rgba(244, 63, 94, ${0.08 + ageWeight * 0.28})`);
          gradient.addColorStop(0.35, `rgba(234, 179, 8, ${0.04 + ageWeight * 0.14})`);
          gradient.addColorStop(0.7, `rgba(6, 182, 212, ${0.02 + ageWeight * 0.08})`);
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        });

        const latestPoint = points.at(-1);
        if (latestPoint) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(latestPoint.x, latestPoint.y, 8, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(244, 63, 94, 0.95)';
          ctx.beginPath();
          ctx.arc(latestPoint.x, latestPoint.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.clearRect(0, 0, width, height);
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
