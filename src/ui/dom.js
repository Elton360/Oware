import { icons } from "./icons.js";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);

export const initials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const hydrateIcons = (root = document) => {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    el.innerHTML = icons[el.dataset.icon] ?? "";
    el.classList.add("icon-slot");
    el.removeAttribute("data-icon");
  });
};

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
