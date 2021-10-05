//Selectors//////////////////////////////////
const mainBG = document.querySelector("main");
const overlay = document.querySelector(".overlay");
const begin = document.querySelector(".begin");
const game = document.querySelector(".game");
const hole1 = document.querySelector(".holes-1");
const hole2 = document.querySelector(".holes-2");
const holeImg = document.getElementsByClassName(".hole-img");

console.log(hole1);

//Player 1 (Pink)
const holes1 = [4, 4, 4, 4, 4, 4];

//Player 2 (White)
const holes2 = [4, 4, 4, 4, 4, 4];

//This function displays the holes based on the holes arrays for each player

const displayHoles = function (player1Arr, player2Arr) {
  hole1.innerHTML = hole2.innerHTML = "";

  player1Arr.forEach((dots, i) => {
    const html = `<img class = hole-img src="./images/holes-pink/pink-${dots}.png" alt="">`;
    hole1.insertAdjacentHTML("afterbegin", html);
  });

  player2Arr.forEach((dots, i) => {
    const html = `<img class = hole-img src="./images/holes-white/white-${dots}.png" alt="">`;
    hole2.insertAdjacentHTML("afterbegin", html);
  });
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
  overlay.style.opacity = "0";
  holeImg.style.margin = "1rem";
  displayHoles(holes1, holes2);
});
