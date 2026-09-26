import { describe, it, expect } from "vitest";
import {
  createInitialState,
  isLegalMove,
  getLegalMoves,
  sow,
  capture,
  checkEndOfGame,
  applyMove,
} from "./engine.js";

const sum = (values) => values.reduce((total, value) => total + value, 0);

describe("sowing", () => {
  it("sows seeds counter-clockwise into the following holes", () => {
    const board = createInitialState().board; // twelve 4s
    const result = sow(board, 0);
    expect(result.board[0]).toBe(0);
    expect(result.board[1]).toBe(5);
    expect(result.board[2]).toBe(5);
    expect(result.board[3]).toBe(5);
    expect(result.board[4]).toBe(5);
    expect(result.board[5]).toBe(4); // only 4 seeds sown, hole 5 untouched
    expect(result.landingHole).toBe(4);
    expect(result.sowPath).toEqual([1, 2, 3, 4]);
  });

  it("skips the origin hole on every lap, even past a full 12-hole wrap (regression: self-modifying loop bound)", () => {
    const board = [13, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    const before = sum(board);
    const result = sow(board, 0);

    expect(result.board[0]).toBe(0); // origin never re-credited, even on the 2nd lap
    expect(result.board[1]).toBe(6); // wrap-around credit
    expect(result.board[2]).toBe(6); // wrap-around credit
    for (let i = 3; i <= 11; i++) {
      expect(result.board[i]).toBe(5);
    }
    expect(sum(result.board)).toBe(before); // seeds are conserved, not duplicated
  });

  it("never mutates the caller's board array", () => {
    const board = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    const copy = [...board];
    sow(board, 0);
    expect(board).toEqual(copy);
  });
});

describe("capture", () => {
  it("captures a single opponent hole landing on exactly 2 seeds", () => {
    const result = capture([0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0], 0, 6);
    expect(result.capturedSeeds).toBe(2);
    expect(result.capturedHoles).toEqual([6]);
    expect(result.board[6]).toBe(0);
  });

  it("captures a single opponent hole landing on exactly 3 seeds", () => {
    const result = capture([0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0], 0, 6);
    expect(result.capturedSeeds).toBe(3);
    expect(result.capturedHoles).toEqual([6]);
  });

  it("chains captures backward through consecutive 2s and 3s in the opponent row", () => {
    const result = capture([0, 0, 0, 0, 0, 0, 2, 3, 2, 0, 0, 0], 0, 8);
    expect(result.capturedHoles).toEqual([8, 7, 6]);
    expect(result.capturedSeeds).toBe(7);
    expect(result.board.slice(6, 9)).toEqual([0, 0, 0]);
  });

  it("stops at the row boundary even when the crossing hole holds 2 or 3 seeds (regression: asymmetric boundary check)", () => {
    const board = [4, 4, 4, 4, 3, 2, 2, 2, 5, 6, 6, 6];
    const sown = sow(board, 4);
    expect(sown.landingHole).toBe(7);
    expect(sown.board.slice(5, 8)).toEqual([3, 3, 3]);

    const result = capture(sown.board, 0, sown.landingHole);
    expect(result.capturedSeeds).toBe(6); // holes 6 and 7 only
    expect(result.capturedHoles).toEqual([7, 6]);
    expect(result.board[5]).toBe(3); // mover's own hole must NOT be captured
  });

  it("does not capture when landing in the mover's own row", () => {
    const result = capture([0, 1, 1, 1, 2, 0, 0, 0, 0, 0, 0, 0], 0, 4);
    expect(result.capturedSeeds).toBe(0);
    expect(result.capturedHoles).toEqual([]);
  });
});

describe("move legality", () => {
  it("rejects a move on an empty hole and leaves state unchanged", () => {
    const state = createInitialState(0);
    state.board[0] = 0;
    const result = applyMove(state, 0);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("empty-hole");
    expect(result.state).toBe(state);
  });

  it("rejects a move on a hole the active player does not own and leaves state unchanged", () => {
    const state = createInitialState(0);
    const result = applyMove(state, 6);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not-your-turn");
    expect(result.state).toBe(state);
  });

  it("rejects an out-of-range hole index", () => {
    const state = createInitialState(0);
    const result = applyMove(state, 12);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("invalid-hole");
  });

  it("rejects any move once the game has already ended", () => {
    const state = { ...createInitialState(0), status: "won", winner: 0 };
    const result = applyMove(state, 0);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("game-over");
  });

  it("getLegalMoves returns only the active player's non-empty holes", () => {
    const state = createInitialState(0);
    state.board[2] = 0;
    expect(getLegalMoves(state)).toEqual([0, 1, 3, 4, 5]);

    const p1State = createInitialState(1);
    expect(getLegalMoves(p1State)).toEqual([6, 7, 8, 9, 10, 11]);
  });

  it("isLegalMove is false for any move once the game has ended", () => {
    const state = { ...createInitialState(0), status: "draw" };
    expect(isLegalMove(state, 0)).toBe(false);
  });
});

describe("turn order", () => {
  it("switches currentPlayer after a legal move", () => {
    const state = createInitialState(0);
    const result = applyMove(state, 0);
    expect(result.ok).toBe(true);
    expect(result.state.currentPlayer).toBe(1);
  });

  it("does not switch currentPlayer after a rejected move", () => {
    const state = createInitialState(0);
    const result = applyMove(state, 6);
    expect(result.state.currentPlayer).toBe(0);
  });
});

describe("end of game", () => {
  it("declares a win once a player's score exceeds 24", () => {
    const result = checkEndOfGame(
      new Array(12).fill(1),
      [25, 0],
      0
    );
    expect(result.status).toBe("won");
    expect(result.winner).toBe(0);
  });

  it("sweeps the mover's remaining seeds into their score when the move leaves the opponent with nothing to sow", () => {
    const state = {
      board: [5, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0],
      scores: [0, 0],
      currentPlayer: 0,
      status: "in_progress",
      winner: null,
    };
    const result = applyMove(state, 5);
    expect(result.ok).toBe(true);
    expect(result.state.scores).toEqual([8, 0]);
    expect(result.state.board).toEqual(new Array(12).fill(0));
    expect(result.state.status).toBe("won");
    expect(result.state.winner).toBe(0);
    expect(result.move.starvationSweep).toEqual({ player: 0, holes: [0], seeds: 5 });
  });

  it("ends in a draw when the game-ending sweep brings both players to equal scores", () => {
    const state = {
      board: [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      scores: [20, 24],
      currentPlayer: 0,
      status: "in_progress",
      winner: null,
    };
    const result = applyMove(state, 0);
    expect(result.ok).toBe(true);
    expect(result.state.scores).toEqual([24, 24]);
    expect(result.state.board).toEqual(new Array(12).fill(0));
    expect(result.state.status).toBe("draw");
    expect(result.state.winner).toBeNull();
  });

  it("keeps the game in_progress when the opponent still has seeds after the move", () => {
    const state = createInitialState(0);
    const result = applyMove(state, 0);
    expect(result.state.status).toBe("in_progress");
    expect(result.state.winner).toBeNull();
  });
});

describe("full-game seed conservation", () => {
  it("keeps board + scores summing to 48 across a sequence of legal moves", () => {
    let state = createInitialState(0);
    const total = () => sum(state.board) + sum(state.scores);
    expect(total()).toBe(48);

    for (let i = 0; i < 50 && state.status === "in_progress"; i++) {
      const moves = getLegalMoves(state);
      if (moves.length === 0) break;
      const result = applyMove(state, moves[0]);
      expect(result.ok).toBe(true);
      state = result.state;
      expect(total()).toBe(48);
    }
  });
});
