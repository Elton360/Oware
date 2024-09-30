"use strict";

export const selectRandomPlayer = () =>
  Math.floor(Math.random() * (1 - 0 + 1) + 0);

export const setMenuOptionsVisibility = function (options, visibility) {
  const opacity = visibility === "visible" ? "1" : "0";

  options.forEach((menuOption) => {
    menuOption.style.opacity = opacity;
    menuOption.style.visibility = visibility;
  });
};

export const defaultHoleSetup = [4, 4, 4, 4, 4, 4];
