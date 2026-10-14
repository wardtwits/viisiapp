(function () {
  "use strict";

  // Cycles the home hero screenshots. Each color-scheme set cycles on its own,
  // so the light and dark sets may hold different numbers of images.
  const sets = document.querySelectorAll("[data-screenshot-set]");
  if (!sets.length) return;

  const INTERVAL_MS = 3000;
  const toggle = document.querySelector("[data-screenshot-toggle]");
  const toggleLabel =
    toggle && toggle.querySelector("[data-screenshot-toggle-label]");
  const reduceMotionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  let timer = null;
  let paused = false;

  function advance() {
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
  }

  // Runs unless the visitor paused it or asks for reduced motion. With reduced
  // motion nothing moves, so the pause control is hidden as well (WCAG 2.2.2).
  function update() {
    const reduceMotion = Boolean(reduceMotionQuery && reduceMotionQuery.matches);
    const shouldRun = !paused && !reduceMotion;

    if (shouldRun && timer === null) {
      timer = window.setInterval(advance, INTERVAL_MS);
    } else if (!shouldRun && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }

    if (toggle) {
      toggle.hidden = reduceMotion;
      toggle.classList.toggle("is-paused", paused);
      if (toggleLabel) toggleLabel.textContent = paused ? "Play" : "Pause";
    }
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      paused = !paused;
      update();
    });
  }

  if (reduceMotionQuery) {
    if (typeof reduceMotionQuery.addEventListener === "function") {
      reduceMotionQuery.addEventListener("change", update);
    } else if (typeof reduceMotionQuery.addListener === "function") {
      reduceMotionQuery.addListener(update);
    }
  }

  update();
})();
