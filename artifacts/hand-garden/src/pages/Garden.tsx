import { useEffect, useRef, useCallback, useState } from 'react';
import { PlantRenderer } from '../lib/plantRenderer';
import { useHandTracking } from '../hooks/useHandTracking';
import type { GestureEvent } from '../lib/gestureDetector';
import { FistRotateIcon, OpenPalmIcon, PinchIcon } from '../components/GestureIcons';

const FONT = "'Josefin Sans', sans-serif";

export default function Garden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PlantRenderer | null>(null);
  const [started, setStarted] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);

  const handleGesture = useCallback((event: GestureEvent) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (!started) return;

    switch (event.type) {
      case 'wristRotation':
        renderer.growStem(event.value, event.handIndex);
        break;

      case 'openPalm':
        renderer.addFlower(event.value, event.handIndex);
        break;

      case 'pinch':
        renderer.addLeaf(event.handIndex);
        break;
    }
  }, [started]);

  const { videoRef, cameraState, handsDetected } = useHandTracking(
    handleGesture,
    true
  );

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setHandCount(handsDetected);
    }
  }, [handsDetected]);

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
  };

  const gestureItems = [
    { icon: <FistRotateIcon size={34} opacity={0.8} />, gesture: 'Rotate fist', effect: 'Grow vines & branches' },
    { icon: <OpenPalmIcon size={34} opacity={0.8} />, gesture: 'Open palm', effect: 'Bloom flowers' },
    { icon: <PinchIcon size={34} opacity={0.8} />, gesture: 'Pinch fingers', effect: 'Sprout leaves' },
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: '#33442A',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      paddingLeft: 'env(safe-area-inset-left, 0px)',
      paddingRight: 'env(safe-area-inset-right, 0px)',
      boxSizing: 'border-box',
    }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />

      <video
        ref={videoRef}
        style={{
          position: 'fixed',
          bottom: 'max(80px, calc(20px + env(safe-area-inset-bottom, 60px)))',
          right: 'max(16px, env(safe-area-inset-right, 0px))',
          width: 'min(160px, 30vw)',
          height: 'min(120px, 22vw)',
          borderRadius: 8,
          border: '1px solid rgba(233, 232, 213, 0.3)',
          opacity: cameraState === 'active' ? 0.8 : 0,
          transform: 'scaleX(-1)',
          objectFit: 'cover',
          transition: 'opacity 0.5s ease',
          zIndex: 10,
        }}
        autoPlay
        playsInline
        muted
      />

      {cameraState === 'active' && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(max(80px, calc(20px + env(safe-area-inset-bottom, 60px))) + min(120px, 22vw) + 8px)',
            right: 'max(16px, env(safe-area-inset-right, 0px))',
            color: '#E9E8D5',
            fontSize: 20,
            fontFamily: FONT,
            opacity: 0.6,
            zIndex: 10,
            textAlign: 'right',
            width: 'min(160px, 30vw)',
          }}>
          {handsDetected > 0
            ? `${handsDetected} hand${handsDetected > 1 ? 's' : ''}`
            : 'Show your hands'}
        </div>
      )}

      {cameraState === 'active' && started && (
        <div
          style={{
            position: 'fixed',
            top: 'max(16px, env(safe-area-inset-top, 0px))',
            right: 'max(16px, env(safe-area-inset-right, 0px))',
            zIndex: 20,
          }}
        >
          <button
            onClick={() => setPanelExpanded(!panelExpanded)}
            style={{
              background: 'rgba(233, 232, 213, 0.08)',
              border: '1px solid rgba(233, 232, 213, 0.15)',
              color: '#E9E8D5',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(233, 232, 213, 0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(233, 232, 213, 0.08)')}
          >
            <FistRotateIcon size={32} opacity={0.6} />
            <OpenPalmIcon size={32} opacity={0.6} />
            <PinchIcon size={32} opacity={0.6} />
          </button>

          {panelExpanded && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              background: 'rgba(51, 68, 42, 0.95)',
              border: '1px solid rgba(233, 232, 213, 0.15)',
              borderRadius: 8,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              minWidth: 260,
              backdropFilter: 'blur(8px)',
            }}>
              {gestureItems.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  color: '#E9E8D5',
                  fontFamily: FONT,
                }}>
                  <div style={{ width: 40, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, opacity: 0.9 }}>{item.gesture}</div>
                    <div style={{ fontSize: 16, opacity: 0.5, marginTop: 2 }}>{item.effect}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cameraState === 'denied' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#E9E8D5',
          textAlign: 'center',
          fontFamily: FONT,
          zIndex: 20,
          padding: '0 24px',
        }}>
          <p style={{ fontSize: 20, marginBottom: 16 }}>Camera access is needed</p>
          <p style={{ fontSize: 16, opacity: 0.7 }}>
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
          fontFamily: FONT,
          zIndex: 20,
          padding: '0 24px',
        }}>
          <p style={{ fontSize: 20, marginBottom: 16 }}>Something went wrong</p>
          <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 24 }}>
            Could not access the camera. Please check your device.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(233, 232, 213, 0.4)',
              color: '#E9E8D5',
              padding: '10px 28px',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 16,
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {(cameraState === 'idle' || cameraState === 'requesting') && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#E9E8D5',
          textAlign: 'center',
          fontFamily: FONT,
          zIndex: 20,
          padding: '0 24px',
        }}>
          <h1 style={{
            fontSize: 'min(48px, 10vw)',
            fontWeight: 200,
            letterSpacing: 8,
            marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            Hand Garden
          </h1>
          <p style={{
            fontSize: 'min(18px, 4vw)',
            opacity: 0.6,
            letterSpacing: 2,
            marginBottom: 24,
          }}>
            Grow plants with your hands
          </p>
          <p style={{
            fontSize: 16,
            opacity: 0.5,
          }}>
            {cameraState === 'requesting'
              ? 'Please allow camera access...'
              : 'Initializing camera...'}
          </p>
        </div>
      )}

      {!started && cameraState === 'active' && (
        <div
          onClick={handleStart}
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
            background: 'rgba(51, 68, 42, 0.88)',
            cursor: 'pointer',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={{
            color: '#E9E8D5',
            fontFamily: FONT,
            fontSize: 'min(42px, 9vw)',
            fontWeight: 200,
            letterSpacing: 8,
            marginBottom: 8,
            textTransform: 'uppercase',
          }}>
            Hand Garden
          </h1>

          <p style={{
            color: '#E9E8D5',
            fontFamily: FONT,
            fontSize: 'min(18px, 4vw)',
            fontWeight: 300,
            fontStyle: 'italic',
            opacity: 0.5,
            marginBottom: 50,
            letterSpacing: 2,
          }}>
            Grow plants with your hands
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            maxWidth: 380,
            width: '100%',
          }}>
            {gestureItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                color: '#E9E8D5',
                fontFamily: FONT,
              }}>
                <div style={{ width: 48, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 'min(20px, 4.5vw)', opacity: 0.9 }}>{item.gesture}</div>
                  <div style={{ fontSize: 'min(16px, 3.5vw)', opacity: 0.5, marginTop: 2 }}>{item.effect}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{
            color: '#E9E8D5',
            fontFamily: FONT,
            fontSize: 16,
            opacity: 0.4,
            marginTop: 50,
          }}>
            Tap anywhere to begin
          </p>
        </div>
      )}
    </div>
  );
}
