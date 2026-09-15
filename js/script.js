// ---- Scroll-triggered reveal ----
// Add the "reveal-box" class to any element (image, process step, section)
// and it will fade + slide in the first time it scrolls into view.
const revealTargets = document.querySelectorAll('.reveal-box');

if (revealTargets.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // only animate once
      }
    });
  }, { threshold: 0.2 });

  revealTargets.forEach(el => revealObserver.observe(el));
}

// Hover-reveal captions and custom cursor / drag effects can be added here
// once the Figma design defines exactly what's needed.

console.log("Portfolio loaded");
