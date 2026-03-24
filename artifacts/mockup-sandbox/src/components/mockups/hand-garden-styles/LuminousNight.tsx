import { useEffect, useRef } from 'react';
import './_group.css';

const BG_TOP = '#0A0E1A';
const BG_BOTTOM = '#141B2D';
const TEAL = '#5EEAD4';
const VIOLET = '#A78BFA';
const BLUE = '#60A5FA';
const TEXT_COLOR = '#E8ECF4';
const FONT = "'Josefin Sans', sans-serif";

interface Seg { x: number; y: number; angle: number; thickness: number }
interface Branch { segments: Seg[]; color: string }
interface StarFlower { x: number; y: number; rays: number; rayLen: number; color: string; rotation: number; pulse: number }
interface FernLeaf { x: number; y: number; angle: number; leaflets: number; size: number; color: string }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function randRange(a: number, b: number) { return a + Math.random() * (b - a); }

function buildVine(w: number, h: number) {
  const segments: Seg[] = [{ x: w * 0.5, y: h - 60, angle: -Math.PI / 2, thickness: 3.5 }];
  let spiralAngle = 0;

  for (let i = 0; i < 45; i++) {
    const last = segments[segments.length - 1];
    spiralAngle += 0.35;
    const spiralInfluence = Math.sin(spiralAngle) * 0.25;
    const segLen = 8 + Math.random() * 4;
    const angle = -Math.PI / 2 + spiralInfluence + (Math.random() - 0.5) * 0.12;
    if (last.y + Math.sin(angle) * segLen < 80) break;
    segments.push({
      x: last.x + Math.cos(angle) * segLen,
      y: last.y + Math.sin(angle) * segLen,
      angle,
      thickness: Math.max(1.2, 3.5 - i * 0.05),
    });
  }
  return segments;
}

function buildBranches(vine: Seg[]): Branch[] {
  const branches: Branch[] = [];
  const colors = [TEAL, VIOLET, BLUE];
  const indices = [8, 16, 24, 32, 38].filter(i => i < vine.length);

  for (const idx of indices) {
    const seg = vine[idx];
    const side = Math.random() > 0.5 ? 1 : -1;
    const branchAngle = seg.angle + side * (Math.PI / 4 + Math.random() * Math.PI / 6);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const segs: Seg[] = [{ x: seg.x, y: seg.y, angle: branchAngle, thickness: seg.thickness * 0.55 }];
    const len = 3 + Math.floor(Math.random() * 4);

    for (let i = 0; i < len; i++) {
      const prev = segs[segs.length - 1];
      const l = 5 + Math.random() * 3;
      const a = branchAngle + (Math.random() - 0.5) * 0.25 + Math.sin(i * 0.8) * 0.15;
      segs.push({
        x: prev.x + Math.cos(a) * l,
        y: prev.y + Math.sin(a) * l,
        angle: a,
        thickness: Math.max(0.6, prev.thickness * 0.8),
      });
    }
    branches.push({ segments: segs, color });
  }
  return branches;
}

function buildFlowers(vine: Seg[], branches: Branch[]): StarFlower[] {
  const flowers: StarFlower[] = [];
  const points: Seg[] = [];
  for (let i = 5; i < vine.length; i++) points.push(vine[i]);
  for (const b of branches) for (let i = 1; i < b.segments.length; i++) points.push(b.segments[i]);

  const colors = [TEAL, VIOLET, BLUE];
  const chosen = new Set<number>();

  for (let f = 0; f < 4; f++) {
    let tries = 0;
    let idx: number;
    do {
      idx = Math.floor(Math.random() * points.length);
      tries++;
    } while (chosen.has(idx) && tries < 20);
    chosen.add(idx);
    const pt = points[idx];
    flowers.push({
      x: pt.x + randRange(-6, 6),
      y: pt.y + randRange(-6, 6),
      rays: 8 + Math.floor(Math.random() * 5),
      rayLen: 12 + Math.random() * 14,
      color: colors[f % colors.length],
      rotation: Math.random() * Math.PI * 2,
      pulse: Math.random() * Math.PI * 2,
    });
  }
  return flowers;
}

