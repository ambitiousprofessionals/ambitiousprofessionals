/* ============================================================
   HERO TYPING HEADLINE
   Cycles the <em id="heroTyped"> through the institute's tracks
   with a type/erase effect.
   ============================================================ */
(function () {
  var el = document.getElementById('heroTyped');
  if (!el) return;

  var words = ['CA', 'CMA', 'CS', 'MBA Entrances'];
  var wordIndex = 0;
  var charIndex = words[0].length; // start fully typed (matches the static markup)
  var deleting = false;

  function tick() {
    var current = words[wordIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex >= current.length) {
        deleting = true;
        setTimeout(tick, 1800); // pause before erasing
        return;
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex <= 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }
    }
    setTimeout(tick, deleting ? 45 : 90);
  }

  setTimeout(tick, 2200); // let the page settle first
})();
