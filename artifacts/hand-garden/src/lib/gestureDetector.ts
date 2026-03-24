export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type GestureType = 'wristRotation' | 'openPalm' | 'pinch';

export interface GestureEvent {
  type: GestureType;
  handIndex: number;
  value: number;
  position: { x: number; y: number };
}

const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const INDEX_TIP = 8;
const INDEX_DIP = 7;
const MIDDLE_TIP = 12;
const MIDDLE_DIP = 11;
const RING_TIP = 16;
const RING_DIP = 15;
const PINKY_TIP = 20;
const PINKY_DIP = 19;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;

const ROTATION_ANGLE_THRESHOLD = Math.PI * 1.4;
const ROTATION_RADIUS_THRESHOLD = 0.035;
const ROTATION_MIN_POSITIONS = 10;
const ROTATION_WINDOW_MS = 1500;
const ROTATION_COOLDOWN_MS = 600;

const OPEN_PALM_OPENNESS_THRESHOLD = 1.45;
const OPEN_PALM_STILL_MS = 400;
const OPEN_PALM_EMIT_INTERVAL_MS = 800;
const OPEN_PALM_MOVEMENT_THRESHOLD = 0.03;

const PINCH_DISTANCE_THRESHOLD = 0.06;
const PINCH_EMIT_INTERVAL_MS = 1000;

interface HandHistory {
  wristPositions: { x: number; y: number; time: number }[];
  rotationAngle: number;
  lastRotationEmit: number;

  openPalmStartTime: number;
  lastOpenPalmEmit: number;
  lastPalmPosition: { x: number; y: number } | null;

  lastPinchEmit: number;
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
        rotationAngle: 0,
        lastRotationEmit: 0,
        openPalmStartTime: 0,
        lastOpenPalmEmit: 0,
        lastPalmPosition: null,
        lastPinchEmit: 0,
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
      this.detectOpenPalm(landmarks, handIndex, history, now);
      this.detectPinch(landmarks, handIndex, history, now);
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

  private isFingerExtended(landmarks: HandLandmark[], tipIdx: number, dipIdx: number, mcpIdx: number): boolean {
    const wrist = landmarks[WRIST];
    const tip = landmarks[tipIdx];
    const dip = landmarks[dipIdx];
    const mcp = landmarks[mcpIdx];

    const tipDist = Math.sqrt((tip.x - wrist.x) ** 2 + (tip.y - wrist.y) ** 2);
    const dipDist = Math.sqrt((dip.x - wrist.x) ** 2 + (dip.y - wrist.y) ** 2);
    const mcpDist = Math.sqrt((mcp.x - wrist.x) ** 2 + (mcp.y - wrist.y) ** 2);

    return tipDist > dipDist && tipDist > mcpDist * 1.1;
  }

  private detectOpenPalm(
    landmarks: HandLandmark[],
    handIndex: number,
    history: HandHistory,
    now: number
  ) {
    const openness = this.computeOpenness(landmarks);
    const wrist = landmarks[WRIST];
    const palmPos = { x: wrist.x, y: wrist.y };

    if (openness < OPEN_PALM_OPENNESS_THRESHOLD) {
      history.openPalmStartTime = 0;
      history.lastPalmPosition = null;
      return;
    }

    if (history.lastPalmPosition) {
      const movement = Math.sqrt(
        (palmPos.x - history.lastPalmPosition.x) ** 2 +
        (palmPos.y - history.lastPalmPosition.y) ** 2
      );
      if (movement > OPEN_PALM_MOVEMENT_THRESHOLD) {
        history.openPalmStartTime = now;
      }
    }

    history.lastPalmPosition = palmPos;

    if (history.openPalmStartTime === 0) {
      history.openPalmStartTime = now;
      return;
    }

    const heldDuration = now - history.openPalmStartTime;
    if (heldDuration > OPEN_PALM_STILL_MS && now - history.lastOpenPalmEmit > OPEN_PALM_EMIT_INTERVAL_MS) {
      history.lastOpenPalmEmit = now;
      this.emit({
        type: 'openPalm',
        handIndex,
        value: openness,
        position: {
          x: landmarks[MIDDLE_TIP].x,
          y: landmarks[MIDDLE_TIP].y,
        },
      });
    }
  }

  private detectPinch(
    landmarks: HandLandmark[],
    handIndex: number,
    history: HandHistory,
    now: number
  ) {
    const thumbTip = landmarks[THUMB_TIP];
    const indexTip = landmarks[INDEX_TIP];

    const pinchDist = Math.sqrt(
      (thumbTip.x - indexTip.x) ** 2 +
      (thumbTip.y - indexTip.y) ** 2
    );

    if (pinchDist > PINCH_DISTANCE_THRESHOLD) {
      return;
    }

    const middleExtended = this.isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_DIP, MIDDLE_MCP);
    const ringExtended = this.isFingerExtended(landmarks, RING_TIP, RING_DIP, RING_MCP);
    const pinkyExtended = this.isFingerExtended(landmarks, PINKY_TIP, PINKY_DIP, PINKY_MCP);

    const otherFingersUp = (middleExtended ? 1 : 0) + (ringExtended ? 1 : 0) + (pinkyExtended ? 1 : 0);

    if (otherFingersUp < 1) {
      return;
    }

    if (now - history.lastPinchEmit > PINCH_EMIT_INTERVAL_MS) {
      history.lastPinchEmit = now;
      this.emit({
        type: 'pinch',
        handIndex,
        value: 1 - pinchDist / PINCH_DISTANCE_THRESHOLD,
        position: {
          x: (thumbTip.x + indexTip.x) / 2,
          y: (thumbTip.y + indexTip.y) / 2,
        },
      });
    }
  }

  reset() {
    this.handHistories.clear();
  }
}
