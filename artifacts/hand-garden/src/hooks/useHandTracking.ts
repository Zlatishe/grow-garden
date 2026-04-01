import { useEffect, useRef, useCallback, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { GestureDetector, GestureEvent } from '../lib/gestureDetector';

export type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

// Detect mobile devices — lower resources available for WASM inference
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  || window.innerWidth <= 768;

export function useHandTracking(
  onGesture: (event: GestureEvent) => void,
  enabled: boolean
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const gestureDetector = useRef(new GestureDetector());
  const cameraRef = useRef<Camera | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const destroyedRef = useRef(false);
  const processingRef = useRef(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [handsDetected, setHandsDetected] = useState(0);

  const onGestureRef = useRef(onGesture);
  onGestureRef.current = onGesture;

  useEffect(() => {
    return gestureDetector.current.onGesture((event) => {
      onGestureRef.current(event);
    });
  }, []);

  const startTracking = useCallback(async () => {
    if (!videoRef.current || cameraState === 'active') return;

    setCameraState('requesting');
    destroyedRef.current = false;

    try {
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 2,
        // Lite model (0) is 2-3× faster on mobile — critical for sufficient frame rate
        modelComplexity: isMobile ? 0 : 1,
        // Slightly looser thresholds on mobile: Lite model is less precise,
        // loosening prevents dropping valid detections
        minDetectionConfidence: isMobile ? 0.5 : 0.6,
        minTrackingConfidence: isMobile ? 0.4 : 0.5,
      });

      hands.onResults((results: Results) => {
        if (destroyedRef.current) return;
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setHandsDetected(results.multiHandLandmarks.length);
          const handedness = results.multiHandedness?.map(
            (h: { label: string; score: number; index?: number }) => ({
              label: h.label,
              score: h.score,
              index: h.index,
            })
          );
          gestureDetector.current.processHands(
            results.multiHandLandmarks,
            handedness
          );
        } else {
          setHandsDetected(0);
        }
      });

      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (destroyedRef.current) return;
          // Frame skipping: if MediaPipe is still processing the previous frame,
          // skip this one rather than letting frames queue up (causes growing latency)
          if (processingRef.current) return;
          if (videoRef.current && handsRef.current) {
            processingRef.current = true;
            try {
              await handsRef.current.send({ image: videoRef.current });
            } catch {
            } finally {
              processingRef.current = false;
            }
          }
        },
        // Lower resolution on mobile: MediaPipe downscales to 256×256 internally anyway.
        // 480×360 reduces per-frame pixel count by ~44%, directly speeding up inference.
        width: isMobile ? 480 : 640,
        height: isMobile ? 360 : 480,
      });

      cameraRef.current = camera;
      await camera.start();
      setCameraState('active');
    } catch (err: unknown) {
      console.error('Camera error:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setCameraState('denied');
      } else {
        setCameraState('error');
      }
    }
  }, [cameraState]);

  useEffect(() => {
    if (enabled && cameraState === 'idle') {
      startTracking();
    }
  }, [enabled, cameraState, startTracking]);

  useEffect(() => {
    return () => {
      destroyedRef.current = true;
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    cameraState,
    handsDetected,
    startTracking,
  };
}
