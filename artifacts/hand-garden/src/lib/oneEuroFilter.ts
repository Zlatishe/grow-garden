/**
 * One Euro Filter — adaptive low-pass filter for noisy signals.
 * Smooths aggressively when signal is stable, reduces smoothing on fast movement.
 * Reference: https://gery.casiez.net/1euro/
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.s === null) {
      this.s = value;
    } else {
      this.s = alpha * value + (1 - alpha) * this.s;
    }
    this.y = this.s;
    return this.y;
  }

  lastValue(): number {
    return this.s ?? 0;
  }

  reset() {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime = -1;
  private lastRawValue: number | null = null;
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private computeAlpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(value: number, timestamp: number): number {
    if (this.lastTime < 0 || this.lastRawValue === null) {
      this.lastTime = timestamp;
      this.lastRawValue = value;
      this.dxFilter.filter(0, 1.0);
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000, 1e-6);
    this.lastTime = timestamp;

    // Estimate derivative
    const dx = (value - this.lastRawValue) / dt;
    this.lastRawValue = value;

    // Filter derivative to reduce noise
    const edx = this.dxFilter.filter(dx, this.computeAlpha(this.dCutoff, dt));

    // Adaptive cutoff based on filtered derivative
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    // Filter the signal
    return this.xFilter.filter(value, this.computeAlpha(cutoff, dt));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = -1;
    this.lastRawValue = null;
  }
}

/** A pair of One Euro Filters for 2D coordinates. */
export class OneEuroFilter2D {
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.fx = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.fy = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  filter(x: number, y: number, timestamp: number): { x: number; y: number } {
    return {
      x: this.fx.filter(x, timestamp),
      y: this.fy.filter(y, timestamp),
    };
  }

  reset() {
    this.fx.reset();
    this.fy.reset();
  }
}
