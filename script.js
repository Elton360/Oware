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
const score1Box = document.querySelector(".score-1");
const score2Box = document.querySelector(".score-2");
const main = document.getElementsByTagName('main');
const menuOptions = [restart, home, help, settings];

let activePlayer;
let holeImg;
let homeConf;
let gameStarted;
let throb;
let holes1;
let holes2;
let positions;
let score1 = 0;
let score2 = 0;

const setOpacity = function (selector, opacity, visibility) {
  selector.style.opacity = opacity;
  selector.style.visibility = visibility;
}

//Pre-Starting Conditions Setter
const starter = function () {
  gameStarted = false;
  modal.classList.add("no-display");
  begin.style.display = "flex";
  setOpacity(restart, '0', 'hidden');
  setOpacity(home, '0', 'hidden');

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

//Scale current Player 
const currentPlayer = function(player) {

  const helper = function (hole_1, scoreBox1, hole_2, scoreBox2) {
    hole_1.style.transform = 'scale(1.05)';
    scoreBox1.style.transform = 'scale(1.2)';
    hole_2.style.transform = 'scale(1)';
    scoreBox2.style.transform = 'scale(1)';
  }

  if (player === 0) {
    helper(hole1, score1Box, hole2, score2Box);
  }
  else {
    helper(hole2, score2Box, hole1, score1Box);
  }

}

//Now Playing
const startPlay = function () {
  begin.addEventListener("click", function (e) {
    e.preventDefault();
    gameStarted = true;
    activePlayer = Math.floor(Math.random() * (1 - 0 + 1) + 0);
    currentPlayer(activePlayer);
    clearInterval(throb);
    begin.style.display = "none";
    overlay.style.display = "none";
    setOpacity(restart, '1', 'visible');
    setOpacity(home, '1', 'visible');
    holes1 = holes2 = [4, 4, 4, 4, 4, 4];
    createHoles(holes1, holes2, 700, 150);
  });
};


//This function displays the holes based on the holes arrays for each player
const createHoles = function (player1Arr, player2Arr, initTime, increment) {
  hole1.innerHTML = hole2.innerHTML = "";

  const helper = function (playerArr, player, hole, color, className) {
    playerArr.forEach((numDots, i) => {
      let dots;
      player === 1 ? index = i : index = 11 - i;
      player === 1 ? dots = numDots : dots = playerArr[5 - i];
      const html = `
      <div class = "playImg ${className}">
        <div class = "playPass no-opacity">
          <h1 class = "play ${index}">Play</h1>
          <h1 class = "drop">Drop</h1>
        </div>
        <div class ="hole hole-img">
          <img class = " ${color}-hole"  src="./images/holes-${color}/${color}-${dots}.png" alt="hole">
        </div>
      </div>`;
  
      setTimeout(function() {
        hole.insertAdjacentHTML("afterbegin", html);
      }, sum)
  
      sum+=increment;
        
    });
  }
 
  let sum = initTime;
  helper(player1Arr, 1, hole1, 'pink', 'playImg2');
  helper(player2Arr, 2, hole2, 'white', 'playImg1');

  setTimeout(function() {
  holeImg = document.querySelectorAll(".hole-img");
  
    imgClick();
  }, initTime*4)
  
};


const createHoles2 = function (player1Arr, player2Arr, moveOver, position) {
  const timer = ms => new Promise(res => setTimeout(res, ms));
  async function load (arr) { 
    for (let i = position; i <= position+moveOver; i++) {
      if (i<6 || (i > 11 && i < 18)) {
        hole1.children[i>11?5-(i-12):5-i].children[1].children[0].src = `./images/holes-pink/pink-${arr[i>11?i-12:i]}.png`;
      }
      else if ((i > 5 && i < 12) || (i > 17)) {
        hole2.children[i>17?i-18:i-6].children[1].children[0].src = `./images/holes-white/white-${player2Arr[i>17?i-18:i-6]}.png`;
      }
      

      await timer(200); // then the created Promise can be awaited
    }
  }

  load(player1Arr);
  
  holeIm();
    
};

//ONLY current player's holes are active
const playerBlock = function (img,opacity,visibility,scale) {
  opacity === 1 ? img.parentElement.firstChild.nextSibling.classList.add('opacity'):
  img.parentElement.firstChild.nextSibling.classList.remove('opacity');
  img.parentElement.firstChild.nextSibling.style.visibility = visibility;
  img.style.transform=`scale(${scale})`;
}

const imgClick = function () {
  holeImg.forEach((img, i) => {

    img.addEventListener("click", (e) => {
      if (activePlayer === 0 && i <6 || activePlayer === 1 && i >5 ) {

        playerBlock(img, 1, 'visible', '1.2');
        main[0].addEventListener('click', (mainE)=> {
        if(mainE != e) {
          playerBlock(img, 0, 'hidden', '1');
        }
        else {
          playerBlock(img, 1, 'visible', '1.2');
        }
        
        });
      }   
    });
  });
  holeIm();
};


//handles captures
const capture = function (player, posArr, lastPos) {
  if ((posArr[lastPos] === 2 || posArr[lastPos] === 3) && ((player === 0 && lastPos < 6) || (player === 1 && lastPos >5))) {
    
    const helper = function (scoreBox, holes, stopper) {
      while (posArr[lastPos] === 3 || posArr[lastPos] === 2 && lastPos != stopper) {
        let playerScore = holes === 1 ? score1+=posArr[lastPos] : score2+=posArr[lastPos];
        scoreBox.innerHTML = `<h1>${playerScore}</h1>`;
        holes === 1 ? holes2[lastPos-6]=0 : holes1[lastPos]=0;
        console.log(holes1, holes2, holes)
        lastPos--;
      }
    }

    if (player === 1) 
      helper(score1Box, 1, 5);
    else 
      helper(score2Box, 2, -1);
  }
}

const holeIm = function () {
  
  holeImg.forEach((img, i) => {
    positions = [...holes1, ...holes2];
    img.parentElement.firstChild.nextSibling.children[0].addEventListener("click", function (e) { 

      if (activePlayer ===0) 
        activePlayer = 1;
      else 
        activePlayer = 0;
      currentPlayer(activePlayer);

      let pos = parseInt(e.target.classList[1]);
      let moveOver = positions[pos];
      if (e.target.classList.contains("play")) {
        for (let i = pos; i < positions[pos] + pos; i++) {
          if (i >= 11) positions[i - 11]++;
          else positions[i + 1]++;
        }
        positions[pos] = 0;
      }
      holes1 = positions.slice(0, 6);
      holes2 = positions.slice(6, 12);
      playerBlock(img, 0, 'hidden', '1');
      let endingHole = pos+moveOver > 11? pos+moveOver-12 : pos+moveOver;
      capture(activePlayer,positions,endingHole);
      createHoles2(holes1, holes2, moveOver, pos);
      e.stopImmediatePropagation();

    });
  });
};

starter();
startPlay();

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
const settingsHtml = '';
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
