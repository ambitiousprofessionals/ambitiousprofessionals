/* ============================================================
   LATEST LECTURES CAROUSEL (homepage)
   Fetches the channel's latest uploads from /api/latest-lectures
   and auto-scrolls 3 at a time (1 on mobile), right to left,
   with manual arrows and auto-advance.
   ============================================================ */
(function () {
  const track = document.getElementById('llTrack');
  const prevBtn = document.getElementById('llPrev');
  const nextBtn = document.getElementById('llNext');
  if (!track) return;

  let videos = [];
  let index = 0;
  let autoTimer = null;

  fetch('/api/latest-lectures')
    .then(r => r.json())
    .then(data => {
      videos = (data.videos || []).slice(0, 10);
      if (videos.length === 0) {
        track.innerHTML = '<p class="ll-loading">No lectures available right now.</p>';
        return;
      }
      renderCards();
      startAuto();
    })
    .catch(() => {
      track.innerHTML = '<p class="ll-loading">Couldn\'t load the latest lectures right now.</p>';
    });

  function renderCards() {
    track.innerHTML = videos.map(v => `
      <a class="ll-card" href="${v.url}" target="_blank" rel="noopener">
        <img src="${v.thumbnail}" alt="${escapeHtml(v.title)}" loading="lazy">
        <div class="ll-title">${escapeHtml(v.title)}</div>
      </a>
    `).join('');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function goTo(newIndex) {
    if (videos.length === 0) return;
    index = (newIndex + videos.length) % videos.length;
    const card = track.children[0];
    if (!card) return;
    const cardWidth = card.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    track.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, 4000);
  }
  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAuto(); });

  const wrap = document.querySelector('.ll-carousel-wrap');
  if (wrap) {
    wrap.addEventListener('mouseenter', stopAuto);
    wrap.addEventListener('mouseleave', startAuto);
  }
  window.addEventListener('resize', () => goTo(index));
})();
