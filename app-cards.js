/* ============================================================
   SHARED CARD PIECES
   Used by the Lectures page, the Test Series page, and the full-page Cart / My Orders.
   Needs app-coursedata.js to be loaded before it.
   ============================================================ */

function esc(s){
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* the "<" back icon used on every back button */
const ICON_BACK = '<svg class="ic-back" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';

function isLoggedIn(){
  return !!(typeof auth !== 'undefined' && auth.currentUser && currentUserProfile);
}

/* ============================================================
   FACULTY PHOTOS — until a photo exists the photo area simply stays blank
   ============================================================ */
document.addEventListener('error', (e)=>{
  const img = e.target;
  if(!(img instanceof HTMLImageElement) || !img.classList.contains('pc-face')) return;
  const step = img.dataset.ext || 'png';
  if(step === 'png'){
    img.dataset.ext = 'jpg';
    img.src = facultyPhotoPath(img.dataset.fac, 'jpg');
  } else {
    img.dataset.ext = 'none';
    img.classList.add('pc-face-off');
  }
}, true);

function faceImg(name, cls){
  return '<img class="pc-face ' + cls + '" data-fac="' + esc(name) + '" data-ext="png" src="' + esc(facultyPhotoPath(name, 'png')) +
    '" alt="" loading="lazy" decoding="async">';
}

/* ============================================================
   FITS THE TEXT ON EVERY POSTER — measures the real text and shrinks it until it fits its box
   ============================================================ */
function fitPosterText(root){
  const SINGLE = [10, 8.6, 7.4, 6.4, 5.6, 4.8, 4.2, 3.6];
  const COMBO  = [6.6, 5.8, 5, 4.4, 3.8, 3.4, 3];
  const BADGE  = [4.6, 4.2, 3.8, 3.4, 3.1, 2.8, 2.5];     // the exam name at the top-left must stay on ONE row
  root.querySelectorAll('.pc-subject, .pc-csubject, .pc-badge').forEach(el => {
    if(el.dataset.fit === '1') return;
    if(!el.offsetWidth) return;                           // not on screen yet
    const sizes = el.classList.contains('pc-badge') ? BADGE : (el.classList.contains('pc-csubject') ? COMBO : SINGLE);
    for(let i = 0; i < sizes.length; i++){
      el.style.fontSize = sizes[i] + 'cqw';
      if(el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1) break;
    }
    el.dataset.fit = '1';
  });
}
function refitAllPosters(){
  document.querySelectorAll('[data-fit]').forEach(el => { delete el.dataset.fit; });
  fitPosterText(document);
}
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(refitAllPosters); }
window.addEventListener('load', refitAllPosters);

/* ============================================================
   POSTERS (the picture part of every card)
   ============================================================ */
function toneStyle(p){
  const t = getCardTone(p.course, p.level, p.batch);
  return '--ta:' + t[0] + ';--tb:' + t[1];
}

function lectureTagHTML(p){
  // both tags are written on two rows so they never stretch towards the faculty photo
  return p.batch === 'fasttrack'
    ? '<span class="pc-lectag">Fast-track<br>Lectures</span>'
    : '<span class="pc-lectag">Regular<br>Lectures</span>';
}

function posterSingleHTML(p){
  const subject = p.subjects[0];
  const fac = p.faculties[0];
  return '<div class="pc-poster pc-single pc-tone" style="' + toneStyle(p) + '">' +
    '<div class="pc-panel">' +
      '<span class="pc-rect"></span>' +
      faceImg(fac, 'pc-face-main') +
      '<div class="pc-left">' +
        '<div class="pc-badge">' + esc(p.examLabel) + '</div>' +
        (CARD_TAGLINE ? '<div class="pc-tagline">' + esc(CARD_TAGLINE) + '</div>' : '') +
        (p.group ? '<div class="pc-group">' + esc(p.group) + '</div>' : '') +
        '<div class="pc-paperno">' + esc(paperLabel(p.paperNo)) + '</div>' +
        '<div class="pc-subject">' + esc(subject) + '</div>' +
        '<div class="pc-facname">' + esc(fac) + '</div>' +
      '</div>' +
      lectureTagHTML(p) +
    '</div>' +
  '</div>';
}

function posterComboHTML(p){
  const short = p.subjects.map(getSubjectShort).join(' + ');
  const tiles = p.faculties.slice(0, 5).map(f => '<div class="pc-tile">' + faceImg(f, 'pc-face-tile') + '</div>').join('');
  return '<div class="pc-poster pc-combo pc-tone" style="' + toneStyle(p) + '">' +
    '<div class="pc-cpanel">' +
      '<div class="pc-ctitle">' + esc(p.examFull) + '</div>' +
      '<span class="pc-gpill">' + esc(p.group ? (p.group + ' COMBO') : 'COMBO') + '</span>' +
      (CARD_TAGLINE ? '<div class="pc-ctag">' + esc(CARD_TAGLINE) + '</div>' : '') +
    '</div>' +
    '<div class="pc-cinner">' +
      '<div class="pc-tiles pc-tiles-' + Math.min(p.faculties.length, 5) + '">' + tiles + '</div>' +
      '<div class="pc-csubject">' + esc(short) + '</div>' +
      '<span class="pc-clectag">' + esc(BATCH_TYPES[p.batch].tag) + '</span>' +
    '</div>' +
  '</div>';
}

