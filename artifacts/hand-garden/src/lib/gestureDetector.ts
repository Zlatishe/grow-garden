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

const FIST_THRESHOLD = 1.1;
const OPEN_THRESHOLD = 1.55;
const OPEN_DELTA_THRESHOLD = 0.3;

const ROTATION_ANGLE_THRESHOLD = Math.PI * 1.8;
const ROTATION_RADIUS_THRESHOLD = 0.04;
const ROTATION_MIN_POSITIONS = 12;
const ROTATION_WINDOW_MS = 1200;

const SWOOSH_SPEED_THRESHOLD = 0.002;
const SWOOSH_DISTANCE_THRESHOLD = 0.2;

const ROTATION_COOLDOWN_MS = 800;
const EXTENSION_COOLDOWN_MS = 1200;
const SWOOSH_COOLDOWN_MS = 1000;

interface HandHistory {
  wristPositions: { x: number; y: number; time: number }[];
  lastOpenness: number;
  wasFist: boolean;
  fistStartTime: number;
  rotationAngle: number;
  lastSwooshX: number;
  lastSwooshTime: number;
  lastRotationEmit: number;
  lastExtensionEmit: number;
  lastSwooshEmit: number;
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
        wasFist: false,
        fistStartTime: 0,
        rotationAngle: 0,
        lastSwooshX: -1,
        lastSwooshTime: 0,
        lastRotationEmit: 0,
        lastExtensionEmit: 0,
        lastSwooshEmit: 0,
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
      this.detectFingerExtension(landmarks, handIndex, history, now);
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
    const middleMcp = landmarks[MIDDLE_MCP];
    const cx = (wrist.x + middleMcp.x) / 2;
    const cy = (wrist.y + middleMcp.y) / 2;
    const pos = { x: cx, y: cy, time: now };

    history.wristPositions.push(pos);

    const cutoff = now - ROTATION_WINDOW_MS;
    history.wristPositions = history.wristPositions.filter(p => p.time > cutoff);

    if (history.wristPositions.length < ROTATION_MIN_POSITIONS) return;

    const positions = history.wristPositions;
    const centerX = positions.reduce((s, p) => s + p.x, 0) / positions.length;
    const centerY = positions.reduce((s, p) => s + p.y, 0) / positions.length;

    let totalAngle = 0;
    for (let i = 1; i < positions.length; i++) {
      const prev = Math.atan2(positions[i - 1].y - centerY, positions[i - 1].x - centerX);
      const curr = Math.atan2(positions[i].y - centerY, positions[i].x - centerX);
      let diff = curr - prev;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      if (diff < -Math.PI) diff += 2 * Math.PI;
      totalAngle += diff;
    }

    const absAngle = Math.abs(totalAngle);
    if (absAngle > ROTATION_ANGLE_THRESHOLD) {
      const radius = positions.reduce((s, p) => {
        return s + Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
      }, 0) / positions.length;

      if (radius > ROTATION_RADIUS_THRESHOLD && now - history.lastRotationEmit > ROTATION_COOLDOWN_MS) {
        history.rotationAngle += absAngle;
        history.lastRotationEmit = now;
        this.emit({
          type: 'wristRotation',
          handIndex,
          value: absAngle,
          position: { x: centerX, y: centerY },
        });
        history.wristPositions = history.wristPositions.slice(-4);
      }
    }
  }

  private computeOpenness(landmarks: HandLandmark[]): number {
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

    return totalExtension / 5;
  }

  private detectFingerExtension(
    landmarks: HandLandmark[],
    handIndex: number,
    history: HandHistory,
    now: number
  ) {
    const openness = this.computeOpenness(landmarks);

    if (openness < FIST_THRESHOLD) {
      if (!history.wasFist) {
        history.wasFist = true;
        history.fistStartTime = now;
      }
    } else if (history.wasFist && openness > OPEN_THRESHOLD) {
      const delta = openness - history.lastOpenness;
      const fistDuration = now - history.fistStartTime;

      if (delta > OPEN_DELTA_THRESHOLD && fistDuration > 150 && now - history.lastExtensionEmit > EXTENSION_COOLDOWN_MS) {
        history.lastExtensionEmit = now;
        history.wasFist = false;
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
    }

    if (openness > FIST_THRESHOLD + 0.1) {
      history.wasFist = false;
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

    if (dt > 0 && dt < 400) {
      const speed = Math.abs(dx) / dt;
      if (speed > SWOOSH_SPEED_THRESHOLD && Math.abs(dx) > SWOOSH_DISTANCE_THRESHOLD) {
        if (now - history.lastSwooshEmit > SWOOSH_COOLDOWN_MS) {
          history.lastSwooshEmit = now;
          const type = dx > 0 ? 'swooshLeft' : 'swooshRight';
          this.emit({
            type,
            handIndex,
            value: Math.abs(dx),
            position: { x: wrist.x, y: wrist.y },
          });
        }
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
