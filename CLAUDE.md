# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oware is a browser implementation of the traditional African board game (Abapa, 2-3 capture variant), built as a static site with plain HTML/CSS and native ES modules: no build step, no bundler, no framework. It is a local two-player (hot-seat) game designed for players sharing one device such as a tablet. See README.md for the rules video and live demo location (eltonlucien.com/oware/index.html).

## Commands

- **Run locally**: serve the directory with any static file server (e.g. `python3 -m http.server`). ES modules don't load over `file://`, so opening `index.html` directly won't work.
- **Test**: `npm test` (Vitest; covers the pure modules in `src/`).
- **Lint**: `npx eslint .` (flat config in `eslint.config.mjs`: `@eslint/js` recommended rules with browser globals).

## Architecture

Pure logic (tested, DOM-free) lives in `src/`; DOM code lives in `src/ui/`; `script.js` is the entry point that wires them together.

**Board model** (`src/engine.js`): one flat 12-element `board` array. Indices 0–5 are South (player 0), 6–11 North (player 1). Sowing runs counter-clockwise by increasing index and wraps 11 → 0. `applyMove(state, hole)` returns `{ ok, state, move }`, where `move` describes the `sowPath`, captures and any starvation sweep. Seeds are captured into scores only; there are no store pits in the sowing path.

**Notation**: `pitLabel()` in `src/match.js` maps South 0–5 → `1`–`6` and North 6–11 → `A`–`F`, so on screen the North row reads `F E D C B A` left to right.

**Match layer** (`src/match.js`): wraps the engine state with player names, per-player undo budgets, the move log, timing and seed identities. Every change goes through `dispatch(match, action)` (`move` / `undo` / `agree-draw` / `new-match`), which never mutates its input. For a move it also returns animation `steps`. This single entry point is where a future network opponent would plug in.

**Seed identities** (`src/seeds.js`): the engine only tracks counts, so this layer gives each of the 48 seeds a fixed colour and moves ids alongside each engine move, keeping colours physically consistent. `layoutSeed()` gives deterministic scattered positions per slot, so existing seeds never shift when others arrive. Tests assert the seed layer always mirrors board counts and scores.

**Rendering** (`src/ui/`): `board.js` builds the pits once and positions all 48 seed elements absolutely in one overlay layer, measured from the pits' live geometry and re-placed on resize. Moves animate by transitioning each seed's `transform` along `steps`. `panels.js`, `chrome.js` (status bar, log) and `dialogs.js` (native `<dialog>`) re-render from the match on every change. `script.js`'s `commit()` runs dispatch, then animate, then `renderAll()`, and locks input while animating.

**Persistence**: the match is saved to `localStorage` (`oware.match.v1`) after each change and restored on load if `isValidMatch()` passes; player names are remembered separately (`oware.names`). Undo history is capped at the total undo budget to keep the saved match small.
