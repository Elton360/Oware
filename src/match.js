// Match controller: everything about a local match that the pure engine does
// not know about (names, undo budget, log, timing, seed identities). Every
// state change goes through dispatch(), so a future network opponent only has
// to produce the same actions.

import { applyMove, createInitialState, HOLES_PER_PLAYER } from "./engine.js";
import { applyMoveToSeeds, createSeeds } from "./seeds.js";

export const UNDOS_PER_PLAYER = 2;
export const SIDE_NAMES = ["South", "North"];

export const pitLabel = (holeIndex) =>
  holeIndex < HOLES_PER_PLAYER ? String(holeIndex + 1) : "ABCDEF"[holeIndex - HOLES_PER_PLAYER];

export const createMatch = (names, startingPlayer = 0, now = Date.now()) => ({
  version: 1,
  players: names.map((name) => ({ name })),
  game: createInitialState(startingPlayer),
  seeds: createSeeds(),
  undos: [UNDOS_PER_PLAYER, UNDOS_PER_PLAYER],
  log: [],
  history: [],
  startedAt: now,
  endedAt: null,
  turnStartedAt: now,
  endReason: null,
});

// Parts of the match that an undo rolls back (the log is simply truncated).
const snapshot = ({ game, seeds, turnStartedAt }) => ({ game, seeds, turnStartedAt });

// Undo budgets cap how far back anyone can go, so older snapshots are dead weight.
const MAX_HISTORY = UNDOS_PER_PLAYER * 2;

export const turnNumber = (match) => match.log.length + 1;

export const movesBy = (match, player) => match.log.filter((entry) => entry.player === player).length;

export const lastEntryBy = (match, player) => {
  for (let i = match.log.length - 1; i >= 0; i--) {
    if (match.log[i].player === player) return match.log[i];
  }
  return null;
};

export const canUndo = (match) => {
  const last = match.log.at(-1);
  return Boolean(
    last && match.game.status === "in_progress" && match.undos[last.player] > 0 && match.history.length
  );
};

export const describeEntry = (entry) => {
  const from = `Pit ${pitLabel(entry.holeIndex)}`;
  let outcome;
  if (entry.capturedSeeds > 0) outcome = `Captures ${entry.capturedSeeds}`;
  else outcome = pitLabel(entry.landingHole);
  const sweep = entry.sweptSeeds ? ` · Sweeps ${entry.sweptSeeds}` : "";
  return `${from} → ${outcome}${sweep}`;
};

export const formatLogEntry = (entry, players) => `${players[entry.player].name}: ${describeEntry(entry)}`;

const endIfOver = (match, now) =>
  match.game.status === "in_progress" ? match : { ...match, endedAt: now, endReason: match.game.status };

// Returns { match, move?, steps?, error? }. Never mutates the input.
export const dispatch = (match, action, now = Date.now()) => {
  switch (action.type) {
    case "move": {
      const result = applyMove(match.game, action.holeIndex);
      if (!result.ok) return { match, error: result.reason };
      const { move } = result;
      const { seeds, steps } = applyMoveToSeeds(match.seeds, move);
      const entry = {
        player: move.player,
        holeIndex: move.holeIndex,
        landingHole: move.landingHole,
        seedsSown: move.seedsSown,
        capturedSeeds: move.capturedSeeds,
        sweptSeeds: move.starvationSweep ? move.starvationSweep.seeds : 0,
        thinkMs: Math.max(0, now - match.turnStartedAt),
      };
      const next = {
        ...match,
        game: result.state,
        seeds,
        log: [...match.log, entry],
        history: [...match.history, snapshot(match)].slice(-MAX_HISTORY),
        turnStartedAt: now,
      };
      return { match: endIfOver(next, now), move, steps };
    }

    case "undo": {
      if (!canUndo(match)) return { match, error: "cannot-undo" };
      const mover = match.log.at(-1).player;
      const previous = match.history.at(-1);
      const undos = [...match.undos];
      undos[mover]--;
      return {
        match: {
          ...match,
          ...previous,
          turnStartedAt: now,
          log: match.log.slice(0, -1),
          history: match.history.slice(0, -1),
          undos,
        },
      };
    }

    case "agree-draw": {
      if (match.game.status !== "in_progress") return { match, error: "game-over" };
      return {
        match: {
          ...match,
          game: { ...match.game, status: "draw", winner: null },
          endedAt: now,
          endReason: "agreement",
        },
      };
    }

    case "new-match":
      return {
        match: createMatch(
          match.players.map((p) => p.name),
          action.startingPlayer ?? 0,
          now
        ),
      };

    default:
      return { match, error: "unknown-action" };
  }
};

// Loose structural check for a match restored from storage.
export const isValidMatch = (value) => {
  try {
    if (!value || value.version !== 1) return false;
    const { game, seeds, players } = value;
    if (players.length !== 2 || !players.every((p) => typeof p.name === "string")) return false;
    if (game.board.length !== 12 || seeds.pits.length !== 12) return false;
    const seedsMatch = game.board.every((count, i) => seeds.pits[i].length === count);
    const storesMatch = seeds.stores.every((store, p) => store.length === game.scores[p]);
    return seedsMatch && storesMatch && Array.isArray(value.log) && Array.isArray(value.history);
  } catch {
    return false;
  }
};
