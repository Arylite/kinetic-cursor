const VELOCITY_WINDOW = 48
const STALE_AFTER = 40

interface Sample {
  x: number
  y: number
  time: number
}

/** Pointer position plus a velocity estimate in px/s, robust to irregular event timing. */
export class PointerTracker {
  x = 0
  y = 0
  vx = 0
  vy = 0
  private samples: Sample[] = []

  record(x: number, y: number, time: number): void {
    this.x = x
    this.y = y
    this.samples.push({ x, y, time })
    while (this.samples.length > 2 && time - this.samples[0].time > VELOCITY_WINDOW) {
      this.samples.shift()
    }
  }

  update(now: number): void {
    const first = this.samples.at(0)
    const last = this.samples.at(-1)
    if (!first || !last || last.time <= first.time || now - last.time > STALE_AFTER) {
      this.vx = 0
      this.vy = 0
      return
    }
    const seconds = (last.time - first.time) / 1000
    this.vx = (last.x - first.x) / seconds
    this.vy = (last.y - first.y) / seconds
  }

  reset(): void {
    this.samples.length = 0
    this.vx = 0
    this.vy = 0
  }
}
