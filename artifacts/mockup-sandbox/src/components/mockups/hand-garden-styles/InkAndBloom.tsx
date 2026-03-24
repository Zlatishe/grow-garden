import { useEffect, useRef } from 'react';
import './_group.css';

const BG = '#1A1714';
const CREAM = '#E8DCC8';
const GOLD = '#C9A96E';
const ROSE = '#B8847C';
const TEXT_COLOR = '#D4CBC0';
const FONT = "'Josefin Sans', sans-serif";

interface Seg { x: number; y: number; angle: number; thickness: number }
interface Branch { segments: Seg[] }
interface InkFlower { x: number; y: number; arcs: number; size: number; color: string; rotation: number }
interface BrushLeaf { x: number; y: number; angle: number; size: number; color: string; thick: boolean }

function randRange(a: number, b: number) { return a + Math.random() * (b - a); }

function buildVine(w: number, h: number): Seg[] {
  const segments: Seg[] = [{ x: w * 0.5, y: h - 60, angle: -Math.PI / 2, thickness: 4.5 }];
  let spiralAngle = 0;

  for (let i = 0; i < 38; i++) {
    const last = segments[segments.length - 1];
    spiralAngle += 0.4;
    const spiralInfluence = Math.sin(spiralAngle) * 0.2;
    const segLen = 10 + Math.random() * 5;
    const angle = -Math.PI / 2 + spiralInfluence + (Math.random() - 0.5) * 0.1;
    if (last.y + Math.sin(angle) * segLen < 90) break;

    const thickVariation = Math.sin(i * 0.7) * 2;
    segments.push({
      x: last.x + Math.cos(angle) * segLen,
      y: last.y + Math.sin(angle) * segLen,
      angle,
      thickness: Math.max(0.8, 3 + thickVariation - i * 0.04),
    });
  }
  return segments;
}

function buildBranches(vine: Seg[]): Branch[] {
  const branches: Branch[] = [];
  const indices = [7, 14, 22, 30].filter(i => i < vine.length);

  for (const idx of indices) {
    const seg = vine[idx];
    const side = idx % 2 === 0 ? 1 : -1;
    const branchAngle = seg.angle + side * (Math.PI / 3 + Math.random() * 0.3);
    const segs: Seg[] = [{ x: seg.x, y: seg.y, angle: branchAngle, thickness: seg.thickness * 0.7 }];
    const len = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < len; i++) {
      const prev = segs[segs.length - 1];
      const l = 6 + Math.random() * 4;
      const a = branchAngle + (Math.random() - 0.5) * 0.15;
      segs.push({
        x: prev.x + Math.cos(a) * l,
        y: prev.y + Math.sin(a) * l,
        angle: a,
        thickness: Math.max(0.5, prev.thickness * 0.65),
      });
    }
    branches.push({ segments: segs });
  }
  return branches;
}

function buildFlowers(vine: Seg[], branches: Branch[]): InkFlower[] {
  const flowers: InkFlower[] = [];
  const points: Seg[] = [];
  for (let i = 6; i < vine.length; i += 5) points.push(vine[i]);
  for (const b of branches) if (b.segments.length > 1) points.push(b.segments[b.segments.length - 1]);

  const colors = [CREAM, GOLD, ROSE];
  for (let i = 0; i < Math.min(3, points.length); i++) {
    const pt = points[i];
    flowers.push({
      x: pt.x + randRange(-5, 5),
      y: pt.y + randRange(-5, 5),
      arcs: 3 + Math.floor(Math.random() * 3),
      size: 14 + Math.random() * 12,
      color: colors[i % colors.length],
      rotation: Math.random() * Math.PI * 2,
    });
  }
  return flowers;
}

function buildLeaves(vine: Seg[], branches: Branch[]): BrushLeaf[] {
  const leaves: BrushLeaf[] = [];
  const points: Seg[] = [];
  for (let i = 3; i < vine.length; i += 4) points.push(vine[i]);
  for (const b of branches) for (let i = 0; i < b.segments.length; i += 2) points.push(b.segments[i]);

  const colors = [CREAM, GOLD];
  for (let i = 0; i < Math.min(8, points.length); i++) {
    const pt = points[i];
    const side = i % 2 === 0 ? -1 : 1;
    leaves.push({
      x: pt.x,
      y: pt.y,
      angle: pt.angle + side * (Math.PI / 3 + Math.random() * 0.4),
      size: 12 + Math.random() * 18,
      color: colors[i % colors.length],
      thick: Math.random() > 0.4,
    });
  }
  return leaves;
}

