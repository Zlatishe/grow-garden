import { useEffect, useRef } from 'react';
import './_group.css';

const BG = '#050505';
const GRID = '#111111';
const WHITE = '#E8E8E8';
const MINT = '#7DFFC3';
const CYAN = '#5CE0D8';
const FONT = "'Space Mono', monospace";

interface Seg { x: number; y: number; angle: number }
interface HexFlower { x: number; y: number; size: number; rings: number; rotation: number; color: string }
interface TriLeaf { x: number; y: number; angle: number; size: number; color: string }

function randRange(a: number, b: number) { return a + Math.random() * (b - a); }

function buildAngularVine(w: number, h: number): Seg[] {
  const segments: Seg[] = [{ x: w * 0.48, y: h - 50, angle: -Math.PI / 2 }];
  const angles = [-Math.PI / 2, -Math.PI / 3, -2 * Math.PI / 3, -Math.PI / 2.5, -Math.PI / 1.8];

  for (let i = 0; i < 50; i++) {
    const last = segments[segments.length - 1];
    const baseAngle = angles[i % angles.length];
    const jitter = (Math.random() - 0.5) * 0.15;
    const angle = baseAngle + jitter;
    const segLen = 10 + Math.random() * 6;
    const ny = last.y + Math.sin(angle) * segLen;
    if (ny < 70) break;
    segments.push({
      x: last.x + Math.cos(angle) * segLen,
      y: ny,
      angle,
    });
  }
  return segments;
}

function buildAngularBranches(vine: Seg[]): Seg[][] {
  const branches: Seg[][] = [];
  const forkPoints = [6, 14, 22, 30, 40].filter(i => i < vine.length);

  for (const idx of forkPoints) {
    const seg = vine[idx];
    const side = idx % 2 === 0 ? 1 : -1;
    const angle = seg.angle + side * (Math.PI / 3);
    const branch: Seg[] = [{ x: seg.x, y: seg.y, angle }];
    const len = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < len; i++) {
      const prev = branch[branch.length - 1];
      const l = 8 + Math.random() * 5;
      const a = angle + (Math.random() - 0.5) * 0.2;
      branch.push({ x: prev.x + Math.cos(a) * l, y: prev.y + Math.sin(a) * l, angle: a });
    }
    branches.push(branch);
  }
  return branches;
}

function buildHexFlowers(vine: Seg[], branches: Seg[][]): HexFlower[] {
  const flowers: HexFlower[] = [];
  const pts: Seg[] = [];
  for (let i = 8; i < vine.length; i += 10) pts.push(vine[i]);
  for (const b of branches) if (b.length > 1) pts.push(b[b.length - 1]);

  const colors = [MINT, CYAN, WHITE];
  for (let i = 0; i < Math.min(4, pts.length); i++) {
    flowers.push({
      x: pts[i].x + randRange(-8, 8),
      y: pts[i].y + randRange(-8, 8),
      size: 10 + Math.random() * 10,
      rings: 2 + Math.floor(Math.random() * 2),
      rotation: Math.random() * Math.PI / 6,
      color: colors[i % colors.length],
    });
  }
  return flowers;
}

