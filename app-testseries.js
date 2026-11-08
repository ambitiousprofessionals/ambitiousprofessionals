/* ============================================================
   TEST SERIES PAGE — "AMBITION SERIES"
   Works with: test-series.html, app-coursedata.js, app-common.js
   Address format:  test-series.html?course=CA&level=Intermediate            -> the two cards
                    test-series.html?course=CA&level=Intermediate&type=group -> the product page
   ============================================================ */

let tsCourse = null;
let tsLevel = null;
let tsProduct = null;        // the card that is currently open
let tsChosen = [];           // subjects ticked (Subject Wise)
let tsCouponCode = '';       // coupon typed in and accepted
let tsCouponMsgState = null; // 'ok' | 'bad' | null

const tsMentor   = document.getElementById('tsMentor');
const tsPicker   = document.getElementById('tsPicker');
const tsCards    = document.getElementById('tsCards');
const tsProductEl = document.getElementById('tsProduct');

/* (esc, isLoggedIn, poster pieces, text fitting and the exam chooser live in app-cards.js) */

const TS_HINTS = {
  group:   'Choose your attempt & group',
  subject: 'Choose attempt, number & subjects',
  all:     'Choose your attempt'
};

function tsCardHTML(p){
  return '<article class="pc ts-card" data-type="' + esc(p.typeKey) + '" tabindex="0" role="link" aria-label="' + esc(p.title) + '">' +
    tsPosterHTML(p) +
    '<div class="pc-strip pc-strip-ts">' +
      '<h3 class="pc-title">' + esc(p.title) + '</h3>' +
      '<div class="pc-sep"></div>' +
      '<div class="pc-hint">' + esc(TS_HINTS[p.typeKey] || '') + ' <span aria-hidden="true">→</span></div>' +
    '</div>' +
  '</article>';
}

function renderCards(){
  tsCards.innerHTML = getTSTypes(tsCourse, tsLevel).map(t => tsCardHTML(makeTSProduct(tsCourse, tsLevel, t.key))).join('');
  fitPosterText(tsCards);
}

