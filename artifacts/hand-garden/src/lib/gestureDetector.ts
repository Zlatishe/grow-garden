export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandednessInfo {
  label: string;
  score: number;
  index?: number;
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

const ROTATION_ANGLE_THRESHOLD = Math.PI * 1.2;
const ROTATION_RADIUS_THRESHOLD = 0.03;
const ROTATION_MIN_POSITIONS_1H = 7;
const ROTATION_MIN_POSITIONS_2H = 6;
const ROTATION_WINDOW_MS = 1800;
const ROTATION_COOLDOWN_MS = 500;
const FIST_OPENNESS_THRESHOLD = 1.0;

const PALM_CLOSE_THRESHOLD = 1.25;
const PALM_OPEN_THRESHOLD = 1.55;
const PALM_BLOOM_COOLDOWN_MS = 800;

const ROTATION_ACTIVE_SUPPRESS_BLOOM = true;

const PINCH_DISTANCE_THRESHOLD = 0.05;
const PINCH_EMIT_INTERVAL_MS = 1000;

const SMOOTH_FACTOR = 0.4;

interface SmoothedPosition {
  x: number;
  y: number;
}

interface HandHistory {
  wristPositions: { x: number; y: number; time: number }[];
  rotationAngle: number;
  lastRotationEmit: number;
  rotationActive: boolean;

  wristRollAngles: { angle: number; time: number }[];

  palmWasClosed: boolean;
  lastBloomEmit: number;

  lastPinchEmit: number;

  smoothedPos: SmoothedPosition | null;
}

export class GestureDetector {
  private handHistories: Map<number, HandHistory> = new Map();
  private listeners: ((event: GestureEvent) => void)[] = [];
  private currentHandCount: number = 1;

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
        rotationActive: false,
        wristRollAngles: [],
        palmWasClosed: false,
        lastBloomEmit: 0,
        lastPinchEmit: 0,
        smoothedPos: null,
      });
    }
    return this.handHistories.get(handIndex)!;
  }

  private resolveStableIndices(
    handedness?: HandednessInfo[],
    handCount?: number
  ): Map<number, number> {
    const mapping = new Map<number, number>();
    const count = handCount || 0;

    if (!handedness || handedness.length === 0 || count === 0) {
      for (let i = 0; i < count; i++) mapping.set(i, i);
      return mapping;
    }

    const assignments: { rawIndex: number; label: string; score: number; sourceIndex?: number }[] = [];
    for (let i = 0; i < count; i++) {
      const entry = handedness[i];
      if (entry) {
        assignments.push({ rawIndex: i, label: entry.label.toLowerCase(), score: entry.score, sourceIndex: entry.index });
      } else {
        assignments.push({ rawIndex: i, label: '', score: 0 });
      }
    }

    const usedStable = new Set<number>();

    const sorted = [...assignments].sort((a, b) => b.score - a.score);
    for (const a of sorted) {
      let stableIdx: number;
      if (a.sourceIndex !== undefined && a.sourceIndex >= 0 && a.sourceIndex <= 1) {
        stableIdx = a.label === 'left' ? 0 : a.label === 'right' ? 1 : a.sourceIndex;
      } else if (a.label === 'left') {
        stableIdx = 0;
      } else if (a.label === 'right') {
        stableIdx = 1;
      } else {
        stableIdx = a.rawIndex;
      }

      if (usedStable.has(stableIdx)) {
        stableIdx = stableIdx === 0 ? 1 : 0;
      }

      usedStable.add(stableIdx);
      mapping.set(a.rawIndex, stableIdx);
    }

    return mapping;
  }

  processHands(
    multiHandLandmarks: HandLandmark[][],
    multiHandedness?: HandednessInfo[]
  ) {
    const activeHands = new Set<number>();
    this.currentHandCount = multiHandLandmarks.length;

    const indexMap = this.resolveStableIndices(multiHandedness, multiHandLandmarks.length);

    multiHandLandmarks.forEach((landmarks, rawIndex) => {
      const stableIndex = indexMap.get(rawIndex) ?? rawIndex;
      activeHands.add(stableIndex);
      const history = this.getHistory(stableIndex);
      const now = Date.now();

      this.detectFistRotation(landmarks, stableIndex, history, now);
      this.detectPalmOpenClose(landmarks, stableIndex, history, now);
      this.detectPinch(landmarks, stableIndex, history, now);
    });

    for (const [key] of this.handHistories) {
      if (!activeHands.has(key)) {
        this.handHistories.delete(key);
      }
    }
  }

  private smoothPosition(
    history: HandHistory,
    rawX: number,
    rawY: number
  ): { x: number; y: number } {
    if (!history.smoothedPos) {
      history.smoothedPos = { x: rawX, y: rawY };
      return { x: rawX, y: rawY };
    }
    history.smoothedPos.x += (rawX - history.smoothedPos.x) * SMOOTH_FACTOR;
    history.smoothedPos.y += (rawY - history.smoothedPos.y) * SMOOTH_FACTOR;
    return { x: history.smoothedPos.x, y: history.smoothedPos.y };
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

  private computeWristRollAngle(landmarks: HandLandmark[]): number {
    const wrist = landmarks[WRIST];
    const middleMcp = landmarks[MIDDLE_MCP];
    return Math.atan2(middleMcp.y - wrist.y, middleMcp.x - wrist.x);
  }

  private detectFistRotation(
    landmarks: HandLandmark[],
    handIndex: number,
    history: HandHistory,
    now: number
  ) {
    const openness = this.computeOpenness(landmarks);
    if (openness > FIST_OPENNESS_THRESHOLD) {
      history.wristPositions = [];
      history.wristRollAngles = [];
      history.rotationActive = false;
      return;
    }

    history.rotationActive = true;

    const rollAngle = this.computeWristRollAngle(landmarks);
    history.wristRollAngles.push({ angle: rollAngle, time: now });

    const rollCutoff = now - ROTATION_WINDOW_MS;
    history.wristRollAngles = history.wristRollAngles.filter(r => r.time > rollCutoff);

    const wrist = landmarks[WRIST];
    const middleMcp = landmarks[MIDDLE_MCP];
    const rawX = (wrist.x + middleMcp.x) / 2;
    const rawY = (wrist.y + middleMcp.y) / 2;
    const smoothed = this.smoothPosition(history, rawX, rawY);
    const pos = { x: smoothed.x, y: smoothed.y, time: now };

    history.wristPositions.push(pos);

    const cutoff = now - ROTATION_WINDOW_MS;
    history.wristPositions = history.wristPositions.filter(p => p.time > cutoff);

    const minPositions = this.currentHandCount >= 2 ? ROTATION_MIN_POSITIONS_2H : ROTATION_MIN_POSITIONS_1H;
    if (history.wristPositions.length < minPositions) return;

    let totalRollAngle = 0;
    const rollAngles = history.wristRollAngles;
    if (rollAngles.length >= 3) {
      for (let i = 1; i < rollAngles.length; i++) {
        let diff = rollAngles[i].angle - rollAngles[i - 1].angle;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        totalRollAngle += diff;
      }
    }

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

    const absCircularAngle = Math.abs(totalAngle);
    const absRollAngle = Math.abs(totalRollAngle);
    const combinedAngle = Math.max(absCircularAngle, absRollAngle);

    if (combinedAngle > ROTATION_ANGLE_THRESHOLD) {
      const radius = positions.reduce((s, p) => {
        return s + Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
      }, 0) / positions.length;

      const passesRadius = radius > ROTATION_RADIUS_THRESHOLD || absRollAngle > ROTATION_ANGLE_THRESHOLD;

      if (passesRadius && now - history.lastRotationEmit > ROTATION_COOLDOWN_MS) {
        history.rotationAngle += combinedAngle;
        history.lastRotationEmit = now;
        this.emit({
          type: 'wristRotation',
          handIndex,
          value: combinedAngle,
          position: { x: centerX, y: centerY },
        });
        history.wristPositions = history.wristPositions.slice(-3);
        history.wristRollAngles = history.wristRollAngles.slice(-3);
      }
    }
  }

  private detectPalmOpenClose(
    landmarks: HandLandmark[],
    handIndex: number,
    history: HandHistory,
    now: number
  ) {
    const openness = this.computeOpenness(landmarks);

    if (openness < PALM_CLOSE_THRESHOLD) {
      history.palmWasClosed = true;
      return;
    }

    if (ROTATION_ACTIVE_SUPPRESS_BLOOM && history.rotationActive) {
      return;
    }

    if (history.palmWasClosed && openness > PALM_OPEN_THRESHOLD) {
      history.palmWasClosed = false;

      if (now - history.lastBloomEmit > PALM_BLOOM_COOLDOWN_MS) {
        history.lastBloomEmit = now;
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

    const ringExtended = this.isFingerExtended(landmarks, RING_TIP, RING_DIP, RING_MCP);
    const pinkyExtended = this.isFingerExtended(landmarks, PINKY_TIP, PINKY_DIP, PINKY_MCP);
    const middleExtended = this.isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_DIP, MIDDLE_MCP);

    const otherFingersUp = (middleExtended ? 1 : 0) + (ringExtended ? 1 : 0) + (pinkyExtended ? 1 : 0);

    if (otherFingersUp < 2) {
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
