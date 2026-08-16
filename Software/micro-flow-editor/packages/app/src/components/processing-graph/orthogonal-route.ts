import { NODE_HEIGHT, NODE_WIDTH } from "./layout-constants.js";

export type Point = { readonly x: number; readonly y: number };
export type Rect = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };

export type NodeLike = {
  readonly id: string;
  readonly type?: string;
  readonly position: Point;
  readonly parentId?: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly measured?: { readonly width?: number; readonly height?: number };
};

const OBSTACLE_PAD = 12;
/** Source/target need a thin wall so the wire cannot recross the card, without swallowing the handle lead. */
const ENDPOINT_PAD = 2;
const CORNER_RADIUS = 10;
const HANDLE_LEAD = 16;
const CLEAR = 24;

function inflate(r: Rect, pad: number): Rect {
  return { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function moveTowards(from: Point, to: Point, amount: number): Point {
  const d = dist(from, to);
  if (d === 0) return from;
  const t = Math.min(amount, d) / d;
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

function absolutePosition(node: NodeLike, byId: ReadonlyMap<string, NodeLike>): Point {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  const seen = new Set<string>([node.id]);
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

/**
 * Block cards only — the dashed event container is a drop-area, not a wall.
 * Source and target *are* walls: the wire leaves via a short outward stub
 * (see `leadFromHandle`) and must not cross back over either card.
 */
export function obstacleRectsForEdge(nodes: readonly NodeLike[], sourceId: string, targetId: string): Rect[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rects: Rect[] = [];
  for (const node of nodes) {
    if (node.type === "event-container") continue;
    const origin = absolutePosition(node, byId);
    const w = node.measured?.width ?? node.width ?? NODE_WIDTH;
    const h = node.measured?.height ?? node.height ?? NODE_HEIGHT;
    if (w <= 0 || h <= 0) continue;
    const isEnd = node.id === sourceId || node.id === targetId;
    rects.push(inflate({ x: origin.x, y: origin.y, w, h }, isEnd ? ENDPOINT_PAD : OBSTACLE_PAD));
  }
  return rects;
}

export function leadFromHandle(point: Point, side: "left" | "right" | "top" | "bottom", lead = HANDLE_LEAD): Point {
  if (side === "right") return { x: point.x + lead, y: point.y };
  if (side === "left") return { x: point.x - lead, y: point.y };
  if (side === "top") return { x: point.x, y: point.y - lead };
  return { x: point.x, y: point.y + lead };
}

/** Horizontal-then-vertical-then-horizontal, like a diagram connector. */
function hvh(start: Point, end: Point, midX: number): Point[] {
  return simplifyAxisAligned([start, { x: midX, y: start.y }, { x: midX, y: end.y }, end]);
}

/** Vertical-then-horizontal-then-vertical. */
function vhv(start: Point, end: Point, midY: number): Point[] {
  return simplifyAxisAligned([start, { x: start.x, y: midY }, { x: end.x, y: midY }, end]);
}

function pathScore(points: readonly Point[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += Math.abs(points[i + 1]!.x - points[i]!.x) + Math.abs(points[i + 1]!.y - points[i]!.y);
  }
  return len + (points.length - 2) * 32;
}

/**
 * A few canonical H/V routes (through the middle, or around the bounding box /
 * each obstacle). Picks the shortest that does not cross a block. Never a
 * grid staircase — at most a handful of axis-aligned segments.
 */
export function routeOrthogonal(start: Point, end: Point, obstacles: readonly Rect[]): Point[] {
  const candidates: Point[][] = [];
  if (start.x === end.x || start.y === end.y) candidates.push([start, end]);
  candidates.push(hvh(start, end, (start.x + end.x) / 2));
  candidates.push(vhv(start, end, (start.y + end.y) / 2));
  // Stay on the handle's outward axis first (right-handle → down → in) instead
  // of cutting back across the source/target card.
  candidates.push(hvh(start, end, start.x));
  candidates.push(hvh(start, end, end.x));
  candidates.push(vhv(start, end, start.y));
  candidates.push(vhv(start, end, end.y));

  let minX = Math.min(start.x, end.x);
  let maxX = Math.max(start.x, end.x);
  let minY = Math.min(start.y, end.y);
  let maxY = Math.max(start.y, end.y);
  for (const o of obstacles) {
    minX = Math.min(minX, o.x);
    maxX = Math.max(maxX, o.x + o.w);
    minY = Math.min(minY, o.y);
    maxY = Math.max(maxY, o.y + o.h);
    candidates.push(vhv(start, end, o.y - CLEAR));
    candidates.push(vhv(start, end, o.y + o.h + CLEAR));
    candidates.push(hvh(start, end, o.x - CLEAR));
    candidates.push(hvh(start, end, o.x + o.w + CLEAR));
  }
  candidates.push(hvh(start, end, maxX + CLEAR));
  candidates.push(hvh(start, end, minX - CLEAR));
  candidates.push(vhv(start, end, minY - CLEAR));
  candidates.push(vhv(start, end, maxY + CLEAR));

  const clear = candidates.filter((p) => !polylineHitsObstacle(p, obstacles));
  const pool = (clear.length > 0 ? clear : candidates).sort((a, b) => pathScore(a) - pathScore(b) || a.length - b.length);
  return pool[0] ?? [start, end];
}

/** Drop collinear midpoints so a run of points becomes one H or V segment. */
export function simplifyAxisAligned(points: readonly Point[]): Point[] {
  if (points.length <= 2) return [...points];
  const out: Point[] = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = out[out.length - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;
    const colinear = (prev.x === curr.x && curr.x === next.x) || (prev.y === curr.y && curr.y === next.y);
    if (!colinear) out.push(curr);
  }
  out.push(points[points.length - 1]!);
  return out.filter((p, i, arr) => i === 0 || p.x !== arr[i - 1]!.x || p.y !== arr[i - 1]!.y);
}

export function roundedOrthogonalPath(points: readonly Point[], radius = CORNER_RADIUS): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  if (points.length === 2) return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;

  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;
    const isRightAngle = (prev.x === curr.x && curr.y === next.y) || (prev.y === curr.y && curr.x === next.x);
    const r = Math.min(radius, dist(prev, curr) / 2, dist(curr, next) / 2);
    if (!isRightAngle || r < 2) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }
    const p1 = moveTowards(curr, prev, r);
    const p2 = moveTowards(curr, next, r);
    d += ` L ${p1.x} ${p1.y} Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`;
  }
  const last = points[points.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function pathMidpoint(points: readonly Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0]!;
  let bestI = 0;
  let bestLen = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const len = dist(points[i]!, points[i + 1]!);
    if (len > bestLen) {
      bestLen = len;
      bestI = i;
    }
  }
  const a = points[bestI]!;
  const b = points[bestI + 1]!;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** True if an axis-aligned segment crosses the interior of `r`. */
function segmentHitsRect(a: Point, b: Point, r: Rect): boolean {
  const right = r.x + r.w;
  const bottom = r.y + r.h;
  if (a.x === b.x) {
    const x = a.x;
    if (x <= r.x || x >= right) return false;
    const y0 = Math.min(a.y, b.y);
    const y1 = Math.max(a.y, b.y);
    return y0 < bottom && y1 > r.y;
  }
  if (a.y === b.y) {
    const y = a.y;
    if (y <= r.y || y >= bottom) return false;
    const x0 = Math.min(a.x, b.x);
    const x1 = Math.max(a.x, b.x);
    return x0 < right && x1 > r.x;
  }
  return true;
}

export function polylineHitsObstacle(points: readonly Point[], obstacles: readonly Rect[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    for (const o of obstacles) {
      if (segmentHitsRect(points[i]!, points[i + 1]!, o)) return true;
    }
  }
  return false;
}
