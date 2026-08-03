/* ============================================================
   RESULT BANNERS CAROUSEL (homepage, above the hero eyebrow)
   Full-width, one banner at a time, auto-scrolling with manual
   arrows, seamless infinite loop.
   ============================================================ */
(function () {
  const track = document.getElementById('rbTrack');
  if (!track) return;

  const banners = [
    'images/result-banner-1.png',
    'images/result-banner-2.png',
    'images/result-banner-3.png',
    'images/result-banner-4.png',
    'images/result-banner-5.png'
  ];

  const slidesHtml = banners.map(function (src) {
    return '<div class="rb-slide"><img src="' + src + '" alt="Ambitious Professionals — student results"></div>';
  });

  createInfiniteCarousel({
    track: track,
    items: slidesHtml,
    prevBtn: document.getElementById('rbPrev'),
    nextBtn: document.getElementById('rbNext'),
    wrapEl: document.querySelector('.rb-carousel-wrap'),
    cloneCount: 1,
    autoMs: 4500
  });
})();
