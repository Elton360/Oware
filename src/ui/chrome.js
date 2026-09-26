// Status bar, board header/footer text and the live game log.

import { SIDE_NAMES, formatLogEntry, turnNumber } from "../match.js";
import { TOTAL_SEEDS } from "../seeds.js";
import { icons } from "./icons.js";
import { escapeHtml } from "./dom.js";
import { isSoundOn } from "./sound.js";

const $ = (id) => document.getElementById(id);

const pad = (n) => String(n).padStart(2, "0");

export const formatClock = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const mmss = `${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return hours ? `${hours}:${mmss}` : mmss;
};

export const renderClock = (match, now = Date.now()) => {
  $("match-clock").textContent = formatClock((match.endedAt ?? now) - match.startedAt);
};

export const renderSoundToggle = () => {
  const button = $("sound-toggle");
  const on = isSoundOn();
  button.innerHTML = on ? icons.soundOn : icons.soundOff;
  button.setAttribute("aria-pressed", String(on));
  button.title = on ? "Sound on" : "Sound off";
};

export const renderStatus = (match) => {
  const over = match.game.status !== "in_progress";
  $("turn-number").textContent = over ? "Final" : `Turn ${turnNumber(match)}`;
  renderClock(match);

  const player = match.game.currentPlayer;
  const north = player === 1;
  $("board-head-side").innerHTML = `${icons.arrowLeft} North side (F to A)`;
  if (over) {
    $("turn-hint-name").textContent = "Match over.";
    $("turn-hint-text").textContent = "Start a new match from the menu.";
  } else {
    $("turn-hint-name").textContent = `${match.players[player].name}'s turn:`;
    $("turn-hint-text").textContent = `Tap any of your pits (${north ? "A–F" : "1–6"}) to lift and sow counter-clockwise`;
  }
  document.body.dataset.turn = SIDE_NAMES[player].toLowerCase();
};

export const renderLog = (match) => {
  const list = $("log-list");
  const onBoard = match.game.board.reduce((a, b) => a + b, 0);
  $("seed-circulation").textContent = `${onBoard} of ${TOTAL_SEEDS} seeds in circulation`;

  if (!match.log.length) {
    const starter = match.players[match.game.currentPlayer].name;
    list.innerHTML = `<li class="log-empty muted">No moves yet — ${escapeHtml(starter)} opens the match.</li>`;
    return;
  }
  const lastIndex = match.log.length - 1;
  list.innerHTML = match.log
    .map((entry, i) => {
      const current = i === lastIndex;
      return `<li class="log-entry${current ? " is-current" : ""}${entry.capturedSeeds ? " is-capture" : ""}">
        <span class="log-n">${i + 1}.</span> ${escapeHtml(formatLogEntry(entry, match.players))}${current ? ' <span class="muted">(Current)</span>' : ""}
      </li>`;
    })
    .join("");
  list.scrollTop = list.scrollHeight;
};
