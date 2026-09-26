import { describe, it, expect } from "vitest";
import { getLegalMoves } from "./engine.js";
import {
  createMatch,
  dispatch,
  pitLabel,
  describeEntry,
  canUndo,
  isValidMatch,
  UNDOS_PER_PLAYER,
} from "./match.js";
import { TOTAL_SEEDS, createSeeds, colorOf, SEED_COLORS, layoutSeed } from "./seeds.js";

const sum = (values) => values.reduce((a, b) => a + b, 0);

const seededRandom = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const playRandom = (match, random, maxMoves = 400) => {
  for (let i = 0; i < maxMoves && match.game.status === "in_progress"; i++) {
    const moves = getLegalMoves(match.game);
    const hole = moves[Math.floor(random() * moves.length)];
    match = dispatch(match, { type: "move", holeIndex: hole }, i).match;
  }
  return match;
};

describe("pit labels", () => {
  it("numbers South 1-6 and letters North A-F along the sowing direction", () => {
    expect([0, 1, 2, 3, 4, 5].map(pitLabel)).toEqual(["1", "2", "3", "4", "5", "6"]);
    expect([6, 7, 8, 9, 10, 11].map(pitLabel)).toEqual(["A", "B", "C", "D", "E", "F"]);
  });
});

describe("seeds", () => {
  it("has 48 seeds split into the legend's colour counts", () => {
    expect(sum(SEED_COLORS.map((c) => c.count))).toBe(TOTAL_SEEDS);
    const all = createSeeds().pits.flat();
    expect(new Set(all).size).toBe(TOTAL_SEEDS);
    for (const color of SEED_COLORS) {
      expect(all.filter((id) => colorOf(id) === color.key)).toHaveLength(color.count);
    }
  });

  it("keeps a seed's position independent of later seeds and inside the pit", () => {
    const first = layoutSeed(3, 0);
    expect(layoutSeed(3, 0)).toEqual(first);
    for (let slot = 0; slot < 30; slot++) {
      const { x, y } = layoutSeed(slot, slot);
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(0.31);
    }
  });

  it("mirrors the engine board and scores exactly across many random games", () => {
    for (let game = 0; game < 40; game++) {
      const random = seededRandom(game + 1);
      let match = createMatch(["S", "N"], game % 2);
      for (let i = 0; i < 400 && match.game.status === "in_progress"; i++) {
        const moves = getLegalMoves(match.game);
        match = dispatch(match, { type: "move", holeIndex: moves[Math.floor(random() * moves.length)] }).match;
        match.game.board.forEach((count, pit) => expect(match.seeds.pits[pit]).toHaveLength(count));
        match.seeds.stores.forEach((store, p) => expect(store).toHaveLength(match.game.scores[p]));
        const everySeed = [...match.seeds.pits.flat(), ...match.seeds.stores.flat()];
        expect(new Set(everySeed).size).toBe(TOTAL_SEEDS);
      }
    }
  });
});

describe("match dispatch", () => {
  it("logs moves with think time and switches turns", () => {
    const start = createMatch(["Ama", "Kofi"], 0, 1000);
    const { match, steps } = dispatch(start, { type: "move", holeIndex: 2 }, 4500);
    expect(match.game.currentPlayer).toBe(1);
    expect(match.log).toEqual([
      expect.objectContaining({ player: 0, holeIndex: 2, landingHole: 6, thinkMs: 3500 }),
    ]);
    expect(describeEntry(match.log[0])).toBe("Pit 3 → A");
    expect(steps.map((s) => s.to.pit)).toEqual([3, 4, 5, 6]);
  });

  it("rejects illegal moves without changing the match", () => {
    const start = createMatch(["Ama", "Kofi"], 0);
    const result = dispatch(start, { type: "move", holeIndex: 8 });
    expect(result.error).toBe("not-your-turn");
    expect(result.match).toBe(start);
  });

  it("undo restores the exact prior position and charges the player who moved", () => {
    let match = createMatch(["Ama", "Kofi"], 0, 0);
    match = dispatch(match, { type: "move", holeIndex: 1 }, 10).match;
    const before = match;
    match = dispatch(match, { type: "move", holeIndex: 9 }, 20).match;
    match = dispatch(match, { type: "undo" }, 30).match;

    expect(match.game).toEqual(before.game);
    expect(match.seeds).toEqual(before.seeds);
    expect(match.log).toEqual(before.log);
    expect(match.undos).toEqual([UNDOS_PER_PLAYER, UNDOS_PER_PLAYER - 1]);
  });

  it("stops allowing undo once the mover's budget is spent", () => {
    let match = createMatch(["Ama", "Kofi"], 0);
    for (let i = 0; i < UNDOS_PER_PLAYER; i++) {
      match = dispatch(match, { type: "move", holeIndex: 0 }).match;
      match = dispatch(match, { type: "undo" }).match;
    }
    match = dispatch(match, { type: "move", holeIndex: 0 }).match;
    expect(canUndo(match)).toBe(false);
    expect(dispatch(match, { type: "undo" }).error).toBe("cannot-undo");
  });

  it("ends the game as a draw by agreement", () => {
    const { match } = dispatch(createMatch(["Ama", "Kofi"]), { type: "agree-draw" }, 99);
    expect(match.game.status).toBe("draw");
    expect(match.endReason).toBe("agreement");
    expect(match.endedAt).toBe(99);
  });

  it("round-trips through JSON as a valid saved match", () => {
    const match = playRandom(createMatch(["Ama", "Kofi"]), seededRandom(5), 20);
    expect(isValidMatch(JSON.parse(JSON.stringify(match)))).toBe(true);
    expect(isValidMatch({ ...match, version: 0 })).toBe(false);
  });
});
