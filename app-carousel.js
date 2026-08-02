/* ============================================================
   SHARED INFINITE CAROUSEL ENGINE
   Clones a few items at each end so looping past the last (or
   before the first) slide continues seamlessly in the same
   direction, instead of snapping/rewinding back to the start.
   ============================================================ */
function createInfiniteCarousel(opts) {
  const track = opts.track;
  const items = opts.items || [];
  const prevBtn = opts.prevBtn;
  const nextBtn = opts.nextBtn;
  const autoMs = opts.autoMs || 4000;
  const wrapEl = opts.wrapEl;
  const n = items.length;
  const cloneCount = Math.min(opts.cloneCount || 1, n);

  if (!track || n === 0) return null;

  const headClones = items.slice(n - cloneCount);
  const tailClones = items.slice(0, cloneCount);
  track.innerHTML = headClones.join('') + items.join('') + tailClones.join('');

  let index = cloneCount;
  let animating = false;
  let autoTimer = null;

  function stepWidth() {
    const card = track.children[0];
    if (!card) return 0;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return cardWidth + gap;
  }

  function apply(withTransition) {
    track.style.transition = withTransition ? 'transform .5s ease' : 'none';
    track.style.transform = 'translateX(-' + (index * stepWidth()) + 'px)';
  }

  apply(false);

  track.addEventListener('transitionend', function () {
    animating = false;
    if (index >= cloneCount + n) { index -= n; apply(false); }
    else if (index < cloneCount) { index += n; apply(false); }
  });

  function next() {
    if (animating) return;
    animating = true;
    index++;
    apply(true);
  }
  function prev() {
    if (animating) return;
    animating = true;
    index--;
    apply(true);
  }

  function startAuto() { stopAuto(); autoTimer = setInterval(next, autoMs); }
  function stopAuto() { if (autoTimer) clearInterval(autoTimer); }

  if (nextBtn) nextBtn.addEventListener('click', function () { next(); startAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); startAuto(); });
  if (wrapEl) {
    wrapEl.addEventListener('mouseenter', stopAuto);
    wrapEl.addEventListener('mouseleave', startAuto);
  }
  window.addEventListener('resize', function () { apply(false); });

  startAuto();
  return { next: next, prev: prev, startAuto: startAuto, stopAuto: stopAuto };
}