function posterHTML(p){
  return p.category === 'combo' ? posterComboHTML(p) : posterSingleHTML(p);
}

/* Test Series poster (a test-paper picture instead of a faculty photo) */
const TS_ILLUS =
  '<svg class="pc-ts-illus" viewBox="0 0 120 150" aria-hidden="true">' +
    '<rect x="12" y="8" width="96" height="134" rx="10" fill="#fff"/>' +
    '<g fill="none" stroke="#AE1029" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M26 40 l5 5 9-10"/><path d="M26 72 l5 5 9-10"/><path d="M26 104 l5 5 9-10"/>' +
    '</g>' +
    '<g stroke="#2B2823" stroke-width="5" stroke-linecap="round" opacity=".75">' +
      '<line x1="52" y1="40" x2="94" y2="40"/><line x1="52" y1="72" x2="94" y2="72"/><line x1="52" y1="104" x2="86" y2="104"/>' +
    '</g>' +
  '</svg>';

function tsPosterHTML(p){
  return '<div class="pc-poster pc-single pc-ts">' +
    '<div class="pc-panel">' +
      '<span class="pc-rect"></span>' + TS_ILLUS +
      '<div class="pc-left">' +
        '<div class="pc-badge">' + esc(p.examLabel) + '</div>' +
        '<div class="pc-tagline">TEST SERIES</div>' +
        '<div class="pc-subject">' + esc(AMBITION_SERIES_NAME) + '</div>' +
      '</div>' +
      '<span class="pc-lectag">' + esc(p.typeLabel) + '</span>' +
    '</div>' +
  '</div>';
}

/* Counselling request (free) poster, shown in the cart / orders */
function counsellingPosterHTML(item){
  return '<div class="pc-poster pc-single pc-ts">' +
    '<div class="pc-panel">' +
      '<span class="pc-rect"></span>' + TS_ILLUS +
      '<div class="pc-left">' +
        '<div class="pc-badge">' + esc((item && item.examOrCourse) ? item.examOrCourse : 'COUNSELLING') + '</div>' +
        '<div class="pc-tagline">FREE</div>' +
        '<div class="pc-subject">COUNSELLING</div>' +
      '</div>' +
      '<span class="pc-lectag">Free<br>Session</span>' +
    '</div>' +
  '</div>';
}

/* ============================================================
   PRODUCT PAGE PIECES (shared by the product page and the cart "Product Details" view)
   ============================================================ */
function productInfoTableHTML(p){
  const info = getProductInfo(p);
  return '<table class="pv-table"><tbody>' +
    PRODUCT_INFO_ROWS.map(r => '<tr><th scope="row">' + esc(r.label) + '</th><td>' + esc(info[r.key] || '---') + '</td></tr>').join('') +
  '</tbody></table>';
}

function facultyInfoHTML(p){
  return p.faculties.map(name => {
    const info = getFacultyInfo(name);
    const extra = [];
    if(info && info.qualification) extra.push('<div><b>Qualification:</b> ' + esc(info.qualification) + '</div>');
    if(info && info.experience) extra.push('<div><b>Experience:</b> ' + esc(info.experience) + '</div>');
    return '<div class="pv-fac">' +
      '<div class="pv-fac-ph">' + faceImg(name, 'pv-fac-img') + '</div>' +
      '<div class="pv-fac-text"><h4>' + esc(name) + '</h4>' +
      '<p>' + esc((info && info.about) ? info.about : 'Faculty information will be updated soon.') + '</p>' + extra.join('') + '</div>' +
    '</div>';
  }).join('');
}

function termsHTML(){
  return '<h4 class="pv-terms-h">Cancellation/ Refund Policy</h4>' +
    '<ul class="pv-terms">' +
      '<li>Course once purchased cannot be cancelled &amp; fees are non-refundable.</li>' +
      '<li>Subscribed Courses cannot be changed with another course.</li>' +
      '<li>The course is non-transferable.</li>' +
    '</ul>';
}

/* the three tabs (Product Info / Faculty Info / Terms & Conditions) */
function productTabsHTML(p){
  return '<div class="pv-tabs-wrap">' +
    '<div class="pv-tabs" role="tablist">' +
      '<button type="button" role="tab" class="pv-tab active" data-tab="info" aria-selected="true">Product Info</button>' +
      '<button type="button" role="tab" class="pv-tab" data-tab="faculty" aria-selected="false">Faculty Info</button>' +
      '<button type="button" role="tab" class="pv-tab" data-tab="terms" aria-selected="false">Terms &amp; Conditions</button>' +
    '</div>' +
    '<div class="pv-panel" data-panel="info">' + productInfoTableHTML(p) + '</div>' +
    '<div class="pv-panel hidden" data-panel="faculty">' + facultyInfoHTML(p) + '</div>' +
    '<div class="pv-panel hidden" data-panel="terms">' + termsHTML() + '</div>' +
  '</div>';
}

