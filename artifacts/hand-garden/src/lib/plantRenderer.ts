const CREAM = '#E9E8D5';
const BG_COLOR = '#33442A';

interface StemSegment {
  x: number;
  y: number;
  angle: number;
  thickness: number;
}

interface Branch {
  segments: StemSegment[];
  angle: number;
  maxLength: number;
  growthProgress: number;
  targetAngle: number;
  depth: number;
  curveSeed: number;
  currentAngle: number;
  segsSinceSubBranch: number;
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

interface Vine {
  segments: StemSegment[];
  branches: Branch[];
  baseX: number;
  growthProgress: number;
  spiralAngle: number;
  segmentsSinceLastBranch: number;
  flowers: Flower[];
  leaves: Leaf[];
  nextLeafSide: 'left' | 'right';
  lastAngle: number;
}

export class PlantRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private vines: Map<number, Vine> = new Map();
  private animationFrame: number = 0;
  private time: number = 0;
  private handCount: number = 1;
  private scaleFactor: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  private updateScaleFactor() {
    const w = window.innerWidth;
    if (w > 1024) {
      this.scaleFactor = 1.6 + (Math.min(w, 1920) - 1024) / (1920 - 1024) * 0.6;
    } else if (w > 768) {
      this.scaleFactor = 1.2 + (w - 768) / (1024 - 768) * 0.4;
    } else {
      this.scaleFactor = 1;
    }
  }

