import { useEffect, useRef, useCallback, useState } from 'react';
import { PlantRenderer } from '../lib/plantRenderer';
import { useHandTracking } from '../hooks/useHandTracking';
import type { GestureEvent } from '../lib/gestureDetector';

export default function Garden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PlantRenderer | null>(null);
  const [started, setStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const swooshCooldown = useRef<Map<string, number>>(new Map());

  const handleGesture = useCallback((event: GestureEvent) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const now = Date.now();

    switch (event.type) {
      case 'wristRotation':
        renderer.growStem(event.handIndex, event.value);
        break;

      case 'fingerExtension':
        renderer.addFlower(event.handIndex, event.value);
        break;

      case 'swooshLeft':
      case 'swooshRight': {
        const key = `${event.type}-${event.handIndex}`;
        const lastTime = swooshCooldown.current.get(key) || 0;
        if (now - lastTime > 600) {
          const side = event.type === 'swooshLeft' ? 'left' : 'right';
          renderer.addLeaf(event.handIndex, side);
          swooshCooldown.current.set(key, now);
        }
        break;
      }
    }
  }, []);

  const { videoRef, cameraState, handsDetected, startTracking } = useHandTracking(
    handleGesture,
    started
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new PlantRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.startAnimation();

    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.stopAnimation();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleStart = () => {
    setStarted(true);
    setShowInstructions(false);
    if (cameraState === 'idle') {
      startTracking();
    }
  };

  const handleDismissInstructions = () => {
    setShowInstructions(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: '#33442A' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />

      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 160,
          height: 120,
          borderRadius: 8,
          border: '1px solid rgba(233, 232, 213, 0.3)',
          opacity: started && cameraState === 'active' ? 0.8 : 0,
          transform: 'scaleX(-1)',
          objectFit: 'cover',
          transition: 'opacity 0.5s ease',
          zIndex: 10,
        }}
        autoPlay
        playsInline
        muted
      />

      {started && cameraState === 'active' && (
        <div style={{
          position: 'absolute',
          bottom: 145,
          right: 20,
          color: '#E9E8D5',
          fontSize: 12,
          fontFamily: "'Georgia', serif",
          opacity: 0.6,
          zIndex: 10,
          textAlign: 'right',
        }}>
          {handsDetected > 0
            ? `${handsDetected} hand${handsDetected > 1 ? 's' : ''} detected`
            : 'Show your hands'}
        </div>
      )}

      {started && cameraState === 'active' && !showInstructions && (
        <button
          onClick={() => setShowInstructions(true)}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(233, 232, 213, 0.1)',
            border: '1px solid rgba(233, 232, 213, 0.2)',
            color: '#E9E8D5',
            borderRadius: '50%',
            width: 36,
            height: 36,
            cursor: 'pointer',
            fontSize: 16,
            fontFamily: "'Georgia', serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            transition: 'background 0.3s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(233, 232, 213, 0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(233, 232, 213, 0.1)')}
        >
          ?
        </button>
      )}

      {cameraState === 'denied' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#E9E8D5',
          textAlign: 'center',
          fontFamily: "'Georgia', serif",
          zIndex: 20,
        }}>
          <p style={{ fontSize: 18, marginBottom: 12 }}>Camera access is needed</p>
          <p style={{ fontSize: 14, opacity: 0.7 }}>
            Please allow camera access in your browser settings and reload the page.
          </p>
        </div>
      )}

      {cameraState === 'error' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#E9E8D5',
          textAlign: 'center',
          fontFamily: "'Georgia', serif",
          zIndex: 20,
        }}>
          <p style={{ fontSize: 18, marginBottom: 12 }}>Something went wrong</p>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
            Could not access the camera. Please check your device.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(233, 232, 213, 0.4)',
              color: '#E9E8D5',
              padding: '8px 24px',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: "'Georgia', serif",
              fontSize: 14,
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {cameraState === 'requesting' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#E9E8D5',
          textAlign: 'center',
          fontFamily: "'Georgia', serif",
          zIndex: 20,
          opacity: 0.8,
        }}>
          <p style={{ fontSize: 16 }}>Requesting camera access...</p>
        </div>
      )}

      {!started && cameraState === 'idle' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          background: 'rgba(51, 68, 42, 0.95)',
        }}>
          <h1 style={{
            color: '#E9E8D5',
            fontFamily: "'Georgia', serif",
            fontSize: 48,
            fontWeight: 300,
            letterSpacing: 6,
            marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            Hand Garden
          </h1>

          <p style={{
            color: '#E9E8D5',
            fontFamily: "'Georgia', serif",
            fontSize: 16,
            opacity: 0.6,
            marginBottom: 60,
            letterSpacing: 2,
          }}>
            Grow plants with your hands
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            marginBottom: 60,
            maxWidth: 420,
          }}>
            {[
              { gesture: 'Rotate your wrist', effect: 'Grow spiraling vines' },
              { gesture: 'Open your fist', effect: 'Bloom flowers' },
              { gesture: 'Swoosh left or right', effect: 'Sprout leaves' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                color: '#E9E8D5',
                fontFamily: "'Georgia', serif",
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '1px solid rgba(233, 232, 213, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  opacity: 0.7,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 15, opacity: 0.9 }}>{item.gesture}</div>
                  <div style={{ fontSize: 13, opacity: 0.5, marginTop: 2 }}>{item.effect}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            style={{
              background: 'transparent',
              border: '1px solid rgba(233, 232, 213, 0.4)',
              color: '#E9E8D5',
              padding: '14px 48px',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: "'Georgia', serif",
              fontSize: 16,
              letterSpacing: 3,
              textTransform: 'uppercase',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(233, 232, 213, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(233, 232, 213, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(233, 232, 213, 0.4)';
            }}
          >
            Begin
          </button>

          <p style={{
            color: '#E9E8D5',
            fontFamily: "'Georgia', serif",
            fontSize: 12,
            opacity: 0.4,
            marginTop: 24,
          }}>
            Camera access required for hand tracking
          </p>
        </div>
      )}

      {showInstructions && started && cameraState === 'active' && (
        <div
          onClick={handleDismissInstructions}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
            background: 'rgba(51, 68, 42, 0.85)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            maxWidth: 380,
          }}>
            {[
              { icon: '\u27F3', gesture: 'Rotate your wrist', effect: 'to grow vines upward' },
              { icon: '\u270B', gesture: 'Open your hand wide', effect: 'to bloom flowers' },
              { icon: '\u2194', gesture: 'Swoosh left or right', effect: 'to sprout leaves' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: '#E9E8D5',
                fontFamily: "'Georgia', serif",
              }}>
                <span style={{ fontSize: 28, opacity: 0.7, width: 40, textAlign: 'center' }}>
                  {item.icon}
                </span>
                <div>
                  <div style={{ fontSize: 15, opacity: 0.9 }}>{item.gesture}</div>
                  <div style={{ fontSize: 13, opacity: 0.5, marginTop: 2 }}>{item.effect}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{
            color: '#E9E8D5',
            fontFamily: "'Georgia', serif",
            fontSize: 12,
            opacity: 0.4,
            marginTop: 40,
          }}>
            Tap anywhere to dismiss
          </p>
        </div>
      )}
    </div>
  );
}
