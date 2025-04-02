export const smoothScrollTo = function(value, callback) {
  const start = window.pageYOffset;
  const destination = value instanceof Element ? value.getBoundingClientRect().top + window.scrollY : value;
  const offset = destination === 0 ? 0 : window.innerWidth < 768 ? 15 : 10;
  const distance = destination - offset - start;
  const startTime = performance.now();

  if (start === destination) return false; // do nothing if starting at destination (nothing to scroll to)

  function step(timestamp) {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / 666, 1);
    const easedProgress = easeInOutQuad(progress); // Use your preferred easing function

    window.scrollTo(0, start + distance * easedProgress);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      if (callback) callback();
    }
  }

  requestAnimationFrame(step);

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
}
