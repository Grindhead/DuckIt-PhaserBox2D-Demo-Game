export type PlayerInput = { left: boolean; right: boolean; up: boolean };
export function mergePlayerInput(keys: {left?: {isDown: boolean}; right?: {isDown: boolean}; up?: {isDown: boolean}} | null, touch: PlayerInput): PlayerInput {
  return {left: Boolean(keys?.left?.isDown || touch.left), right: Boolean(keys?.right?.isDown || touch.right), up: Boolean(keys?.up?.isDown || touch.up)};
}
export class FixedStepClock {
  private pending = 0;
  advance(milliseconds: number, step: () => void): number {
    const interval = 1 / 60;
    if (!Number.isFinite(milliseconds) || milliseconds < 0) return 0;
    this.pending = Math.min(this.pending + milliseconds / 1000, interval * 4);
    let count = 0;
    while (this.pending + Number.EPSILON >= interval && count < 4) {
      step(); this.pending -= interval; count++;
    }
    return count;
  }
  reset(): void { this.pending = 0; }
}
export type ShapeHandle = {index1: number; world0: number; revision: number};
export type ContactEvent = {shapeIdA: ShapeHandle; shapeIdB: ShapeHandle; manifold?: {normalY?: number; normal?: {y: number}} | null; normalY?: number};
export class GroundContacts {
  private contacts = new Set<string>();
  private key(event: ContactEvent): string {
    const id = (shape: ShapeHandle) => `${shape.world0}:${shape.index1}:${shape.revision}`;
    return [id(event.shapeIdA), id(event.shapeIdB)].sort().join('|');
  }
  update(event: ContactEvent, beginning: boolean, playerIsA: boolean): void {
    const key = this.key(event);
    if (!beginning) { this.contacts.delete(key); return; }
    const normal = event.manifold?.normalY ?? event.manifold?.normal?.y ?? event.normalY;
    if (normal === undefined || !Number.isFinite(normal)) return;
    if ((playerIsA ? -normal : normal) > 0.1) this.contacts.add(key);
  }
  get grounded(): boolean { return this.contacts.size > 0; }
  reset(): void { this.contacts.clear(); }
}
