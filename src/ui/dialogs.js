import { WINNING_SCORE } from "../engine.js";
import { SIDE_NAMES } from "../match.js";
import { icons } from "./icons.js";
import { escapeHtml } from "./dom.js";

const dialog = document.getElementById("dialog");

// Shows `html` (which must contain a <form method="dialog">) and resolves with
// the submitting button's value, or the result of onSubmit when given.
const present = (html, { dismissible = true, onSubmit } = {}) =>
  new Promise((resolve) => {
    if (dialog.open) dialog.close();
    dialog.innerHTML = html;
    dialog.returnValue = "";
    let result;

    const onCancel = (e) => {
      if (!dismissible) e.preventDefault();
    };
    const onBackdrop = (e) => {
      if (dismissible && e.target === dialog) dialog.close();
    };
    const form = dialog.querySelector("form");
    form.addEventListener("submit", (e) => {
      if (onSubmit && e.submitter?.value !== "close") result = onSubmit(new FormData(form), e.submitter?.value);
    });
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("click", onBackdrop);
    dialog.addEventListener(
      "close",
      () => {
        dialog.removeEventListener("cancel", onCancel);
        dialog.removeEventListener("click", onBackdrop);
        resolve(result ?? dialog.returnValue);
      },
      { once: true }
    );
    dialog.showModal();
  });

const closeButton = `<button class="dialog-close round-btn" value="close" formnovalidate aria-label="Close">${icons.close}</button>`;

export const askNames = (defaults = ["", ""]) =>
  present(
    `<form method="dialog" class="dialog-body">
      <p class="micro micro--accent">New match</p>
      <h2>Who's playing?</h2>
      <p class="muted">Share this device and pass it across the board between turns. South plays the bottom row (1–6), North the top row (A–F).</p>
      <label class="field"><span>South · bottom row</span>
        <input name="south" required maxlength="20" autocomplete="off" placeholder="Player 1" value="${escapeHtml(defaults[0])}" />
      </label>
      <label class="field"><span>North · top row</span>
        <input name="north" required maxlength="20" autocomplete="off" placeholder="Player 2" value="${escapeHtml(defaults[1])}" />
      </label>
      <fieldset class="segmented">
        <legend>Who sows first?</legend>
        <label><input type="radio" name="starter" value="random" checked /><span>Random</span></label>
        <label><input type="radio" name="starter" value="0" /><span>South</span></label>
        <label><input type="radio" name="starter" value="1" /><span>North</span></label>
      </fieldset>
      <button class="cta" value="start">Start match</button>
    </form>`,
    {
      dismissible: false,
      onSubmit: (data) => {
        const starter = data.get("starter");
        return {
          names: [data.get("south").trim() || "South", data.get("north").trim() || "North"],
          startingPlayer: starter === "random" ? Math.floor(Math.random() * 2) : Number(starter),
        };
      },
    }
  );

export const showRules = () =>
  present(`<form method="dialog" class="dialog-body dialog-body--wide">
    ${closeButton}
    <p class="micro micro--accent">Rules &amp; Guide</p>
    <h2>How to play Oware</h2>
    <h3>Goal</h3>
    <p>There are 48 seeds. Capture ${WINNING_SCORE} or more to win. If both players finish with 24, the match is a draw.</p>
    <h3>Sowing</h3>
    <p>On your turn, pick up every seed from one of your six pits and drop them one at a time into the following pits, counter-clockwise. If a pit holds 12 or more seeds, the lap skips the pit you started from.</p>
    <h3>Capturing</h3>
    <p>If your last seed lands in an opponent's pit and brings it to exactly 2 or 3, you capture those seeds. Then check the pit before it: if it's also an opponent's pit holding 2 or 3, capture it too, and keep going backwards until the chain breaks.</p>
    <h3>End of the match</h3>
    <p>The match ends as soon as someone reaches ${WINNING_SCORE}. It also ends if your move leaves your opponent with no seeds at all: you then collect every seed left on your side. Players can agree a draw at any time, for example when the same moves start repeating.</p>
    <h3>On this device</h3>
    <p>Tap a pit on your side to sow it. Each player can take back up to two of their own moves.</p>
  </form>`);

export const confirm = ({ eyebrow = "", title, body, confirmLabel, cancelLabel = "Cancel" }) =>
  present(`<form method="dialog" class="dialog-body">
    ${eyebrow ? `<p class="micro micro--accent">${escapeHtml(eyebrow)}</p>` : ""}
    <h2>${escapeHtml(title)}</h2>
    <p class="muted">${escapeHtml(body)}</p>
    <div class="dialog-actions">
      <button class="ghost ghost--boxed" value="no">${escapeHtml(cancelLabel)}</button>
      <button class="cta" value="yes">${escapeHtml(confirmLabel)}</button>
    </div>
  </form>`).then((value) => value === "yes");

export const askRestart = () =>
  present(`<form method="dialog" class="dialog-body">
    ${closeButton}
    <p class="micro micro--accent">New match</p>
    <h2>Start a new match?</h2>
    <p class="muted">The current match will end and its progress will be lost.</p>
    <div class="dialog-actions">
      <button class="ghost ghost--boxed" value="new-players">New players</button>
      <button class="cta" value="again">Same players</button>
    </div>
  </form>`);

export const showGameOver = (match) => {
  const { game, players, endReason } = match;
  const [south, north] = game.scores;
  let title;
  let body;
  if (game.status === "draw") {
    title = "It's a draw";
    body = endReason === "agreement" ? "Both players agreed to share the harvest." : "The seeds are split evenly.";
  } else {
    title = `${players[game.winner].name} wins!`;
    body = `Playing ${SIDE_NAMES[game.winner]}, ${players[game.winner].name} captured ${game.scores[game.winner]} seeds.`;
  }
  return present(`<form method="dialog" class="dialog-body dialog-body--center">
    ${closeButton}
    <p class="micro micro--accent">Match complete</p>
    <h2>${escapeHtml(title)}</h2>
    <p class="final-score tabular">
      <span><small>${escapeHtml(players[0].name)}</small>${south}</span>
      <span class="muted">–</span>
      <span><small>${escapeHtml(players[1].name)}</small>${north}</span>
    </p>
    <p class="muted">${escapeHtml(body)}</p>
    <div class="dialog-actions">
      <button class="ghost ghost--boxed" value="new-players">New players</button>
      <button class="cta" value="again">Play again</button>
    </div>
  </form>`);
};
