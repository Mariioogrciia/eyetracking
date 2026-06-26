import { useEffect, useRef, useState, useCallback } from 'react';

export type Point = { x: number; y: number };

interface UseWebGazerProps {
  isMeasuring: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasWidth: number;
  canvasHeight: number;
}

export function useWebGazer({ isMeasuring, containerRef, canvasWidth, canvasHeight }: UseWebGazerProps) {
  const [isReady, setIsReady] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const webgazerRef = useRef<any>(null);
  
  // To avoid constant state updates on every frame, we could mutate a ref for points and only expose state periodically
  // but for a React MVP, updating state can be okay if we throttle or handle it efficiently.
  // Actually, WebGazer fires rapidly. A mutable ref is better for performance, and we can force an update for metrics.
  const pointsRef = useRef<Point[]>([]);

  const initWebGazer = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).webgazer) return;
    
    const wg = (window as any).webgazer;
    webgazerRef.current = wg;

    await wg.setRegression('ridge')
      .setGazeListener((data: any, elapsedTime: number) => {
        if (!data) return;
        
        // This is tricky: we only record points if we're measuring, 
        // but the listener is global. We use a mutable ref for measuring state or check the closure?
        // Since setGazeListener captures the initial closure, it's safer to access a ref or window variable,
        // OR we can just rely on the component using the returned `pointsRef`.
      })
      .begin();

    wg.showVideoPreview(false).showPredictionPoints(false);
    setIsReady(true);
  }, []);

  // We need a way to let the gaze listener know about `isMeasuring` and `containerRef`.
  // Since we don't want to re-register the listener, we use refs.
  const stateRef = useRef({ isMeasuring, containerRef, canvasWidth, canvasHeight });
  
  useEffect(() => {
    stateRef.current = { isMeasuring, containerRef, canvasWidth, canvasHeight };
  }, [isMeasuring, containerRef, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webgazer && !isReady) {
      // Re-register listener safely
      const wg = (window as any).webgazer;
      
      wg.setGazeListener((data: any) => {
        if (!data) return;
        const state = stateRef.current;
        if (!state.isMeasuring || !state.containerRef.current) return;

        const rect = state.containerRef.current.getBoundingClientRect();
        const xRel = data.x - rect.left;
        const yRel = data.y - rect.top;

        if (xRel >= 0 && xRel <= rect.width && yRel >= 0 && yRel <= rect.height) {
          const scaleX = state.canvasWidth / rect.width;
          const scaleY = state.canvasHeight / rect.height;
          
          pointsRef.current.push({
            x: xRel * scaleX,
            y: yRel * scaleY
          });
        }
      });
      
      if (!isReady) {
         initWebGazer();
      }
    }

    return () => {
      // Cleanup? WebGazer is a singleton. 
      // wg.end() would stop the camera entirely. We might not want to do this on component unmount if navigating.
    };
  }, [initWebGazer, isReady]);

  const clearPoints = useCallback(() => {
    pointsRef.current = [];
    setPoints([]); // force update if needed
  }, []);

  const getPoints = useCallback(() => {
    return pointsRef.current;
  }, []);

  return {
    isReady,
    pointsRef,
    clearPoints,
    getPoints
  };
}
