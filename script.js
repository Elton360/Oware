//Selectors//////////////////////////////////
const mainBG = document.querySelector("main");
const overlay = document.querySelector(".overlay");
const begin = document.querySelector(".begin");
const game = document.querySelector(".game");
const hole1 = document.querySelector(".holes-1");
let hole2 = document.querySelector(".holes-2");
const restart = document.querySelector(".restart");
const home = document.querySelector(".home");

//Player 1 (Pink)
const holes1 = [4, 4, 4, 4, 4, 4];

//Player 2 (White)
const holes2 = [4, 4, 4, 4, 4, 4];

//This function displays the holes based on the holes arrays for each player

const displayHoles = function (player1Arr, player2Arr) {
  hole1.innerHTML = hole2.innerHTML = "";

  player1Arr.forEach((dots, i) => {
    const html = `
    <div class = "playImg playImg2 playOrig">
      <div class = "playPass no-opacity">
        <h1 class = "play">Play</h1>
        <h1 class = "drop">Drop</h1>
      </div>
      <div class ="hole">
        <img class = "hole-img pink-hole"  src="./images/holes-pink/pink-${dots}.png" alt="">
      </div>
    </div>`;
    hole1.insertAdjacentHTML("afterbegin", html);
  });

  player2Arr.forEach((dots, i) => {
    const html = `
    <div class = "playImg playImg1">
      <div class = "playPass no-opacity">
        <h1 class = "play">Play</h1>
        <h1 class = "drop">Drop</h1>
      </div>
      <div class ="hole ">
        <img class = "hole-img white-hole"  src="./images/holes-white/white-${dots}.png" alt="">
      </div>
    </div>`;
    hole2.insertAdjacentHTML("afterbegin", html);
  });

  holeImg = document.querySelectorAll(".hole-img");
};

//Starting Conditions
displayHoles([1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1]);

//Display Lets Play throbbing
let scale = 1.1;
const throb = setInterval(function () {
  begin.style.transform = `scale(${scale})`;
  if (scale > 1) scale = 1;
  else scale = 1.1;
}, 800);

//Start Play///////////////////////////////////

//Remove Overlay
begin.addEventListener("click", function (e) {
  e.preventDefault();
  clearInterval(throb);
  begin.style.display = "none";
  overlay.style.display = "none";
  restart.style.opacity = "1";
  home.style.opacity = "1";
  displayHoles(holes1, holes2);

  holeImg.forEach((img, i) => {
    img.addEventListener("click", (e) => {
      console.log(img.parentElement.previousSibling.previousSibling);
      img.parentElement.previousSibling.previousSibling.style.opacity = "1";
    });
  });
});
