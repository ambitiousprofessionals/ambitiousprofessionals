/* ============================================================
   LOVED BY OUR STUDENTS — testimonial carousel (homepage)
   Same seamless infinite-loop engine as the other carousels.
   ============================================================ */
(function () {
  const track = document.getElementById('tsmTrack');
  const prevBtn = document.getElementById('tsmPrev');
  const nextBtn = document.getElementById('tsmNext');
  if (!track) return;

  const testimonials = [
    { name: 'CMA Sagar', level: 'CMA Qualified', gender: 'm', quote: "I joined Ambitious Professionals right at the start of my CMA journey, and honestly, that decision made all the difference. The faculty broke down even the toughest topics into something I could actually understand and apply. Today, as a qualified CMA, I can say this institute built my foundation brick by brick." },
    { name: 'CMA Sneha', level: 'CMA Qualified', gender: 'f', quote: "From my very first CMA Foundation class here to clearing my finals, Ambitious Professionals has been with me every step. The teachers never let a doubt go unanswered, and that personal attention is exactly what got me through the tougher papers." },
    { name: 'Abhishek', level: 'CMA Finalist', gender: 'm', quote: "I've been with Ambitious Professionals since I started my CMA journey, and reaching the Final level today feels like proof that their teaching actually works. The faculty's clarity on complex topics is the biggest reason I've stayed consistent." },
    { name: 'A. Sourav', level: 'CMA Finalist', gender: 'm', quote: "Right from CMA Foundation, this institute has pushed me to understand concepts, not just mug them up. Now that I'm at the Final stage, I really feel that early foundation is what's carrying me through. Solid teaching, solid support." },
    { name: 'Arpan', level: 'CMA Finalist', gender: 'm', quote: "Being with Ambitious Professionals since the beginning of my CMA journey gave me a strong base I still rely on at the Final level. The faculty genuinely care about whether you've understood a topic, not just whether you've finished the syllabus." },
    { name: 'Srujalin', level: 'CMA Finalist', gender: 'm', quote: "I started my CMA journey here and I'm still here at the Final stage — that says a lot about how much this institute has helped me grow. The teaching is thorough, and the doubt-clearing sessions have saved me more times than I can count." },
    { name: 'K. Vinay', level: 'CMA Finalist', gender: 'm', quote: "From day one of CMA Foundation to now, at the Final level, Ambitious Professionals has stayed consistent in one thing — genuinely wanting their students to succeed. That kind of support is hard to find." },
    { name: 'Sagarika', level: 'CMA Finalist', gender: 'f', quote: "I joined at the very start of my CMA journey and I've grown with this institute at every level since. The way faculty explain difficult topics here made subjects I used to dread actually make sense." },
    { name: 'Stutida', level: 'CMA Finalist', gender: 'f', quote: "Ambitious Professionals has been part of my CMA journey since Foundation, and now at the Final stage, I can see just how much that early guidance shaped my understanding. Great faculty, real support." },
    { name: 'Ayusman', level: 'CMA Finalist', gender: 'm', quote: "I've stuck with this institute through my entire CMA journey so far, and reaching CMA Final is the biggest proof I can give of how good the teaching here actually is. They don't just teach — they make sure you understand." },
    { name: 'Mehek', level: 'CMA Finalist', gender: 'f', quote: "Since the start of my CMA journey, Ambitious Professionals has been my constant. Now at the Final level, I still rely on the concept clarity I built here in my very first classes. That's the kind of teaching that stays with you." },
    { name: 'Aditya', level: 'CMA Inter', gender: 'm', quote: "I joined Ambitious Professionals right at the beginning of my CMA journey, and the way they've built my basics has made CMA Intermediate feel far less overwhelming than I expected. Genuinely helpful faculty." },
    { name: 'Rishita', level: 'CMA Inter', gender: 'f', quote: "Being with this institute since I started my CMA journey has made a real difference at the Intermediate level — the concepts I struggled with early on finally make sense, thanks to how patiently the faculty teach here." },
    { name: 'Subham', level: 'CMA Inter', gender: 'm', quote: "From CMA Foundation to now Intermediate, Ambitious Professionals has stuck with me and pushed me to actually understand the subjects, not just clear papers. It's the kind of institute that genuinely wants you to do well." }
  ];

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  const maleAvatar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>';
  const femaleAvatar = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="7.5" r="3.6"/><path d="M12 11c-1 2-1 3 0 4M9.2 9.6c-2.6 1-4 3.4-4.2 6.9M14.8 9.6c2.6 1 4 3.4 4.2 6.9"/><path d="M4 20c0-3.6 3.6-5.6 8-5.6s8 2 8 5.6"/></svg>';
  const starSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>';
  const stars = new Array(5).fill(starSvg).join('');

  const cardsHtml = testimonials.map(function (t) {
    return '<div class="tsm-card">' +
      '<div class="tsm-top">' +
        '<div class="tsm-avatar">' + (t.gender === 'f' ? femaleAvatar : maleAvatar) + '</div>' +
        '<div>' +
          '<div class="tsm-name">' + escapeHtml(t.name) + '</div>' +
          '<div class="tsm-level">' + escapeHtml(t.level) + '</div>' +
        '</div>' +
      '</div>' +
      '<p class="tsm-text">' + escapeHtml(t.quote) + '</p>' +
      '<div class="tsm-stars">' + stars + '</div>' +
      '</div>';
  });

  createInfiniteCarousel({
    track: track,
    items: cardsHtml,
    prevBtn: prevBtn,
    nextBtn: nextBtn,
    wrapEl: document.querySelector('.tsm-carousel-wrap'),
    cloneCount: 3,
    autoMs: 5000
  });
})();
