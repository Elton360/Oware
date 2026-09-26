import { WINNING_SCORE } from "../engine.js";
import { SIDE_NAMES, canUndo, lastEntryBy, movesBy, pitLabel } from "../match.js";
import { SEED_COLORS } from "../seeds.js";
import { icons } from "./icons.js";
import { escapeHtml, initials } from "./dom.js";

const WISDOM = [
  "Oware teaches patience: never sow without first counting the harvest.",
  "A full house is a store of strength — and a target for your rival.",
  "Leave your opponent seeds to play with; a starved board ends in your hands.",
  "Count the path twice. The last seed decides the harvest.",
  "Small pits of two and three are where captures are born.",
];

const leadText = (lead) => {
  if (lead > 0) return `Lead: +${lead} seed${lead === 1 ? "" : "s"}`;
  if (lead < 0) return `Behind by ${-lead}`;
  return "Level";
};

const decisionText = (entry) => {
  const parts = [`Sowed ${entry.seedsSown} from Pit ${pitLabel(entry.holeIndex)} to Pit ${pitLabel(entry.landingHole)}`];
  if (entry.capturedSeeds) parts.push(`harvested ${entry.capturedSeeds}`);
  if (entry.sweptSeeds) parts.push(`swept ${entry.sweptSeeds}`);
  return parts.join(", ");
};

export const renderPanel = (el, match, player, { busy }) => {
  const { game, players } = match;
  const opponent = 1 - player;
  const inProgress = game.status === "in_progress";
  const active = inProgress && game.currentPlayer === player;
  const winner = game.status === "won" && game.winner === player;
  const score = game.scores[player];
  const pct = Math.min(100, Math.round((score / WINNING_SCORE) * 100));
  const moves = movesBy(match, player);
  const name = escapeHtml(players[player].name);

  el.classList.toggle("is-active", active);
  el.classList.toggle("is-winner", winner);
  el.dataset.side = SIDE_NAMES[player].toLowerCase();

  let turnBadge = "";
  if (active) turnBadge = `<span class="panel-turn">Active Turn</span>`;
  else if (winner) turnBadge = `<span class="panel-turn">Winner</span>`;

  let footer;
  if (active) {
    footer = `
      <p class="your-move">Your move, ${name}. Tap a pit on your side.</p>
      <div class="controls">
        <button class="ghost" type="button" data-action="offer-draw" ${busy ? "disabled" : ""}>${icons.handshake}Offer Draw</button>
      </div>`;
  } else {
    const last = lastEntryBy(match, player);
    const isLastMover = match.log.at(-1)?.player === player;
    const undosLeft = match.undos[player];
    const undoLabel = undosLeft > 0 ? `Undo (${undosLeft} left)` : "Undo";
    const showUndo = inProgress && isLastMover;
    footer = `
      <div class="recent">
        <div class="row-between">
          <span class="label">Recent Decision</span>
          <span class="muted small tabular">${last ? `${(last.thinkMs / 1000).toFixed(1)}s` : "—"}</span>
        </div>
        <p class="quote">${last ? `“${decisionText(last)}”` : "No moves yet."}</p>
      </div>
      ${
        showUndo
          ? `<div class="controls">
              <button class="ghost" type="button" data-action="undo" ${busy || !canUndo(match) ? "disabled" : ""}>${icons.undo}${undoLabel}</button>
            </div>`
          : ""
      }`;
  }

  el.innerHTML = `
    <header class="panel-head">
      <span class="panel-tag">Player ${player + 1} (${SIDE_NAMES[player]})</span>
      ${turnBadge}
    </header>
    <div class="identity">
      <span class="avatar" aria-hidden="true">${escapeHtml(initials(players[player].name))}</span>
      <div class="identity-text">
        <p class="name">${name}</p>
        <p class="muted small">${SIDE_NAMES[player]} side · ${moves} move${moves === 1 ? "" : "s"}</p>
      </div>
    </div>
    <div class="score">
      <div class="row-between">
        <span class="label">Captured Seeds</span>
        <span class="score-num tabular">${score}<span class="score-of"> / ${WINNING_SCORE}</span></span>
      </div>
      <div class="progress" role="progressbar" aria-label="${name}'s progress to ${WINNING_SCORE}" aria-valuemin="0" aria-valuemax="${WINNING_SCORE}" aria-valuenow="${score}">
        <span style="width:${pct}%"></span>
      </div>
      <div class="row-between small">
        <span class="lead">${leadText(score - game.scores[opponent])}</span>
        <span class="muted">${pct}% of Target</span>
      </div>
    </div>
    ${footer}`;
};

export const renderWisdom = (el, match) => {
  el.textContent = `“${WISDOM[Math.floor(match.log.length / 2) % WISDOM.length]}”`;
};

export const renderLegend = (el) => {
  el.innerHTML = SEED_COLORS.map(
    (c) => `<li><span class="legend-dot seed--${c.key}"></span>${c.label} <span class="muted">(${c.count})</span></li>`
  ).join("");
};
