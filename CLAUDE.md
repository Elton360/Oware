# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oware is a browser implementation of the traditional African board game (2-3 capture variant), built as a static site with plain HTML/CSS/JS — no build step, no bundler, no framework. See README.md for the game rules link and live demo location (eltonlucien.com/oware/index.html).

## Commands

There is no build, dev-server, or test setup — this is a static site.

- **Run locally**: open `index.html` directly in a browser, or serve the directory with any static file server.
- **Lint**: `npx eslint .` (uses the flat config in `eslint.config.mjs`, which applies `@eslint/js` recommended rules with browser globals).
- There are no automated tests in this repo.

## Architecture

The entire game lives in `script.js` (no modules/imports — loaded via a single `<script>` tag, runs in the global scope).

**Board model**: the 12 holes are represented as a single flat array, `positions`, built each move from `[...player_1.holes, ...player_2.holes]`. Indices 0–5 belong to player 1, indices 6–11 to player 2. Sowing moves counter-clockwise around this circular array (index 11 wraps to 0).

**Rendering vs. state are decoupled**: `positions`/`player_1.holes`/`player_2.holes` hold the authoritative game state, while `hole1`/`hole2` (`.holes-1`/`.holes-2` DOM elements) are rendered separately. `updateGameBoard()` walks the sown range and animates each affected hole's image via `setTimeout`-staggered DOM updates — it assumes moves span at most two laps around the 12-hole board (its index math branches on ranges up to 23), so seed counts high enough to lap more than that will not render correctly.

**Turn flow** (`holeIm()` in script.js): a click on a hole's `.play` label reads `pos` from the element's class name, computes `moveOver` (seed count) from `positions[pos]`, distributes seeds, then calls `capture()` on the landing hole before handing off to `updateGameBoard()` for animation and flipping `activePlayer`.

**Capture logic** (`capture()`): triggered when the last-sown hole lands in *opponent* territory with 2 or 3 seeds; it then walks backward through consecutive 2-or-3 holes, zeroing them and adding to the capturing player's score. Note the confusing `player` parameter convention here — by the time `capture()` is called, `activePlayer` has already been flipped for the *next* turn, so `player` in this function refers to the player who just moved.

**Menu/modal system**: `.home`, `.restart`, `.help` icons all funnel through `handleMenuOptionModal()`, which swaps in one of the `rulesHtml` / `homeHtml` / `restartHtml` template strings (defined at the bottom of script.js) into `.modal-content`. Home/restart both just reload the page (`window.location.reload()`) — there is no in-place reset path.

**Hole images**: `images/holes-pink/pink-N.png` and `images/holes-white/white-N.png` are pre-rendered sprites for N seeds (0–24+); the game swaps `<img src>` rather than drawing seed counts dynamically.

Known gap (per commit history and README): the codebase has not had a full refactor; state (`player_1`/`player_2`/`positions`) and DOM manipulation are tightly interleaved throughout `script.js` rather than separated into distinct layers.
