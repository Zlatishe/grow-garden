const CREAM = '#E9E8D5';
const BG_COLOR = '#33442A';

interface StemSegment {
  x: number;
  y: number;
  angle: number;
  thickness: number;
}

interface Flower {
  x: number;
  y: number;
  petalCount: number;
  petalSize: number;
  bloomProgress: number;
  targetBloom: number;
  rotation: number;
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  angle: number;
  side: 'left' | 'right';
  growProgress: number;
}

interface Stem {
  segments: StemSegment[];
  baseX: number;
  growthProgress: number;
  spiralAngle: number;
}

export class PlantRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stem: Stem | null = null;
  private flowers: Flower[] = [];
  private leaves: Leaf[] = [];
  private animationFrame: number = 0;
  private time: number = 0;
  private nextLeafSide: 'left' | 'right' = 'left';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private ensureStem(): Stem {
    if (!this.stem) {
      const w = window.innerWidth;
      this.stem = {
        segments: [{ x: w * 0.5, y: window.innerHeight - 40, angle: -Math.PI / 2, thickness: 2.5 }],
        baseX: w * 0.5,
        growthProgress: 0,
        spiralAngle: 0,
      };
    }
    return this.stem;
  }

  growStem(rotationAmount: number) {
    const stem = this.ensureStem();
    const last = stem.segments[stem.segments.length - 1];

    stem.spiralAngle += rotationAmount * 1.5;
    const spiralInfluence = Math.sin(stem.spiralAngle) * 0.3;

    const segmentLength = 6 + Math.random() * 3;
    const baseAngle = -Math.PI / 2;
    const wobble = (Math.random() - 0.5) * 0.15;
    const newAngle = baseAngle + spiralInfluence + wobble;

    const maxHeight = 80;
    if (last.y < maxHeight) return;

    const newX = last.x + Math.cos(newAngle) * segmentLength;
    const newY = last.y + Math.sin(newAngle) * segmentLength;

    const thickness = Math.max(0.8, 2.5 - stem.segments.length * 0.015);

    stem.segments.push({
      x: newX,
      y: newY,
      angle: newAngle,
      thickness,
    });

    stem.growthProgress += segmentLength;
  }

  addFlower(intensity: number) {
    const stem = this.stem;
    if (!stem || stem.segments.length < 5) return;

    const segIdx = Math.max(3, stem.segments.length - Math.floor(Math.random() * 5) - 1);
    const seg = stem.segments[segIdx];

    const tooClose = this.flowers.some(f => {
      const dist = Math.sqrt((f.x - seg.x) ** 2 + (f.y - seg.y) ** 2);
      return dist < 40;
    });
    if (tooClose) {
      this.flowers.forEach(f => {
        if (f.targetBloom < 1) {
          f.targetBloom = Math.min(1, f.targetBloom + 0.3);
        }
      });
      return;
    }

    const petalCount = 5 + Math.floor(Math.random() * 4);
    this.flowers.push({
      x: seg.x + (Math.random() - 0.5) * 8,
      y: seg.y + (Math.random() - 0.5) * 8,
      petalCount,
      petalSize: 8 + Math.random() * 10,
      bloomProgress: 0,
      targetBloom: Math.min(1, 0.3 + intensity * 0.3),
      rotation: Math.random() * Math.PI * 2,
    });
  }

  addLeaf() {
    const stem = this.stem;
    if (!stem || stem.segments.length < 4) return;

    const segIdx = 3 + Math.floor(Math.random() * (stem.segments.length - 3));
    const seg = stem.segments[segIdx];

    const side = this.nextLeafSide;
    this.nextLeafSide = side === 'left' ? 'right' : 'left';

    const baseAngle = side === 'left'
      ? seg.angle - Math.PI / 2 - Math.random() * 0.4
      : seg.angle + Math.PI / 2 + Math.random() * 0.4;

    this.leaves.push({
      x: seg.x,
      y: seg.y,
      size: 15 + Math.random() * 20,
      angle: baseAngle,
      side,
      growProgress: 0,
    });
  }

  private drawStem(stem: Stem) {
    const ctx = this.ctx;
    if (stem.segments.length < 2) return;

    ctx.strokeStyle = CREAM;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < stem.segments.length; i++) {
      const prev = stem.segments[i - 1];
      const curr = stem.segments[i];

      ctx.beginPath();
      ctx.lineWidth = curr.thickness;
      ctx.globalAlpha = Math.min(1, 0.6 + (i / stem.segments.length) * 0.4);
      ctx.moveTo(prev.x, prev.y);

      if (i < stem.segments.length - 1) {
        const next = stem.segments[i + 1];
        const cpx = curr.x;
        const cpy = curr.y;
        const ex = (curr.x + next.x) / 2;
        const ey = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      } else {
        ctx.lineTo(curr.x, curr.y);
      }

      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private drawFlower(flower: Flower) {
    const ctx = this.ctx;
    const progress = flower.bloomProgress;
    if (progress <= 0) return;

    ctx.save();
    ctx.translate(flower.x, flower.y);
    ctx.rotate(flower.rotation);

    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8 + progress * 0.2;

    const size = flower.petalSize * progress;

    for (let i = 0; i < flower.petalCount; i++) {
      const angle = (i / flower.petalCount) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      const cp1x = size * 0.3;
      const cp1y = -size * 0.6;
      const cp2x = size * 0.7;
      const cp2y = -size * 0.6;
      const ex = size * 0.5;
      const ey = 0;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
      ctx.bezierCurveTo(cp2x, -cp2y + ey * 2, cp1x, -cp1y + ey * 2, 0, 0);
      ctx.stroke();

      if (progress > 0.5) {
        ctx.globalAlpha = (progress - 0.5) * 0.3;
        ctx.beginPath();
        const veinLen = size * 0.4 * progress;
        ctx.moveTo(2, 0);
        ctx.lineTo(size * 0.3, -veinLen * 0.3);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.globalAlpha = progress;
    ctx.beginPath();
    ctx.arc(0, 0, 2 + progress * 2, 0, Math.PI * 2);
    ctx.stroke();

    if (progress > 0.3) {
      ctx.beginPath();
      const dotCount = 3 + Math.floor(progress * 4);
      for (let i = 0; i < dotCount; i++) {
        const a = (i / dotCount) * Math.PI * 2;
        const r = 1.5 + progress;
        ctx.moveTo(Math.cos(a) * r + 0.5, Math.sin(a) * r);
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 0.5, 0, Math.PI * 2);
      }
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawLeaf(leaf: Leaf) {
    const ctx = this.ctx;
    const progress = leaf.growProgress;
    if (progress <= 0) return;

    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle);

    const size = leaf.size * progress;

    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7 + progress * 0.3;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      size * 0.2, -size * 0.4,
      size * 0.8, -size * 0.3,
      size, 0
    );
    ctx.bezierCurveTo(
      size * 0.8, size * 0.3,
      size * 0.2, size * 0.4,
      0, 0
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size * 0.9, 0);
    ctx.stroke();

    if (progress > 0.4) {
      const veinCount = 3 + Math.floor(progress * 3);
      for (let i = 1; i <= veinCount; i++) {
        const t = i / (veinCount + 1);
        const vx = size * t;
        const veinSize = size * 0.2 * (1 - Math.abs(t - 0.5) * 1.5) * progress;

        ctx.beginPath();
        ctx.moveTo(vx, 0);
        ctx.lineTo(vx + veinSize * 0.5, -veinSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(vx, 0);
        ctx.lineTo(vx + veinSize * 0.5, veinSize);
        ctx.stroke();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawSmallBud(x: number, y: number, size: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.4;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-size * 0.3, -size, size * 0.3, -size, 0, 0);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  update() {
    this.time += 0.016;

    this.flowers.forEach(f => {
      if (f.bloomProgress < f.targetBloom) {
        f.bloomProgress += (f.targetBloom - f.bloomProgress) * 0.03;
      }
      f.rotation += Math.sin(this.time * 0.5) * 0.001;
    });

    this.leaves.forEach(l => {
      if (l.growProgress < 1) {
        l.growProgress += (1 - l.growProgress) * 0.04;
      }
    });
  }

  render() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    const sway = Math.sin(this.time * 0.3) * 0.5;
    ctx.save();

    if (this.stem) {
      ctx.save();
      const stemSway = sway * 0.002;
      ctx.transform(1, 0, stemSway, 1, 0, 0);
      this.drawStem(this.stem);
      ctx.restore();
    }

    this.leaves.forEach(leaf => this.drawLeaf(leaf));
    this.flowers.forEach(flower => this.drawFlower(flower));

    if (this.stem && this.stem.segments.length > 3) {
      const tipSeg = this.stem.segments[this.stem.segments.length - 1];
      if (this.flowers.length === 0 && this.leaves.length === 0) {
        this.drawSmallBud(tipSeg.x, tipSeg.y - 3, 4);
      }
    }

    ctx.restore();
  }

  startAnimation() {
    const loop = () => {
      this.update();
      this.render();
      this.animationFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  reset() {
    this.stem = null;
    this.flowers = [];
    this.leaves = [];
  }
}
