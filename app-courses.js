/* ============================================================
   LECTURES PAGE — product catalog (filters + cards) and product page
   Works with: courses.html, app-coursedata.js, app-common.js
   ============================================================ */

/* ---------- state ---------- */
let currentCourse = null;
let currentLevel = null;
let catalog = [];          // every product of the chosen exam, in default order
let filtered = [];         // products after the filters are applied
let shownCount = 0;        // how many cards are currently on screen
let currentProduct = null;
let couponState = null;    // {code, off, finalPrice} once a coupon is applied
let savedScrollY = 0;
let relCleanup = null;     // stops the related-products carousel timer

const PAGE_SIZE = 30;               // 3 cards x 10 rows, then "Show more" adds 30 more
const FACULTY_DEFAULT_VISIBLE = 8;  // faculty names shown in the filter before searching / expanding

const filters = { subjects:new Set(), categories:new Set(), batches:new Set(), faculties:new Set() };
let facultySearchText = '';
let facultyShowAll = false;
let subjectList = [];
let facultyList = [];

/* ---------- elements ---------- */
const coursesHeading   = document.getElementById('coursesHeading');
const noSelectionMsg   = document.getElementById('noSelectionMsg');
const mbaPanelSection  = document.getElementById('mbaPanelSection');
const catalogHead      = document.getElementById('catalogHead');
const catalogView      = document.getElementById('catalogView');
const productView      = document.getElementById('productView');
const filterPane       = document.getElementById('filterPane');
const filterBackdrop   = document.getElementById('filterBackdrop');
const filterBody       = document.getElementById('filterBody');
const productGrid      = document.getElementById('productGrid');
const noProductsMsg    = document.getElementById('noProductsMsg');
const showMoreWrap     = document.getElementById('showMoreWrap');
const showMoreBtn      = document.getElementById('showMoreBtn');
const resultCount      = document.getElementById('resultCount');
const clearFiltersBtn  = document.getElementById('clearFiltersBtn');
const filterToggleBtn  = document.getElementById('filterToggleBtn');
const filterCloseBtn   = document.getElementById('filterCloseBtn');

