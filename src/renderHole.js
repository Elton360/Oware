// Pure, DOM-free SVG generator for a single hole's seed display. No fixed
// ceiling on seed count (unlike the old per-count PNG sprite set): seeds are
// drawn individually up to DENSE_CUTOFF, then a numeral badge takes over.

export const DENSE_CUTOFF = 12;
const HOLE_RADIUS = 46;
const DOT_RADIUS = 6;
const RING_SPACING = 13;
const GRID_OFFSET = 17;

const round = (n) => Math.round(n * 100) / 100;

// A 3x3 grid, like a die face, for seed counts that are small enough to have
// a familiar canonical layout. Using this instead of the ring formula below
// avoids lopsided results such as n=2 putting one dot dead center and the
// other off to a side — here the *group* of dots is what's centered.
const GRID = {
  TL: { x: 50 - GRID_OFFSET, y: 50 - GRID_OFFSET },
  TC: { x: 50, y: 50 - GRID_OFFSET },
  TR: { x: 50 + GRID_OFFSET, y: 50 - GRID_OFFSET },
  ML: { x: 50 - GRID_OFFSET, y: 50 },
  MC: { x: 50, y: 50 },
  MR: { x: 50 + GRID_OFFSET, y: 50 },
  BL: { x: 50 - GRID_OFFSET, y: 50 + GRID_OFFSET },
  BC: { x: 50, y: 50 + GRID_OFFSET },
  BR: { x: 50 + GRID_OFFSET, y: 50 + GRID_OFFSET },
};

// Standard dice/domino-style pip layouts, each already balanced around the
// hole's center as a group.
const PIP_PATTERNS = {
  1: ["MC"],
  2: ["TL", "BR"],
  3: ["TL", "MC", "BR"],
  4: ["TL", "TR", "BL", "BR"],
  5: ["TL", "TR", "MC", "BL", "BR"],
  6: ["TL", "ML", "BL", "TR", "MR", "BR"],
  7: ["TL", "ML", "BL", "TR", "MR", "BR", "MC"],
  8: ["TL", "TC", "TR", "ML", "MR", "BL", "BC", "BR"],
  9: ["TL", "TC", "TR", "ML", "MC", "MR", "BL", "BC", "BR"],
};

const ringCapacity = (ring) => (ring === 0 ? 1 : 6 * ring);

// Shifts a set of points so their centroid lands exactly on the hole's
// center, so the group reads as centered even when a ring is only
// partially filled.
const recenter = (points) => {
  if (points.length === 0) return points;
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const dx = 50 - cx;
  const dy = 50 - cy;
  return points.map(({ x, y }) => ({ x: round(x + dx), y: round(y + dy) }));
};

// Fallback for seed counts beyond the canonical pip patterns: concentric
// hexagonally-packed rings, staggered per ring and recentered as a group.
const ringPositions = (n) => {
  const raw = [];
  let remaining = n;
  let ring = 0;

  while (remaining > 0) {
    const capacity = ringCapacity(ring);
    const count = Math.min(capacity, remaining);

    if (ring === 0) {
      raw.push({ x: 50, y: 50 });
    } else {
      const radius = ring * RING_SPACING;
      const angleOffset = ring % 2 === 0 ? 0 : Math.PI / capacity;
      for (let i = 0; i < count; i++) {
        const angle = angleOffset + (2 * Math.PI * i) / capacity;
        raw.push({
          x: 50 + radius * Math.cos(angle),
          y: 50 + radius * Math.sin(angle),
        });
      }
    }

    remaining -= count;
    ring++;
  }

  return recenter(raw);
};

export const seedPositions = (n) => {
  if (n === 0) return [];
  if (PIP_PATTERNS[n]) return PIP_PATTERNS[n].map((key) => ({ ...GRID[key] }));
  return ringPositions(n);
};

// Returns markup for a hole containing `seedCount` seeds: an inline SVG
// (100x100 viewBox) plus, up to DENSE_CUTOFF, a sibling corner-badge <span>
// with the exact count. The badge is deliberately a sibling, not part of the
// SVG, so it does not spin along with the hole on hover (see .hole-svg:hover
// in style.css) and can be positioned/clipped independently via plain CSS.
// Colors are left to CSS (`.hole-bg`, `.seed-dot`, `.seed-count-badge`,
// `.corner-badge`) so the same markup is reused for both players and
// recolored per side via ancestor classes.
//
// Above DENSE_CUTOFF, individual dots stop being legible (they'd overlap a
// same-colored numeral badge drawn in the same central area), so the dots
// are dropped entirely in favor of one clean central number.
export const createHoleSVG = (seedCount) => {
  const overCutoff = seedCount > DENSE_CUTOFF;

  const body = overCutoff
    ? `<text class="seed-count-badge" x="50" y="58" text-anchor="middle">${seedCount}</text>`
    : seedPositions(seedCount)
        .map(
          ({ x, y }) =>
            `<circle class="seed-dot" cx="${x}" cy="${y}" r="${DOT_RADIUS}"/>`
        )
        .join("");

  const svg =
    `<svg class="hole-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">` +
    `<circle class="hole-bg" cx="50" cy="50" r="${HOLE_RADIUS}"/>` +
    `${body}</svg>`;

  // A small always-on exact-count readout in the corner, up to DENSE_CUTOFF —
  // above that the big central number already gives the exact count.
  const cornerBadge = overCutoff
    ? ""
    : `<span class="corner-badge">${seedCount}</span>`;

  return `${svg}${cornerBadge}`;
};
