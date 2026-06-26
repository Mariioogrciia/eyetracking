import { useEffect, useRef, useState, useCallback } from 'react';

export type Point = { 
  x: number; 
  y: number; 
  normalizedX: number;
  normalizedY: number;
  timestamp: number;
  videoTime: number;
  videoId: string;
};

interface UseWebGazerProps {
  isMeasuring: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  videoId: string;
}

export function useWebGazer({ isMeasuring, containerRef, videoRef, canvasWidth, canvasHeight, videoId }: UseWebGazerProps) {
  const [isReady, setIsReady] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const webgazerRef = useRef<any>(null);
  const pointsRef = useRef<Point[]>([]);

  const initWebGazer = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).webgazer) return;
    
    const wg = (window as any).webgazer;
    webgazerRef.current = wg;

    await wg.setRegression('ridge')
      .setGazeListener((data: any) => {
        // We handle capture logic inside the useEffect to have fresh closure state via refs
      })
      .begin();

    wg.showVideoPreview(false).showPredictionPoints(false);
    setIsReady(true);
  }, []);

  const stateRef = useRef({ isMeasuring, containerRef, videoRef, canvasWidth, canvasHeight, videoId });
  
  useEffect(() => {
    stateRef.current = { isMeasuring, containerRef, videoRef, canvasWidth, canvasHeight, videoId };
  }, [isMeasuring, containerRef, videoRef, canvasWidth, canvasHeight, videoId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webgazer && !isReady) {
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
          
          const normalizedX = xRel / rect.width;
          const normalizedY = yRel / rect.height;
          
          let currentVideoTime = 0;
          if (state.videoRef.current) {
            currentVideoTime = state.videoRef.current.currentTime;
          }

          pointsRef.current.push({
            x: xRel * scaleX,
            y: yRel * scaleY,
            normalizedX,
            normalizedY,
            timestamp: Date.now(),
            videoTime: currentVideoTime,
            videoId: state.videoId
          });
        }
      });
      
      if (!isReady) {
         initWebGazer();
      }
    }
  }, [initWebGazer, isReady]);

  const clearPoints = useCallback(() => {
    pointsRef.current = [];
    setPoints([]);
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