/* ---------- small helpers ---------- */
function esc(s){
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

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
   CARD HTML  (poster on top, dark title + price strip below)
   ============================================================ */
/* picks the biggest text size (in % of the card width) at which the text still fits its box */
function fitSize(text, boxWidth, sizes, maxLines){
  const words = String(text).toUpperCase().split(/\s+/).filter(Boolean);
  for(let i = 0; i < sizes.length; i++){
    const size = sizes[i];
    const perLine = boxWidth / (size * 0.62);
    if(words.some(w => w.length > perLine)) continue;
    let lines = 1, cur = 0;
    words.forEach(w => {
      const add = (cur ? 1 : 0) + w.length;
      if(cur + add > perLine){ lines++; cur = w.length; } else { cur += add; }
    });
    if(lines <= maxLines) return size;
  }
  return sizes[sizes.length - 1];
}
function sizeStyle(size){
  return 'font-size:' + Math.round(size * 3.4) + 'px;font-size:' + size + 'cqw';
}

function posterSingleHTML(p){
  const subject = p.subjects[0];
  const size = fitSize(subject, 50, [10, 8.6, 7.4, 6.4, 5.6, 4.8, 4.2], 5);
  const fac = p.faculties[0];
  return '<div class="pc-poster pc-single">' +
    '<div class="pc-panel">' +
      '<span class="pc-rect"></span>' +
      faceImg(fac, 'pc-face-main') +
      '<div class="pc-left">' +
        '<div class="pc-badge">' + esc(p.examLabel) + '</div>' +
        (CARD_TAGLINE ? '<div class="pc-tagline">' + esc(CARD_TAGLINE) + '</div>' : '') +
        (p.group ? '<div class="pc-group">' + esc(p.group) + '</div>' : '') +
        '<div class="pc-subject" style="' + sizeStyle(size) + '">' + esc(subject) + '</div>' +
        '<div class="pc-facname">' + esc(fac) + '</div>' +
      '</div>' +
      '<span class="pc-lectag">' + esc(BATCH_TYPES[p.batch].tag) + '</span>' +
    '</div>' +
  '</div>';
}

function posterComboHTML(p){
  const short = p.subjects.map(getSubjectShort).join(' + ');
  const size = fitSize(short, 84, [6.6, 5.8, 5, 4.4, 3.8], 2);
  const tiles = p.faculties.slice(0, 5).map(f => '<div class="pc-tile">' + faceImg(f, 'pc-face-tile') + '</div>').join('');
  return '<div class="pc-poster pc-combo">' +
    '<div class="pc-cpanel">' +
      '<div class="pc-ctitle">' + esc(p.examFull) + '</div>' +
      '<span class="pc-gpill">' + esc(p.group ? (p.group + ' COMBO') : 'COMBO') + '</span>' +
      (CARD_TAGLINE ? '<div class="pc-ctag">' + esc(CARD_TAGLINE) + '</div>' : '') +
    '</div>' +
    '<div class="pc-cinner">' +
      '<div class="pc-tiles pc-tiles-' + Math.min(p.faculties.length, 5) + '">' + tiles + '</div>' +
      '<div class="pc-csubject" style="' + sizeStyle(size) + '">' + esc(short) + '</div>' +
      '<span class="pc-clectag">' + esc(BATCH_TYPES[p.batch].tag) + '</span>' +
    '</div>' +
  '</div>';
}

function posterHTML(p){
  return p.category === 'combo' ? posterComboHTML(p) : posterSingleHTML(p);
}

function stripHTML(p){
  const off = p.discount ? (p.discount + '% off') : '---% off';
  const price = (p.price === null || p.price === undefined) ? '---' : (formatRupees(p.price) + '/-');
  return '<div class="pc-strip">' +
    '<h3 class="pc-title">' + esc(p.title) + '</h3>' +
    '<div class="pc-sep"></div>' +
    '<div class="pc-row">' +
      '<span class="pc-coin" aria-hidden="true">₹</span>' +
      '<s class="pc-mrp">' + esc(formatRupees(p.mrp)) + '</s>' +
      '<b class="pc-final">' + esc(price) + '</b>' +
      '<span class="pc-off">' + esc(off) + '</span>' +
    '</div>' +
  '</div>';
}

function cardHTML(p, i){
  return '<article class="pc" data-id="' + esc(p.id) + '" tabindex="0" role="link" aria-label="' + esc(p.title) + '" style="animation-delay:' + ((i % 6) * 45) + 'ms">' +
    posterHTML(p) + stripHTML(p) +
  '</article>';
}

function miniCardHTML(p){
  return '<article class="pc pc-mini" data-id="' + esc(p.id) + '" tabindex="0" role="link" aria-label="' + esc(p.title) + '">' + posterHTML(p) + '</article>';
}

/* ============================================================
   FILTERS
   ============================================================ */
function chkHTML(group, value, label, checked){
  return '<label class="fchk"><input type="checkbox" data-group="' + group + '" value="' + esc(value) + '"' + (checked ? ' checked' : '') + '>' +
    '<span class="fchk-box" aria-hidden="true"></span><span class="fchk-label">' + esc(label) + '</span></label>';
}

function renderFilterPane(){
  const examLabel = getExamLabel(currentCourse, currentLevel);
  let html = '';
  html += '<div class="cat-filter-exam">' + esc(examLabel) + '</div>';

  html += '<div class="cat-filter-sec"><h4>Subject</h4>';
  subjectList.forEach(s => { html += chkHTML('subjects', s, s, filters.subjects.has(s)); });
  html += '</div>';

  html += '<div class="cat-filter-sec"><h4>Category</h4>' +
    chkHTML('categories', 'single', 'Single', filters.categories.has('single')) +
    chkHTML('categories', 'combo', 'Combo', filters.categories.has('combo')) +
  '</div>';

  html += '<div class="cat-filter-sec"><h4>Sub Category</h4>' +
    chkHTML('batches', 'regular', BATCH_TYPES.regular.label, filters.batches.has('regular')) +
    chkHTML('batches', 'fasttrack', BATCH_TYPES.fasttrack.label, filters.batches.has('fasttrack')) +
  '</div>';

  html += '<div class="cat-filter-sec"><h4>Faculties</h4>' +
    '<input type="search" id="facultySearch" class="cat-search" placeholder="Search faculties…" autocomplete="off" value="' + esc(facultySearchText) + '">' +
    '<div id="facultyList" class="cat-faculty-list"></div>' +
    '<button type="button" id="facultyToggleBtn" class="cat-link hidden"></button>' +
  '</div>';

  filterBody.innerHTML = html;
  renderFacultyList();
}

function renderFacultyList(){
  const listEl = document.getElementById('facultyList');
  const toggleBtn = document.getElementById('facultyToggleBtn');
  if(!listEl) return;
  const q = normName(facultySearchText);
  let items;
  if(q){
    items = facultyList.filter(f => normName(f).indexOf(q) > -1);
    toggleBtn.classList.add('hidden');
  } else if(facultyShowAll || facultyList.length <= FACULTY_DEFAULT_VISIBLE){
    items = facultyList.slice();
    toggleBtn.classList.toggle('hidden', facultyList.length <= FACULTY_DEFAULT_VISIBLE);
    toggleBtn.textContent = 'Show fewer';
  } else {
    // default: the first few names, plus any names the visitor has already ticked
    items = facultyList.filter((f, i) => i < FACULTY_DEFAULT_VISIBLE || filters.faculties.has(f));
    toggleBtn.classList.remove('hidden');
    toggleBtn.textContent = 'Show all ' + facultyList.length + ' faculties';
  }
  listEl.innerHTML = items.length
    ? items.map(f => chkHTML('faculties', f, f, filters.faculties.has(f))).join('')
    : '<div class="cat-nofac">No faculty found</div>';
}

function anyFilterActive(){
  return filters.subjects.size || filters.categories.size || filters.batches.size || filters.faculties.size;
}

function productMatches(p){
  if(filters.subjects.size && !p.subjects.some(s => filters.subjects.has(s))) return false;
  if(filters.categories.size && !filters.categories.has(p.category)) return false;
  if(filters.batches.size && !filters.batches.has(p.batch)) return false;
  if(filters.faculties.size && !p.faculties.some(f => filters.faculties.has(f))) return false;
  return true;
}

function applyFilters(){
  filtered = catalog.filter(productMatches);
  shownCount = Math.min(PAGE_SIZE, filtered.length);
  productGrid.innerHTML = '';
  appendCards(0, shownCount);
  clearFiltersBtn.classList.toggle('hidden', !anyFilterActive());
  updateGridChrome();
}

function appendCards(from, to){
  let html = '';
  for(let i = from; i < to; i++) html += cardHTML(filtered[i], i - from);
  productGrid.insertAdjacentHTML('beforeend', html);
}

function updateGridChrome(){
  const none = filtered.length === 0;
  noProductsMsg.classList.toggle('hidden', !none);
  productGrid.classList.toggle('hidden', none);
  showMoreWrap.classList.toggle('hidden', shownCount >= filtered.length);
  resultCount.textContent = none ? '' : ('Showing ' + shownCount + ' of ' + filtered.length + ' lectures');
}

filterBody.addEventListener('change', (e)=>{
  const input = e.target;
  if(!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;
  const set = filters[input.dataset.group];
  if(!set) return;
  if(input.checked) set.add(input.value); else set.delete(input.value);
  if(input.dataset.group === 'faculties') renderFacultyList();
  applyFilters();
});
filterBody.addEventListener('input', (e)=>{
  if(e.target && e.target.id === 'facultySearch'){
    facultySearchText = e.target.value;
    renderFacultyList();
  }
});
filterBody.addEventListener('click', (e)=>{
  if(e.target && e.target.id === 'facultyToggleBtn'){
    facultyShowAll = !facultyShowAll;
    renderFacultyList();
  }
});
clearFiltersBtn.addEventListener('click', ()=>{
  Object.keys(filters).forEach(k => filters[k].clear());
  facultySearchText = '';
  facultyShowAll = false;
  renderFilterPane();
  applyFilters();
});
showMoreBtn.addEventListener('click', ()=>{
  const from = shownCount;
  shownCount = Math.min(shownCount + PAGE_SIZE, filtered.length);
  appendCards(from, shownCount);
  updateGridChrome();
});

/* mobile / narrow screens: filter pane becomes a slide-in drawer */
function openFilterDrawer(){
  filterPane.classList.add('open');
  filterBackdrop.classList.add('open');
  document.body.classList.add('cat-lock');
}
function closeFilterDrawer(){
  filterPane.classList.remove('open');
  filterBackdrop.classList.remove('open');
  document.body.classList.remove('cat-lock');
}
filterToggleBtn.addEventListener('click', openFilterDrawer);
filterCloseBtn.addEventListener('click', closeFilterDrawer);
filterBackdrop.addEventListener('click', closeFilterDrawer);

/* ============================================================
   OPENING A CARD
   ============================================================ */
function onCardActivate(e){
  if(e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.pc');
  if(!card) return;
  if(e.type === 'keydown') e.preventDefault();
  openProduct(card.dataset.id, true);
}
productGrid.addEventListener('click', onCardActivate);
productGrid.addEventListener('keydown', onCardActivate);
productView.addEventListener('click', (e)=>{ if(e.target.closest('.pc')) onCardActivate(e); });
productView.addEventListener('keydown', (e)=>{ if(e.target.closest('.pc')) onCardActivate(e); });

function productURL(id){
  const params = new URLSearchParams();
  params.set('course', currentCourse);
  params.set('level', currentLevel);
  if(id) params.set('product', id);
  return window.location.pathname + '?' + params.toString();
}

function showCatalogView(){
  stopRelatedCarousel();
  productView.classList.add('hidden');
  productView.innerHTML = '';
  catalogView.classList.remove('hidden');
  currentProduct = null;
  document.title = getExamLabel(currentCourse, currentLevel) + ' Lectures — Ambitious Professionals';
}

function openProduct(id, push){
  const p = catalog.find(x => x.id === id);
  if(!p){
    showCatalogView();
    return;
  }
  if(push) savedScrollY = window.scrollY;
  closeFilterDrawer();
  stopRelatedCarousel();
  currentProduct = p;
  couponState = null;
  catalogView.classList.add('hidden');
  productView.classList.remove('hidden');
  renderProduct(p);
  document.title = p.title + ' — Ambitious Professionals';
  if(push) history.pushState({ product:id }, '', productURL(id));
  window.scrollTo({ top:0, behavior:'instant' });
}

function closeProduct(){
  if(history.state && history.state.product){
    history.back();           // popstate handler below shows the catalog again
  } else {
    history.replaceState({}, '', productURL(null));
    showCatalogView();
    window.scrollTo({ top:0, behavior:'instant' });
  }
}

window.addEventListener('popstate', ()=>{
  if(!currentCourse) return;
  const id = new URLSearchParams(window.location.search).get('product');
  if(id && catalog.some(x => x.id === id)){
    openProduct(id, false);
  } else {
    showCatalogView();
    window.scrollTo({ top:savedScrollY, behavior:'instant' });
  }
});

/* ============================================================
   PRODUCT PAGE
   ============================================================ */
function optionsHTML(list, placeholder){
  return '<option value="" selected disabled>' + esc(placeholder) + '</option>' +
    list.map(v => '<option value="' + esc(v) + '">' + esc(v) + '</option>').join('');
}

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

function relatedProducts(p){
  const out = [];
  const used = new Set([p.id]);
  catalog.forEach(x => {
    if(out.length < 6 && !used.has(x.id) && x.subjects.some(s => p.subjects.indexOf(s) > -1)){ out.push(x); used.add(x.id); }
  });
  catalog.forEach(x => {
    if(out.length < 12 && !used.has(x.id)){ out.push(x); used.add(x.id); }
  });
  return out;
}

function renderProduct(p){
  const attempts = getAttemptsFor(p.course, p.level);
  const related = relatedProducts(p);
  const rules = getProductRules(p);
  const bookHTML = rules.bookDisabled
    ? '<select id="pvBook" disabled><option value="Not Applicable" selected>Not applicable</option></select>'
    : '<select id="pvBook">' + optionsHTML(BOOK_PREFERENCES, 'Select preference') + '</select>';
  productView.innerHTML =
    '<button type="button" class="pv-back" id="pvBack"><span aria-hidden="true">←</span> Back to all lectures</button>' +
    '<div class="pv-top">' +
      '<div class="pv-visual">' + posterHTML(p) + '</div>' +
      '<div class="pv-info">' +
        '<h1 class="pv-title">' + esc(p.title) + '</h1>' +
        '<div class="pv-selects">' +
          '<div class="pv-field"><label for="pvAttempt">For the Attempt</label><select id="pvAttempt">' + optionsHTML(attempts, 'Select attempt') + '</select></div>' +
          '<div class="pv-field"><label for="pvBook">Book Preference</label>' + bookHTML + '</div>' +
          '<div class="pv-field"><label for="pvMode">Mode of Class</label><select id="pvMode">' + optionsHTML(rules.modes, 'Select mode') + '</select></div>' +
        '</div>' +
        '<div class="pv-coupon">' +
          '<button type="button" class="pv-coupon-link" id="pvCouponToggle">Apply Coupon Code (if any)</button>' +
          '<div class="pv-coupon-box hidden" id="pvCouponBox">' +
            '<input type="text" id="pvCouponInput" placeholder="Enter coupon code" autocomplete="off" maxlength="30">' +
            '<button type="button" class="pv-coupon-apply" id="pvCouponApply">Apply</button>' +
          '</div>' +
          '<div class="pv-coupon-msg hidden" id="pvCouponMsg"></div>' +
        '</div>' +
        '<div class="pv-price" id="pvPrice"></div>' +
        '<button type="button" class="btn btn-primary pv-cta" id="pvCta">Login to Proceed</button>' +
      '</div>' +
    '</div>' +

    '<div class="pv-tabs-wrap">' +
      '<div class="pv-tabs" role="tablist">' +
        '<button type="button" role="tab" class="pv-tab active" data-tab="info" aria-selected="true">Product Info</button>' +
        '<button type="button" role="tab" class="pv-tab" data-tab="faculty" aria-selected="false">Faculty Info</button>' +
        '<button type="button" role="tab" class="pv-tab" data-tab="terms" aria-selected="false">Terms &amp; Conditions</button>' +
      '</div>' +
      '<div class="pv-panel" data-panel="info">' + productInfoTableHTML(p) + '</div>' +
      '<div class="pv-panel hidden" data-panel="faculty">' + facultyInfoHTML(p) + '</div>' +
      '<div class="pv-panel hidden" data-panel="terms">' + termsHTML() + '</div>' +
    '</div>' +

    (related.length ? (
      '<div class="pv-related">' +
        '<h3 class="pv-related-title">Related Lectures</h3>' +
        '<div class="rel-carousel" id="relCarousel">' +
          '<div class="rel-viewport"><div class="rel-track">' +
            related.map(r => '<div class="rel-item">' + miniCardHTML(r) + '</div>').join('') +
          '</div></div>' +
          '<button type="button" class="rel-arrow rel-prev" id="relPrev" aria-label="Previous">‹</button>' +
          '<button type="button" class="rel-arrow rel-next" id="relNext" aria-label="Next">›</button>' +
        '</div>' +
      '</div>'
    ) : '');

  wireProductPage(p);
}

function updatePriceBlock(){
  const p = currentProduct;
  const box = document.getElementById('pvPrice');
  if(!p || !box) return;
  const shown = couponState ? couponState.finalPrice : p.price;
  let html = '<div class="pv-price-row">' +
    '<s class="pv-mrp">' + esc(formatRupees(p.mrp)) + '</s>' +
    '<b class="pv-final">' + esc(formatRupees(shown)) + '</b>' +
    '<span class="pc-off">' + esc(p.discount ? (p.discount + '% off') : '---% off') + '</span>' +
  '</div>';
  if(couponState){
    html += '<div class="pv-saved">Coupon ' + esc(couponState.code) + ' applied: −' + esc(formatRupees(couponState.off)) + '</div>';
  }
  box.innerHTML = html;
}

function refreshCTA(){
  const btn = document.getElementById('pvCta');
  if(!btn || btn.dataset.flashing) return;
  const want = isLoggedIn() ? 'Add to Cart' : 'Login to Proceed';
  if(btn.textContent !== want) btn.textContent = want;
}

function wireProductPage(p){
  document.getElementById('pvBack').addEventListener('click', closeProduct);
  updatePriceBlock();
  refreshCTA();
  if(getProductRules(p).modes.length === 1) document.getElementById('pvMode').selectedIndex = 1;   // only one choice: pre-select it

  /* tabs */
  productView.querySelectorAll('.pv-tab').forEach(tab => {
    tab.addEventListener('click', ()=>{
      productView.querySelectorAll('.pv-tab').forEach(t => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      productView.querySelectorAll('.pv-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.panel !== tab.dataset.tab);
      });
    });
  });

  /* coupon */
  const couponBox = document.getElementById('pvCouponBox');
  const couponInput = document.getElementById('pvCouponInput');
  const couponMsg = document.getElementById('pvCouponMsg');
  document.getElementById('pvCouponToggle').addEventListener('click', ()=>{
    couponBox.classList.toggle('hidden');
    if(!couponBox.classList.contains('hidden')) couponInput.focus();
  });
  function applyCoupon(){
    if(couponState){ // second press acts as "Remove"
      couponState = null;
      couponInput.value = '';
      couponInput.disabled = false;
      document.getElementById('pvCouponApply').textContent = 'Apply';
      couponMsg.classList.add('hidden');
      updatePriceBlock();
      return;
    }
    const res = applyCouponToPrice(couponInput.value, p.price);
    couponMsg.classList.remove('hidden');
    couponMsg.classList.toggle('ok', !!res.ok);
    couponMsg.classList.toggle('bad', !res.ok);
    couponMsg.textContent = res.message;
    if(res.ok){
      couponState = { code:res.code, off:res.off, finalPrice:res.finalPrice };
      couponInput.disabled = true;
      document.getElementById('pvCouponApply').textContent = 'Remove';
      updatePriceBlock();
    }
  }
  document.getElementById('pvCouponApply').addEventListener('click', applyCoupon);
  couponInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); applyCoupon(); } });

  /* main button */
  document.getElementById('pvCta').addEventListener('click', ()=>{
    const btn = document.getElementById('pvCta');
    if(!isLoggedIn()){
      openOverlay('signInOverlay');
      return;
    }
    const attempt = document.getElementById('pvAttempt').value;
    const book = document.getElementById('pvBook').value;
    const mode = document.getElementById('pvMode').value;
    if(!attempt || !book || !mode){
      showToast('Please select the attempt, book preference and mode of class first.', 'error');
      return;
    }
    p.items.forEach(it => {
      cartItems.push({
        kind:'classPaper', course:p.course, level:p.level,
        paperNo:it.paperNo, paperName:it.paperName, faculty:it.faculty,
        attempt:attempt, typeOfClass:BATCH_TYPES[p.batch].label,
        bookPreference:book, modeOfClass:mode
      });
    });
    saveCartToFirestore().then(()=>{
      updateCartBadge();
      btn.dataset.flashing = '1';
      btn.textContent = 'Added to Cart ✓';
      setTimeout(()=>{ delete btn.dataset.flashing; refreshCTA(); }, 1800);
    });
  });

  initRelatedCarousel();
}

