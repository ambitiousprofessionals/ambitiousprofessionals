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

  /* the last good list is remembered in the visitor's browser, so a hiccup never leaves the box empty */
  var CACHE_KEY = 'apLatestLectures_v1';
  function readCache() {
    try {
      var o = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (o && o.videos && o.videos.length) return o.videos;
    } catch (e) { /* ignore */ }
    return null;
  }
  function writeCache(videos) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), videos: videos })); } catch (e) { /* ignore */ }
  }

  var RETRY_DELAYS = [1500, 3000, 5000, 8000];   // wait a little longer before each new try

  function giveUp() {
    var cached = readCache();
    if (cached) { renderVideos(cached); return; }
    track.innerHTML = '<p class="ll-loading">Couldn\'t load the latest videos right now. ' +
      '<a href="https://www.youtube.com/@AMBITIOUSPROFESSIONALS" target="_blank" rel="noopener">Watch on YouTube</a></p>';
  }

  function load(attempt) {
    function retryOrGiveUp() {
      if (attempt < RETRY_DELAYS.length) {
        setTimeout(function () { load(attempt + 1); }, RETRY_DELAYS[attempt]);
      } else {
        giveUp();
      }
    }
    fetch('/api/latest-lectures')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var videos = (data.videos || []).slice(0, 10);
        if (videos.length === 0) { retryOrGiveUp(); return; }
        writeCache(videos);
        renderVideos(videos);
      })
      .catch(retryOrGiveUp);
  }

  load(0); // up to 5 tries in total (spread over ~17 seconds) before falling back to the saved list
})();
