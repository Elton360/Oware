const svg = (body, viewBox = "0 0 24 24") =>
  `<svg class="icon" viewBox="${viewBox}" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const icons = {
  logo: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${[6, 12, 18]
    .flatMap((x) => [9, 15].map((y) => `<circle cx="${x}" cy="${y}" r="2.1" fill="currentColor"/>`))
    .join("")}</svg>`,
  hourglass: svg('<path d="M6 3h12M6 21h12M7 3c0 5 10 6 10 9s-10 4-10 9M17 3c0 5-10 6-10 9"/>'),
  cycle: svg('<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>'),
  book: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>'),
  soundOn: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  soundOff: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 9 5 6M22 9l-5 6"/>'),
  restart: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>'),
  undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  handshake: svg('<path d="m12 5 7 7-7 7-7-7z"/>'),
  leaf: svg('<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19 14 10"/>'),
  log: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
  seed: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'),
  arrowLeft: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
};
