//Selectors//////////////////////////////////
const mainBG = document.querySelector("main");
const overlay = document.querySelector(".overlay");
const modal = document.querySelector(".modal");
const closeModal = document.querySelector(".close-modal");
const modalContent = document.querySelector(".modal-content");
const begin = document.querySelector(".begin");
const game = document.querySelector(".game");
const hole1 = document.querySelector(".holes-1");
const hole2 = document.querySelector(".holes-2");
const restart = document.querySelector(".restart");
const home = document.querySelector(".home");
const help = document.querySelector(".help");
const settings = document.querySelector(".settings");
const menuOptions = [restart, home, help, settings];

let holeImg;
let homeConf;
let throb;
let gameStarted;
let holes1;
let holes2;
let positions;
let rulesHtml;
let settingsHtml;
let homeHtml;
let restartHtml;

//Pre-Starting Conditions Setter
const starter = function () {
  gameStarted = false;
  holes1 = holes2 = [0, 0, 0, 0, 0, 0];
  modal.classList.add("no-display");
  begin.style.display = "flex";
  restart.style.opacity = "0.1";
  home.style.opacity = "0.1";
  displayHoles(holes1, holes2);

  //Display Lets Play throbbing
  let scale = 1.1;
  throb = setInterval(function () {
    begin.style.transform = `scale(${scale})`;
    if (scale > 1) scale = 1;
    else scale = 1.1;
  }, 800);

  //Add Menu options
  menuOptions.forEach((opt) => {
    opt.addEventListener("click", modalFunc);
  });

  closeModal.addEventListener("click", (e) => {
    if (gameStarted) {
      overlay.style.display = "none";
      modal.classList.add("no-display");
    } else modal.classList.add("no-display");
  });
};

//Now Playing
const startPlay = function () {
  begin.addEventListener("click", function (e) {
    e.preventDefault();
    gameStarted = true;
    clearInterval(throb);
    begin.style.display = "none";
    overlay.style.display = "none";
    restart.style.opacity = "1";
    home.style.opacity = "1";
    holes1 = holes2 = [4, 4, 4, 4, 4, 4];
    displayHoles(holes1, holes2);
  });
};

//this function displays a modal and adds appropriate html for each menu option
const modalFunc = function (e) {
  e.preventDefault();

  //displaying/hiding modal
  modal.classList.remove("no-display");
  overlay.style.display = "flex";
  overlay.addEventListener("click", (e) => {
    if (gameStarted) overlay.style.display = "none";
    modal.classList.add("no-display");
  });

  if (e.target.parentElement.classList.contains("help")) {
    modalContent.innerHTML = rulesHtml;
  } else if (e.target.parentElement.classList.contains("home")) {
    modalContent.innerHTML = homeHtml;
    homeConf = document.querySelector(".home-conf");
  } else if (e.target.parentElement.classList.contains("restart")) {
    modalContent.innerHTML = restartHtml;
    homeConf = document.querySelector(".home-conf");
  }

  //player confirms they want to return home
  homeConf.addEventListener("click", () => {
    starter();
  });
};

//This function displays the holes based on the holes arrays for each player
const displayHoles = function (player1Arr, player2Arr) {
  hole1.innerHTML = hole2.innerHTML = "";

  player1Arr.forEach((dots, i) => {
    const html = `
    <div class = "playImg playImg2 playOrig">
      <div class = "playPass no-opacity">
        <h1 class = "play ${i}">Play</h1>
        <h1 class = "drop">Drop</h1>
      </div>
      <div class ="hole hole-img">
        <img class = " pink-hole"  src="./images/holes-pink/pink-${dots}.png" alt="">
      </div>
    </div>`;
    hole1.insertAdjacentHTML("afterbegin", html);
  });

  player2Arr.forEach((dots, i) => {
    const html = `
    <div class = "playImg playImg1">
      <div class = "playPass no-opacity">
        <h1 class = "play ${11 - i}">Play</h1>
        <h1 class = "drop">Drop</h1>
      </div>
      <div class ="hole hole-img">
        <img class = " white-hole"  src="./images/holes-white/white-${
          player2Arr[5 - i]
        }.png" alt="">
      </div>
    </div>`;
    hole2.insertAdjacentHTML("afterbegin", html);
  });

  holeImg = document.querySelectorAll(".hole-img");
  imgClick();
};

const imgClick = function () {
  holeImg.forEach((img, i) => {
    img.addEventListener("click", (e) => {
      positions = [...holes1, ...holes2];
      img.parentElement.firstChild.nextSibling.style.opacity = "1";
    });
  });
  holeIm();
};

const holeIm = function () {
  holeImg.forEach((img, i) => {
    positions = [...holes1, ...holes2];
    img.parentElement.firstChild.nextSibling.addEventListener(
      "click",
      function (e) {
        let pos = parseInt(e.target.classList[1]);
        if (e.target.classList.contains("play")) {
          for (let i = pos; i < positions[pos] + pos; i++) {
            if (i >= 11) positions[i - 11]++;
            else positions[i + 1]++;
          }
          positions[pos] = 0;
        }
        holes1 = positions.splice(0, 6);
        holes2 = positions.splice(0, 11);
        displayHoles(holes1, holes2);
      }
    );
  });
};

starter();
startPlay();

rulesHtml = `
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

 <h3>Fair Play Mode</h3>
 <p>
   Fair Play mode can be turned on in the settings before a game starts. Its is an exception disallowing capture 
   of all an opponent's seeds and requires that one ought to make a move that allows the opponent to continue playing. 
   If an opponent's pits are all empty, the current player must make a move that gives the opponent seeds. 
   If no such move is possible, the current player captures all seeds in their own territory, ending the board game.
 </p>

 <h3>End of the game</h3>
 <p>
   If a player captures 25 seeds, that player automatically wins. The game ends also when after a move of a player, 
   the opponent has no seeds left to sow. The player that moved last, will get all seeds in his own pits added to his score. 
   If an endless cycle of moves occurs, Each player gets the seeds, which are in his holes."
 </p>

`;
settingsHtml;
homeHtml = `
<h1>Are you sure you want to return to the home page?</h1>
<h2>
   This action will end any current game. 
</h2>
<br>
<button class="home-conf"><h1>Go Home!</h1></button>
`;
restartHtml = `
<h1>Are you sure you want to restart the game?</h1>
<h2>
   This action will end any current game, and a player will be randomly selected to restart. 
</h2>
<br>
<button class="home-conf"><h1>Restart</h1></button>
`;
