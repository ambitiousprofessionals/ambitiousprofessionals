/* ============================================================
   LATEST LECTURES CAROUSEL (homepage)
   Fetches the channel's latest uploads from /api/latest-lectures
   and auto-scrolls 3 at a time (1 on mobile), right to left,
   with manual arrows and auto-advance. Loops seamlessly.
   ============================================================ */
(function () {
  const track = document.getElementById('llTrack');
  const prevBtn = document.getElementById('llPrev');
  const nextBtn = document.getElementById('llNext');
  if (!track) return;

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function renderVideos(videos) {
    const cardsHtml = videos.map(function (v) {
      return '<a class="ll-card" href="' + v.url + '" target="_blank" rel="noopener">' +
        '<img src="' + v.thumbnail + '" alt="' + escapeHtml(v.title) + '" loading="lazy">' +
        '<div class="ll-title">' + escapeHtml(v.title) + '</div>' +
        '</a>';
    });
    createInfiniteCarousel({
      track: track,
      items: cardsHtml,
      prevBtn: prevBtn,
      nextBtn: nextBtn,
      wrapEl: document.querySelector('.ll-carousel-wrap'),
      cloneCount: 3,
      autoMs: 4000
    });
  }

  function load(retriesLeft) {
    fetch('/api/latest-lectures')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const videos = (data.videos || []).slice(0, 10);
        if (videos.length === 0) {
          if (retriesLeft > 0) {
            setTimeout(function () { load(retriesLeft - 1); }, 1500);
            return;
          }
          track.innerHTML = '<p class="ll-loading">No videos available right now.</p>';
          return;
        }
        renderVideos(videos);
      })
      .catch(function () {
        if (retriesLeft > 0) {
          setTimeout(function () { load(retriesLeft - 1); }, 1500);
          return;
        }
        track.innerHTML = '<p class="ll-loading">Couldn\'t load the latest videos right now.</p>';
      });
  }

  load(2); // try up to 3 times total before giving up
})();
