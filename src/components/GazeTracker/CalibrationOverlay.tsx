import { useState, useEffect, type RefObject } from 'react';

interface CalibrationOverlayProps {
  onComplete: () => void;
  onPointClick: (
    screenX: number,
    screenY: number,
    targetNormalizedX: number,
    targetNormalizedY: number,
    useForLocalCorrection: boolean
  ) => void;
  calibrationTargetRef: RefObject<HTMLDivElement | null>;
}

const CLICKS_PER_POINT = 5;
const CALIBRATION_POINTS = [
  { x: 0.5, y: 0.5 },
  { x: 0.1, y: 0.1 },
  { x: 0.5, y: 0.1 },
  { x: 0.9, y: 0.1 },
  { x: 0.1, y: 0.5 },
  { x: 0.9, y: 0.5 },
  { x: 0.1, y: 0.9 },
  { x: 0.5, y: 0.9 },
  { x: 0.9, y: 0.9 },
];

export default function CalibrationOverlay({ onComplete, onPointClick, calibrationTargetRef }: CalibrationOverlayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [clicksOnCurrentPoint, setClicksOnCurrentPoint] = useState(0);
  const [targetBounds, setTargetBounds] = useState<DOMRect | null>(null);
  const activePoint = CALIBRATION_POINTS[activeIndex];
  const isComplete = activeIndex >= CALIBRATION_POINTS.length;

  useEffect(() => {
    let animationFrameId: number | undefined;

    const updateBounds = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        setTargetBounds(calibrationTargetRef.current?.getBoundingClientRect() ?? null);
      });
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);

    return () => {
      window.removeEventListener('resize', updateBounds);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [calibrationTargetRef]);

  useEffect(() => {
    if (isComplete) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [isComplete, onComplete]);

  const handleClick = () => {
    if (isComplete || !activePoint || !targetBounds) return;

    const screenX = targetBounds.left + targetBounds.width * activePoint.x;
    const screenY = targetBounds.top + targetBounds.height * activePoint.y;
    const nextClickCount = clicksOnCurrentPoint + 1;
    
    onPointClick(
      screenX,
      screenY,
      activePoint.x,
      activePoint.y,
      nextClickCount >= 3
    );

    setClicksOnCurrentPoint(prev => {
      const next = prev + 1;
      if (next >= CLICKS_PER_POINT) {
        setActiveIndex(index => index + 1);
        return 0;
      }
      return next;
    });
  };

  const completedPoints = Math.min(activeIndex, CALIBRATION_POINTS.length);
  const totalClicks = completedPoints * CLICKS_PER_POINT + clicksOnCurrentPoint;
  const totalRequiredClicks = CALIBRATION_POINTS.length * CLICKS_PER_POINT;
  const remaining = CLICKS_PER_POINT - clicksOnCurrentPoint;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(255, 255, 255, 0.88)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ position: 'absolute', fontSize: '24px', fontWeight: 'bold', color: '#333', textAlign: 'center', pointerEvents: 'none' }}>
        Mira el punto dentro del vídeo y haz clic 5 veces.
        <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 500, color: '#666' }}>
          {Math.min(totalClicks, totalRequiredClicks)} / {totalRequiredClicks}
        </div>
      </div>

      {targetBounds && (
        <div
          style={{
            position: 'absolute',
            left: targetBounds.left,
            top: targetBounds.top,
            width: targetBounds.width,
            height: targetBounds.height,
            border: '2px solid #111827',
            borderRadius: '12px',
            pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(255,255,255,0.16)',
          }}
        />
      )}

      {!isComplete && activePoint && targetBounds && (
        <div
          onClick={handleClick}
          style={{
            position: 'absolute',
            left: targetBounds.left + targetBounds.width * activePoint.x,
            top: targetBounds.top + targetBounds.height * activePoint.y,
            width: '38px',
            height: '38px',
            backgroundColor: clicksOnCurrentPoint > 0 ? '#fca311' : '#e63946',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '13px',
            boxShadow: '0 0 0 10px rgba(230, 57, 70, 0.12), 0 0 18px rgba(230, 57, 70, 0.5)',
            transition: 'background-color 0.2s, transform 0.2s',
          }}
        >
          {remaining}
        </div>
      )}
    </div>
  );
}
