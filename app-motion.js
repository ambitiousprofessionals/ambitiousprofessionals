/* ============================================================
   SHARED MOTION / UX LAYER
   Toasts (replaces browser alert()), a smooth fade between page
   loads, and scroll-reveal for major sections. Loaded on every
   page, near the top, so it can act before the rest of the page
   finishes loading.
   ============================================================ */

/* ---- Toast notifications ---- */
function showToast(message, type) {
  var container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' toast-' + type : '');
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(function () { toast.classList.add('toast-in'); });
  setTimeout(function () {
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(function () { toast.remove(); }, 300);
  }, 3800);
}

/* ---- Cursor glow (desktop / mouse devices only) ---- */
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  var shown = false;
  window.addEventListener('mousemove', function (e) {
    if (!shown) { glow.classList.add('cursor-glow-on'); shown = true; }
    glow.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
  });
  window.addEventListener('mouseleave', function () {
    glow.classList.remove('cursor-glow-on');
    shown = false;
  });
})();

/* ---- Page load fade-in (paired with the js-loading class already on <html>) ---- */
document.addEventListener('DOMContentLoaded', function () {
  document.documentElement.classList.remove('js-loading');
});

/* ---- Fix for browser back/forward showing a blank page: when a page is restored
   from bfcache (or simply re-shown), make sure it's never stuck invisible from a
   fade-out that was mid-flight when the user navigated away from it. ---- */
window.addEventListener('pageshow', function () {
  document.documentElement.classList.remove('page-leaving');
  document.documentElement.classList.remove('js-loading');
});

/* ---- Smooth internal navigation: fade out before leaving for another page ---- */
document.addEventListener('click', function (e) {
  var a = e.target.closest('a');
  if (!a) return;
  if (e.defaultPrevented) return;
  if (a.target === '_blank' || a.hasAttribute('download')) return;
  if (a.classList.contains('dropdown-toggle') || a.classList.contains('submenu-toggle')) return;
  if (a.dataset.noTransition !== undefined) return;
  var href = a.getAttribute('href');
  if (!href) return;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
  if (a.origin && a.origin !== window.location.origin) return; // external link — leave alone
  if (!/\.html(\?|#|$)/.test(href)) return; // only intercept normal same-site page links

  e.preventDefault();
  document.documentElement.classList.add('page-leaving');
  setTimeout(function () { window.location.href = href; }, 180);
});

/* ---- Scroll-reveal for major sections (auto-applies to every <section>,
   except ones already visible on load — those carry class "no-reveal") ---- */
document.addEventListener('DOMContentLoaded', function () {
  var targets = document.querySelectorAll('section:not(.no-reveal)');
  if (targets.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (t) { t.classList.add('revealed'); });
    return;
  }
  targets.forEach(function (t) { t.classList.add('reveal'); });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(function (t) { observer.observe(t); });
});
