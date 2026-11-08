/* ============================================================
   ANIMATED STATS COUNTER (homepage)
   Counts up from 0 to each target number once the section
   scrolls into view.
   ============================================================ */
(function () {
  var nums = document.querySelectorAll('.stat-num');
  if (nums.length === 0) return;

  /* "Years of Excellence": full years since October of the start year — ticks over every 1st October (same rule as elsewhere on the site) */
  function yearsSince(startYear) {
    var now = new Date();
    var years = now.getFullYear() - startYear;
    if (now < new Date(now.getFullYear(), 9, 1)) years -= 1;
    return years;
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (el.hasAttribute('data-oct-years')) target = yearsSince(parseInt(el.getAttribute('data-oct-years'), 10));
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    nums.forEach(animateCount);
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  nums.forEach(function (el) { observer.observe(el); });
})();
