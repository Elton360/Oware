// Pure Oware (2-3 capture variant) game engine. No DOM/browser dependencies.
// board[0..5] = player 0's holes, board[6..11] = player 1's holes, sown counter-clockwise.

export const HOLES_PER_PLAYER = 6;
export const BOARD_SIZE = HOLES_PER_PLAYER * 2;
export const WINNING_SCORE = 25;

export const ownerOf = (holeIndex) =>
  holeIndex < HOLES_PER_PLAYER ? 0 : 1;

const opponentRange = (player) =>
  player === 0 ? [HOLES_PER_PLAYER, BOARD_SIZE - 1] : [0, HOLES_PER_PLAYER - 1];

export const createInitialState = (startingPlayer = 0) => ({
  board: new Array(BOARD_SIZE).fill(4),
  scores: [0, 0],
  currentPlayer: startingPlayer,
  status: "in_progress",
  winner: null,
});

export const isLegalMove = (state, holeIndex) => {
  if (state.status !== "in_progress") return false;
  if (holeIndex < 0 || holeIndex >= BOARD_SIZE) return false;
  if (ownerOf(holeIndex) !== state.currentPlayer) return false;
  if (state.board[holeIndex] === 0) return false;
  return true;
};

export const getLegalMoves = (state) => {
  if (state.status !== "in_progress") return [];
  const [start, end] =
    state.currentPlayer === 0 ? [0, HOLES_PER_PLAYER - 1] : [HOLES_PER_PLAYER, BOARD_SIZE - 1];
  const moves = [];
  for (let i = start; i <= end; i++) {
    if (state.board[i] > 0) moves.push(i);
  }
  return moves;
};

// Sows the seeds from holeIndex counter-clockwise, always skipping the origin
// hole itself, even across multiple full laps of the board.
export const sow = (board, holeIndex) => {
  const seedsToSow = board[holeIndex];
  const nextBoard = [...board];
  nextBoard[holeIndex] = 0;

  const sowPath = [];
  let cursor = holeIndex;
  let sown = 0;
  while (sown < seedsToSow) {
    cursor = (cursor + 1) % BOARD_SIZE;
    if (cursor === holeIndex) continue; // never re-credit the source hole
    nextBoard[cursor]++;
    sowPath.push(cursor);
    sown++;
  }

  const landingHole = sowPath[sowPath.length - 1];
  return { board: nextBoard, landingHole, sowPath };
};

// Captures backward from landingHole through consecutive 2-or-3 holes,
// stopping as soon as the walk leaves the opponent's row (uniformly for
// both capturable values, so a chain can never bleed into the mover's own row).
export const capture = (board, mover, landingHole) => {
  const [rangeStart, rangeEnd] = opponentRange(mover);
  const nextBoard = [...board];
  const capturedHoles = [];
  let capturedSeeds = 0;

  let pos = landingHole;
  while (
    pos >= rangeStart &&
    pos <= rangeEnd &&
    (nextBoard[pos] === 2 || nextBoard[pos] === 3)
  ) {
    capturedSeeds += nextBoard[pos];
    capturedHoles.push(pos);
    nextBoard[pos] = 0;
    pos--;
  }

  return { board: nextBoard, capturedHoles, capturedSeeds };
};

const sum = (values) => values.reduce((total, value) => total + value, 0);

// Applies the starvation sweep and resolves win/draw status after a move.
export const checkEndOfGame = (board, scores, mover) => {
  const [oppStart, oppEnd] = opponentRange(mover);
  const opponentHasSeeds = board
    .slice(oppStart, oppEnd + 1)
    .some((seeds) => seeds > 0);

  let nextBoard = board;
  let nextScores = scores;
  let starvationSweep = null;

  if (!opponentHasSeeds) {
    const [ownStart, ownEnd] = mover === 0 ? [0, HOLES_PER_PLAYER - 1] : [HOLES_PER_PLAYER, BOARD_SIZE - 1];
    const sweptSeeds = sum(nextBoard.slice(ownStart, ownEnd + 1));
    if (sweptSeeds > 0) {
      nextBoard = [...nextBoard];
      const sweptHoles = [];
      for (let i = ownStart; i <= ownEnd; i++) {
        if (nextBoard[i] > 0) sweptHoles.push(i);
        nextBoard[i] = 0;
      }
      nextScores = [...nextScores];
      nextScores[mover] += sweptSeeds;
      starvationSweep = { player: mover, holes: sweptHoles, seeds: sweptSeeds };
    }
  }

  let status = "in_progress";
  let winner = null;

  if (nextScores[0] >= WINNING_SCORE || nextScores[1] >= WINNING_SCORE) {
    status = "won";
    winner = nextScores[0] > nextScores[1] ? 0 : 1;
  } else if (sum(nextBoard) === 0) {
    if (nextScores[0] === nextScores[1]) {
      status = "draw";
    } else {
      status = "won";
      winner = nextScores[0] > nextScores[1] ? 0 : 1;
    }
  }

  return { board: nextBoard, scores: nextScores, status, winner, starvationSweep };
};

export const applyMove = (state, holeIndex) => {
  if (!isLegalMove(state, holeIndex)) {
    const reason =
      state.status !== "in_progress"
        ? "game-over"
        : holeIndex < 0 || holeIndex >= BOARD_SIZE
        ? "invalid-hole"
        : ownerOf(holeIndex) !== state.currentPlayer
        ? "not-your-turn"
        : "empty-hole";
    return { ok: false, reason, state };
  }

  const mover = state.currentPlayer;
  const sown = sow(state.board, holeIndex);
  const captured = capture(sown.board, mover, sown.landingHole);
  const scoresAfterCapture = [...state.scores];
  scoresAfterCapture[mover] += captured.capturedSeeds;

  const ended = checkEndOfGame(captured.board, scoresAfterCapture, mover);

  const nextState = {
    board: ended.board,
    scores: ended.scores,
    currentPlayer: ended.status === "in_progress" ? (mover === 0 ? 1 : 0) : state.currentPlayer,
    status: ended.status,
    winner: ended.winner,
  };

  return {
    ok: true,
    state: nextState,
    move: {
      player: mover,
      holeIndex,
      seedsSown: sown.sowPath.length,
      sowPath: sown.sowPath,
      landingHole: sown.landingHole,
      capturedHoles: captured.capturedHoles,
      capturedSeeds: captured.capturedSeeds,
      starvationSweep: ended.starvationSweep,
    },
  };
};
