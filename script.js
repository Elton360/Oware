"use strict";
const selectRandomPlayer = () => Math.floor(Math.random() * (1 - 0 + 1) + 0);

const setMenuOptionsVisibility = function (options, visibility) {
  const opacity = visibility === "visible" ? "1" : "0";

  options.forEach((menuOption) => {
    menuOption.style.opacity = opacity;
    menuOption.style.visibility = visibility;
  });
};

const defaultHole = [4, 4, 4, 4, 4, 4];

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
const main = document.getElementsByTagName("main");
const menuOptions = [restart, home, help /*settings*/];

const player_1 = {
  holes: [...defaultHole],
  score: 0,
};

const player_2 = {
  holes: [...defaultHole],
  score: 0,
};

let activePlayer;
let board;
let gameStarted = false;
let positions;

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
    activePlayer = selectRandomPlayer();
    setCurrentPlayer(activePlayer);
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
    { player: 1, hole: hole1, color: "pink", className: "playImg2" },
    { player: 2, hole: hole2, color: "white", className: "playImg1" },
  ];

  playerData.forEach(({ player, hole, color, className }) => {
    Array.from({ length: 6 }).forEach((_, i) => {
      const index = player === 1 ? i : 11 - i;
      const html = `
        <div class="playImg ${className}">
          <div class="playPass no-opacity">
            <h1 class="play ${index}">Play</h1>
            <h1 class="drop">Drop</h1>
          </div>
          <div class="hole hole-img">
            <img class="${color}-hole" src="./images/holes-${color}/${color}-4.png" alt="hole">
          </div>
        </div>`;

      setTimeout(() => {
        hole.insertAdjacentHTML("afterbegin", html);
      }, sum);

      sum += increment;
    });
  });

  setTimeout(() => {
    board = document.querySelectorAll(".hole-img");
    addEventListenersToHoles();
  }, sum);
};

const updateGameBoard = function (player1Arr, player2Arr, moveOver, position) {
  const timer = (ms) => new Promise((res) => setTimeout(res, ms));
  async function load() {
    for (let i = position; i <= position + moveOver; i++) {
      if (i < 6 || (i > 11 && i < 18)) {
        hole1.children[
          i > 11 ? 5 - (i - 12) : 5 - i
        ].children[1].children[0].src = `./images/holes-pink/pink-${
          player1Arr[i > 11 ? i - 12 : i]
        }.png`;
      } else if ((i > 5 && i < 12) || i > 17) {
        hole2.children[
          i > 17 ? i - 18 : i - 6
        ].children[1].children[0].src = `./images/holes-white/white-${
          player2Arr[i > 17 ? i - 18 : i - 6]
        }.png`;
      }

      await timer(200);
    }
  }

  load();

  holeIm();
};

//ONLY current player's holes are active
const playerBlock = function (img, opacity, visibility, scale) {
  opacity === 1
    ? img.parentElement.firstChild.nextSibling.classList.add("opacity")
    : img.parentElement.firstChild.nextSibling.classList.remove("opacity");
  img.parentElement.firstChild.nextSibling.style.visibility = visibility;
  img.style.transform = `scale(${scale})`;
};

const addEventListenersToHoles = function () {
  board.forEach((hole, i) => {
    hole.addEventListener("click", (e) => {
      if (
        (activePlayer === 0 && i < 6 && positions[Math.abs(i - 5)] != 0) ||
        (activePlayer === 1 && i > 5 && positions[i] != 0)
      ) {
        playerBlock(hole, 1, "visible", "1.2");
        main[0].addEventListener("click", (mainE) => {
          if (mainE != e) {
            playerBlock(hole, 0, "hidden", "1");
          } else {
            playerBlock(hole, 1, "visible", "1.2");
          }
        });
      }
    });
  });
  holeIm();
};

//handles winners
const winner = function (
  player,
  wonHoles,
  scoreBoxWon,
  scoreBoxLost,
  lostHoles
) {
  overlay.style.display = "flex";
  scores.style.zIndex = "4";
  game.style.zIndex = "4";
  setMenuOptionsVisibility(win, "visible");
  wonHoles.style.transform = "scale(1.2)";
  scoreBoxWon.style.transform = "scale(1.2)";
  scoreBoxLost.style.transform = "scale(1)";
  setMenuOptionsVisibility(lostHoles, "hidden");
  if (player === 1) win.classList.add("winner-1");
};

//handles captures
const capture = function (player, posArr, lastPos) {
  if (
    (posArr[lastPos] === 2 || posArr[lastPos] === 3) &&
    ((player === 0 && lastPos < 6) || (player === 1 && lastPos > 5))
  ) {
    //player 0 and player 1 have switched due to the currentplayer call in holeIm()
    const helper = function (scoreBox, holes, stopper) {
      while (
        posArr[lastPos] === 3 ||
        (posArr[lastPos] === 2 && lastPos != stopper)
      ) {
        const playerScore =
          holes === 1
            ? (player_1.score += posArr[lastPos])
            : (player_2.score += posArr[lastPos]);
        if (playerScore > 24) {
          if (player === 1) winner(player, hole1, score1Box, score2Box, hole2);
          if (player === 0) winner(player, hole2, score2Box, score1Box, hole1);
        }
        scoreBox.innerHTML = `<h1>${playerScore}</h1>`;
        holes === 1
          ? (player_2.holes[lastPos - 6] = 0)
          : (player_1.holes[lastPos] = 0);
        lastPos--;
      }
    };

    if (player === 1) helper(score1Box, 1, 5);
    else helper(score2Box, 2, -1);
  }
};

const holeIm = function () {
  board.forEach((img) => {
    positions = [...player_1.holes, ...player_2.holes];
    img.parentElement.firstChild.nextSibling.children[0].addEventListener(
      "click",
      function (e) {
        if (activePlayer === 0) activePlayer = 1;
        else activePlayer = 0;
        setCurrentPlayer(activePlayer);

        let pos = parseInt(e.target.classList[1]);
        let moveOver = positions[pos];
        if (e.target.classList.contains("play")) {
          for (let i = pos; i < positions[pos] + pos; i++) {
            if (i >= 11) positions[i - 11]++;
            else positions[i + 1]++;
          }
          positions[pos] = 0;
        }
        player_1.holes = positions.slice(0, 6);
        player_2.holes = positions.slice(6, 12);
        playerBlock(img, 0, "hidden", "1");
        let endingHole =
          pos + moveOver > 11 ? pos + moveOver - 12 : pos + moveOver;
        capture(activePlayer, positions, endingHole);
        updateGameBoard(player_1.holes, player_2.holes, moveOver, pos);
        e.stopImmediatePropagation();
      }
    );
  });
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
