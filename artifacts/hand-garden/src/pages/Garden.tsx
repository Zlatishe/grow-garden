import { useEffect, useRef, useCallback, useState } from 'react';
import { PlantRenderer } from '../lib/plantRenderer';
import { useHandTracking } from '../hooks/useHandTracking';
import type { GestureEvent } from '../lib/gestureDetector';
import { RotateIcon, BloomIcon, SwooshIcon } from '../components/GestureIcons';

const FONT = "'Cormorant Garamond', Georgia, serif";

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
        renderer.growStem(event.handIndex, event.value);
        break;

      case 'fingerExtension':
        renderer.addFlower(event.handIndex, event.value);
        break;

      case 'swooshLeft':
      case 'swooshRight': {
        const side = event.type === 'swooshRight' ? 'right' : 'left';
        renderer.addLeaf(event.handIndex, side);
        break;
      }
    }
  }, [started]);

  const { videoRef, cameraState, handsDetected } = useHandTracking(
    handleGesture,
    true
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
  };

  const gestureItems = [
    { icon: <RotateIcon size={24} opacity={0.8} />, gesture: 'Rotate your wrist', effect: 'Grow vines upward' },
    { icon: <BloomIcon size={24} opacity={0.8} />, gesture: 'Fist, then open wide', effect: 'Bloom flowers' },
    { icon: <SwooshIcon size={24} opacity={0.8} />, gesture: 'Swoosh left or right', effect: 'Sprout leaves' },
  ];

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
            position: 'absolute',
            bottom: 145,
            right: 20,
            color: '#E9E8D5',
            fontSize: 16,
            fontFamily: FONT,
            opacity: 0.6,
            zIndex: 10,
            textAlign: 'right',
          }}
          className="text-[24px]">
          {handsDetected > 0
            ? `${handsDetected} hand${handsDetected > 1 ? 's' : ''} detected`
            : 'Show your hands'}
        </div>
      )}
      {cameraState === 'active' && started && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 20,
            transition: 'all 0.3s ease',
          }}
        >
          <button
            onClick={() => setPanelExpanded(!panelExpanded)}
            style={{
              background: 'rgba(233, 232, 213, 0.08)',
              border: '1px solid rgba(233, 232, 213, 0.15)',
              color: '#E9E8D5',
              borderRadius: panelExpanded ? '8px 8px 0 0' : 8,
              padding: '8px 14px',
              cursor: 'pointer',
              fontFamily: FONT,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(233, 232, 213, 0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(233, 232, 213, 0.08)')}
          >
            <RotateIcon size={20} opacity={0.6} />
            <BloomIcon size={20} opacity={0.6} />
            <SwooshIcon size={20} opacity={0.6} />
          </button>

          {panelExpanded && (
            <div style={{
              background: 'rgba(51, 68, 42, 0.92)',
              border: '1px solid rgba(233, 232, 213, 0.15)',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              minWidth: 240,
            }}>
              {gestureItems.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#E9E8D5',
                  fontFamily: FONT,
                }}>
                  <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, opacity: 0.9 }} className="text-[18px]">{item.gesture}</div>
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
        }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 300,
            letterSpacing: 6,
            marginBottom: 12,
            textTransform: 'uppercase',
          }}>
            Hand Garden
          </h1>
          <p style={{
            fontSize: 18,
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
          }}
        >
          <h1 style={{
            color: '#E9E8D5',
            fontFamily: FONT,
            fontSize: 42,
            fontWeight: 300,
            letterSpacing: 6,
            marginBottom: 8,
            textTransform: 'uppercase',
          }}>
            Hand Garden
          </h1>

          <p style={{
            color: '#E9E8D5',
            fontFamily: FONT,
            fontSize: 18,
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
          }}>
            {gestureItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                color: '#E9E8D5',
                fontFamily: FONT,
              }}>
                <div style={{ width: 40, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 18, opacity: 0.9 }} className="text-[20px]">{item.gesture}</div>
                  <div style={{ fontSize: 16, opacity: 0.5, marginTop: 2 }}>{item.effect}</div>
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
