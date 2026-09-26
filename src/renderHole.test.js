import { describe, it, expect } from "vitest";
import { seedPositions, createHoleSVG, DENSE_CUTOFF } from "./renderHole.js";

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

describe("seedPositions", () => {
  it("returns no positions for zero seeds", () => {
    expect(seedPositions(0)).toEqual([]);
  });

  it("returns one position per seed", () => {
    expect(seedPositions(4)).toHaveLength(4);
    expect(seedPositions(19)).toHaveLength(19);
  });

  it("keeps every dot within the hole and pairwise non-overlapping", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 19, 37]) {
      const positions = seedPositions(n);
      for (const p of positions) {
        expect(distance(p, { x: 50, y: 50 })).toBeLessThanOrEqual(46);
      }
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          expect(distance(positions[i], positions[j])).toBeGreaterThanOrEqual(11);
        }
      }
    }
  });

  it("keeps the group of dots centered as a whole, not just anchored on one center dot (regression: n=2 used to put one dot dead center and the other off to a side)", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 19, 37]) {
      const positions = seedPositions(n);
      const centroidX = positions.reduce((s, p) => s + p.x, 0) / positions.length;
      const centroidY = positions.reduce((s, p) => s + p.y, 0) / positions.length;
      expect(centroidX).toBeCloseTo(50, 0);
      expect(centroidY).toBeCloseTo(50, 0);
    }
  });
});

describe("createHoleSVG", () => {
  const countDots = (svg) => (svg.match(/class="seed-dot"/g) || []).length;

  it("draws one dot per seed below the dense cutoff", () => {
    expect(countDots(createHoleSVG(0))).toBe(0);
    expect(countDots(createHoleSVG(4))).toBe(4);
    expect(countDots(createHoleSVG(DENSE_CUTOFF))).toBe(DENSE_CUTOFF);
  });

  it("replaces the dots with a numeral badge beyond the dense cutoff (dots this dense would be illegible under a same-colored number)", () => {
    const svg = createHoleSVG(45);
    expect(countDots(svg)).toBe(0);
    expect(svg).toContain('class="seed-count-badge"');
    expect(svg).toContain(">45<");
  });

  it("omits the badge at and below the cutoff", () => {
    expect(createHoleSVG(DENSE_CUTOFF)).not.toContain("seed-count-badge");
  });

  it("is valid, well-formed SVG markup", () => {
    const markup = createHoleSVG(6);
    expect(markup).toMatch(/^<svg[^>]*>.*<\/svg>/);
    expect(markup).toContain('class="hole-bg"');
  });

  it("renders the corner count badge as a sibling of the SVG, not inside it, so it doesn't rotate along with the hole on hover", () => {
    const markup = createHoleSVG(6);
    expect(markup).toMatch(/<\/svg><span class="corner-badge">6<\/span>$/);
  });

  it("shows a corner count badge with the exact number, for every count up to and including the dense cutoff", () => {
    for (const n of [0, 1, 6, DENSE_CUTOFF]) {
      const markup = createHoleSVG(n);
      expect(markup).toContain(`<span class="corner-badge">${n}</span>`);
    }
  });

  it("omits the corner badge once the big central number takes over above the dense cutoff", () => {
    const markup = createHoleSVG(DENSE_CUTOFF + 1);
    expect(markup).not.toContain("corner-badge");
  });
});
