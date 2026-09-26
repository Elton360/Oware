import { BOARD_SIZE, HOLES_PER_PLAYER, getLegalMoves } from "../engine.js";
import { pitLabel } from "../match.js";
import { colorOf, layoutSeed, layoutStoreSeed } from "../seeds.js";
import { playTok } from "./sound.js";
import { prefersReducedMotion, wait } from "./dom.js";

const isNorth = (hole) => hole >= HOLES_PER_PLAYER;

// Grid column (1-based, store occupies column 1) for each hole, so the North
// row reads F..A left to right and the South row 1..6.
const columnOf = (hole) => (isNorth(hole) ? BOARD_SIZE - hole : hole + 1) + 1;

export const createBoard = (root, { onPit }) => {
  const layer = root.querySelector(".seed-layer");
  const storeEls = [0, 1].map((p) => root.querySelector(`[data-store="${p}"]`));
  const storeCountEls = [0, 1].map((p) => root.querySelector(`#store-count-${p}`));
  const seedEls = new Map();
  const pitEls = [];
  const countEls = [];
  const labelEls = [];
  let current = null;
  let seedSize = 10;

  for (let hole = 0; hole < BOARD_SIZE; hole++) {
    const cell = document.createElement("div");
    cell.className = `pit-cell pit-cell--${isNorth(hole) ? "north" : "south"}`;
    cell.style.setProperty("--col", columnOf(hole));
    cell.innerHTML = `
      <span class="pit-label">${pitLabel(hole)}</span>
      <button class="pit" type="button" data-hole="${hole}">
        <span class="pit-count">0</span>
      </button>`;
    root.insertBefore(cell, layer);
    pitEls.push(cell.querySelector(".pit"));
    countEls.push(cell.querySelector(".pit-count"));
    labelEls.push(cell.querySelector(".pit-label"));
  }

  root.addEventListener("click", (e) => {
    const pit = e.target.closest(".pit");
    if (pit && !pit.disabled) onPit(Number(pit.dataset.hole));
  });

  const seedEl = (seedId) => {
    let el = seedEls.get(seedId);
    if (!el) {
      el = document.createElement("span");
      el.className = `seed seed--${colorOf(seedId)}`;
      layer.appendChild(el);
      seedEls.set(seedId, el);
    }
    return el;
  };

  const measure = () => {
    const base = root.getBoundingClientRect();
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return {
        cx: r.left - base.left + r.width / 2,
        cy: r.top - base.top + r.height / 2,
        w: el.offsetWidth,
        h: el.offsetHeight,
      };
    };
    const pits = pitEls.map(box);
    seedSize = Math.max(6, Math.min(13, Math.round(pits[0].w * 0.2)));
    root.style.setProperty("--seed", `${seedSize}px`);
    return { pits, stores: storeEls.map(box) };
  };

  const pointFor = (geom, where, seedId, slot) => {
    if (where.store !== undefined) {
      const g = geom.stores[where.store];
      const o = layoutStoreSeed(seedId, slot);
      return { x: g.cx + o.x * g.w, y: g.cy + o.y * g.h };
    }
    const g = geom.pits[where.pit];
    const o = layoutSeed(seedId, slot);
    return { x: g.cx + o.x * g.w, y: g.cy + o.y * g.w };
  };

  const place = (el, { x, y }, lift = 0) => {
    const half = seedSize / 2;
    el.style.transform = `translate(${(x - half).toFixed(1)}px, ${(y - half - lift).toFixed(1)}px)`;
  };

  const placeAll = (match, { instant = false } = {}) => {
    const geom = measure();
    if (instant) layer.classList.add("is-instant");
    match.seeds.pits.forEach((ids, pit) =>
      ids.forEach((id, slot) => place(seedEl(id), pointFor(geom, { pit }, id, slot)))
    );
    match.seeds.stores.forEach((ids, store) =>
      ids.forEach((id, slot) => place(seedEl(id), pointFor(geom, { store }, id, slot)))
    );
    if (instant) {
      void layer.offsetWidth;
      layer.classList.remove("is-instant");
    }
  };

  const render = (match, { interactive = true } = {}) => {
    const { game } = match;
    const playable = interactive ? new Set(getLegalMoves(game)) : new Set();
    const firstRender = current === null;
    current = match;

    for (let hole = 0; hole < BOARD_SIZE; hole++) {
      const count = game.board[hole];
      const pit = pitEls[hole];
      pit.disabled = !playable.has(hole);
      pit.classList.toggle("is-empty", count === 0);
      pit.setAttribute(
        "aria-label",
        `Pit ${pitLabel(hole)}, ${count} seed${count === 1 ? "" : "s"}`
      );
      countEls[hole].textContent = count;
      labelEls[hole].classList.toggle("is-active-side", playable.size > 0 && isNorth(hole) === (game.currentPlayer === 1));
    }
    game.scores.forEach((score, p) => (storeCountEls[p].textContent = score));
    root.dataset.turn = game.currentPlayer === 0 ? "south" : "north";
    placeAll(match, { instant: firstRender });
  };

  const timing = () =>
    prefersReducedMotion()
      ? { lift: 60, stagger: 70, travel: 120, pause: 80, collect: 20 }
      : { lift: 220, stagger: 190, travel: 380, pause: 280, collect: 55 };

  // Animates `steps` (from dispatch) starting from `before`'s seed layout.
  const animate = async (before, move, steps) => {
    const t = timing();
    const geom = measure();
    layer.style.setProperty("--travel", `${t.travel}ms`);
    const counts = [...before.game.board];
    const storeCounts = [...before.game.scores];
    const running = before.seeds.pits.map((ids) => [...ids]);
    const runningStores = before.seeds.stores.map((ids) => [...ids]);

    const origin = move.holeIndex;
    pitEls[origin].classList.add("is-origin");
    const hand = running[origin];
    running[origin] = [];
    counts[origin] = 0;
    countEls[origin].textContent = 0;
    hand.forEach((id, i) => {
      const el = seedEl(id);
      el.classList.add("is-lifted");
      place(el, pointFor(geom, { pit: origin }, id, i), seedSize * 1.4);
    });
    await wait(t.lift);

    for (const step of steps.filter((s) => s.phase === "sow")) {
      const target = step.to.pit;
      running[target].push(step.seedId);
      const el = seedEl(step.seedId);
      el.classList.remove("is-lifted");
      el.classList.add("is-moving");
      place(el, pointFor(geom, { pit: target }, step.seedId, running[target].length - 1));
      setTimeout(() => {
        el.classList.remove("is-moving");
        counts[target]++;
        countEls[target].textContent = counts[target];
        pitEls[target].classList.add("is-landing");
        setTimeout(() => pitEls[target].classList.remove("is-landing"), 200);
        playTok();
      }, t.travel);
      await wait(t.stagger);
    }
    await wait(t.travel);
    pitEls[origin].classList.remove("is-origin");

    for (const phase of ["capture", "sweep"]) {
      const phaseSteps = steps.filter((s) => s.phase === phase);
      if (!phaseSteps.length) continue;
      const holes = [...new Set(phaseSteps.map((s) => s.from.pit))];
      holes.forEach((hole) => pitEls[hole].classList.add("is-captured"));
      await wait(t.pause);
      for (const step of phaseSteps) {
        const store = step.to.store;
        runningStores[store].push(step.seedId);
        const el = seedEl(step.seedId);
        el.classList.add("is-moving");
        place(el, pointFor(geom, { store }, step.seedId, runningStores[store].length - 1));
        counts[step.from.pit]--;
        countEls[step.from.pit].textContent = counts[step.from.pit];
        setTimeout(() => {
          el.classList.remove("is-moving");
          storeCounts[store]++;
          storeCountEls[store].textContent = storeCounts[store];
          playTok(0.6);
        }, t.travel);
        await wait(t.collect);
      }
      await wait(t.travel);
      holes.forEach((hole) => pitEls[hole].classList.remove("is-captured"));
    }
  };

  let animating = false;
  const animateLocked = async (...args) => {
    animating = true;
    try {
      await animate(...args);
    } finally {
      animating = false;
    }
  };

  new ResizeObserver(() => current && !animating && placeAll(current, { instant: true })).observe(root);

  return { render, animate: animateLocked };
};