/* the button text follows the visitor's sign-in state (signing in/out happens on this same page) */
setInterval(()=>{ if(currentProduct) refreshCTA(); }, 400);

/* ============================================================
   RELATED PRODUCTS CAROUSEL — slides by itself, loops without a jump
   ============================================================ */
function stopRelatedCarousel(){
  if(relCleanup){ relCleanup(); relCleanup = null; }
}

function initRelatedCarousel(){
  const root = document.getElementById('relCarousel');
  if(!root) return;
  const track = root.querySelector('.rel-track');
  const originals = Array.prototype.slice.call(track.children);
  const total = originals.length;
  let perView = 5;
  let index = 0;
  let paused = false;

  function getPerView(){
    const w = root.clientWidth;
    if(w >= 1100) return 5;
    if(w >= 860) return 4;
    if(w >= 600) return 3;
    return 2;
  }
  function stepWidth(){
    const first = track.children[0];
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  }
  function setPos(animate){
    track.style.transition = animate ? 'transform .65s ease' : 'none';
    track.style.transform = 'translateX(' + (-index * stepWidth()) + 'px)';
  }
  function build(){
    track.querySelectorAll('.rel-clone').forEach(n => n.remove());
    perView = getPerView();
    root.style.setProperty('--n', perView);
    root.classList.toggle('rel-static', total <= perView);
    if(total > perView){
      originals.slice(0, perView).forEach(it => {
        const c = it.cloneNode(true);
        c.classList.add('rel-clone');
        c.setAttribute('aria-hidden', 'true');
        c.querySelectorAll('.pc').forEach(card => card.tabIndex = -1);
        track.appendChild(c);
      });
    }
    index = 0;
    setPos(false);
  }
  function next(){
    if(total <= perView) return;
    index++;
    setPos(true);
    if(index >= total){
      setTimeout(()=>{ index = 0; setPos(false); }, 680);
    }
  }
  function prev(){
    if(total <= perView) return;
    if(index === 0){ index = total; setPos(false); void track.offsetWidth; }
    index--;
    setPos(true);
  }

  build();
  document.getElementById('relNext').addEventListener('click', next);
  document.getElementById('relPrev').addEventListener('click', prev);
  root.addEventListener('mouseenter', ()=>{ paused = true; });
  root.addEventListener('mouseleave', ()=>{ paused = false; });
  root.addEventListener('focusin', ()=>{ paused = true; });
  root.addEventListener('focusout', ()=>{ paused = false; });

  const timer = setInterval(()=>{ if(!paused && !document.hidden) next(); }, 2800);
  let resizeT = null;
  function onResize(){ clearTimeout(resizeT); resizeT = setTimeout(build, 150); }
  window.addEventListener('resize', onResize);

  relCleanup = ()=>{
    clearInterval(timer);
    clearTimeout(resizeT);
    window.removeEventListener('resize', onResize);
  };
}

