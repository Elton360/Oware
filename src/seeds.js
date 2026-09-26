// Visual seed identities. The engine only tracks counts; this layer gives each
// of the 48 seeds a fixed colour and follows it around the board so colours
// stay physically consistent as seeds are sown and captured.

import { BOARD_SIZE } from "./engine.js";

export const TOTAL_SEEDS = 48;

export const SEED_COLORS = [
  { key: "terracotta", label: "Terracotta", count: 16 },
  { key: "ochre", label: "Ochre", count: 18 },
  { key: "jade", label: "Jade", count: 14 },
];

export const colorOf = (seedId) => {
  let upper = 0;
  for (const color of SEED_COLORS) {
    upper += color.count;
    if (seedId < upper) return color.key;
  }
  throw new RangeError(`Unknown seed id ${seedId}`);
};

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Deals the 48 seeds into 12 pits of 4, shuffled so colours are mixed.
export const createSeeds = (shuffleSeed = 7) => {
  const random = mulberry32(shuffleSeed);
  const ids = Array.from({ length: TOTAL_SEEDS }, (_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const perPit = TOTAL_SEEDS / BOARD_SIZE;
  return {
    pits: Array.from({ length: BOARD_SIZE }, (_, pit) => ids.slice(pit * perPit, (pit + 1) * perPit)),
    stores: [[], []],
  };
};

// Moves seed ids to mirror an engine move. Returns the new seed state plus the
// ordered steps the renderer animates.
export const applyMoveToSeeds = (seeds, move) => {
  const pits = seeds.pits.map((pit) => [...pit]);
  const stores = seeds.stores.map((store) => [...store]);
  const steps = [];

  const hand = pits[move.holeIndex];
  pits[move.holeIndex] = [];
  move.sowPath.forEach((pit, order) => {
    const seedId = hand.shift();
    pits[pit].push(seedId);
    steps.push({ phase: "sow", seedId, to: { pit }, order });
  });

  const collect = (phase, holes, player) => {
    holes.forEach((pit) => {
      for (const seedId of pits[pit]) {
        stores[player].push(seedId);
        steps.push({ phase, seedId, from: { pit }, to: { store: player } });
      }
      pits[pit] = [];
    });
  };
  collect("capture", move.capturedHoles, move.player);
  if (move.starvationSweep) collect("sweep", move.starvationSweep.holes, move.starvationSweep.player);

  return { seeds: { pits, stores }, steps };
};

const hash = (n) => {
  let x = (n + 1) * 0x9e3779b1;
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
};

const GOLDEN_ANGLE = 2.399963;

// Position of the seed in `slot` within a container, as offsets from the
// container centre in units of the container's width/height (-0.5..0.5).
// Spiral packing plus per-seed jitter, so seeds look scattered rather than
// gridded, and a seed's position never depends on how many seeds follow it.
export const layoutSeed = (seedId, slot, { spread = 0.075, maxRadius = 0.3 } = {}) => {
  const jitterA = hash(seedId) - 0.5;
  const jitterB = hash(seedId + 101) - 0.5;
  const radius = Math.min(maxRadius, spread * Math.sqrt(slot + 0.35) + jitterA * 0.03);
  const angle = slot * GOLDEN_ANGLE + jitterB * 0.6 + 0.8;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

export const layoutStoreSeed = (seedId, slot) =>
  layoutSeed(seedId, slot, { spread: 0.058, maxRadius: 0.36 });
