import { describe, expect, it } from "vitest";
import {
  obstacleRectsForEdge,
  polylineHitsObstacle,
  roundedOrthogonalPath,
  routeOrthogonal,
  simplifyAxisAligned,
} from "./orthogonal-route.js";

describe("simplifyAxisAligned", () => {
  it("collapses a staircase of collinear grid points into one segment", () => {
    expect(
      simplifyAxisAligned([
        { x: 0, y: 0 },
        { x: 16, y: 0 },
        { x: 32, y: 0 },
        { x: 32, y: 16 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 32, y: 0 },
      { x: 32, y: 16 },
    ]);
  });
});

describe("routeOrthogonal", () => {
  it("is a single horizontal when start and end share Y and nothing is in the way", () => {
    const path = routeOrthogonal({ x: 0, y: 40 }, { x: 200, y: 40 }, []);
    expect(path).toEqual([
      { x: 0, y: 40 },
      { x: 200, y: 40 },
    ]);
  });

  it("uses a few H/V segments to go around a block, never through it", () => {
    const start = { x: 0, y: 40 };
    const end = { x: 400, y: 40 };
    const wall = { x: 150, y: 10, w: 100, h: 60 };
    const path = routeOrthogonal(start, end, [wall]);
    expect(polylineHitsObstacle(path, [wall])).toBe(false);
    expect(path.length).toBeLessThanOrEqual(4);
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]!;
      const b = path[i + 1]!;
      expect(a.x === b.x || a.y === b.y).toBe(true);
    }
  });

  it("does not cut back across the source when leaving a right handle toward a node below", () => {
    const source = { x: 0, y: 0, w: 224, h: 64 };
    const start = { x: 224 + 16, y: 32 };
    const end = { x: 112, y: 120 - 16 };
    const path = routeOrthogonal(start, end, [source]);
    expect(polylineHitsObstacle(path, [source])).toBe(false);
    expect(path[0]).toEqual(start);
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]!;
      const b = path[i + 1]!;
      expect(a.x === b.x || a.y === b.y).toBe(true);
    }
    expect(path.every((p) => p.x >= 224 || p.y >= 64 || p.y <= 0)).toBe(true);
  });
});

describe("roundedOrthogonalPath", () => {
  it("uses only move/line/quadratic commands (H/V segments + rounded corners)", () => {
    const d = roundedOrthogonalPath([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
    ]);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.includes(" Q ")).toBe(true);
    expect(/[CS]/i.test(d.replaceAll("Q", ""))).toBe(false);
  });
});

describe("obstacleRectsForEdge", () => {
  it("skips the dashed container and treats source, target, and other blocks as walls", () => {
    const rects = obstacleRectsForEdge(
      [
        { id: "container-a", type: "event-container", position: { x: 0, y: 0 }, width: 400, height: 200 },
        { id: "src", type: "processing", position: { x: 24, y: 56 }, parentId: "container-a", width: 224, height: 64 },
        { id: "mid", type: "processing", position: { x: 24, y: 160 }, parentId: "container-a", width: 224, height: 64 },
        { id: "dst", type: "processing", position: { x: 280, y: 56 }, parentId: "container-a", width: 224, height: 64 },
      ],
      "src",
      "dst",
    );
    expect(rects).toHaveLength(3);
    const byX = [...rects].sort((a, b) => a.x - b.x || a.y - b.y);
    // mid uses the full obstacle pad; src/dst use a thin endpoint pad
    expect(byX).toEqual([
      { x: 24 - 12, y: 160 - 12, w: 224 + 24, h: 64 + 24 },
      { x: 24 - 2, y: 56 - 2, w: 224 + 4, h: 64 + 4 },
      { x: 280 - 2, y: 56 - 2, w: 224 + 4, h: 64 + 4 },
    ]);
  });
});