  private isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.updateScaleFactor();
  }

  setHandCount(count: number) {
    this.handCount = Math.max(1, Math.min(2, count));
  }

  private getVineBaseX(handIndex: number): number {
    const w = window.innerWidth;
    if (this.handCount <= 1) return w * 0.5;
    if (this.isMobile()) {
      return handIndex === 0 ? w * 0.25 : w * 0.55;
    }
    return handIndex === 0 ? w * 0.35 : w * 0.65;
  }

  private ensureVine(handIndex: number): Vine {
    if (!this.vines.has(handIndex)) {
      const baseX = this.getVineBaseX(handIndex);
      const s = this.scaleFactor;
      this.vines.set(handIndex, {
        segments: [{ x: baseX, y: window.innerHeight - 40, angle: -Math.PI / 2, thickness: 4.5 * s }],
        branches: [],
        baseX,
        growthProgress: 0,
        spiralAngle: 0,
        segmentsSinceLastBranch: 0,
        flowers: [],
        leaves: [],
        nextLeafSide: 'left',
        lastAngle: -Math.PI / 2,
      });
    }
    return this.vines.get(handIndex)!;
  }

  growStem(rotationAmount: number, handIndex: number = 0) {
    const vine = this.ensureVine(handIndex);
    const last = vine.segments[vine.segments.length - 1];
    const s = this.scaleFactor;

    this.growPendingBranches(vine);

    const clampedRotation = Math.min(rotationAmount, 0.6);
    vine.spiralAngle += clampedRotation * 0.5;
    const spiralInfluence = Math.sin(vine.spiralAngle) * 0.08;

    const segmentLength = (9 + Math.random() * 5) * s;
    const baseAngle = -Math.PI / 2;
    const wobble = (Math.random() - 0.5) * 0.03;
    const targetAngle = baseAngle + spiralInfluence + wobble;

    const smoothedAngle = vine.lastAngle + (targetAngle - vine.lastAngle) * 0.25;
    vine.lastAngle = smoothedAngle;

    const maxHeight = 80;
    if (last.y < maxHeight) return;

    const newX = last.x + Math.cos(smoothedAngle) * segmentLength;
    const newY = last.y + Math.sin(smoothedAngle) * segmentLength;

    const thickness = Math.max(1.2 * s, 4.5 * s - vine.segments.length * 0.02);

    vine.segments.push({
      x: newX,
      y: newY,
      angle: smoothedAngle,
      thickness,
    });

    vine.growthProgress += segmentLength;
    vine.segmentsSinceLastBranch++;

    const branchInterval = 5 + Math.floor(Math.random() * 4);
    if (vine.segmentsSinceLastBranch >= branchInterval && vine.segments.length > 3) {
      this.spawnBranch(vine, vine.segments.length - 1, 0);
      vine.segmentsSinceLastBranch = 0;
    }
  }

  private spawnBranch(vine: Vine, segIdx: number, depth: number, sourceSeg?: StemSegment) {
    const seg = sourceSeg || vine.segments[segIdx];
    const side = Math.random() > 0.5 ? 1 : -1;

    const startAngle = seg.angle + side * (0.15 + Math.random() * 0.1);

    const finalSpread = depth === 0
      ? Math.PI / 4 + Math.random() * Math.PI / 6
      : Math.PI / 5 + Math.random() * Math.PI / 8;
    const targetAngle = seg.angle + side * finalSpread;

    const maxLen = depth === 0
      ? 12 + Math.floor(Math.random() * 9)
      : 5 + Math.floor(Math.random() * 6);

    const thicknessRatio = depth === 0 ? 0.65 : 0.55;

    const branch: Branch = {
      segments: [{ x: seg.x, y: seg.y, angle: startAngle, thickness: seg.thickness * thicknessRatio }],
      angle: startAngle,
      maxLength: maxLen,
      growthProgress: 0,
      targetAngle,
      depth,
      curveSeed: Math.random() * Math.PI * 2,
      currentAngle: startAngle,
      segsSinceSubBranch: 0,
    };

    vine.branches.push(branch);
  }

  private growPendingBranches(vine: Vine) {
    const s = this.scaleFactor;

    for (const branch of vine.branches) {
      const currentLen = branch.segments.length - 1;
      if (currentLen >= branch.maxLength) continue;

      {
        const i = branch.segments.length - 1;
        const prev = branch.segments[branch.segments.length - 1];
        const progress = i / branch.maxLength;

        const bLen = (branch.depth === 0
          ? 8 + Math.random() * 4
          : 5 + Math.random() * 3) * s;

        const curveToTarget = (branch.targetAngle - branch.currentAngle) * 0.15;
        const organicWave = Math.sin(branch.curveSeed + progress * Math.PI * 2.5) * 0.04;
        const gentleLift = -0.008;

        branch.currentAngle += curveToTarget + organicWave + gentleLift;

        const taperRate = branch.depth === 0 ? 0.90 : 0.85;
        branch.segments.push({
          x: prev.x + Math.cos(branch.currentAngle) * bLen,
          y: prev.y + Math.sin(branch.currentAngle) * bLen,
          angle: branch.currentAngle,
          thickness: Math.max(0.4, prev.thickness * taperRate),
        });

        branch.segsSinceSubBranch++;

        if (branch.depth < 2 && branch.segsSinceSubBranch >= (4 + Math.floor(Math.random() * 3)) && i > 2 && i < branch.maxLength - 1) {
          this.spawnBranch(vine, -1, branch.depth + 1, branch.segments[branch.segments.length - 1]);
          branch.segsSinceSubBranch = 0;
        }
      }

      if (branch.segments.length - 1 >= branch.maxLength) {
        branch.growthProgress = 1;
      } else {
        branch.growthProgress = (branch.segments.length - 1) / branch.maxLength;
      }
    }
  }

  addFlower(intensity: number, handIndex: number = 0) {
    const vine = this.vines.get(handIndex);
    if (!vine || vine.segments.length < 5) return;
    const s = this.scaleFactor;

    const allAttachPoints = this.getAttachPoints(vine);
    if (allAttachPoints.length === 0) return;

    const shuffled = [...allAttachPoints].sort(() => Math.random() - 0.5);

    let chosenPt = shuffled[0];
    for (const candidate of shuffled) {
      const tooClose = vine.flowers.some(f => {
        const dist = Math.sqrt((f.x - candidate.x) ** 2 + (f.y - candidate.y) ** 2);
        return dist < 15 * s;
      });
      if (!tooClose) {
        chosenPt = candidate;
        break;
      }
    }

    const petalCount = 5 + Math.floor(Math.random() * 4);
    vine.flowers.push({
      x: chosenPt.x + (Math.random() - 0.5) * 8 * s,
      y: chosenPt.y + (Math.random() - 0.5) * 8 * s,
      petalCount,
      petalSize: (8 + Math.random() * 10) * s,
      bloomProgress: 0,
      targetBloom: 1.0,
      rotation: Math.random() * Math.PI * 2,
    });
  }

  addLeaf(handIndex: number = 0) {
    const vine = this.vines.get(handIndex);
    if (!vine || vine.segments.length < 4) return;
    const s = this.scaleFactor;

    const allAttachPoints = this.getAttachPoints(vine);
    if (allAttachPoints.length === 0) return;

    const pt = allAttachPoints[Math.floor(Math.random() * allAttachPoints.length)];

    const side = vine.nextLeafSide;
    vine.nextLeafSide = side === 'left' ? 'right' : 'left';

    const baseAngle = side === 'left'
      ? pt.angle - Math.PI / 2 - Math.random() * 0.4
      : pt.angle + Math.PI / 2 + Math.random() * 0.4;

    vine.leaves.push({
      x: pt.x,
      y: pt.y,
      size: (15 + Math.random() * 20) * s,
      angle: baseAngle,
      side,
      growProgress: 0,
    });
  }

  private getAttachPoints(vine: Vine): StemSegment[] {
    const points: StemSegment[] = [];

    for (let i = 3; i < vine.segments.length; i++) {
      points.push(vine.segments[i]);
    }

    for (const branch of vine.branches) {
      for (let i = 1; i < branch.segments.length; i++) {
        points.push(branch.segments[i]);
      }
    }

    return points;
  }

  private catmullRomPoint(
    p0: StemSegment, p1: StemSegment, p2: StemSegment, p3: StemSegment, t: number
  ): { x: number; y: number } {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    };
  }

  private drawSegments(segments: StemSegment[]) {
    const ctx = this.ctx;
    if (segments.length < 2) return;

    ctx.strokeStyle = CREAM;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (segments.length <= 3) {
      for (let i = 1; i < segments.length; i++) {
        const prev = segments[i - 1];
        const curr = segments[i];
        ctx.beginPath();
        ctx.lineWidth = curr.thickness;
        ctx.globalAlpha = Math.min(1, 0.6 + (i / segments.length) * 0.4);
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return;
    }

    const stepsPerSegment = 8;
    for (let i = 0; i < segments.length - 1; i++) {
      const p0 = segments[Math.max(0, i - 1)];
      const p1 = segments[i];
      const p2 = segments[i + 1];
      const p3 = segments[Math.min(segments.length - 1, i + 2)];

      const startThick = p1.thickness;
      const endThick = p2.thickness;
      const progress = i / (segments.length - 1);
      const alpha = Math.min(1, 0.6 + progress * 0.4);

      ctx.globalAlpha = alpha;

      let prevPt = this.catmullRomPoint(p0, p1, p2, p3, 0);
      for (let s = 1; s <= stepsPerSegment; s++) {
        const t = s / stepsPerSegment;
        const pt = this.catmullRomPoint(p0, p1, p2, p3, t);
        const thick = startThick + (endThick - startThick) * t;

        ctx.beginPath();
        ctx.lineWidth = thick;
        ctx.moveTo(prevPt.x, prevPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();

        prevPt = pt;
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawFlower(flower: Flower) {
    const ctx = this.ctx;
    const progress = flower.bloomProgress;
    if (progress <= 0) return;
    const s = this.scaleFactor;

    ctx.save();
    ctx.translate(flower.x, flower.y);
    ctx.rotate(flower.rotation);

    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 1 * s;
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
    ctx.arc(0, 0, (2 + progress * 2) * s, 0, Math.PI * 2);
    ctx.stroke();

    if (progress > 0.3) {
      ctx.beginPath();
      const dotCount = 3 + Math.floor(progress * 4);
      for (let i = 0; i < dotCount; i++) {
        const a = (i / dotCount) * Math.PI * 2;
        const r = (1.5 + progress) * s;
        ctx.moveTo(Math.cos(a) * r + 0.5 * s, Math.sin(a) * r);
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 0.5 * s, 0, Math.PI * 2);
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
    const s = this.scaleFactor;

    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle);

    const size = leaf.size * progress;

    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 1 * s;
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
    const s = this.scaleFactor;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 0.8 * s;
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

    for (const vine of this.vines.values()) {
      vine.flowers.forEach(f => {
        if (f.bloomProgress < f.targetBloom) {
          f.bloomProgress += (f.targetBloom - f.bloomProgress) * 0.03;
          if (f.targetBloom - f.bloomProgress < 0.001) {
            f.bloomProgress = f.targetBloom;
          }
        }
        f.rotation += Math.sin(this.time * 0.5) * 0.001;
      });

      vine.leaves.forEach(l => {
        if (l.growProgress < 1) {
          l.growProgress += (1 - l.growProgress) * 0.04;
        }
      });
    }
  }

  render() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    const sway = Math.sin(this.time * 0.3) * 0.5;

    for (const vine of this.vines.values()) {
      ctx.save();
      const stemSway = sway * 0.002;
      ctx.transform(1, 0, stemSway, 1, 0, 0);

      this.drawSegments(vine.segments);

      for (const branch of vine.branches) {
        this.drawSegments(branch.segments);
      }

      ctx.restore();

      vine.leaves.forEach(leaf => this.drawLeaf(leaf));
      vine.flowers.forEach(flower => this.drawFlower(flower));

      if (vine.segments.length > 3) {
        const tipSeg = vine.segments[vine.segments.length - 1];
        if (vine.flowers.length === 0 && vine.leaves.length === 0) {
          this.drawSmallBud(tipSeg.x, tipSeg.y - 3 * this.scaleFactor, 4 * this.scaleFactor);
        }
      }
    }
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
    this.vines.clear();
  }
}