function buildTriLeaves(vine: Seg[], branches: Seg[][]): TriLeaf[] {
  const leaves: TriLeaf[] = [];
  const pts: Seg[] = [];
  for (let i = 4; i < vine.length; i += 5) pts.push(vine[i]);
  for (const b of branches) for (let i = 0; i < b.length; i += 2) pts.push(b[i]);

  const colors = [MINT, CYAN];
  for (let i = 0; i < Math.min(10, pts.length); i++) {
    const side = i % 2 === 0 ? -1 : 1;
    leaves.push({
      x: pts[i].x,
      y: pts[i].y,
      angle: pts[i].angle + side * (Math.PI / 3),
      size: 6 + Math.random() * 8,
      color: colors[i % colors.length],
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

    const vine = buildAngularVine(w, h);
    const branches = buildAngularBranches(vine);
    const flowers = buildHexFlowers(vine, branches);
    const leaves = buildTriLeaves(vine, branches);

    let time = 0;

    function drawGrid() {
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.4;
      const spacing = 30;
      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function drawAngularSegments(segs: Seg[], color: string, lineW: number) {
      if (segs.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';

      for (let i = 1; i < segs.length; i++) {
        ctx.globalAlpha = 0.5 + (i / segs.length) * 0.5;
        ctx.beginPath();
        ctx.moveTo(segs[i - 1].x, segs[i - 1].y);
        ctx.lineTo(segs[i].x, segs[i].y);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(segs[i].x - 1.5, segs[i].y - 1.5, 3, 3);
      }
      ctx.globalAlpha = 1;
    }

    function drawHexFlower(f: HexFlower, t: number) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation + t * 0.15);

      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1;

      for (let ring = 1; ring <= f.rings; ring++) {
        const r = f.size * ring * 0.5;
        const pulse = 1 + Math.sin(t * 2 + ring) * 0.06;
        ctx.globalAlpha = 0.4 + (ring / f.rings) * 0.4;
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * r * pulse;
          const py = Math.sin(a) * r * pulse;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.globalAlpha = 0.8;
      ctx.fillStyle = f.color;
      ctx.fillRect(-2, -2, 4, 4);

      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const outerR = f.size * f.rings * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * outerR * 1.3, Math.sin(a) * outerR * 1.3);
        ctx.stroke();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawTriLeaf(leaf: TriLeaf, t: number) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      const sway = Math.sin(t * 0.7 + leaf.angle * 3) * 0.04;
      ctx.rotate(leaf.angle + sway);

      ctx.strokeStyle = leaf.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(leaf.size, -leaf.size * 0.5);
      ctx.lineTo(leaf.size, leaf.size * 0.5);
      ctx.closePath();
      ctx.stroke();

      ctx.globalAlpha = 0.08;
      ctx.fillStyle = leaf.color;
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawScanLine(t: number) {
      const scanY = (t * 40) % h;
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = MINT;
      ctx.fillRect(0, scanY, w, 2);
      ctx.globalAlpha = 1;
    }

    function render() {
      time += 0.016;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);
      drawGrid();
      drawScanLine(time);

      drawAngularSegments(vine, WHITE, 1.5);
      for (const b of branches) drawAngularSegments(b, MINT, 1);

      for (const leaf of leaves) drawTriLeaf(leaf, time);
      for (const flower of flowers) drawHexFlower(flower, time);

      frameRef.current = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: BG }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute', top: 16, left: 12,
        width: 54, height: 40, borderRadius: 4,
        border: `1px solid ${GRID}`,
        background: 'rgba(125,255,195,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6" stroke={MINT} strokeWidth="1" opacity="0.5" />
          <circle cx="9" cy="9" r="2" fill={MINT} opacity="0.3" />
        </svg>
      </div>
      <div style={{
        position: 'absolute', top: 60, left: 12,
        color: MINT, fontFamily: FONT, fontSize: 9, opacity: 0.4,
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        cam
      </div>

      <div style={{
        position: 'absolute', left: 12, top: 90,
        display: 'flex', flexDirection: 'column', gap: 20,
        zIndex: 20,
      }}>
        {[
          { icon: (
            <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" stroke={WHITE} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <path d="M11 3v3M11 16v3" stroke={WHITE} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
              <path d="M7 5l1 2M14 15l1 2" stroke={MINT} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </svg>
          ), label: 'ROT' },
          { icon: (
            <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <polygon points="11,2 20,18 2,18" stroke={CYAN} strokeWidth="1" fill="none" opacity="0.5" />
              <polygon points="11,7 16,16 6,16" stroke={CYAN} strokeWidth="0.7" fill="none" opacity="0.3" />
            </svg>
          ), label: 'BLM' },
          { icon: (
            <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <rect x="5" y="5" width="12" height="12" stroke={MINT} strokeWidth="1" opacity="0.5" />
              <rect x="8" y="8" width="6" height="6" stroke={MINT} strokeWidth="0.7" opacity="0.3" />
              <line x1="11" y1="2" x2="11" y2="5" stroke={MINT} strokeWidth="1" opacity="0.3" />
            </svg>
          ), label: 'SPR' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${GRID}`, borderRadius: 2,
            }}>
              {item.icon}
            </div>
            <span style={{
              color: WHITE, fontFamily: FONT, fontSize: 9, opacity: 0.35,
              letterSpacing: 2, textTransform: 'uppercase',
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 20, left: 12,
        color: WHITE, fontFamily: FONT, fontSize: 9, opacity: 0.25,
        letterSpacing: 2, textTransform: 'uppercase', lineHeight: '16px',
      }}>
        hand.garden<br />
        v2.0 // terrarium
      </div>

      <div style={{
        position: 'absolute', top: 16, right: 14,
        color: MINT, fontFamily: FONT, fontSize: 10, opacity: 0.35,
        textAlign: 'right', letterSpacing: 1,
      }}>
        01 HAND<br />
        DETECTED
      </div>
    </div>
  );
}
