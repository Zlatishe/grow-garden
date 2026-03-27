import { useEffect, useRef } from 'react';
import './_group.css';

const BG = '#F5F0E8';
const STEM_GREEN = '#3D5A3A';
const DARK_GREEN = '#2A3E28';
const LEAF_GREEN = '#5A7D52';
const PETAL_PINK = '#D4909A';
const PETAL_GOLD = '#C8A84E';
const PETAL_LILAC = '#9B8EC4';
const EARTH = '#8B7355';
const TEXT = '#3A3530';
const FONT = "'Cormorant Garamond', serif";

interface Seg { x: number; y: number; angle: number; thickness: number }
interface WildFlower {
  x: number; y: number; kind: 'daisy' | 'bell' | 'cluster';
  size: number; color: string; rotation: number;
}
interface GrassLeaf { x: number; y: number; angle: number; length: number; curve: number }

function randRange(a: number, b: number) { return a + Math.random() * (b - a); }

function buildWildStems(w: number, h: number): Seg[][] {
  const stems: Seg[][] = [];
  const basePoints = [w * 0.25, w * 0.42, w * 0.6, w * 0.78];

  for (const bx of basePoints) {
    const stem: Seg[] = [{ x: bx + randRange(-10, 10), y: h - 45, angle: -Math.PI / 2, thickness: 2.5 + Math.random() }];
    const segCount = 15 + Math.floor(Math.random() * 20);

    for (let i = 0; i < segCount; i++) {
      const last = stem[stem.length - 1];
      const lean = (bx < w * 0.5) ? 0.08 : -0.08;
      const angle = -Math.PI / 2 + lean + Math.sin(i * 0.6) * 0.2 + (Math.random() - 0.5) * 0.15;
      const segLen = 8 + Math.random() * 6;
      const ny = last.y + Math.sin(angle) * segLen;
      if (ny < 100 + Math.random() * 200) break;
      stem.push({
        x: last.x + Math.cos(angle) * segLen,
        y: ny,
        angle,
        thickness: Math.max(0.6, last.thickness - 0.08),
      });
    }
    stems.push(stem);
  }
  return stems;
}

function buildWildFlowers(stems: Seg[][]): WildFlower[] {
  const flowers: WildFlower[] = [];
  const kinds: WildFlower['kind'][] = ['daisy', 'bell', 'cluster'];
  const colors = [PETAL_PINK, PETAL_GOLD, PETAL_LILAC, PETAL_PINK];

  for (let s = 0; s < stems.length; s++) {
    const stem = stems[s];
    if (stem.length < 5) continue;
    const tip = stem[stem.length - 1];
    flowers.push({
      x: tip.x + randRange(-5, 5), y: tip.y + randRange(-8, -2),
      kind: kinds[s % kinds.length], size: 12 + Math.random() * 10,
      color: colors[s % colors.length], rotation: Math.random() * Math.PI * 2,
    });

    if (stem.length > 10 && Math.random() > 0.4) {
      const mid = stem[Math.floor(stem.length * 0.6)];
      flowers.push({
        x: mid.x + randRange(-12, 12), y: mid.y + randRange(-6, 6),
        kind: kinds[(s + 1) % kinds.length], size: 8 + Math.random() * 8,
        color: colors[(s + 1) % colors.length], rotation: Math.random() * Math.PI * 2,
      });
    }
  }
  return flowers;
}

