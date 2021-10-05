//Selectors//////////////////////////////////
const mainBG = document.querySelector("main");
const overlay = document.querySelector(".overlay");
const begin = document.querySelector(".begin");
const game = document.querySelector(".game");
const hole1 = document.querySelector(".hole-1");
const hole2 = document.querySelector(".hole-2");

//Player 1 (Pink)
const holes1 = [4, 4, 4, 4, 4, 4];

//Player 2 (White)
const holes2 = [4, 4, 4, 4, 4, 4];

//Starting Conditions
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
});
