import { useEffect, useRef, useCallback, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { GestureDetector, GestureEvent } from '../lib/gestureDetector';

export type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

export function useHandTracking(
  onGesture: (event: GestureEvent) => void,
  enabled: boolean
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const gestureDetector = useRef(new GestureDetector());
  const cameraRef = useRef<Camera | null>(null);
  const handsRef = useRef<Hands | null>(null);
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

    try {
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: Results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setHandsDetected(results.multiHandLandmarks.length);
          gestureDetector.current.processHands(results.multiHandLandmarks);
        } else {
          setHandsDetected(0);
        }
      });

      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
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
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
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
