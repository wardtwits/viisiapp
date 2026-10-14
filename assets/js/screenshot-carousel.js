(function () {
  "use strict";

  // Cycles the home hero screenshots. Each color-scheme set cycles on its own,
  // so the light and dark sets may hold different numbers of images.
  const sets = document.querySelectorAll("[data-screenshot-set]");
  if (!sets.length) return;

  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const INTERVAL_MS = 3000;

  window.setInterval(() => {
    sets.forEach((set) => {
      // The set hidden by the current color scheme stays put.
      if (set.offsetParent === null) return;
      const images = set.querySelectorAll("img");
      if (images.length < 2) return;
      const current = set.querySelector("img.is-active");
      const index = Array.prototype.indexOf.call(images, current);
      const next = images[(index + 1) % images.length];
      if (current) current.classList.remove("is-active");
      next.classList.add("is-active");
    });
  }, INTERVAL_MS);
})();