export function InkAndBloom() {
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

    function drawCalligraphicSegments(segs: Seg[]) {
      if (segs.length < 2) return;
      ctx.strokeStyle = CREAM;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < segs.length; i++) {
        const prev = segs[i - 1];
        const curr = segs[i];
        ctx.beginPath();
        ctx.lineWidth = curr.thickness;
        ctx.globalAlpha = 0.65 + (i / segs.length) * 0.35;

        if (curr.thickness < 1.2) {
          ctx.setLineDash([3, 4]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.moveTo(prev.x, prev.y);
        if (i < segs.length - 1) {
          const next = segs[i + 1];
          const cpx = curr.x + (Math.random() - 0.5) * 2;
          const cpy = curr.y + (Math.random() - 0.5) * 2;
          ctx.quadraticCurveTo(cpx, cpy, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
        } else {
          ctx.lineTo(curr.x, curr.y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    function drawInkFlower(f: InkFlower, t: number) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation + Math.sin(t * 0.5) * 0.02);

      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1.8;

      for (let i = 0; i < f.arcs; i++) {
        const startAngle = (i / f.arcs) * Math.PI * 2 + Math.random() * 0.3;
        const sweep = Math.PI * (0.5 + Math.random() * 0.8);
        ctx.globalAlpha = 0.5 + Math.random() * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, f.size * (0.6 + Math.random() * 0.4), startAngle, startAngle + sweep);
        ctx.stroke();
      }

      ctx.globalAlpha = 0.9;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(0, 0, 3 + Math.random(), 0, Math.PI * 2);
      ctx.fill();

      const splatCount = 2 + Math.floor(Math.random() * 3);
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < splatCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = f.size * 0.8 + Math.random() * 8;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 0.8 + Math.random() * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawBrushLeaf(leaf: BrushLeaf, t: number) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      const sway = Math.sin(t * 0.6 + leaf.angle * 2) * 0.04;
      ctx.rotate(leaf.angle + sway);

      ctx.strokeStyle = leaf.color;
      ctx.fillStyle = leaf.color;

      if (leaf.thick) {
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          leaf.size * 0.3, -leaf.size * 0.35,
          leaf.size * 0.7, -leaf.size * 0.2,
          leaf.size, 0
        );
        ctx.bezierCurveTo(
          leaf.size * 0.7, leaf.size * 0.2,
          leaf.size * 0.3, leaf.size * 0.35,
          0, 0
        );
        ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.stroke();
      } else {
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(leaf.size * 0.5, -leaf.size * 0.25, leaf.size * 0.8, -leaf.size * 0.05);
        ctx.stroke();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function render() {
      time += 0.016;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      ctx.globalAlpha = 0.03;
      ctx.fillStyle = '#2A2520';
      for (let i = 0; i < 6; i++) {
        const gx = Math.random() * w;
        const gy = Math.random() * h;
        const gr = 40 + Math.random() * 80;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, '#3A3530');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      }
      ctx.globalAlpha = 1;

      const swayAmount = Math.sin(time * 0.3) * 0.5;
      ctx.save();
      ctx.transform(1, 0, swayAmount * 0.002, 1, 0, 0);
      drawCalligraphicSegments(vine);
      for (const b of branches) drawCalligraphicSegments(b.segments);
      ctx.restore();

      for (const leaf of leaves) drawBrushLeaf(leaf, time);
      for (const flower of flowers) drawInkFlower(flower, time);

      frameRef.current = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute', bottom: 20, right: 16,
        width: 120, height: 90, borderRadius: 6,
        border: `0.5px solid rgba(232, 220, 200, 0.2)`,
      }} />

      <div style={{
        position: 'absolute', bottom: 118, right: 16,
        color: TEXT_COLOR, fontSize: 13, fontFamily: FONT, opacity: 0.5, textAlign: 'right', width: 120,
      }}>
        1 hand
      </div>

      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 20,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px',
          border: `0.5px solid rgba(232, 220, 200, 0.15)`,
          borderRadius: 6,
        }}>
          <svg width={26} height={26} viewBox="0 0 28 28" fill="none">
            <rect x="8" y="9" width="10" height="11" rx="3" stroke={CREAM} strokeWidth="2.2" opacity="0.7" />
            <path d="M22 8v4" stroke={CREAM} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M20 6l2 2 2-2" stroke={CREAM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
            <path d="M22 20v-4" stroke={CREAM} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <path d="M20 22l2-2 2 2" stroke={CREAM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
          <svg width={26} height={26} viewBox="0 0 28 28" fill="none">
            <path d="M14 24v-8" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <path d="M14 16V4" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <path d="M10 16V6" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <path d="M18 16V6" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <path d="M6 16V10" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <path d="M22 16V10" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <path d="M6 16c0 4.418 3.582 8 8 8s8-3.582 8-8" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
          </svg>
          <svg width={26} height={26} viewBox="0 0 28 28" fill="none">
            <path d="M8 10l5 5" stroke={ROSE} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <path d="M20 10l-5 5" stroke={ROSE} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <circle cx="14" cy="16" r="2" stroke={ROSE} strokeWidth="2" opacity="0.7" />
            <path d="M14 18v4" stroke={ROSE} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
            <path d="M6 6l2 1M22 6l-2 1M14 4v2" stroke={ROSE} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          </svg>
        </div>
      </div>

      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        color: TEXT_COLOR, textAlign: 'center', fontFamily: FONT, zIndex: 5,
        pointerEvents: 'none', opacity: 0.1,
      }}>
        <h1 style={{
          fontSize: 36, fontWeight: 200, letterSpacing: 8, textTransform: 'uppercase',
        }}>
          Hand Garden
        </h1>
        <p style={{ fontSize: 14, fontWeight: 300, fontStyle: 'italic', letterSpacing: 2, marginTop: 4 }}>
          Ink & Bloom
        </p>
      </div>
    </div>
  );
}
