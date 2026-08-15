import { NODE_HEIGHT, NODE_WIDTH } from "./layout-constants.js";

type Point = { readonly x: number; readonly y: number };
type Rect = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

function nodeRect(position: Point): Rect {
  return { x: position.x, y: position.y, w: NODE_WIDTH, h: NODE_HEIGHT };
}

function intersection(a: Rect, b: Rect): { readonly overlapX: number; readonly overlapY: number } | null {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (overlapX <= 0 || overlapY <= 0) return null;
  return { overlapX, overlapY };
}

/**
 * Nudges `position` away from any sibling node it fully or mostly overlaps,
 * along the axis of least penetration (a minimal-translation push, not a
 * snap to some grid slot) — React Flow itself never prevents two nodes from
 * sharing the same spot, and a full overlap reads as one of the two blocks
 * having vanished. Runs a few passes since resolving one collision can create
 * another against a third sibling.
 *
 * `lowerBound`, when given, re-clamps the result to never fall below it after
 * every push — used when this block was just attached to a container
 * (event-containers.ts only ever grows a container to the right/down of its
 * trigger). Without this, a push resolving overlap against another member
 * could shove the new block above/left of the container's own anchor: the
 * container's size wouldn't grow to cover it (still computed as the max of
 * members' *positive* offset from the trigger), so relative-to-container math
 * in ProcessingGraphScreen would place it at a negative offset — outside the
 * dashed box, effectively invisible against the canvas background.
 */
export function resolveSiblingOverlap(id: string, position: Point, siblings: readonly { readonly id: string; readonly position: Point }[], lowerBound?: Point): Point {
  let current = position;
  const clamp = (p: Point): Point => (lowerBound ? { x: Math.max(p.x, lowerBound.x), y: Math.max(p.y, lowerBound.y) } : p);
  current = clamp(current);
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (const sibling of siblings) {
      if (sibling.id === id) continue;
      const a = nodeRect(current);
      const b = nodeRect(sibling.position);
      const hit = intersection(a, b);
      if (!hit) continue;
      moved = true;
      if (hit.overlapX < hit.overlapY) {
        current = { x: current.x + (a.x < b.x ? -hit.overlapX : hit.overlapX), y: current.y };
      } else {
        current = { x: current.x, y: current.y + (a.y < b.y ? -hit.overlapY : hit.overlapY) };
      }
      current = clamp(current);
    }
    if (!moved) break;
  }
  return current;
}

/**
 * Finds the container whose rectangle contains `position`'s center — used to
 * detect "this block was just dropped into that dashed box", the gesture
 * `ProcessingGraphScreen` turns into a real edge (trigger/chain-tail -> this
 * block) rather than treating the drop itself as membership.
 */
export function containerAtPosition<C extends { readonly x: number; readonly y: number; readonly width: number; readonly height: number }>(position: Point, containers: readonly C[]): C | undefined {
  const centerX = position.x + NODE_WIDTH / 2;
  const centerY = position.y + NODE_HEIGHT / 2;
  return containers.find((c) => centerX >= c.x && centerX <= c.x + c.width && centerY >= c.y && centerY <= c.y + c.height);
}