tsCards.addEventListener('click', onCardActivate);
tsCards.addEventListener('keydown', onCardActivate);
function onCardActivate(e){
  if(e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.ts-card');
  if(!card) return;
  if(e.type === 'keydown') e.preventDefault();
  openProduct(card.dataset.type, true);
}

/* ============================================================
   ROUTING
   ============================================================ */
function pageURL(type){
  const params = new URLSearchParams();
  params.set('course', tsCourse);
  params.set('level', tsLevel);
  if(type) params.set('type', type);
  return window.location.pathname + '?' + params.toString();
}

function showCards(){
  tsProduct = null;
  tsProductEl.classList.add('hidden');
  tsProductEl.innerHTML = '';
  tsMentor.classList.remove('hidden');
  tsCards.classList.remove('hidden');
  fitPosterText(tsCards);
  document.title = getExamLabel(tsCourse, tsLevel) + ' Test Series — Ambitious Professionals';
}

function openProduct(typeKey, push){
  const p = makeTSProduct(tsCourse, tsLevel, typeKey);
  if(!p){ showCards(); return; }
  tsProduct = p;
  tsChosen = [];
  tsCouponCode = '';
  tsCouponMsgState = null;
  tsMentor.classList.add('hidden');
  tsCards.classList.add('hidden');
  tsProductEl.classList.remove('hidden');
  renderProduct(p);
  document.title = p.title + ' — Ambitious Professionals';
  if(push) history.pushState({ type:typeKey }, '', pageURL(typeKey));
  window.scrollTo({ top:0, behavior:'instant' });
}

function closeProduct(){
  if(history.state && history.state.type){
    history.back();
  } else {
    history.replaceState({}, '', pageURL(null));
    showCards();
    window.scrollTo({ top:0, behavior:'instant' });
  }
}

window.addEventListener('popstate', ()=>{
  if(!tsCourse) return;
  const type = new URLSearchParams(window.location.search).get('type');
  if(type && getTSTypes(tsCourse, tsLevel).some(t => t.key === type)){
    openProduct(type, false);
  } else {
    showCards();
  }
});

/* ============================================================
   PRODUCT PAGE
   ============================================================ */
function optionsHTML(list, placeholder){
  return '<option value="" selected disabled>' + esc(placeholder) + '</option>' +
    list.map(o => '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>').join('');
}

function renderProduct(p){
  const attempts = getAttemptsFor(p.course, p.level).map(a => ({ value:a, label:a }));
  const subjects = getTSSubjects(p.course, p.level);
  let extra = '';
  if(p.typeKey === 'group'){
    extra = '<div class="pv-field"><label for="tsGroup">Group</label><select id="tsGroup">' +
      optionsHTML(['Group 1', 'Group 2', 'Both Groups'].map(g => ({ value:g, label:g })), 'Select group') + '</select></div>';
  } else if(p.typeKey === 'subject'){
    const counts = [];
    for(let i = 1; i < subjects.length; i++) counts.push({ value:String(i), label:'Any ' + i });
    extra =
      '<div class="pv-field"><label for="tsCount">Number of Subjects</label><select id="tsCount">' + optionsHTML(counts, 'Select number of subjects') + '</select></div>' +
      '<div class="pv-field"><label for="tsMsBtn">Subjects</label>' +
        '<div class="ms" id="tsMs">' +
          '<button type="button" class="ms-btn" id="tsMsBtn" disabled><span id="tsMsLabel">Select number of subjects first</span></button>' +
          '<div class="ms-panel hidden" id="tsMsPanel" role="group" aria-label="Subjects"></div>' +
        '</div>' +
      '</div>';
  }

  tsProductEl.innerHTML =
    '<button type="button" class="pv-back" id="tsBack"><span aria-hidden="true">←</span> Back</button>' +
    '<div class="pv-top">' +
      '<div class="pv-visual">' + tsPosterHTML(p) + '</div>' +
      '<div class="pv-info">' +
        '<h1 class="pv-title">' + esc(p.title) + '</h1>' +
        '<div class="pv-selects">' +
          '<div class="pv-field"><label for="tsAttempt">For the Attempt</label><select id="tsAttempt">' + optionsHTML(attempts, 'Select attempt') + '</select></div>' +
          extra +
        '</div>' +
        '<div class="pv-coupon">' +
          '<button type="button" class="pv-coupon-link" id="tsCouponToggle">Apply Coupon Code (if any)</button>' +
          '<div class="pv-coupon-box hidden" id="tsCouponBox">' +
            '<input type="text" id="tsCouponInput" placeholder="Enter coupon code" autocomplete="off" maxlength="30">' +
            '<button type="button" class="pv-coupon-apply" id="tsCouponApply">Apply</button>' +
          '</div>' +
          '<div class="pv-coupon-msg hidden" id="tsCouponMsg"></div>' +
        '</div>' +
        '<div class="pv-price" id="tsPrice"></div>' +
        '<button type="button" class="btn btn-primary pv-cta" id="tsCta">Login to Proceed</button>' +
      '</div>' +
    '</div>';

  fitPosterText(tsProductEl);
  wireProduct(p, subjects);
}

function currentOption(p){
  if(p.typeKey === 'group'){ const g = document.getElementById('tsGroup'); return g ? g.value : ''; }
  if(p.typeKey === 'subject'){ const c = document.getElementById('tsCount'); return c ? c.value : ''; }
  return undefined;
}

function updatePriceBlock(){
  const p = tsProduct;
  const box = document.getElementById('tsPrice');
  if(!p || !box) return;
  const info = getTSPriceInfo(p, currentOption(p));
  let shown = info.price;
  let couponLine = '';
  if(tsCouponCode){
    const res = applyCouponToPrice(tsCouponCode, info.price);
    if(res.ok){
      shown = res.finalPrice;
      couponLine = '<div class="pv-saved">Coupon ' + esc(res.code) + ' applied: −' + esc(formatRupees(res.off)) + '</div>';
    }
  }
  box.innerHTML =
    '<div class="pv-price-row">' +
      '<s class="pv-mrp' + (info.mrp ? '' : ' pc-na') + '">' + esc(formatRupees(info.mrp)) + '</s>' +
      '<b class="pv-final">' + esc(formatRupees(shown)) + '</b>' +
      '<span class="pc-off">' + esc(info.discount ? (info.discount + '% off') : '---% off') + '</span>' +
    '</div>' + couponLine;
}

function refreshCTA(){
  const btn = document.getElementById('tsCta');
  if(!btn || btn.dataset.flashing) return;
  const want = isLoggedIn() ? 'Add to Cart' : 'Login to Proceed';
  if(btn.textContent !== want) btn.textContent = want;
}
setInterval(()=>{ if(tsProduct) refreshCTA(); }, 400);

function wireProduct(p, subjects){
  document.getElementById('tsBack').addEventListener('click', closeProduct);
  updatePriceBlock();
  refreshCTA();

  const groupSel = document.getElementById('tsGroup');
  if(groupSel) groupSel.addEventListener('change', updatePriceBlock);

  /* ----- Subject Wise: number of subjects + tick list ----- */
  const countSel = document.getElementById('tsCount');
  if(countSel){
    const msBtn = document.getElementById('tsMsBtn');
    const msPanel = document.getElementById('tsMsPanel');
    const msLabel = document.getElementById('tsMsLabel');

    function wanted(){ return parseInt(countSel.value, 10) || 0; }

    function buildPanel(){
      let html = '';
      let lastGroup = null;
      subjects.forEach((s, i) => {
        if(s.group && s.group !== lastGroup){
          lastGroup = s.group;
          html += '<div class="ms-group">' + esc(s.group) + '</div>';
        }
        html += '<label class="fchk"><input type="checkbox" value="' + i + '">' +
          '<span class="fchk-box" aria-hidden="true"></span><span class="fchk-label">' + esc(s.name) + '</span></label>';
      });
      msPanel.innerHTML = html;
    }
    function syncPanel(){
      const n = wanted();
      const full = n > 0 && tsChosen.length >= n;
      msPanel.querySelectorAll('input[type=checkbox]').forEach(inp => {
        const name = subjects[parseInt(inp.value, 10)].name;
        inp.checked = tsChosen.indexOf(name) > -1;
        const lock = full && !inp.checked;
        inp.disabled = lock;
        inp.closest('.fchk').classList.toggle('is-disabled', lock);
      });
      if(!n){
        msLabel.textContent = 'Select number of subjects first';
        msBtn.disabled = true;
      } else {
        msBtn.disabled = false;
        msLabel.textContent = tsChosen.length === 0
          ? ('Select ' + n + ' subject' + (n > 1 ? 's' : ''))
          : (tsChosen.length + ' of ' + n + ' selected');
      }
      msBtn.classList.toggle('ms-done', n > 0 && tsChosen.length === n);
    }
    buildPanel();
    syncPanel();

    countSel.addEventListener('change', ()=>{
      tsChosen = [];                 // a new number starts the ticking again
      syncPanel();
      updatePriceBlock();
      msPanel.classList.add('hidden');
    });
    msBtn.addEventListener('click', ()=>{ msPanel.classList.toggle('hidden'); });
    msPanel.addEventListener('change', (e)=>{
      const inp = e.target;
      if(!(inp instanceof HTMLInputElement)) return;
      const name = subjects[parseInt(inp.value, 10)].name;
      const n = wanted();
      if(inp.checked){
        if(tsChosen.length >= n){ inp.checked = false; return; }
        tsChosen.push(name);
      } else {
        tsChosen = tsChosen.filter(x => x !== name);
      }
      syncPanel();
    });
    p._openPanel = ()=>{ msPanel.classList.remove('hidden'); };
  }

  /* ----- coupon ----- */
  const couponBox = document.getElementById('tsCouponBox');
  const couponInput = document.getElementById('tsCouponInput');
  const couponMsg = document.getElementById('tsCouponMsg');
  const couponApply = document.getElementById('tsCouponApply');
  document.getElementById('tsCouponToggle').addEventListener('click', ()=>{
    couponBox.classList.toggle('hidden');
    if(!couponBox.classList.contains('hidden')) couponInput.focus();
  });
  function applyCoupon(){
    if(tsCouponCode){                 // second press acts as "Remove"
      tsCouponCode = '';
      couponInput.value = '';
      couponInput.disabled = false;
      couponApply.textContent = 'Apply';
      couponMsg.classList.add('hidden');
      updatePriceBlock();
      return;
    }
    const info = getTSPriceInfo(p, currentOption(p));
    const res = applyCouponToPrice(couponInput.value, info.price);
    couponMsg.classList.remove('hidden');
    couponMsg.classList.toggle('ok', !!res.ok);
    couponMsg.classList.toggle('bad', !res.ok);
    couponMsg.textContent = res.message;
    if(res.ok){
      tsCouponCode = res.code;
      couponInput.disabled = true;
      couponApply.textContent = 'Remove';
      updatePriceBlock();
    }
  }
  couponApply.addEventListener('click', applyCoupon);
  couponInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ e.preventDefault(); applyCoupon(); } });

  /* ----- main button ----- */
  document.getElementById('tsCta').addEventListener('click', ()=>{
    const btn = document.getElementById('tsCta');
    if(!isLoggedIn()){ openOverlay('signInOverlay'); return; }

    const attempt = document.getElementById('tsAttempt').value;
    if(!attempt){ showToast('Please select the attempt first.', 'error'); return; }

    let attemptingFor = '';
    if(p.typeKey === 'group'){
      attemptingFor = document.getElementById('tsGroup').value;
      if(!attemptingFor){ showToast('Please select the group first.', 'error'); return; }
    } else if(p.typeKey === 'all'){
      attemptingFor = 'All Subjects';
    } else {
      const n = parseInt(document.getElementById('tsCount').value, 10) || 0;
      if(!n){ showToast('Please select the number of subjects first.', 'error'); return; }
      if(tsChosen.length !== n){
        showToast('Please tick exactly ' + n + ' subject' + (n > 1 ? 's' : '') + ' — you have ticked ' + tsChosen.length + '.', 'error');
        if(p._openPanel) p._openPanel();
        return;
      }
      attemptingFor = 'Any ' + n + ' Subject' + (n > 1 ? 's' : '') + ': ' + tsChosen.join(', ');
    }

    const info = getTSPriceInfo(p, currentOption(p));
    const couponRes = tsCouponCode ? applyCouponToPrice(tsCouponCode, info.price) : null;
    const finalPrice = (couponRes && couponRes.ok) ? couponRes.finalPrice : info.price;
    cartItems.push({
      kind:'testSeries',
      examToAppear: getExamLabel(p.course, p.level),
      attempt: attempt,
      attemptingFor: attemptingFor,
      testSeriesType: 'Ambition Series - ' + p.typeLabel,
      productId: p.id,
      groupId: 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      course: p.course, level: p.level, typeKey: p.typeKey,
      subjects: p.typeKey === 'subject' ? tsChosen.slice() : [],
      mrp: info.mrp, discount: info.discount, price: (finalPrice === undefined ? null : finalPrice),
      coupon: (couponRes && couponRes.ok) ? couponRes.code : '',
      couponOff: (couponRes && couponRes.ok) ? couponRes.off : 0
    });
    saveCartToFirestore().then(()=>{
      updateCartBadge();
      btn.dataset.flashing = '1';
      btn.textContent = 'Added to Cart ✓';
      setTimeout(()=>{ delete btn.dataset.flashing; refreshCTA(); }, 1800);
    });
  });
}

/* close the subject list when clicking anywhere else */
document.addEventListener('click', (e)=>{
  const ms = document.getElementById('tsMs');
  if(!ms || ms.contains(e.target)) return;
  const panel = document.getElementById('tsMsPanel');
  if(panel) panel.classList.add('hidden');
});

/* ============================================================
   START-UP
   ============================================================ */
function renderPicker(){
  buildExamChooser(tsPicker, { target:'test-series.html', courses:['CA','CMA'], title:'Choose your requirement' });
  tsPicker.classList.remove('hidden');
}

function initFromURL(){
  const params = new URLSearchParams(window.location.search);
  const course = params.get('course');
  const level = params.get('level');
  const type = params.get('type');

  if(!tsIsValidExam(course, level)){
    renderPicker();
    return;
  }
  tsCourse = course;
  tsLevel = level;
  renderCards();
  showCards();
  if(type && getTSTypes(course, level).some(t => t.key === type)){
    history.replaceState({}, '', pageURL(null));   // so Back goes to the cards
    openProduct(type, true);
  }
}
initFromURL();
