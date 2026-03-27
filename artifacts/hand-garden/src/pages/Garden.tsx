import { useEffect, useRef, useCallback, useState } from 'react';
import { PlantRenderer } from '../lib/plantRenderer';
import { useHandTracking } from '../hooks/useHandTracking';
import type { GestureEvent, GestureType } from '../lib/gestureDetector';
import { VineGrowIcon, FlowerBloomIcon, LeafSproutIcon } from '../components/GestureIcons';

const FONT = "'Josefin Sans', sans-serif";

interface GestureToast {
  type: GestureType;
  key: number;
  fading: boolean;
}

const TOAST_LABELS: Record<GestureType, string> = {
  wristRotation: 'Growing...',
  openPalm: 'Blooming...',
  pinch: 'Leafing...',
};

function GestureToastIcon({ type, size = 20 }: { type: GestureType; size?: number }) {
  switch (type) {
    case 'wristRotation': return <VineGrowIcon size={size} opacity={0.9} />;
    case 'openPalm': return <FlowerBloomIcon size={size} opacity={0.9} />;
    case 'pinch': return <LeafSproutIcon size={size} opacity={0.9} />;
  }
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

export default function Garden() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<PlantRenderer | null>(null);
  const [started, setStarted] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [gestureToast, setGestureToast] = useState<GestureToast | null>(null);
  const toastKeyRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowWidth = useWindowWidth();

  const isDesktop = windowWidth > 1024;
  const isTablet = windowWidth >= 480 && windowWidth <= 1024;

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

    toastKeyRef.current += 1;
    const key = toastKeyRef.current;
    setGestureToast({ type: event.type, key, fading: false });

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setGestureToast(prev => {
        if (prev && prev.key === key) return { ...prev, fading: true };
        return prev;
      });
      toastFadeTimerRef.current = setTimeout(() => {
        setGestureToast(prev => (prev && prev.key === key ? null : prev));
      }, 400);
    }, 1100);
  }, [started]);

  const { videoRef, cameraState, handsDetected } = useHandTracking(
    handleGesture,
    true
  );

  useEffect(() => {
    if (rendererRef.current && handsDetected > 0) {
      rendererRef.current.setHandCount(handsDetected);
    }
  }, [handsDetected]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastFadeTimerRef.current) clearTimeout(toastFadeTimerRef.current);
    };
  }, []);

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
    {
      icon: <VineGrowIcon size={isDesktop ? 38 : 34} opacity={0.8} />,
      label: 'Grow',
      description: 'Rotate your fist to grow vines',
    },
    {
      icon: <FlowerBloomIcon size={isDesktop ? 38 : 34} opacity={0.8} />,
      label: 'Bloom',
      description: 'Open your palm to bloom flowers',
    },
    {
      icon: <LeafSproutIcon size={isDesktop ? 38 : 34} opacity={0.8} />,
      label: 'Leaf',
      description: 'Pinch to sprout leaves',
    },
  ];

  const cameraWidth = isDesktop ? 180 : isTablet ? 170 : 'min(160px, 30vw)';
  const cameraHeight = isDesktop ? 135 : isTablet ? 128 : 'min(120px, 22vw)';

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
          width: cameraWidth,
          height: cameraHeight,
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
            bottom: `calc(max(80px, calc(20px + env(safe-area-inset-bottom, 60px))) + ${typeof cameraHeight === 'number' ? cameraHeight + 'px' : cameraHeight} + 8px)`,
            right: 'max(16px, env(safe-area-inset-right, 0px))',
            color: '#E9E8D5',
            fontSize: isDesktop ? 18 : 20,
            fontFamily: FONT,
            opacity: 0.6,
            zIndex: 10,
            textAlign: 'right',
            width: typeof cameraWidth === 'number' ? cameraWidth : cameraWidth,
          }}>
          {handsDetected > 0
            ? `${handsDetected} hand${handsDetected > 1 ? 's' : ''}`
            : 'Show your hands'}
        </div>
      )}

      {cameraState === 'active' && gestureToast && (
        <div
          key={gestureToast.key}
          style={{
            position: 'fixed',
            bottom: `calc(max(80px, calc(20px + env(safe-area-inset-bottom, 60px))) + ${typeof cameraHeight === 'number' ? cameraHeight + 'px' : cameraHeight} + 32px)`,
            right: 'max(16px, env(safe-area-inset-right, 0px))',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#E9E8D5',
            fontFamily: FONT,
            fontSize: 15,
            background: 'rgba(51, 68, 42, 0.85)',
            border: '1px solid rgba(233, 232, 213, 0.15)',
            borderRadius: 8,
            padding: '8px 14px',
            zIndex: 15,
            opacity: gestureToast.fading ? 0 : 1,
            transition: 'opacity 0.4s ease-out',
            animation: gestureToast.fading ? 'none' : 'gestureToastIn 0.3s ease-out',
            backdropFilter: 'blur(6px)',
          }}
        >
          <GestureToastIcon type={gestureToast.type} size={18} />
          <span style={{ opacity: 0.85, letterSpacing: 1 }}>{TOAST_LABELS[gestureToast.type]}</span>
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
          {isDesktop ? (
            <div style={{
              background: 'rgba(233, 232, 213, 0.06)',
              border: '1px solid rgba(233, 232, 213, 0.12)',
              borderRadius: 10,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 200,
            }}>
              {gestureItems.map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: '#E9E8D5',
                  fontFamily: FONT,
                }}>
                  <div style={{ width: 34, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, opacity: 0.85 }}>{item.label}</div>
                    <div style={{ fontSize: 13, opacity: 0.4, marginTop: 1 }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
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
                <VineGrowIcon size={isTablet ? 30 : 28} opacity={0.6} />
                <FlowerBloomIcon size={isTablet ? 30 : 28} opacity={0.6} />
                <LeafSproutIcon size={isTablet ? 30 : 28} opacity={0.6} />
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
                  minWidth: isTablet ? 280 : 240,
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
                        <div style={{ fontSize: isTablet ? 18 : 17, opacity: 0.9 }}>{item.label}</div>
                        <div style={{ fontSize: isTablet ? 15 : 14, opacity: 0.5, marginTop: 2 }}>{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
            fontSize: isDesktop ? 52 : 'min(42px, 9vw)',
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
            fontSize: isDesktop ? 20 : 'min(18px, 4vw)',
            fontWeight: 300,
            fontStyle: 'italic',
            opacity: 0.5,
            marginBottom: isDesktop ? 60 : 50,
            letterSpacing: 2,
          }}>
            Grow plants with your hands
          </p>

          <div style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            gap: isDesktop ? 50 : 28,
            maxWidth: isDesktop ? 720 : 380,
            width: '100%',
            justifyContent: 'center',
          }}>
            {gestureItems.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: isDesktop ? 'column' : 'row',
                alignItems: 'center',
                gap: isDesktop ? 12 : 18,
                color: '#E9E8D5',
                fontFamily: FONT,
                textAlign: isDesktop ? 'center' : 'left',
              }}>
                <div style={{
                  width: isDesktop ? 56 : 48,
                  height: isDesktop ? 56 : undefined,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: isDesktop ? 22 : isTablet ? 20 : 'min(20px, 4.5vw)',
                    opacity: 0.9,
                    fontWeight: 300,
                    letterSpacing: 2,
                  }}>{item.label}</div>
                  <div style={{
                    fontSize: isDesktop ? 14 : isTablet ? 15 : 'min(14px, 3.2vw)',
                    opacity: 0.45,
                    marginTop: 3,
                  }}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>

          <p style={{
            color: '#E9E8D5',
            fontFamily: FONT,
            fontSize: 16,
            opacity: 0.4,
            marginTop: isDesktop ? 60 : 50,
          }}>
            Tap anywhere to begin
          </p>
        </div>
      )}

      <style>{`
        @keyframes gestureToastIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