function buildLeaves(vine: Seg[], branches: Branch[]): FernLeaf[] {
  const leaves: FernLeaf[] = [];
  const points: Seg[] = [];
  for (let i = 4; i < vine.length; i += 3) points.push(vine[i]);
  for (const b of branches) for (let i = 1; i < b.segments.length; i += 2) points.push(b.segments[i]);

  for (let i = 0; i < Math.min(10, points.length); i++) {
    const pt = points[i];
    const side = i % 2 === 0 ? -1 : 1;
    const colors = [TEAL, VIOLET, BLUE];
    leaves.push({
      x: pt.x,
      y: pt.y,
      angle: pt.angle + side * (Math.PI / 3 + Math.random() * 0.3),
      leaflets: 4 + Math.floor(Math.random() * 4),
      size: 10 + Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return leaves;
}

export function LuminousNight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const vine = buildVine(w, h);
    const branches = buildBranches(vine);
    const flowers = buildFlowers(vine, branches);
    const leaves = buildLeaves(vine, branches);

    let time = 0;

    function drawGlow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
    }

    function clearGlow(ctx: CanvasRenderingContext2D) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    function drawSegments(segs: Seg[], color: string, glowAmt: number) {
      if (segs.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawGlow(ctx, color, glowAmt);

      for (let i = 1; i < segs.length; i++) {
        const prev = segs[i - 1];
        const curr = segs[i];
        ctx.beginPath();
        ctx.lineWidth = curr.thickness;
        ctx.globalAlpha = 0.7 + (i / segs.length) * 0.3;
        ctx.moveTo(prev.x, prev.y);
        if (i < segs.length - 1) {
          const next = segs[i + 1];
          ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
        } else {
          ctx.lineTo(curr.x, curr.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      clearGlow(ctx);
    }

    function drawStarFlower(f: StarFlower, t: number) {
      ctx.save();
      ctx.translate(f.x, f.y);
      const pulseScale = 1 + Math.sin(t * 1.5 + f.pulse) * 0.08;
      ctx.rotate(f.rotation + t * 0.1);

      drawGlow(ctx, f.color, 12);
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1;

      for (let i = 0; i < f.rays; i++) {
        const angle = (i / f.rays) * Math.PI * 2;
        const len = f.rayLen * pulseScale * (0.7 + Math.random() * 0.3);
        ctx.globalAlpha = 0.6 + Math.sin(t + i) * 0.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const midX = Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 3;
        const midY = Math.sin(angle) * len * 0.5 + (Math.random() - 0.5) * 3;
        ctx.quadraticCurveTo(midX, midY, Math.cos(angle) * len, Math.sin(angle) * len);
        ctx.stroke();

        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * len, Math.sin(angle) * len, 1.5 * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
      }

      clearGlow(ctx);
      drawGlow(ctx, f.color, 20);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(0, 0, 3 * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();
      clearGlow(ctx);

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawFernLeaf(leaf: FernLeaf, t: number) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      const sway = Math.sin(t * 0.8 + leaf.angle) * 0.03;
      ctx.rotate(leaf.angle + sway);

      drawGlow(ctx, leaf.color, 6);
      ctx.strokeStyle = leaf.color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.7;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(leaf.size * leaf.leaflets * 0.5, 0);
      ctx.stroke();

      for (let i = 0; i < leaf.leaflets; i++) {
        const t2 = (i + 1) / (leaf.leaflets + 1);
        const mx = leaf.size * leaf.leaflets * 0.5 * t2;
        const lSize = leaf.size * (1 - Math.abs(t2 - 0.5) * 1.2) * 0.8;

        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(mx, 0);
          ctx.bezierCurveTo(
            mx + lSize * 0.3, side * lSize * 0.5,
            mx + lSize * 0.7, side * lSize * 0.6,
            mx + lSize * 0.4, side * lSize * 0.1
          );
          ctx.stroke();
        }
      }

      clearGlow(ctx);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function render() {
      time += 0.016;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, BG_TOP);
      grad.addColorStop(1, BG_BOTTOM);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const swayAmount = Math.sin(time * 0.3) * 0.5;

      ctx.save();
      ctx.transform(1, 0, swayAmount * 0.002, 1, 0, 0);
      drawSegments(vine, TEAL, 8);
      for (const b of branches) {
        drawSegments(b.segments, b.color, 6);
      }
      ctx.restore();

      for (const leaf of leaves) drawFernLeaf(leaf, time);
      for (const flower of flowers) drawStarFlower(flower, time);

      frameRef.current = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const iconColor = TEAL;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute', bottom: 20, right: 16,
        width: 120, height: 90, borderRadius: 8,
        border: `1px solid rgba(94, 234, 212, 0.3)`,
        background: 'rgba(10, 14, 26, 0.5)',
        backdropFilter: 'blur(4px)',
      }} />

      <div style={{
        position: 'absolute', bottom: 118, right: 16,
        color: TEXT_COLOR, fontSize: 14, fontFamily: FONT, opacity: 0.6, textAlign: 'right', width: 120,
      }}>
        1 hand
      </div>

      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 20,
      }}>
        <div style={{
          background: 'rgba(94, 234, 212, 0.08)',
          border: '1px solid rgba(94, 234, 212, 0.2)',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 20px rgba(94, 234, 212, 0.05)',
        }}>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <rect x="8" y="9" width="10" height="11" rx="3" stroke={iconColor} strokeWidth="1.8" opacity="0.8" />
            <path d="M22 8v4" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M20 6l2 2 2-2" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M22 20v-4" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M20 22l2-2 2 2" stroke={iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          </svg>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <path d="M14 24v-8" stroke={VIOLET} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d="M14 16V4" stroke={VIOLET} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d="M10 16V6" stroke={VIOLET} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d="M18 16V6" stroke={VIOLET} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d="M6 16V10" stroke={VIOLET} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d="M22 16V10" stroke={VIOLET} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d="M6 16c0 4.418 3.582 8 8 8s8-3.582 8-8" stroke={VIOLET} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          </svg>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <path d="M8 10l5 5" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d="M20 10l-5 5" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <circle cx="14" cy="16" r="2" stroke={BLUE} strokeWidth="1.5" opacity="0.8" />
            <path d="M14 18v4" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d="M6 6l2 1M22 6l-2 1M14 4v2" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
      </div>

      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        color: TEXT_COLOR, textAlign: 'center', fontFamily: FONT, zIndex: 5,
        pointerEvents: 'none', opacity: 0.12,
      }}>
        <h1 style={{
          fontSize: 36, fontWeight: 200, letterSpacing: 8, textTransform: 'uppercase',
          textShadow: `0 0 40px ${TEAL}`,
        }}>
          Hand Garden
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, fontStyle: 'italic', letterSpacing: 2, marginTop: 4 }}>
          Luminous Night Garden
        </p>
      </div>
    </div>
  );
}