function wireProductTabs(root){
  root.querySelectorAll('.pv-tab').forEach(tab => {
    tab.addEventListener('click', ()=>{
      root.querySelectorAll('.pv-tab').forEach(t => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      root.querySelectorAll('.pv-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.panel !== tab.dataset.tab);
      });
    });
  });
}

/* ============================================================
   EXAM CHOOSER — shown on Lectures / Test Series when no exam has been picked yet.
   Step 1: CA / CMA / CS / MBA.   Step 2: the other options fade away and the levels slide in.
   opts = { target:'courses.html', courses:['CA','CMA','CS','MBA'], title:'…' }
   ============================================================ */
const CHOOSER_INFO = {
  CA:  { name:'CA',  sub:'Chartered Accountancy' },
  CMA: { name:'CMA', sub:'Cost & Management Accountancy' },
  CS:  { name:'CS',  sub:'Company Secretary' },
  MBA: { name:'MBA', sub:'MBA Guidance & Counselling' }
};
const CHOOSER_LEVELS = {
  CA:  [ ['Foundation','Foundation'], ['Intermediate','Intermediate'], ['Final','Final'] ],
  CMA: [ ['Foundation','Foundation'], ['Intermediate','Intermediate'], ['Final','Final'] ],
  CS:  [ ['CSEET','CSEET'], ['Executive','Executive'], ['Professional','Professional'] ]
};

function buildExamChooser(container, opts){
  const courses = opts.courses;
  const title = opts.title || 'Choose your requirement';
  container.innerHTML =
    '<div class="xc">' +
      '<h2 class="xc-title" id="xcTitle">' + esc(title) + '</h2>' +
      '<p class="xc-sub" id="xcSub">Pick the exam you are preparing for.</p>' +
      '<div class="xc-options" id="xcOptions">' +
        courses.map(c =>
          '<button type="button" class="xc-opt" data-course="' + c + '">' +
            '<span class="xc-opt-name">' + esc(CHOOSER_INFO[c].name) + '</span>' +
            '<span class="xc-opt-sub">' + esc(CHOOSER_INFO[c].sub) + '</span>' +
          '</button>'
        ).join('') +
      '</div>' +
      '<div class="xc-levels" id="xcLevels"></div>' +
      '<button type="button" class="xc-back hidden" id="xcBack">' + ICON_BACK + ' Choose a different option</button>' +
    '</div>';

  const optionsEl = container.querySelector('#xcOptions');
  const levelsEl = container.querySelector('#xcLevels');
  const backBtn = container.querySelector('#xcBack');
  const subEl = container.querySelector('#xcSub');
  const titleEl = container.querySelector('#xcTitle');

  function pick(course){
    if(course === 'MBA'){
      window.location.href = opts.target + '?course=MBA';
      return;
    }
    optionsEl.classList.add('xc-picked');
    optionsEl.querySelectorAll('.xc-opt').forEach(b => {
      b.classList.toggle('is-picked', b.dataset.course === course);
      b.classList.toggle('is-gone', b.dataset.course !== course);
    });
    titleEl.textContent = 'Choose your ' + course + ' level';
    subEl.textContent = 'Tap a level to continue.';
    levelsEl.innerHTML = CHOOSER_LEVELS[course].map((lv, i) =>
      '<a class="xc-level" style="animation-delay:' + (260 + i * 110) + 'ms" href="' + opts.target + '?course=' + course + '&level=' + lv[0] + '">' +
        '<span class="xc-level-name">' + esc(course + ' ' + lv[1]) + '</span>' +
        '<span class="xc-level-arrow" aria-hidden="true">→</span>' +
      '</a>'
    ).join('');
    levelsEl.classList.add('is-open');
    backBtn.classList.remove('hidden');
  }

  function reset(){
    levelsEl.classList.remove('is-open');
    levelsEl.innerHTML = '';
    backBtn.classList.add('hidden');
    optionsEl.classList.remove('xc-picked');
    optionsEl.querySelectorAll('.xc-opt').forEach(b => { b.classList.remove('is-picked'); b.classList.remove('is-gone'); });
    titleEl.textContent = title;
    subEl.textContent = 'Pick the exam you are preparing for.';
  }

  optionsEl.addEventListener('click', (e)=>{
    const b = e.target.closest('.xc-opt');
    if(!b || b.classList.contains('is-picked')) return;
    pick(b.dataset.course);
  });
  backBtn.addEventListener('click', reset);
}
