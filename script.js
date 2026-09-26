import { createMatch, dispatch, isValidMatch } from "./src/match.js";
import { createBoard } from "./src/ui/board.js";
import { renderClock, renderLog, renderSoundToggle, renderStatus } from "./src/ui/chrome.js";
import { askNames, askRestart, confirm, showGameOver, showRules } from "./src/ui/dialogs.js";
import { hydrateIcons } from "./src/ui/dom.js";
import { renderLegend, renderPanel, renderWisdom } from "./src/ui/panels.js";
import { isSoundOn, setSoundOn, unlockAudio } from "./src/ui/sound.js";

const MATCH_KEY = "oware.match.v1";
const NAMES_KEY = "oware.names";

const storage = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable; the match just won't survive a reload.
    }
  },
};

const savedNames = () => {
  const names = storage.get(NAMES_KEY);
  return Array.isArray(names) && names.length === 2 && names.every((n) => typeof n === "string") ? names : null;
};

const panels = [document.getElementById("panel-south"), document.getElementById("panel-north")];

let match = null;
let busy = false;

const board = createBoard(document.getElementById("board"), {
  onPit: (holeIndex) => commit({ type: "move", holeIndex }),
});

const renderAll = (m = match) => {
  board.render(m, { interactive: !busy });
  panels.forEach((el, player) => renderPanel(el, m, player, { busy }));
  renderWisdom(document.getElementById("wisdom-text"), m);
  renderStatus(m);
  renderLog(m);
};

const endOfMatch = async () => {
  const choice = await showGameOver(match);
  if (choice === "again") startMatch(match.players.map((p) => p.name), Math.floor(Math.random() * 2));
  else if (choice === "new-players") newPlayers();
};

// The single entry point for every change to the match.
const commit = async (action) => {
  if (busy) return;
  unlockAudio();
  const before = match;
  const result = dispatch(match, action);
  if (result.error) return;
  match = result.match;
  storage.set(MATCH_KEY, match);

  if (result.steps) {
    busy = true;
    renderAll(before);
    await board.animate(before, result.move, result.steps);
    busy = false;
  }
  renderAll();
  if (before.game.status === "in_progress" && match.game.status !== "in_progress") endOfMatch();
};

const startMatch = (names, startingPlayer) => {
  storage.set(NAMES_KEY, names);
  match = createMatch(names, startingPlayer);
  storage.set(MATCH_KEY, match);
  renderAll();
};

const newPlayers = async () => {
  const { names, startingPlayer } = await askNames(savedNames() ?? ["", ""]);
  startMatch(names, startingPlayer);
};

const actions = {
  rules: () => showRules(),
  sound: () => {
    unlockAudio();
    setSoundOn(!isSoundOn());
    renderSoundToggle();
  },
  undo: () => commit({ type: "undo" }),
  "offer-draw": async () => {
    const offerer = match.game.currentPlayer;
    const accepted = await confirm({
      eyebrow: "Draw offer",
      title: `${match.players[offerer].name} offers a draw`,
      body: `Hand the device to ${match.players[1 - offerer].name}. Accepting ends the match as a draw.`,
      confirmLabel: "Accept draw",
      cancelLabel: "Decline",
    });
    if (accepted) await commit({ type: "agree-draw" });
  },
  restart: async () => {
    if (busy) return;
    const choice = await askRestart();
    if (choice === "again") startMatch(match.players.map((p) => p.name), Math.floor(Math.random() * 2));
    else if (choice === "new-players") newPlayers();
  },
};

document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-action]");
  if (trigger && !trigger.disabled && !trigger.closest("dialog")) actions[trigger.dataset.action]?.();
});

hydrateIcons();
renderSoundToggle();
renderLegend(document.getElementById("legend-list"));
setInterval(() => match && renderClock(match), 1000);

const saved = storage.get(MATCH_KEY);
if (isValidMatch(saved)) {
  match = saved;
  renderAll();
} else {
  // Render a fresh board behind the name dialog so the page isn't empty.
  match = createMatch(savedNames() ?? ["South", "North"]);
  renderAll();
  newPlayers();
}