/* ============================================================
   START-UP — reads ?course=…&level=…(&product=…) from the address
   ============================================================ */
function initCoursesFromURL(){
  const params = new URLSearchParams(window.location.search);
  const urlCourse = params.get('course');
  const urlLevel = params.get('level');
  const urlProduct = params.get('product');

  if(urlCourse === 'MBA'){
    coursesHeading.textContent = 'MBA Guidance';
    noSelectionMsg.classList.add('hidden');
    catalogView.classList.add('hidden');
    productView.classList.add('hidden');
    if(mbaPanelSection) mbaPanelSection.classList.remove('hidden');
    return;
  }
  if(mbaPanelSection) mbaPanelSection.classList.add('hidden');

  const validCourse = urlCourse === 'CA' || urlCourse === 'CMA' || urlCourse === 'CS';
  const validCALevel = (urlCourse === 'CA' || urlCourse === 'CMA') && (urlLevel === 'Foundation' || urlLevel === 'Intermediate' || urlLevel === 'Final');
  const validCSLevel = urlCourse === 'CS' && (urlLevel === 'CSEET' || urlLevel === 'Executive' || urlLevel === 'Professional');

  if(!(validCourse && (validCALevel || validCSLevel))){
    noSelectionMsg.classList.remove('hidden');
    catalogView.classList.add('hidden');
    productView.classList.add('hidden');
    return;
  }

  currentCourse = urlCourse;
  currentLevel = urlLevel;
  coursesHeading.textContent = getExamLabel(urlCourse, urlLevel);
  noSelectionMsg.classList.add('hidden');

  catalog = buildCatalog(currentCourse, currentLevel);
  subjectList = (COURSES[currentCourse][currentLevel] || []).map(pp => pp.name);
  const seen = {};
  facultyList = [];
  catalog.forEach(pr => pr.faculties.forEach(f => { if(!seen[f]){ seen[f] = 1; facultyList.push(f); } }));
  // same preference order as the cards: first list, second list, then everyone else
  const originalIdx = {};
  facultyList.forEach((f, i) => originalIdx[f] = i);
  facultyList.sort((a, b)=>{
    const ta = facultyTier(a), tb = facultyTier(b);
    if(ta.tier !== tb.tier) return ta.tier - tb.tier;
    if(ta.idx !== tb.idx) return ta.idx - tb.idx;
    return originalIdx[a] - originalIdx[b];
  });

  renderFilterPane();
  catalogView.classList.remove('hidden');
  applyFilters();

  catalogHead.classList.add('hidden');   // the filter pane already shows the exam name, so cards start right under the menu
  document.title = getExamLabel(currentCourse, currentLevel) + ' Lectures — Ambitious Professionals';

  if(urlProduct && catalog.some(x => x.id === urlProduct)){
    // opened straight from a shared link: make the catalog the "previous page" so Back works
    history.replaceState({}, '', productURL(null));
    openProduct(urlProduct, true);
  }
}
initCoursesFromURL();

/* ---------- MBA button (unchanged behaviour) ---------- */
const mbaBookBtnEl = document.getElementById('mbaBookBtn');
if(mbaBookBtnEl){
  mbaBookBtnEl.addEventListener('click', ()=>{
    if(!requireAuthOrPrompt()) return;
    pendingCounsellingType = 'mba';
    document.getElementById('counsellingDetailsTitle').textContent = 'MBA Counselling Request';
    document.getElementById('cdExamField').classList.add('hidden');
    document.getElementById('cdExam').removeAttribute('required');
    document.getElementById('counsellingDetailsForm').reset();
    document.getElementById('cdWordCount').textContent = '0';
    openOverlay('counsellingDetailsOverlay');
  });
}
