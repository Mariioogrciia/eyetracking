import { useState, useEffect } from 'react';

interface CalibrationOverlayProps {
  onComplete: () => void;
}

const CLICKS_PER_POINT = 5;
const POSITIONS = [15, 50, 85];

export default function CalibrationOverlay({ onComplete }: CalibrationOverlayProps) {
  const [pointsState, setPointsState] = useState<Record<string, number>>({});

  useEffect(() => {
    // Check if all 9 points have reached CLICKS_PER_POINT
    let completed = 0;
    POSITIONS.forEach(y => {
      POSITIONS.forEach(x => {
        const key = `${x}-${y}`;
        if ((pointsState[key] || 0) >= CLICKS_PER_POINT) {
          completed++;
        }
      });
    });

    if (completed === 9) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [pointsState, onComplete]);

  const handleClick = (x: number, y: number) => {
    const key = `${x}-${y}`;
    setPointsState(prev => ({
      ...prev,
      [key]: Math.min((prev[key] || 0) + 1, CLICKS_PER_POINT)
    }));
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(255, 255, 255, 0.95)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ position: 'absolute', fontSize: '24px', fontWeight: 'bold', color: '#333', textAlign: 'center', pointerEvents: 'none' }}>
        Mira el punto y haz clic 5 veces en él. Trata de no mover la cabeza.
      </div>
      
      {POSITIONS.map(y => (
        POSITIONS.map(x => {
          const key = `${x}-${y}`;
          const clicks = pointsState[key] || 0;
          const isDone = clicks >= CLICKS_PER_POINT;
          const remaining = CLICKS_PER_POINT - clicks;

          return (
            <div
              key={key}
              onClick={() => handleClick(x, y)}
              style={{
                position: 'absolute',
                left: `${x}vw`,
                top: `${y}vh`,
                width: '30px',
                height: '30px',
                backgroundColor: isDone ? 'green' : (clicks > 0 ? '#fca311' : '#e63946'),
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                cursor: isDone ? 'default' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                boxShadow: isDone ? 'none' : '0 0 10px rgba(230, 57, 70, 0.5)',
                pointerEvents: isDone ? 'none' : 'auto',
                transition: 'background-color 0.2s',
              }}
            >
              {isDone ? '✓' : remaining}
            </div>
          );
        })
      ))}
    </div>
  );
}
