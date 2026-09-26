"use strict";

import { createInitialState, applyMove, getLegalMoves } from "./src/engine.js";
import { createHoleSVG } from "./src/renderHole.js";

const selectRandomPlayer = () => Math.floor(Math.random() * 2);

const setMenuOptionsVisibility = function (options, visibility) {
  const opacity = visibility === "visible" ? "1" : "0";

  options.forEach((menuOption) => {
    menuOption.style.opacity = opacity;
    menuOption.style.visibility = visibility;
  });
};

const timer = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//Selectors//////////////////////////////////
const overlay = document.querySelector(".overlay");
const modal = document.querySelector(".modal");
const closeModal = document.querySelector(".close-modal");
const modalContent = document.querySelector(".modal-content");
const game = document.querySelector(".game");
const hole1 = document.querySelector(".holes-1");
const hole2 = document.querySelector(".holes-2");
const restart = document.querySelector(".restart");
const home = document.querySelector(".home");
const help = document.querySelector(".help");
// const settings = document.querySelector(".settings");
const score1Box = document.querySelector(".score-1");
const score2Box = document.querySelector(".score-2");
const scores = document.querySelector(".scores");
const win = document.querySelector(".winner");
const main = document.querySelector("main");
const menuOptions = [restart, home, help /*settings*/];

let gameState = null;
let gameStarted = false;
// holeElements[flatIndex] -> the ".hole-img" element for that board position
let holeElements = [];
let highlightedHole = null;

const displayLetsPlayButton = () => {
  const beginButton = document.querySelector(".begin");

  let scale = 1.1;
  const throb = setInterval(function () {
    beginButton.style.transform = `scale(${scale})`;
    if (scale > 1) scale = 1;
    else scale = 1.1;
  }, 800);

  beginButton.addEventListener("click", function (e) {
    e.preventDefault();
    gameStarted = true;
    gameState = createInitialState(selectRandomPlayer());
    setCurrentPlayer(gameState.currentPlayer);
    clearInterval(throb);
    beginButton.style.display = "none";
    overlay.style.display = "none";
    setMenuOptionsVisibility([restart, home], "visible");
    createNewGameBoard();
  });
};

//Pre-Starting Conditions Setter
const startNewGame = function () {
  gameStarted = false;
  modal.classList.add("no-display");
  setMenuOptionsVisibility([restart, home, win], "hidden");
  setMenuOptionsVisibility([hole1, hole2], "visible");

  displayLetsPlayButton();

  //Add Menu options
  menuOptions.forEach((option) => {
    option.addEventListener("click", () => handleMenuOptionModal(option));
  });

  closeModal.addEventListener("click", () => {
    if (gameStarted) {
      overlay.style.display = "none";
      modal.classList.add("no-display");
    } else modal.classList.add("no-display");
  });

  attachBoardListeners();
};

//this function displays a modal and adds appropriate html for each menu option
const handleMenuOptionModal = function (option) {
  //displaying/hiding modal
  modal.classList.remove("no-display");
  overlay.style.display = "flex";

  if (option === help) {
    modalContent.innerHTML = rulesHtml;
  } else if (option === home || option === restart) {
    if (option === home) modalContent.innerHTML = homeHtml;
    else modalContent.innerHTML = restartHtml;
    const homeConf = document.querySelector(".home-conf");

    homeConf.addEventListener("click", () => {
      window.location.reload();
    });
  }
};

//Scale current Player
const setCurrentPlayer = (player) => {
  const playerSettings = [
    { hole: hole1, scoreBox: score1Box },
    { hole: hole2, scoreBox: score2Box },
  ];

  playerSettings.forEach(({ hole, scoreBox }, index) => {
    hole.style.transform = player === index ? "scale(1.05)" : "scale(1)";
    scoreBox.style.transform = player === index ? "scale(1.2)" : "scale(1)";
  });
};

//This function displays the holes based on the holes arrays for each player
const createNewGameBoard = () => {
  const increment = 150;
  hole1.innerHTML = "";
  hole2.innerHTML = "";
  let sum = 700;

  const playerData = [
    { player: 1, hole: hole1, className: "playImg2" },
    { player: 2, hole: hole2, className: "playImg1" },
  ];

  playerData.forEach(({ player, hole, className }) => {
    Array.from({ length: 6 }).forEach((_, i) => {
      const index = player === 1 ? i : 11 - i;
      const html = `
        <div class="playImg ${className}">
          <div class="playPass no-opacity">
            <h1 class="play ${index}">Play</h1>
            <h1 class="drop">Drop</h1>
          </div>
          <div class="hole hole-img" data-hole="${index}">${createHoleSVG(4)}</div>
        </div>`;

      setTimeout(() => {
        hole.insertAdjacentHTML("afterbegin", html);
      }, sum);

      sum += increment;
    });
  });

  setTimeout(() => {
    holeElements = [];
    document.querySelectorAll(".hole-img").forEach((el) => {
      holeElements[Number(el.dataset.hole)] = el;
    });
  }, sum);
};

// Toggles the "Play"/"Drop" label and the highlight scale for one hole.
const setHoleHighlighted = (flatIndex, isHighlighted) => {
  const holeEl = holeElements[flatIndex];
  if (!holeEl) return;
  const playPass = holeEl.closest(".playImg").querySelector(".playPass");
  playPass.classList.toggle("opacity", isHighlighted);
  playPass.style.visibility = isHighlighted ? "visible" : "hidden";
  holeEl.style.transform = `scale(${isHighlighted ? 1.2 : 1})`;
};