function buildGrassLeaves(stems: Seg[][]): GrassLeaf[] {
  const leaves: GrassLeaf[] = [];

  for (const stem of stems) {
    for (let i = 2; i < stem.length; i += 3) {
      const seg = stem[i];
      const side = i % 2 === 0 ? -1 : 1;
      leaves.push({
        x: seg.x, y: seg.y,
        angle: seg.angle + side * (Math.PI / 4 + Math.random() * 0.3),
        length: 15 + Math.random() * 25,
        curve: (0.3 + Math.random() * 0.5) * side,
      });
    }
  }

  const grassCount = 12 + Math.floor(Math.random() * 8);
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (let i = 0; i < grassCount; i++) {
    leaves.push({
      x: randRange(20, w - 20), y: h - 40 + randRange(-8, 8),
      angle: -Math.PI / 2 + randRange(-0.3, 0.3),
      length: 20 + Math.random() * 35,
      curve: randRange(-0.4, 0.4),
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

    const stems = buildWildStems(w, h);
    const flowers = buildWildFlowers(stems);
    const grassLeaves = buildGrassLeaves(stems);

    let time = 0;

    function drawEarth() {
      const grad = ctx.createLinearGradient(0, h - 50, 0, h);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.3, EARTH + '15');
      grad.addColorStop(1, EARTH + '30');
      ctx.fillStyle = grad;
      ctx.fillRect(0, h - 50, w, 50);
    }

    function drawStem(stem: Seg[]) {
      if (stem.length < 2) return;
      ctx.strokeStyle = STEM_GREEN;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stem[0].x, stem[0].y);
      for (let i = 1; i < stem.length; i++) {
        if (i < stem.length - 1) {
          const curr = stem[i];
          const next = stem[i + 1];
          ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
        } else {
          ctx.lineTo(stem[i].x, stem[i].y);
        }
      }
      ctx.lineWidth = stem[0].thickness;
      ctx.globalAlpha = 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function drawDaisy(f: WildFlower, t: number) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation + Math.sin(t * 0.4) * 0.03);

      const petalCount = 8;
      for (let i = 0; i < petalCount; i++) {
        const a = (i / petalCount) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.ellipse(f.size * 0.55, 0, f.size * 0.35, f.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = f.color === PETAL_PINK ? '#B06B75' : '#9A8030';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = PETAL_GOLD;
      ctx.beginPath();
      ctx.arc(0, 0, f.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9A8030';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.5;
      ctx.stroke();

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawBell(f: WildFlower, t: number) {
      ctx.save();
      ctx.translate(f.x, f.y);
      const sway = Math.sin(t * 0.5 + f.rotation) * 0.05;
      ctx.rotate(sway);

      ctx.strokeStyle = f.color;
      ctx.fillStyle = f.color;
      ctx.lineWidth = 1.2;

      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(-f.size * 0.15, -f.size * 0.3);
      ctx.bezierCurveTo(
        -f.size * 0.5, f.size * 0.2,
        f.size * 0.5, f.size * 0.2,
        f.size * 0.15, -f.size * 0.3
      );
      ctx.fill();

      ctx.globalAlpha = 0.7;
      ctx.stroke();

      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(0, f.size * 0.15);
      ctx.lineTo(0, f.size * 0.35);
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = PETAL_GOLD;
      ctx.beginPath();
      ctx.arc(0, f.size * 0.38, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawCluster(f: WildFlower, t: number) {
      ctx.save();
      ctx.translate(f.x, f.y);

      const count = 5 + Math.floor(Math.random() * 0.01);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.sin(t * 0.3) * 0.02;
        const r = f.size * 0.3;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        ctx.fillStyle = f.color;
        ctx.globalAlpha = 0.55 + Math.random() * 0.15;
        ctx.beginPath();
        ctx.arc(px, py, f.size * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = PETAL_GOLD;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, f.size * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function drawGrassLeaf(leaf: GrassLeaf, t: number) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      const sway = Math.sin(t * 0.8 + leaf.x * 0.02) * 0.04;
      ctx.rotate(leaf.angle + sway);

      ctx.strokeStyle = LEAF_GREEN;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.65;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        leaf.length * 0.5 * leaf.curve, -leaf.length * 0.5,
        leaf.length * 0.3 * leaf.curve, -leaf.length
      );
      ctx.stroke();

      ctx.restore();
      ctx.globalAlpha = 1;
    }

    function render() {
      time += 0.016;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);
      drawEarth();

      for (const leaf of grassLeaves) drawGrassLeaf(leaf, time);
      for (const stem of stems) drawStem(stem);

      for (const f of flowers) {
        if (f.kind === 'daisy') drawDaisy(f, time);
        else if (f.kind === 'bell') drawBell(f, time);
        else drawCluster(f, time);
      }

      frameRef.current = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: BG }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        width: 36, height: 36, borderRadius: '50%',
        border: `1.5px solid ${EARTH}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="5" stroke={EARTH} strokeWidth="1" opacity="0.4" />
          <circle cx="8" cy="8" r="1.5" fill={EARTH} opacity="0.3" />
        </svg>
      </div>

      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, zIndex: 20,
      }}>
        {[
          { icon: (
            <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <path d="M9 14C9 14 9 5 9 3" stroke={STEM_GREEN} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
              <path d="M9 8C7 6 5 7 5 9" stroke={LEAF_GREEN} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
              <path d="M9 6C11 4 13 5 13 7" stroke={LEAF_GREEN} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </svg>
          ), label: 'grow' },
          { icon: (
            <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="8" r="3" fill={PETAL_PINK} opacity="0.4" />
              <ellipse cx="9" cy="4.5" rx="2" ry="3" fill={PETAL_PINK} opacity="0.3" />
              <ellipse cx="12.5" cy="8" rx="3" ry="2" fill={PETAL_PINK} opacity="0.3" />
              <ellipse cx="9" cy="11.5" rx="2" ry="3" fill={PETAL_PINK} opacity="0.3" />
              <ellipse cx="5.5" cy="8" rx="3" ry="2" fill={PETAL_PINK} opacity="0.3" />
              <circle cx="9" cy="8" r="1.5" fill={PETAL_GOLD} opacity="0.6" />
            </svg>
          ), label: 'bloom' },
          { icon: (
            <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <path d="M9 15C9 15 9 8 9 8" stroke={STEM_GREEN} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
              <path d="M9 8C9 8 6 5 4 6C2 7 4 10 6 9C8 8 9 8 9 8" fill={LEAF_GREEN} opacity="0.35" />
              <path d="M9 8C9 8 12 5 14 6C16 7 14 10 12 9C10 8 9 8 9 8" fill={LEAF_GREEN} opacity="0.35" />
            </svg>
          ), label: 'leaf' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20,
            background: `${TEXT}08`,
            border: `1px solid ${TEXT}12`,
          }}>
            {item.icon}
            <span style={{
              fontFamily: FONT, fontSize: 13, color: TEXT, opacity: 0.5,
              fontStyle: 'italic', fontWeight: 400,
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)',
        fontFamily: FONT, color: TEXT, opacity: 0.25, fontSize: 11,
        fontStyle: 'italic', letterSpacing: 1,
      }}>
        1 hand detected
      </div>

      <div style={{
        position: 'absolute', top: '46%', left: '50%', transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none', opacity: 0.08,
      }}>
        <h1 style={{
          fontFamily: FONT, fontSize: 42, fontWeight: 300, color: TEXT,
          letterSpacing: 4, fontStyle: 'italic',
        }}>
          Hand Garden
        </h1>
        <p style={{
          fontFamily: FONT, fontSize: 14, fontWeight: 400, color: EARTH,
          letterSpacing: 3, marginTop: 2, textTransform: 'uppercase',
        }}>
          Wild Meadow
        </p>
      </div>
    </div>
  );
}
