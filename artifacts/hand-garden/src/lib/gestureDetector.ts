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
const ROTATION_MIN_POSITIONS_2H = 4;
const ROTATION_WINDOW_MS = 1800;
const ROTATION_COOLDOWN_MS = 500;
const FIST_OPENNESS_THRESHOLD = 1.0;

const PALM_CLOSE_THRESHOLD = 1.25;
const PALM_OPEN_THRESHOLD = 1.7;
const PALM_BLOOM_COOLDOWN_MS = 800;
const POST_ROTATION_BLOOM_BLOCK_MS = 600;

const PINCH_DISTANCE_THRESHOLD = 0.045;
const PINCH_EMIT_INTERVAL_MS = 1000;
const PINCH_SUSTAIN_MS = 150;
const BLOOM_LEAF_MUTUAL_COOLDOWN_MS = 500;
const BLOOM_PINCH_GUARD_FACTOR = 1.5;

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
  lastRotationEndTime: number;

  wristRollAngles: { angle: number; time: number }[];

  palmWasClosed: boolean;
  lastBloomEmit: number;

  lastPinchEmit: number;
  pinchStartTime: number;
  lastLeafEmit: number;

  smoothedPos: SmoothedPosition | null;
  lastSeenTime: number;
}

export class GestureDetector {
  private handHistories: Map<number, HandHistory> = new Map();
  private listeners: ((event: GestureEvent) => void)[] = [];
  private currentHandCount: number = 1;
  private lastMapping: Map<number, number> = new Map();
  private lastWristPos: Map<number, { x: number; y: number }> = new Map();

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
        lastRotationEndTime: 0,
        wristRollAngles: [],
        palmWasClosed: false,
        lastBloomEmit: 0,
        lastPinchEmit: 0,
        pinchStartTime: 0,
        lastLeafEmit: 0,
        smoothedPos: null,
        lastSeenTime: 0,
      });
    }
    return this.handHistories.get(handIndex)!;
  }

  private resolveStableIndices(
    handedness?: HandednessInfo[],
    handCount?: number,
    multiHandLandmarks?: HandLandmark[][]
  ): Map<number, number> {
    const mapping = new Map<number, number>();
    const count = handCount || 0;

    if (count === 0) return mapping;

    if (count === 1) {
      if (handedness && handedness.length > 0) {
        const label = handedness[0].label.toLowerCase();
        const prevValues = [...this.lastMapping.values()];
        const stableIdx = label === 'left' ? 0 : label === 'right' ? 1 : (prevValues.length >= 1 ? prevValues[0] : 0);
        mapping.set(0, stableIdx);
      } else {
        const prevValues = [...this.lastMapping.values()];
        if (prevValues.length >= 1) {
          mapping.set(0, prevValues[0]);
        } else {
          mapping.set(0, 0);
        }
      }
      this.lastMapping = mapping;
      return mapping;
    }

    if (count === 2 && multiHandLandmarks && multiHandLandmarks.length === 2 && this.lastWristPos.size === 2) {
      const wrists = multiHandLandmarks.map(lm => ({ x: lm[WRIST].x, y: lm[WRIST].y }));

      const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

      const prev0 = this.lastWristPos.get(0)!;
      const prev1 = this.lastWristPos.get(1)!;

      const d00 = dist(wrists[0], prev0);
      const d01 = dist(wrists[0], prev1);
      const d10 = dist(wrists[1], prev0);
      const d11 = dist(wrists[1], prev1);

      if (d00 + d11 <= d01 + d10) {
        mapping.set(0, 0);
        mapping.set(1, 1);
      } else {
        mapping.set(0, 1);
        mapping.set(1, 0);
      }

      this.lastMapping = mapping;
      return mapping;
    }

    if (!handedness || handedness.length < count) {
      for (let i = 0; i < count; i++) mapping.set(i, i);
      this.lastMapping = mapping;
      return mapping;
    }

    const newMapping = new Map<number, number>();
    const usedStable = new Set<number>();

    const assignments: { rawIndex: number; label: string; score: number }[] = [];
    for (let i = 0; i < count; i++) {
      const entry = handedness[i];
      if (entry) {
        assignments.push({ rawIndex: i, label: entry.label.toLowerCase(), score: entry.score });
      } else {
        assignments.push({ rawIndex: i, label: '', score: 0 });
      }
    }

    const sorted = [...assignments].sort((a, b) => b.score - a.score);
    for (const a of sorted) {
      let stableIdx: number;

      if (a.label === 'left') {
        stableIdx = 0;
      } else if (a.label === 'right') {
        stableIdx = 1;
      } else {
        const prevStable = this.lastMapping.get(a.rawIndex);
        stableIdx = prevStable !== undefined ? prevStable : a.rawIndex;
      }

      if (usedStable.has(stableIdx)) {
        stableIdx = stableIdx === 0 ? 1 : 0;
      }

      usedStable.add(stableIdx);
      newMapping.set(a.rawIndex, stableIdx);
    }

    this.lastMapping = newMapping;
    return newMapping;
  }

  processHands(
    multiHandLandmarks: HandLandmark[][],
    multiHandedness?: HandednessInfo[]
  ) {
    const activeHands = new Set<number>();
    this.currentHandCount = multiHandLandmarks.length;

    const indexMap = this.resolveStableIndices(multiHandedness, multiHandLandmarks.length, multiHandLandmarks);

    const now = Date.now();

    multiHandLandmarks.forEach((landmarks, rawIndex) => {
      const stableIndex = indexMap.get(rawIndex) ?? rawIndex;
      activeHands.add(stableIndex);
      const history = this.getHistory(stableIndex);
      history.lastSeenTime = now;

      this.lastWristPos.set(stableIndex, { x: landmarks[WRIST].x, y: landmarks[WRIST].y });

      this.detectFistRotation(landmarks, stableIndex, history, now);
      this.detectPalmOpenClose(landmarks, stableIndex, history, now);
      this.detectPinch(landmarks, stableIndex, history, now);
    });

    const HISTORY_GRACE_MS = 500;
    for (const [key, history] of this.handHistories) {
      if (!activeHands.has(key) && now - history.lastSeenTime > HISTORY_GRACE_MS) {
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
      if (history.rotationActive) {
        if (history.lastRotationEmit > 0 && now - history.lastRotationEmit < ROTATION_WINDOW_MS) {
          history.lastRotationEndTime = now;
        }
        history.palmWasClosed = false;
      }
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
      if (!history.rotationActive) {
        history.palmWasClosed = true;
      }
      return;
    }

    if (history.rotationActive) {
      return;
    }

    if (now - history.lastRotationEndTime < POST_ROTATION_BLOOM_BLOCK_MS) {
      history.palmWasClosed = false;
      return;
    }

    if (history.palmWasClosed && openness > PALM_OPEN_THRESHOLD) {
      const thumbTip = landmarks[THUMB_TIP];
      const indexTip = landmarks[INDEX_TIP];
      const pinchDist = Math.sqrt(
        (thumbTip.x - indexTip.x) ** 2 +
        (thumbTip.y - indexTip.y) ** 2
      );
      if (pinchDist < PINCH_DISTANCE_THRESHOLD * BLOOM_PINCH_GUARD_FACTOR) {
        history.palmWasClosed = false;
        return;
      }

      history.palmWasClosed = false;

      if (now - history.lastBloomEmit > PALM_BLOOM_COOLDOWN_MS &&
          now - history.lastLeafEmit > BLOOM_LEAF_MUTUAL_COOLDOWN_MS) {
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
      history.pinchStartTime = 0;
      return;
    }

    const ringExtended = this.isFingerExtended(landmarks, RING_TIP, RING_DIP, RING_MCP);
    const pinkyExtended = this.isFingerExtended(landmarks, PINKY_TIP, PINKY_DIP, PINKY_MCP);
    const middleExtended = this.isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_DIP, MIDDLE_MCP);

    const otherFingersUp = (middleExtended ? 1 : 0) + (ringExtended ? 1 : 0) + (pinkyExtended ? 1 : 0);

    if (otherFingersUp < 2) {
      history.pinchStartTime = 0;
      return;
    }

    if (history.pinchStartTime === 0) {
      history.pinchStartTime = now;
    }

    if (now - history.pinchStartTime < PINCH_SUSTAIN_MS) {
      return;
    }

    if (now - history.lastPinchEmit > PINCH_EMIT_INTERVAL_MS &&
        now - history.lastBloomEmit > BLOOM_LEAF_MUTUAL_COOLDOWN_MS) {
      history.lastPinchEmit = now;
      history.lastLeafEmit = now;
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
    this.lastMapping.clear();
    this.lastWristPos.clear();
  }
}
