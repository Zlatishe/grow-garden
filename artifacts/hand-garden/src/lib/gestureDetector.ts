export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type GestureType = 'wristRotation' | 'fingerExtension' | 'swooshLeft' | 'swooshRight';

export interface GestureEvent {
  type: GestureType;
  handIndex: number;
  value: number;
  position: { x: number; y: number };
}

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;

interface HandHistory {
  wristPositions: { x: number; y: number; time: number }[];
  lastOpenness: number;
  rotationAngle: number;
  lastSwooshX: number;
  lastSwooshTime: number;
}

export class GestureDetector {
  private handHistories: Map<number, HandHistory> = new Map();
  private listeners: ((event: GestureEvent) => void)[] = [];

  onGesture(callback: (event: GestureEvent) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emit(event: GestureEvent) {
    this.listeners.forEach(l => l(event));
  }

  private getHistory(handIndex: number): HandHistory {
    if (!this.handHistories.has(handIndex)) {
      this.handHistories.set(handIndex, {
        wristPositions: [],
        lastOpenness: 0,
        rotationAngle: 0,
        lastSwooshX: -1,
        lastSwooshTime: 0,
      });
    }
    return this.handHistories.get(handIndex)!;
  }

  processHands(multiHandLandmarks: HandLandmark[][]) {
    const activeHands = new Set<number>();

    multiHandLandmarks.forEach((landmarks, handIndex) => {
      activeHands.add(handIndex);
      const history = this.getHistory(handIndex);
      const now = Date.now();

      this.detectWristRotation(landmarks, handIndex, history, now);
      this.detectFingerExtension(landmarks, handIndex, history);
      this.detectSwoosh(landmarks, handIndex, history, now);
    });

    for (const [key] of this.handHistories) {
      if (!activeHands.has(key)) {
        this.handHistories.delete(key);
      }
    }
  }

  private detectWristRotation(
    landmarks: HandLandmark[],
    handIndex: number,
    history: HandHistory,
    now: number
  ) {
    const wrist = landmarks[WRIST];
    const pos = { x: wrist.x, y: wrist.y, time: now };

    history.wristPositions.push(pos);

    const cutoff = now - 800;
    history.wristPositions = history.wristPositions.filter(p => p.time > cutoff);

    if (history.wristPositions.length < 8) return;

    const positions = history.wristPositions;
    const cx = positions.reduce((s, p) => s + p.x, 0) / positions.length;
    const cy = positions.reduce((s, p) => s + p.y, 0) / positions.length;

    let totalAngle = 0;
    for (let i = 1; i < positions.length; i++) {
      const prev = Math.atan2(positions[i - 1].y - cy, positions[i - 1].x - cx);
      const curr = Math.atan2(positions[i].y - cy, positions[i].x - cx);
      let diff = curr - prev;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      if (diff < -Math.PI) diff += 2 * Math.PI;
      totalAngle += diff;
    }

    const absAngle = Math.abs(totalAngle);
    if (absAngle > Math.PI * 0.5) {
      const radius = positions.reduce((s, p) => {
        return s + Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
      }, 0) / positions.length;

      if (radius > 0.02) {
        history.rotationAngle += absAngle;
        this.emit({
          type: 'wristRotation',
          handIndex,
          value: absAngle,
          position: { x: cx, y: cy },
        });
        history.wristPositions = history.wristPositions.slice(-3);
      }
    }
  }

  private detectFingerExtension(
    landmarks: HandLandmark[],
    handIndex: number,
    history: HandHistory
  ) {
    const wrist = landmarks[WRIST];
    const tips = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
    const mcps = [INDEX_MCP, INDEX_MCP, MIDDLE_MCP, RING_MCP, PINKY_MCP];

    let totalExtension = 0;
    for (let i = 0; i < tips.length; i++) {
      const tip = landmarks[tips[i]];
      const mcp = landmarks[mcps[i]];
      const tipDist = Math.sqrt((tip.x - wrist.x) ** 2 + (tip.y - wrist.y) ** 2);
      const mcpDist = Math.sqrt((mcp.x - wrist.x) ** 2 + (mcp.y - wrist.y) ** 2);
      totalExtension += mcpDist > 0.01 ? tipDist / mcpDist : 0;
    }

    const openness = totalExtension / 5;

    const delta = openness - history.lastOpenness;
    if (delta > 0.15 && openness > 1.3) {
      this.emit({
        type: 'fingerExtension',
        handIndex,
        value: delta,
        position: {
          x: landmarks[MIDDLE_TIP].x,
          y: landmarks[MIDDLE_TIP].y,
        },
      });
    }

    history.lastOpenness = openness;
  }

  private detectSwoosh(
    landmarks: HandLandmark[],
    handIndex: number,
    history: HandHistory,
    now: number
  ) {
    const wrist = landmarks[WRIST];

    if (history.lastSwooshX < 0) {
      history.lastSwooshX = wrist.x;
      history.lastSwooshTime = now;
      return;
    }

    const dx = wrist.x - history.lastSwooshX;
    const dt = now - history.lastSwooshTime;

    if (dt > 0 && dt < 500) {
      const speed = Math.abs(dx) / dt;
      if (speed > 0.0008 && Math.abs(dx) > 0.12) {
        const type = dx > 0 ? 'swooshLeft' : 'swooshRight';
        this.emit({
          type,
          handIndex,
          value: Math.abs(dx),
          position: { x: wrist.x, y: wrist.y },
        });
        history.lastSwooshX = wrist.x;
        history.lastSwooshTime = now;
        return;
      }
    }

    history.lastSwooshX = wrist.x;
    history.lastSwooshTime = now;
  }

  reset() {
    this.handHistories.clear();
  }
}
