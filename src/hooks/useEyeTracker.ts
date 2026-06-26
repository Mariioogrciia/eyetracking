import { useEffect, useRef, useState, useCallback } from 'react';
import type { FaceMesh, NormalizedLandmark, NormalizedLandmarkList, Results } from '@mediapipe/face_mesh';

type FaceMeshConstructor = typeof FaceMesh;

type GazeFeature = {
  x: number;
  y: number;
};

type CalibrationMatrix = {
  x: [number, number, number];
  y: [number, number, number];
};

type CalibrationSample = {
  rawX: number;
  rawY: number;
  targetX: number;
  targetY: number;
};

export type Point = {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
  timestamp: number;
  videoTime: number;
  videoId: string;
};

interface UseEyeTrackerProps {
  isMeasuring: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  videoId: string;
}

export function useEyeTracker({
  isMeasuring,
  containerRef,
  videoRef,
  canvasWidth,
  canvasHeight,
  videoId
}: UseEyeTrackerProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const isMeasuringRef = useRef(isMeasuring);
  const stateRef = useRef({ containerRef, videoRef, canvasWidth, canvasHeight, videoId });
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingFrameRef = useRef(false);
  const lastRawFeatureRef = useRef<GazeFeature | null>(null);
  const lastFeatureTimeRef = useRef(0);
  const lastSmoothedPointRef = useRef<{ x: number; y: number } | null>(null);
  const calibrationSamplesRef = useRef<CalibrationSample[]>([]);
  const calibrationMatrixRef = useRef<CalibrationMatrix | null>(null);

  useEffect(() => {
    isMeasuringRef.current = isMeasuring;
  }, [isMeasuring]);

  useEffect(() => {
    stateRef.current = { containerRef, videoRef, canvasWidth, canvasHeight, videoId };
  }, [containerRef, videoRef, canvasWidth, canvasHeight, videoId]);

  const addPointFromFeature = useCallback((feature: GazeFeature) => {
    const state = stateRef.current;
    if (!isMeasuringRef.current) return;

    const matrix = calibrationMatrixRef.current;
    const correctedX = matrix ? matrix.x[0] * feature.x + matrix.x[1] * feature.y + matrix.x[2] : feature.x;
    const correctedY = matrix ? matrix.y[0] * feature.x + matrix.y[1] * feature.y + matrix.y[2] : feature.y;
    const normalizedX = Math.min(1, Math.max(0, correctedX));
    const normalizedY = Math.min(1, Math.max(0, correctedY));
    const rawX = normalizedX * state.canvasWidth;
    const rawY = normalizedY * state.canvasHeight;
    const previous = lastSmoothedPointRef.current;
    const x = previous ? previous.x * 0.62 + rawX * 0.38 : rawX;
    const y = previous ? previous.y * 0.62 + rawY * 0.38 : rawY;

    lastSmoothedPointRef.current = { x, y };

    pointsRef.current.push({
      x,
      y,
      normalizedX: x / state.canvasWidth,
      normalizedY: y / state.canvasHeight,
      timestamp: Date.now(),
      videoTime: state.videoRef.current?.currentTime ?? 0,
      videoId: state.videoId
    });
  }, []);

  const handleResults = useCallback((results: Results) => {
    const landmarks = results.multiFaceLandmarks?.[0];
    const feature = landmarks ? getEyeGazeFeature(landmarks) : null;

    if (!feature) return;

    lastRawFeatureRef.current = feature;
    lastFeatureTimeRef.current = Date.now();
    addPointFromFeature(feature);
  }, [addPointFromFeature]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setError(null);

        const [{ FaceMesh: FaceMeshClass }, stream] = await Promise.all([
          import('@mediapipe/face_mesh') as Promise<{ FaceMesh: FaceMeshConstructor }>,
          navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          })
        ]);

        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const cameraVideo = document.createElement('video');
        cameraVideo.muted = true;
        cameraVideo.playsInline = true;
        cameraVideo.srcObject = stream;
        cameraVideo.style.display = 'none';
        document.body.appendChild(cameraVideo);
        await cameraVideo.play();

        const faceMesh = new FaceMeshClass({
          locateFile: file => `/mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.65
        });
        faceMesh.onResults(handleResults);
        await faceMesh.initialize();

        if (cancelled) {
          await faceMesh.close();
          stream.getTracks().forEach(track => track.stop());
          cameraVideo.remove();
          return;
        }

        faceMeshRef.current = faceMesh;
        cameraVideoRef.current = cameraVideo;
        cameraStreamRef.current = stream;
        setIsReady(true);

        const processFrame = async () => {
          if (!cameraVideoRef.current || !faceMeshRef.current) return;

          if (!isProcessingFrameRef.current && cameraVideoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            isProcessingFrameRef.current = true;
            try {
              await faceMeshRef.current.send({ image: cameraVideoRef.current });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'No se pudo procesar la webcam');
            } finally {
              isProcessingFrameRef.current = false;
            }
          }

          animationFrameRef.current = requestAnimationFrame(processFrame);
        };

        animationFrameRef.current = requestAnimationFrame(processFrame);
      } catch (err) {
        setIsReady(false);
        setError(err instanceof Error ? err.message : 'No se pudo iniciar MediaPipe con la webcam');
      }
    };

    void init();

    return () => {
      cancelled = true;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      void faceMeshRef.current?.close();
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      cameraVideoRef.current?.remove();

      faceMeshRef.current = null;
      cameraStreamRef.current = null;
      cameraVideoRef.current = null;
    };
  }, [handleResults]);

  const clearPoints = useCallback(() => {
    pointsRef.current = [];
    lastSmoothedPointRef.current = null;
  }, []);

  const getPoints = useCallback(() => {
    return pointsRef.current;
  }, []);

  const resetCalibration = useCallback(() => {
    clearPoints();
    calibrationSamplesRef.current = [];
    calibrationMatrixRef.current = null;
  }, [clearPoints]);

  const recordCalibrationPoint = useCallback((
    _screenX: number,
    _screenY: number,
    targetNormalizedX: number,
    targetNormalizedY: number,
    useForLocalCorrection: boolean
  ) => {
    const feature = lastRawFeatureRef.current;

    if (!feature || Date.now() - lastFeatureTimeRef.current > 1000) {
      setError('No detecto tus ojos en la webcam para calibrar');
      return false;
    }

    if (useForLocalCorrection) {
      calibrationSamplesRef.current.push({
        rawX: feature.x,
        rawY: feature.y,
        targetX: targetNormalizedX,
        targetY: targetNormalizedY
      });
      calibrationMatrixRef.current = buildCalibrationMatrix(calibrationSamplesRef.current);
    }

    return true;
  }, []);

  return {
    isReady,
    error,
    pointsRef,
    clearPoints,
    getPoints,
    recordCalibrationPoint,
    resetCalibration
  };
}

function getEyeGazeFeature(landmarks: NormalizedLandmarkList): GazeFeature | null {
  if (landmarks.length < 478) return null;

  const rightEye = getSingleEyeFeature(landmarks, {
    leftCorner: 33,
    rightCorner: 133,
    topLid: 159,
    bottomLid: 145,
    iris: [468, 469, 470, 471, 472]
  });
  const leftEye = getSingleEyeFeature(landmarks, {
    leftCorner: 362,
    rightCorner: 263,
    topLid: 386,
    bottomLid: 374,
    iris: [473, 474, 475, 476, 477]
  });

  if (!rightEye || !leftEye) return null;

  return {
    x: (rightEye.x + leftEye.x) / 2,
    y: (rightEye.y + leftEye.y) / 2
  };
}

function getSingleEyeFeature(
  landmarks: NormalizedLandmarkList,
  indices: {
    leftCorner: number;
    rightCorner: number;
    topLid: number;
    bottomLid: number;
    iris: number[];
  }
): GazeFeature | null {
  const cornerA = landmarks[indices.leftCorner];
  const cornerB = landmarks[indices.rightCorner];
  const top = landmarks[indices.topLid];
  const bottom = landmarks[indices.bottomLid];
  const iris = averageLandmarks(indices.iris.map(index => landmarks[index]));

  if (!cornerA || !cornerB || !top || !bottom || !iris) return null;

  const minX = Math.min(cornerA.x, cornerB.x);
  const maxX = Math.max(cornerA.x, cornerB.x);
  const minY = Math.min(top.y, bottom.y);
  const maxY = Math.max(top.y, bottom.y);
  const width = Math.max(0.0001, maxX - minX);
  const height = Math.max(0.0001, maxY - minY);

  return {
    x: (iris.x - minX) / width,
    y: (iris.y - minY) / height
  };
}

function averageLandmarks(points: Array<NormalizedLandmark | undefined>): NormalizedLandmark | null {
  const validPoints = points.filter((point): point is NormalizedLandmark => Boolean(point));

  if (validPoints.length === 0) return null;

  return {
    x: validPoints.reduce((sum, point) => sum + point.x, 0) / validPoints.length,
    y: validPoints.reduce((sum, point) => sum + point.y, 0) / validPoints.length,
    z: validPoints.reduce((sum, point) => sum + point.z, 0) / validPoints.length
  };
}

function buildCalibrationMatrix(samples: CalibrationSample[]): CalibrationMatrix | null {
  if (samples.length < 6) return null;

  const x = solveAffine(samples, 'targetX');
  const y = solveAffine(samples, 'targetY');

  if (!x || !y) return null;
  return { x, y };
}

function solveAffine(samples: CalibrationSample[], targetKey: 'targetX' | 'targetY'): [number, number, number] | null {
  const normalMatrix = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const normalVector = [0, 0, 0];

  samples.forEach(sample => {
    const row = [sample.rawX, sample.rawY, 1];
    const target = sample[targetKey];

    for (let i = 0; i < 3; i++) {
      normalVector[i] += row[i] * target;
      for (let j = 0; j < 3; j++) {
        normalMatrix[i][j] += row[i] * row[j];
      }
    }
  });

  for (let i = 0; i < 3; i++) {
    normalMatrix[i][i] += 0.000001;
  }

  return solveLinear3(normalMatrix, normalVector);
}

function solveLinear3(matrix: number[][], vector: number[]): [number, number, number] | null {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let column = 0; column < 3; column++) {
    let pivotRow = column;

    for (let row = column + 1; row < 3; row++) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) {
        pivotRow = row;
      }
    }

    if (Math.abs(augmented[pivotRow][column]) < 0.000001) return null;

    [augmented[column], augmented[pivotRow]] = [augmented[pivotRow], augmented[column]];

    const pivot = augmented[column][column];
    for (let index = column; index < 4; index++) {
      augmented[column][index] /= pivot;
    }

    for (let row = 0; row < 3; row++) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index < 4; index++) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }

  return [augmented[0][3], augmented[1][3], augmented[2][3]];
}