// Only the active player's non-empty holes may ever be highlighted; this
// mirrors (and is driven by) the engine's own legality check, so a stale
// highlight can never cause an illegal move to go through.
const setHighlight = (flatIndex) => {
  if (highlightedHole !== null) setHoleHighlighted(highlightedHole, false);
  const isLegal =
    flatIndex !== null && gameState && getLegalMoves(gameState).includes(flatIndex);
  highlightedHole = isLegal ? flatIndex : null;
  if (isLegal) setHoleHighlighted(flatIndex, true);
};

const renderHole = (flatIndex) => {
  holeElements[flatIndex].innerHTML = createHoleSVG(gameState.board[flatIndex]);
};

// Listeners are attached exactly once, here, and never re-attached on later
// moves (unlike the old per-move addEventListener calls, which leaked).
const attachBoardListeners = () => {
  game.addEventListener("click", (e) => {
    if (!gameStarted) return;
    const label = e.target.closest(".play");
    if (!label) return;
    handleMoveClick(parseInt(label.classList[1], 10));
  });

  main.addEventListener("click", (e) => {
    if (!gameStarted) return;
    const holeEl = e.target.closest(".hole-img");
    setHighlight(holeEl ? Number(holeEl.dataset.hole) : null);
  });
};

const handleMoveClick = (holeIndex) => {
  const result = applyMove(gameState, holeIndex);
  if (!result.ok) return;

  setHighlight(null);
  gameState = result.state;
  setCurrentPlayer(gameState.currentPlayer);
  render(result.move);
};

const render = async (move) => {
  renderHole(move.holeIndex); // origin hole is now empty
  for (const flatIndex of move.sowPath) {
    renderHole(flatIndex);
    await timer(200);
  }

  move.capturedHoles.forEach(renderHole);
  if (move.starvationSweep) move.starvationSweep.holes.forEach(renderHole);

  score1Box.innerHTML = `<h1>${gameState.scores[0]}</h1>`;
  score2Box.innerHTML = `<h1>${gameState.scores[1]}</h1>`;

  if (gameState.status === "won") showEndOfGame("won", gameState.winner);
  else if (gameState.status === "draw") showEndOfGame("draw", null);
};

//handles the end-of-game overlay for both a win and a draw
const showEndOfGame = function (status, winnerPlayer) {
  overlay.style.display = "flex";
  scores.style.zIndex = "4";
  game.style.zIndex = "4";
  win.style.opacity = "1";
  win.style.visibility = "visible";
  win.classList.remove("winner-1", "draw");

  if (status === "draw") {
    win.innerHTML = "<h1>DRAW!</h1>";
    win.classList.add("draw");
    return;
  }

  win.innerHTML = "<h1>WINNER!</h1>";
  const wonHoles = winnerPlayer === 0 ? hole1 : hole2;
  const lostHoles = winnerPlayer === 0 ? hole2 : hole1;
  const scoreBoxWon = winnerPlayer === 0 ? score1Box : score2Box;
  const scoreBoxLost = winnerPlayer === 0 ? score2Box : score1Box;

  wonHoles.style.transform = "scale(1.2)";
  scoreBoxWon.style.transform = "scale(1.2)";
  scoreBoxLost.style.transform = "scale(1)";
  setMenuOptionsVisibility([lostHoles], "hidden");
  if (winnerPlayer === 1) win.classList.add("winner-1");
};

startNewGame();

const rulesHtml = `
<h1>How to Play?</h1>
 <h3>Intro</h3>
 <p>
   Oware is a Mancala variant of a sowing game.
   The object of the board game is to capture more seeds than one's opponent.
   Since the game has only 48 seeds, capturing 25 is sufficient to accomplish this.
   Since there is an even number of seeds,
   it is possible for the game to end in a draw, where each player has captured 24.
 </p>

 <h3>Sowing/Moving</h3>
 <p>
   Players take turns moving the seeds. On a turn, a player chooses one of the six pits under their control.
   The player removes all seeds from this pit, and distributes them in each pit counter-clockwise
   from this house, in a process called sowing.
 </p>

 <h3>Capturing</h3>
 <p>
   After a turn, if the last seed was placed into an opponent's pit that brought its total to two or three,
   all the seeds in that house are captured
   and placed in the player's scoring pit. If the previous to last seed also
   brought an opponent's pit to two or three, these are captured as well, and so on.
   In Fair-Play mode, a move that would allow a player to collect all of an opponent's seed
   (paralyzing them from moving/immidiately winning) is not allowed (Modes can be selected in the settings).
 </p>

 <!--<h3>Fair Play Mode</h3>
 <p>
   Fair Play mode can be turned on in the settings before a game starts. Its is an exception disallowing capture
   of all an opponent's seeds and requires that one ought to make a move that allows the opponent to continue playing.
   If an opponent's pits are all empty, the current player must make a move that gives the opponent seeds.
   If no such move is possible, the current player captures all seeds in their own territory, ending the board game.
 </p>-->

 <h3>End of the game</h3>
 <p>
   If a player captures 25 seeds, that player automatically wins. The game ends also when after a move of a player,
   the opponent has no seeds left to sow. The player that moved last, will get all seeds in his own pits added to his score.
   If an endless cycle of moves occurs, Each player gets the seeds, which are in his holes."
 </p>

`;

const homeHtml = `
<h1>Are you sure you want to return to the home page?</h1>
<h2>
   This action will end any current game.
</h2>
<br>
<button class="home-conf"><h1>Go Home!</h1></button>
`;
const restartHtml = `
<h1>Are you sure you want to restart the game?</h1>
<h2>
   This action will end any current game, and a player will be randomly selected to restart.
</h2>
<br>
<button class="home-conf"><h1>Restart</h1></button>
`;
