/**
 * Founder's teaching experience — counts full years since October 2018.
 * Ticks over automatically each 1st of October.
 */
function updateFounderYears(){
  const now = new Date();
  let years = now.getFullYear() - 2018;
  const cutoff = new Date(now.getFullYear(), 9, 1); // October 1st this year
  if(now < cutoff) years -= 1;
  const el = document.getElementById('founderYears');
  if(el) el.textContent = years;
  const el2 = document.getElementById('wwaYears');
  if(el2) el2.textContent = years;
  const el3 = document.getElementById('footYears');
  if(el3) el3.textContent = years;
}
updateFounderYears();

/* ============================================================
   PASSWORD SHOW/HIDE TOGGLES
   ============================================================ */
document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.previousElementSibling;
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    btn.classList.toggle('showing', !showing);
    btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
  });
});

/* ============================================================
   MODALS
   ============================================================ */
function openOverlay(id){
  document.getElementById(id).classList.remove('hidden-overlay');
}
function closeOverlay(id){
  document.getElementById(id).classList.add('hidden-overlay');
  if(id === 'signUpOverlay'){
    document.getElementById('emailSignUpForm').reset();
    resetPasswordChecklist();
    hideError('signUpError');
  }
  if(id === 'signInOverlay'){
    document.getElementById('emailSignInForm').reset();
    hideError('signInError');
  }
  if(id === 'forgotPasswordOverlay'){
    document.getElementById('forgotPasswordForm').reset();
    resetForgotPasswordOtpState();
    document.getElementById('forgotPasswordMsg').style.display = 'none';
  }
}
document.querySelectorAll('[data-close]').forEach(el=>{
  el.addEventListener('click',()=>closeOverlay(el.dataset.close));
});
document.querySelectorAll('.overlay').forEach(ov=>{
  if(ov.id === 'completeProfileOverlay' || ov.id === 'googleSetPasswordOverlay') return; // mandatory — no dismiss until saved
  ov.addEventListener('click',(e)=>{ if(e.target===ov) closeOverlay(ov.id); });
});
document.addEventListener('keydown',(e)=>{
  if(e.key !== 'Escape') return;
  document.querySelectorAll('.overlay:not(.hidden-overlay)').forEach(ov=>{
    if(ov.id === 'completeProfileOverlay' || ov.id === 'googleSetPasswordOverlay') return; // mandatory
    closeOverlay(ov.id);
  });
});

/* ============================================================
   MOBILE NAV (hamburger)
   ============================================================ */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mainNav = document.getElementById('mainNav');
hamburgerBtn.addEventListener('click',()=>{
  mainNav.classList.toggle('mobile-open');
});
mainNav.querySelectorAll('a').forEach(a=>{
  if(a.classList.contains('dropdown-toggle') || a.classList.contains('submenu-toggle')) return;
  a.addEventListener('click',()=>mainNav.classList.remove('mobile-open'));
});

/* ===== COURSES NAV DROPDOWN ===== */
document.querySelectorAll('.dropdown-toggle').forEach(toggle=>{
  toggle.addEventListener('click',(e)=>{
    e.preventDefault();
    const menu = toggle.nextElementSibling;
    document.querySelectorAll('.dropdown-menu.open').forEach(m=>{ if(m!==menu) m.classList.remove('open'); });
    document.querySelectorAll('.submenu.open').forEach(s=>s.classList.remove('open'));
    menu.classList.toggle('open');
  });
});
document.querySelectorAll('.submenu-toggle').forEach(toggle=>{
  toggle.addEventListener('click',(e)=>{
    e.preventDefault();
    e.stopPropagation();
    const sub = toggle.nextElementSibling;
    document.querySelectorAll('.submenu.open').forEach(s=>{ if(s!==sub) s.classList.remove('open'); });
    sub.classList.toggle('open');
  });
});
document.addEventListener('click',(e)=>{
  if(!e.target.closest('.has-dropdown')){
    document.querySelectorAll('.dropdown-menu.open, .submenu.open').forEach(el=>el.classList.remove('open'));
  }
});

/* ===== EMAIL LINKS: Gmail app on mobile, Gmail web compose on desktop ===== */
document.querySelectorAll('a.mail-link').forEach(a=>{
  a.addEventListener('click', function(e){
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(!isMobile){
      e.preventDefault();
      const email = a.dataset.email;
      window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + email, '_blank');
    }
    // On mobile, let the default mailto: link proceed — this opens the Gmail app directly.
  });
});

/* ===== ACTIVE NAV HIGHLIGHT ===== */
(function highlightActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const topLevelLinks = document.querySelectorAll('#mainNav > ul > li > a');
  topLevelLinks.forEach(a=>{
    const href = a.getAttribute('href');
    if(href === path || (path === '' && href === 'index.html')){
      a.classList.add('nav-active');
    }
  });
})();

/* word counter (counselling details modal only) */
function wireWordCount(textareaId, counterId, max){
  const ta = document.getElementById(textareaId);
  const counter = document.getElementById(counterId);
  ta.addEventListener('input',()=>{
    const words = ta.value.trim().split(/\s+/).filter(Boolean);
    if(words.length > max){
      ta.value = words.slice(0,max).join(' ');
    }
    counter.textContent = Math.min(words.length, max);
  });
}

/* ============================================================
   BACKEND SUBMISSION (Google Apps Script)
   ============================================================ */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzSkJLi9__1V-dC9Rp_e_uAGPBCDh1pwf47NhR9u8RhYql3EtMusnfq3K98E3UR8wO1UQ/exec';

function sendToSheet(payload, retriesLeft){
  // no-cors: we can't read the response, but the data still reaches the script.
  if (retriesLeft === undefined) retriesLeft = 1;
  return fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).catch(err => {
    console.error('Submission error:', err);
    if (retriesLeft > 0) {
      return new Promise(resolve => setTimeout(resolve, 1000)).then(() => sendToSheet(payload, retriesLeft - 1));
    }
    throw err;
  });
}

/* ============================================================
   COUNSELLING → CART (shared by MBA panel on Courses page and
   the general counselling strip on the Counselling page)
   ============================================================ */
/**
 * Builds the display/sheet label for a course+level combo.
 * Special-cased because CSEET isn't "CS CSEET" — it's just "CSEET".
 */
function getExamLabel(course, level){
  if(course === 'CS' && level === 'CSEET') return 'CSEET';
  return course + ' ' + level;
}

function flashAddedToCart(btn){
  const original = btn.textContent;
  btn.textContent = 'Added to Cart ✓';
  setTimeout(()=>{ if(btn) btn.textContent = original; }, 1800);
}

function addCounsellingToCart(examOrCourse, whatWantToKnow){
  if(!requireAuthOrPrompt()) return;
  cartItems.push({ kind:'counselling', examOrCourse: examOrCourse, whatWantToKnow: whatWantToKnow });
  saveCartToFirestore().then(()=>{
    updateCartBadge();
  });
}

/* ============================================================
   HOMEPAGE INLINE COUNSELLING FORM
   ============================================================ */
function fillHomeCounsellingProfile(profile){
  const nameEl = document.getElementById('hcName');
  const emailEl = document.getElementById('hcEmail');
  const phoneEl = document.getElementById('hcPhone');
  if(!nameEl) return;
  if(profile){
    nameEl.value = profile.name || '';
    emailEl.value = profile.email || '';
    phoneEl.value = profile.phone || '';
    nameEl.disabled = true;
    emailEl.disabled = true;
    phoneEl.disabled = true;
  } else {
    nameEl.value = '';
    emailEl.value = '';
    phoneEl.value = '';
    nameEl.disabled = false;
    emailEl.disabled = false;
    phoneEl.disabled = false;
  }
}

const homeCounsellingForm = document.getElementById('homeCounsellingForm');
if(homeCounsellingForm){
  homeCounsellingForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const exam = document.getElementById('hcExam').value.trim();
    const extra = document.getElementById('hcExtra').value.trim();
    addCounsellingToCart(exam, extra);
    if(auth.currentUser && currentUserProfile){
      document.getElementById('hcExam').value = '';
      document.getElementById('hcExtra').value = '';
    }
  });
}

let pendingCounsellingType = null; // 'mba' | 'general'

document.getElementById('counsellingDetailsForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const examOrCourse = pendingCounsellingType === 'mba' ? 'MBA' : document.getElementById('cdExam').value.trim();
  const whatWantToKnow = document.getElementById('cdExtra').value.trim();
  closeOverlay('counsellingDetailsOverlay');
  addCounsellingToCart(examOrCourse, whatWantToKnow);
});

wireWordCount('cdExtra','cdWordCount',200);

/* ============================================================
   CART SYSTEM
   ============================================================ */
let cartItems = [];
let currentUserProfile = null; // { studentId, name, email } cached on sign-in

function requireAuthOrPrompt(){
  if(auth.currentUser && currentUserProfile){
    return true;
  }
  showToast('Please sign in or sign up first to add items to your cart.', 'error');
  openOverlay(auth.currentUser ? 'signInOverlay' : 'signUpOverlay');
  return false;
}

function saveCartToFirestore(){
  if(!auth.currentUser) return Promise.resolve();
  return db.collection('users').doc(auth.currentUser.uid).update({ cart: cartItems });
}

function updateCartBadge(){
  const link = document.getElementById('myCartLink');
  link.textContent = cartItems.length ? ('Cart (' + cartItems.length + ')') : 'Cart';
  const badge = document.getElementById('cartBadge');
  if(cartItems.length > 0){
    badge.textContent = cartItems.length;
    badge.classList.remove('hidden');
    badge.classList.remove('bump');
    void badge.offsetWidth; // restart the animation even if it's already running
    badge.classList.add('bump');
  } else {
    badge.classList.add('hidden');
  }
}

function describeCartItem(item){
  return (item.examOrCourse || 'Counselling') + ' — Free Counselling Request' +
    '<br><span style="color:var(--gray);font-size:12px;">' + item.whatWantToKnow.slice(0,80) + (item.whatWantToKnow.length > 80 ? '…' : '') + '</span>';
}

/**
 * Order ID format: YYMM#### — e.g. 26070001 = 1st order of July 2026.
 * Sequence resets each month, generated via a Firestore transaction so
 * two people placing orders at the same instant never collide.
 */
function generateOrderId(){
  const now = new Date();
  const yearCode = String(now.getFullYear()).slice(-2);
  const monthCode = String(now.getMonth() + 1).padStart(2, '0');
  const counterRef = db.collection('counters').doc('ORD' + yearCode + monthCode);
  return db.runTransaction((tx)=>{
    return tx.get(counterRef).then((doc)=>{
      let next = 1;
      if(doc.exists){
        next = (doc.data().lastNumber || 0) + 1;
      }
      tx.set(counterRef, { lastNumber: next }, { merge: true });
      return yearCode + monthCode + String(next).padStart(4, '0');
    });
  });
}

function buildPaperRowHTML(p, withRemove, idx){
  const removeCell = withRemove ? `<td><a href="#" class="cart-remove-link" data-idx="${idx}" style="color:var(--red);">Remove</a></td>` : '';
  return `<tr>
    <td>${getExamLabel(p.course, p.level)}</td>
    <td>${p.paperNo}</td>
    <td>${p.paperName}</td>
    <td>${p.faculty}</td>
    <td>${p.attempt}</td>
    <td>${p.typeOfClass}</td>
    <td>${p.bookPreference}</td>
    <td>${p.modeOfClass}</td>
    ${removeCell}
  </tr>`;
}

function buildTestSeriesRowHTML(t, withRemove, idx){
  const removeCell = withRemove ? `<td><a href="#" class="cart-remove-ts-link" data-idx="${idx}" style="color:var(--red);">Remove</a></td>` : '';
  return `<tr>
    <td>${t.examToAppear}</td>
    <td>${t.attempt}</td>
    <td>${t.attemptingFor}</td>
    <td>${t.testSeriesType}</td>
    ${removeCell}
  </tr>`;
}

let pendingOrderItems = [];
let pendingTestSeriesItems = [];

function renderCart(){
  const tbody = document.getElementById('cartTableBody');
  const tableWrap = document.getElementById('cartTableWrap');
  const tsBody = document.getElementById('cartTestSeriesTableBody');
  const tsWrap = document.getElementById('cartTestSeriesWrap');
  const counsellingList = document.getElementById('cartCounsellingList');
  const emptyMsg = document.getElementById('cartEmptyMsg');
  const placeBtn = document.getElementById('placeCartOrderBtn');
  tbody.innerHTML = '';
  tsBody.innerHTML = '';
  counsellingList.innerHTML = '';

  const classItems = cartItems.filter(i => i.kind === 'classPaper');
  const testSeriesItems = cartItems.filter(i => i.kind === 'testSeries');
  const counsellingItems = cartItems.filter(i => i.kind === 'counselling');

  tableWrap.classList.toggle('hidden', classItems.length === 0);
  tsWrap.classList.toggle('hidden', testSeriesItems.length === 0);

  cartItems.forEach((item, idx)=>{
    if(item.kind === 'classPaper'){
      tbody.insertAdjacentHTML('beforeend', buildPaperRowHTML(item, true, idx));
    }
    if(item.kind === 'testSeries'){
      tsBody.insertAdjacentHTML('beforeend', buildTestSeriesRowHTML(item, true, idx));
    }
  });
  tbody.querySelectorAll('.cart-remove-link').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const idx = parseInt(a.dataset.idx, 10);
      cartItems.splice(idx, 1);
      saveCartToFirestore().then(()=>{ updateCartBadge(); renderCart(); });
    });
  });
  tsBody.querySelectorAll('.cart-remove-ts-link').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const idx = parseInt(a.dataset.idx, 10);
      cartItems.splice(idx, 1);
      saveCartToFirestore().then(()=>{ updateCartBadge(); renderCart(); });
    });
  });

  counsellingItems.forEach((item)=>{
    const idx = cartItems.indexOf(item);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:13.5px;';
    row.innerHTML = `<div>${describeCartItem(item)}</div><a href="#" style="color:var(--red);font-size:12px;flex:0 0 auto;">Remove</a>`;
    row.querySelector('a').addEventListener('click', (e)=>{
      e.preventDefault();
      cartItems.splice(idx, 1);
      saveCartToFirestore().then(()=>{ updateCartBadge(); renderCart(); });
    });
    counsellingList.appendChild(row);
  });

  if(cartItems.length === 0){
    emptyMsg.style.display = 'block';
    placeBtn.disabled = true;
  } else {
    emptyMsg.style.display = 'none';
    placeBtn.disabled = false;
  }
}

function openCart(){
  renderCart();
  openOverlay('cartOverlay');
}

document.getElementById('placeCartOrderBtn').addEventListener('click', ()=>{
  if(cartItems.length === 0 || !currentUserProfile) return;
  const classPaperItems = cartItems.filter(i => i.kind === 'classPaper');
  const testSeriesItems = cartItems.filter(i => i.kind === 'testSeries');
  const counsellingItems = cartItems.filter(i => i.kind === 'counselling');

  // Counselling is a free service — it needs no Order ID and isn't affected by
  // the "I Promise" step below, so it's submitted immediately either way.
  const uid = auth.currentUser.uid;
  counsellingItems.forEach(item=>{
    sendToSheet({
      formType: 'counselling',
      studentId: currentUserProfile.studentId,
      name: currentUserProfile.name,
      email: currentUserProfile.email,
      examOrCourse: item.examOrCourse,
      whatWantToKnow: item.whatWantToKnow
    });
    db.collection('counsellingRequests').add({
      uid: uid,
      studentId: currentUserProfile.studentId,
      name: currentUserProfile.name,
      email: currentUserProfile.email,
      examOrCourse: item.examOrCourse,
      whatWantToKnow: item.whatWantToKnow,
      confirmationSent: false,
      scheduledAt: null,
      scheduleEmailSentAt: null,
      deliveryStatus: 'pending',
      deliveredAt: null,
      cancelledAt: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(docRef=>{
      db.collection('users').doc(uid).update({
        orderHistory: firebase.firestore.FieldValue.arrayUnion({
          date: new Date().toISOString(),
          docId: docRef.id,
          docCollection: 'counsellingRequests',
          items: [Object.assign({}, item, { _type: 'counselling' })]
        })
      });
    });
  });

  pendingOrderItems = classPaperItems;
  pendingTestSeriesItems = testSeriesItems;

  if(classPaperItems.length === 0 && testSeriesItems.length === 0){
    // Pure counselling request — nothing left to confirm.
    cartItems = cartItems.filter(i => counsellingItems.indexOf(i) === -1);
    saveCartToFirestore().then(()=>{
      updateCartBadge();
      closeOverlay('cartOverlay');
      document.getElementById('bookedSuccessEmail').textContent = currentUserProfile.email;
      openOverlay('bookedSuccessOverlay');
    });
    return;
  }

  document.getElementById('orderConfirmTableWrap').classList.toggle('hidden', classPaperItems.length === 0);
  document.getElementById('orderConfirmTableBody').innerHTML =
    classPaperItems.map(p => buildPaperRowHTML(p, false)).join('');
  document.getElementById('orderConfirmTestSeriesWrap').classList.toggle('hidden', testSeriesItems.length === 0);
  document.getElementById('orderConfirmTestSeriesTableBody').innerHTML =
    testSeriesItems.map(t => buildTestSeriesRowHTML(t, false)).join('');
  closeOverlay('cartOverlay');
  openOverlay('orderConfirmOverlay');
});

document.getElementById('confirmOrderBtn').addEventListener('click', ()=>{
  if(!currentUserProfile) return;
  closeOverlay('orderConfirmOverlay');
  const hasLectures = pendingOrderItems.length > 0;
  const hasTestSeries = pendingTestSeriesItems.length > 0;
  document.getElementById('attentionPromiseMessage').textContent = buildAttentionMessage(hasLectures, hasTestSeries);
  openOverlay('attentionPromiseOverlay');
});

function buildAttentionMessage(hasLectures, hasTestSeries){
  let core;
  if(hasLectures && hasTestSeries){
    core = 'Only taking classes and a test series from us will not guarantee you success — they only work if you actually show up regularly and put in the practice.';
  } else if(hasLectures){
    core = 'Only taking classes from us will not guarantee you success — they only work if you attend regularly and put in the practice.';
  } else {
    core = 'Only taking a test series from us will not guarantee you success — it only works if you appear for every test on time and review your mistakes afterward.';
  }
  const tail = ' Before you place this order — are you promising yourself you will stay regular, follow our guidance, and see it through?';
  return core + tail;
}

document.getElementById('attentionPromiseYesBtn').addEventListener('click', ()=>{
  closeOverlay('attentionPromiseOverlay');
  openOverlay('journeyBeginOverlay');
});

document.getElementById('journeyBeginContinueBtn').addEventListener('click', ()=>{
  closeOverlay('journeyBeginOverlay');
  const idPromises = [];
  let lectureOrderId = null, testSeriesOrderId = null;
  if(pendingOrderItems.length > 0) idPromises.push(generateOrderId().then(id=>{ lectureOrderId = id; }));
  if(pendingTestSeriesItems.length > 0) idPromises.push(generateOrderId().then(id=>{ testSeriesOrderId = id; }));
  Promise.all(idPromises).then(()=>{
    finalizeOrder(lectureOrderId, testSeriesOrderId, pendingOrderItems, pendingTestSeriesItems);
  });
});

document.getElementById('attentionPromiseNoBtn').addEventListener('click', ()=>{
  closeOverlay('attentionPromiseOverlay');
  openOverlay('noWorriesOverlay');
});

function finalizeOrder(lectureOrderId, testSeriesOrderId, paperItems, testSeriesItems){
  const uid = auth.currentUser.uid;
  const historyEntries = [];

  if(paperItems.length > 0){
    const papersForRecord = paperItems.map(p => Object.assign({}, p, { exam: getExamLabel(p.course, p.level) }));
    sendToSheet({
      formType: 'order',
      orderId: lectureOrderId,
      studentId: currentUserProfile.studentId,
      name: currentUserProfile.name,
      email: currentUserProfile.email,
      extraInfo: '',
      papers: papersForRecord
    });
    db.collection('orders').add({
      uid: uid,
      orderId: lectureOrderId,
      studentId: currentUserProfile.studentId,
      name: currentUserProfile.name,
      email: currentUserProfile.email,
      extraInfo: '',
      papers: papersForRecord,
      remarks: '',
      confirmationSent: false,
      billSentAt: null,
      paymentRecd: 'no',
      paymentRecdAt: null,
      deliveryStatus: 'pending',
      deliveredAt: null,
      cancelledAt: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    historyEntries.push({
      orderId: lectureOrderId,
      date: new Date().toISOString(),
      items: papersForRecord.map(p => Object.assign({}, p, { _type: 'classPaper' }))
    });
  }

  if(testSeriesItems.length > 0){
    sendToSheet({
      formType: 'testSeries',
      orderId: testSeriesOrderId,
      studentId: currentUserProfile.studentId,
      name: currentUserProfile.name,
      email: currentUserProfile.email,
      series: testSeriesItems
    });
    db.collection('testSeriesOrders').add({
      uid: uid,
      orderId: testSeriesOrderId,
      studentId: currentUserProfile.studentId,
      name: currentUserProfile.name,
      email: currentUserProfile.email,
      series: testSeriesItems,
      remarks: '',
      confirmationSent: false,
      billSentAt: null,
      paymentRecd: 'no',
      paymentRecdAt: null,
      deliveryStatus: 'pending',
      deliveredAt: null,
      cancelledAt: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    historyEntries.push({
      orderId: testSeriesOrderId,
      date: new Date().toISOString(),
      items: testSeriesItems.map(t => Object.assign({}, t, { _type: 'testSeries' }))
    });
  }

  db.collection('users').doc(uid).update({
    orderHistory: firebase.firestore.FieldValue.arrayUnion(...historyEntries)
  });

  const removedItems = paperItems.concat(testSeriesItems);
  cartItems = cartItems.filter(i => removedItems.indexOf(i) === -1);
  saveCartToFirestore().then(()=>{
    updateCartBadge();
    closeOverlay('cartOverlay');
    closeOverlay('orderConfirmOverlay');
    const idLine = (lectureOrderId && testSeriesOrderId)
      ? ('Lecture Order ID #' + lectureOrderId + '  •  Test Series Order ID #' + testSeriesOrderId)
      : ('OrderID #' + (lectureOrderId || testSeriesOrderId));
    document.getElementById('orderSuccessOrderIdLine').textContent = idLine;
    document.getElementById('orderSuccessEmail').textContent = currentUserProfile.email;
    openOverlay('orderSuccessOverlay');
    pendingOrderItems = [];
    pendingTestSeriesItems = [];
  });
}

/* ============================================================
   MY ORDERS
   ============================================================ */
function renderMyOrders(){
  const tbody = document.getElementById('myOrdersTableBody');
  const emptyMsg = document.getElementById('myOrdersEmptyMsg');
  tbody.innerHTML = '';
  if(!auth.currentUser){ emptyMsg.style.display = 'block'; return; }
  db.collection('users').doc(auth.currentUser.uid).get().then((doc)=>{
    const history = (doc.data() || {}).orderHistory || [];
    if(history.length === 0){
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';
    history.slice().reverse().forEach((entry, i)=>{
      const realIdx = history.length - 1 - i;
      const dateStr = entry.date ? new Date(entry.date).toLocaleDateString() : '—';
      const entryItems = entry.items || [];
      const isCounsellingEntry = !entry.orderId && entryItems.length > 0 && entryItems.every(it => it._type === 'counselling');
      const orderIdDisplay = entry.orderId || (isCounsellingEntry ? 'Counselling' : '—');
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${orderIdDisplay}</td><td>${dateStr}</td><td><button type="button" class="btn btn-outline view-order-btn" data-idx="${realIdx}">View Details</button></td><td><button type="button" class="btn btn-outline track-order-btn" data-idx="${realIdx}">Track Order</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.track-order-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const entry = history[parseInt(btn.dataset.idx, 10)];
        openTrackOrder(entry);
      });
    });
    tbody.querySelectorAll('.view-order-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const entry = history[parseInt(btn.dataset.idx, 10)];
        const items = entry.items || [];
        // Backward-compat: entries saved before this update have no _type — treat as classPaper.
        const paperItems = items.filter(i => !i._type || i._type === 'classPaper');
        const testSeriesItems = items.filter(i => i._type === 'testSeries');
        const counsellingItems = items.filter(i => i._type === 'counselling');
        const isCounsellingEntry = !entry.orderId && items.length > 0 && items.every(it => it._type === 'counselling');

        document.getElementById('orderDetailsTitle').textContent =
          isCounsellingEntry ? 'Counselling Request' : ('OrderID #' + (entry.orderId || '—'));
        document.getElementById('orderDetailsTableWrap').classList.toggle('hidden', paperItems.length === 0);
        document.getElementById('orderDetailsTableBody').innerHTML = paperItems.map(p => buildPaperRowHTML(p, false)).join('');

        document.getElementById('orderDetailsTestSeriesWrap').classList.toggle('hidden', testSeriesItems.length === 0);
        document.getElementById('orderDetailsTestSeriesTableBody').innerHTML = testSeriesItems.map(t => buildTestSeriesRowHTML(t, false)).join('');

        const counsellingList = document.getElementById('orderDetailsCounsellingList');
        counsellingList.innerHTML = counsellingItems.map(item =>
          `<div style="padding:12px 0;border-bottom:1px solid var(--line);font-size:13.5px;">${describeCartItem(item)}</div>`
        ).join('');

        closeOverlay('myOrdersOverlay');
        openOverlay('orderDetailsOverlay');
      });
    });
  });
}

/* ============================================================
   TRACK ORDER
   ============================================================ */
let currentTrackContext = null;

function trackEsc(str){
  return (str===undefined||str===null) ? '' : String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatTrackTime(ts){
  if(!ts) return '';
  const d = (ts && typeof ts.toDate === 'function') ? ts.toDate() : new Date(ts);
  if(isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2,'0');
  const ampm = hours>=12?'PM':'AM';
  hours = hours%12; if(hours===0) hours=12;
  const day = String(d.getDate()).padStart(2,'0');
  const month = String(d.getMonth()+1).padStart(2,'0');
  const year = d.getFullYear();
  return day+'/'+month+'/'+year+' - '+hours+':'+minutes+' '+ampm;
}

function trackStepHTML(label, time, reached, isCancelled){
  const cls = 'track-step' + (reached?' reached':'') + (isCancelled?' cancelled':'');
  const timeStr = formatTrackTime(time);
  return '<div class="'+cls+'"><span class="track-dot"></span><div class="track-label">'+trackEsc(label)+'</div>'+
    (timeStr ? '<div class="track-time">'+timeStr+'</div>' : '')+'</div>';
}

function renderTrackTimeline(data, isCounselling){
  const status = data.deliveryStatus || 'pending';
  const stages = isCounselling ? [
    { label:'Counselling Requested', time: data.createdAt },
    { label:'Schedule Confirmation Received', time: data.scheduleEmailSentAt },
    { label:'Order Delivered', time: data.deliveredAt }
  ] : [
    { label:'Order Placed', time: data.createdAt },
    { label:'Confirmation & Details Received', time: data.billSentAt },
    { label:'Payment Confirmation', time: data.paymentRecdAt },
    { label:'Order Delivered', time: data.deliveredAt }
  ];

  let html = '';
  if(status === 'cancelled'){
    stages.forEach(s=>{
      if(s.time) html += trackStepHTML(s.label, s.time, true, false);
    });
    html += trackStepHTML('Order Cancelled', data.cancelledAt, true, true);
  } else {
    stages.forEach(s=>{
      html += trackStepHTML(s.label, s.time, !!s.time, false);
    });
  }

  document.getElementById('trackOrderTimeline').innerHTML = html;

  const cancelBtn = document.getElementById('cancelOrderBtn');
  const canCancel = status !== 'cancelled' && status !== 'delivered';
  cancelBtn.style.display = canCancel ? 'block' : 'none';
}

function openTrackOrder(entry){
  const items = entry.items || [];
  const hasPapers = items.some(i => !i._type || i._type === 'classPaper');
  const isCounselling = !entry.orderId && items.length > 0 && items.every(i => i._type === 'counselling');
  const collectionName = isCounselling ? (entry.docCollection || 'counsellingRequests') : (hasPapers ? 'orders' : 'testSeriesOrders');

  currentTrackContext = null;
  document.getElementById('trackOrderTimeline').innerHTML = '<p style="color:var(--gray);font-size:13px;">Loading…</p>';
  document.getElementById('trackOrderSubtitle').textContent = isCounselling ? 'Counselling Request' : ('Order ID #' + (entry.orderId || ''));
  document.getElementById('cancelOrderBtn').style.display = 'none';
  closeOverlay('myOrdersOverlay');
  openOverlay('trackOrderOverlay');

  const fetchPromise = isCounselling
    ? (entry.docId ? db.collection(collectionName).doc(entry.docId).get() : Promise.resolve(null))
    : db.collection(collectionName).where('orderId', '==', entry.orderId).where('uid', '==', auth.currentUser.uid).limit(1).get()
        .then(snap => snap.empty ? null : snap.docs[0]);

  fetchPromise.then(docSnap=>{
    if(!docSnap || !docSnap.exists){
      document.getElementById('trackOrderTimeline').innerHTML = '<p style="color:var(--gray);font-size:13px;">Could not load tracking details right now.</p>';
      return;
    }
    currentTrackContext = { collectionName, docId: docSnap.id, isCounselling };
    renderTrackTimeline(docSnap.data(), isCounselling);
  }).catch(()=>{
    document.getElementById('trackOrderTimeline').innerHTML = '<p style="color:var(--gray);font-size:13px;">Could not load tracking details right now.</p>';
  });
}

const cancelOrderBtnEl = document.getElementById('cancelOrderBtn');
if(cancelOrderBtnEl) cancelOrderBtnEl.addEventListener('click', ()=>{
  openOverlay('cancelConfirmOverlay');
});
const cancelConfirmNoBtnEl = document.getElementById('cancelConfirmNoBtn');
if(cancelConfirmNoBtnEl) cancelConfirmNoBtnEl.addEventListener('click', ()=>{
  closeOverlay('cancelConfirmOverlay');
});
const cancelConfirmYesBtnEl = document.getElementById('cancelConfirmYesBtn');
if(cancelConfirmYesBtnEl) cancelConfirmYesBtnEl.addEventListener('click', ()=>{
  if(!currentTrackContext) return;
  const { collectionName, docId, isCounselling } = currentTrackContext;
  db.collection(collectionName).doc(docId).update({
    deliveryStatus: 'cancelled',
    cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(()=>{
    closeOverlay('cancelConfirmOverlay');
    showToast('Order cancelled.', 'success');
    return db.collection(collectionName).doc(docId).get();
  }).then(doc=>{
    if(doc) renderTrackTimeline(doc.data(), isCounselling);
  }).catch(err=>{
    closeOverlay('cancelConfirmOverlay');
    showToast('Failed to cancel order: ' + err.message, 'error');
  });
});


/* ============================================================
   FIREBASE INIT
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyCOLJmk4RY8cpR8CSyhMAKsQ6XSeIJyey4",
  authDomain: "ambitious-professionals.firebaseapp.com",
  projectId: "ambitious-professionals",
  storageBucket: "ambitious-professionals.firebasestorage.app",
  messagingSenderId: "566165560303",
  appId: "1:566165560303:web:40c683e07a030c779f741a"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

/* ============================================================
   PASSWORD VALIDATION
   ============================================================ */
function isStrongPassword(pw){
  const lengthOk = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  return lengthOk && hasUpper && hasLower && hasNumber && hasSymbol;
}

function setRuleState(elId, passed){
  const el = document.getElementById(elId);
  el.classList.toggle('valid', passed);
  el.querySelector('.pw-icon').textContent = passed ? '✓' : '✕';
}

document.getElementById('suPassword').addEventListener('input', ()=>{
  const pw = document.getElementById('suPassword').value;
  const lengthOk = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  setRuleState('pwRuleLength', lengthOk);
  setRuleState('pwRuleUpper', hasUpper);
  setRuleState('pwRuleLower', hasLower);
  setRuleState('pwRuleNumber', hasNumber);
  setRuleState('pwRuleSymbol', hasSymbol);

  const allValid = lengthOk && hasUpper && hasLower && hasNumber && hasSymbol;
  const confirmField = document.getElementById('suPasswordConfirm');
  confirmField.disabled = !allValid;
  if(!allValid) confirmField.value = '';
  updateCreateAccountBtnState();
});
document.getElementById('suPasswordConfirm').addEventListener('input', updateCreateAccountBtnState);

function updateCreateAccountBtnState(){
  const pw = document.getElementById('suPassword').value;
  const confirm = document.getElementById('suPasswordConfirm').value;
  const passwordOk = isStrongPassword(pw) && pw === confirm && confirm.length > 0;
  document.getElementById('suCreateAccountBtn').disabled = !(suEmailVerified && passwordOk);
}

/* ============================================================
   GOOGLE SIGN-UP: SET PASSWORD STEP
   ============================================================ */
function resetGoogleSetPasswordForm(){
  document.getElementById('googleSetPasswordForm').reset();
  ['gpRuleLength','gpRuleUpper','gpRuleLower','gpRuleNumber','gpRuleSymbol'].forEach(id=> setRuleState(id, false));
  document.getElementById('gpPasswordConfirm').disabled = true;
  document.getElementById('gpContinueBtn').disabled = true;
  hideError('googleSetPasswordError');
}

document.getElementById('gpPassword').addEventListener('input', ()=>{
  const pw = document.getElementById('gpPassword').value;
  const lengthOk = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  setRuleState('gpRuleLength', lengthOk);
  setRuleState('gpRuleUpper', hasUpper);
  setRuleState('gpRuleLower', hasLower);
  setRuleState('gpRuleNumber', hasNumber);
  setRuleState('gpRuleSymbol', hasSymbol);

  const allValid = lengthOk && hasUpper && hasLower && hasNumber && hasSymbol;
  const confirmField = document.getElementById('gpPasswordConfirm');
  confirmField.disabled = !allValid;
  if(!allValid) confirmField.value = '';
  updateGpContinueBtnState();
});
document.getElementById('gpPasswordConfirm').addEventListener('input', updateGpContinueBtnState);

function updateGpContinueBtnState(){
  const pw = document.getElementById('gpPassword').value;
  const confirm = document.getElementById('gpPasswordConfirm').value;
  const ok = isStrongPassword(pw) && pw === confirm && confirm.length > 0;
  document.getElementById('gpContinueBtn').disabled = !ok;
}

document.getElementById('googleSetPasswordForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return;
  const password = document.getElementById('gpPassword').value;
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);

  user.linkWithCredential(credential).then(()=>{
    closeOverlay('googleSetPasswordOverlay');
    prefillCompleteProfile(user);
    openOverlay('completeProfileOverlay');
  }).catch((err)=>{
    showError('googleSetPasswordError', err.message);
  });
});

/* ============================================================
   EMAIL OTP VERIFICATION (sign-up + forgot password)
   Note: this deters casual typos/fake emails effectively, but — being
   fully transparent — without a paid backend, a technically determined
   person could still inspect network calls to find the code. It is a
   real, meaningful barrier, not a cryptographic guarantee.
   ============================================================ */
let suEmailVerified = false;

function generateOtpCode(){
  return String(Math.floor(1000 + Math.random() * 9000));
}

function sendOtpEmail(email, code){
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ formType: 'sendOtp', email: email, code: code })
  }).catch(err => console.error('OTP email error:', err));
}

function getOtpBoxesValue(containerId){
  return [...document.querySelectorAll('#' + containerId + ' .otp-box')].map(b => b.value).join('');
}
function clearOtpBoxes(containerId){
  document.querySelectorAll('#' + containerId + ' .otp-box').forEach(b => { b.value=''; b.disabled=false; });
}
function wireOtpBoxes(containerId){
  const boxes = [...document.querySelectorAll('#' + containerId + ' .otp-box')];
  boxes.forEach((box, i)=>{
    box.addEventListener('input', ()=>{
      box.value = box.value.replace(/[^0-9]/g, '').slice(0,1);
      if(box.value && i < boxes.length - 1) boxes[i+1].focus();
    });
    box.addEventListener('keydown', (e)=>{
      if(e.key === 'Backspace' && !box.value && i > 0) boxes[i-1].focus();
    });
    box.addEventListener('paste', (e)=>{
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0,4);
      pasted.split('').forEach((ch, idx)=>{ if(boxes[idx]) boxes[idx].value = ch; });
      if(pasted.length > 0) boxes[Math.min(pasted.length,4)-1].focus();
    });
  });
}
wireOtpBoxes('suOtpBoxes');
wireOtpBoxes('fpOtpBoxes');

function requestOtp(emailInputId, sendBtnId, otpSectionId, otpBoxesId){
  const email = document.getElementById(emailInputId).value.trim();
  if(!email || !email.includes('@')){ showToast('Enter a valid email first.', 'error'); return; }
  const code = generateOtpCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  db.collection('otps').doc(email.toLowerCase()).set({ code: code, expiresAt: expiresAt, attempts: 0 }).then(()=>{
    sendOtpEmail(email, code);
    clearOtpBoxes(otpBoxesId);
    document.getElementById(otpSectionId).classList.remove('hidden');
    document.getElementById(emailInputId).readOnly = true;
    const btn = document.getElementById(sendBtnId);
    btn.textContent = 'Sent';
    btn.disabled = true;
    document.querySelector('#' + otpBoxesId + ' .otp-box').focus();
  });
}

function verifyOtp(emailInputId, otpBoxesId, msgId, onSuccess){
  const email = document.getElementById(emailInputId).value.trim().toLowerCase();
  const entered = getOtpBoxesValue(otpBoxesId);
  const msg = document.getElementById(msgId);

  if(entered.length < 4){
    msg.style.color = 'var(--red)'; msg.textContent = 'Enter all 4 digits.'; msg.style.display = 'block';
    return;
  }

  db.collection('otps').doc(email).get().then((doc)=>{
    if(!doc.exists){
      msg.style.color = 'var(--red)'; msg.textContent = 'Code not found. Please resend.'; msg.style.display = 'block';
      return;
    }
    const d = doc.data();
    if(Date.now() > d.expiresAt){
      msg.style.color = 'var(--red)'; msg.textContent = 'Code expired. Please resend.'; msg.style.display = 'block';
      return;
    }
    if(d.attempts >= 5){
      msg.style.color = 'var(--red)'; msg.textContent = 'Too many attempts. Please resend a new code.'; msg.style.display = 'block';
      return;
    }
    if(entered === d.code){
      msg.style.color = '#2E7D32'; msg.textContent = 'Email verified ✓'; msg.style.display = 'block';
      document.querySelectorAll('#' + otpBoxesId + ' .otp-box').forEach(b => b.disabled = true);
      db.collection('otps').doc(email).delete();
      onSuccess();
    } else {
      db.collection('otps').doc(email).update({ attempts: firebase.firestore.FieldValue.increment(1) });
      msg.style.color = 'var(--red)'; msg.textContent = 'Incorrect code. Try again.'; msg.style.display = 'block';
    }
  });
}

function resetSignUpOtpState(){
  suEmailVerified = false;
  document.getElementById('suOtpSection').classList.add('hidden');
  clearOtpBoxes('suOtpBoxes');
  document.getElementById('suOtpMsg').style.display = 'none';
  document.getElementById('suEmail').readOnly = false;
  document.getElementById('suSendOtpBtn').textContent = 'Verify Email';
  document.getElementById('suSendOtpBtn').disabled = false;
  document.getElementById('suPassword').disabled = true;
  document.getElementById('suPassword').value = '';
  document.getElementById('suEmailDupError').style.display = 'none';
  updateCreateAccountBtnState();
}

document.getElementById('suSendOtpBtn').addEventListener('click', ()=>{
  const email = document.getElementById('suEmail').value.trim();
  if(!email || !email.includes('@')){ showToast('Enter a valid email first.', 'error'); return; }
  const btn = document.getElementById('suSendOtpBtn');
  btn.disabled = true;
  btn.textContent = 'Checking...';
  db.collection('emailIndex').doc(email.toLowerCase()).get().then((doc)=>{
    if(doc.exists){
      const errEl = document.getElementById('suEmailDupError');
      errEl.textContent = 'This email is already registered. Please sign in instead, or use a different email.';
      errEl.style.display = 'block';
      btn.textContent = 'Blocked';
      // stays disabled — only editing the email (via input listener) unfreezes this
      return;
    }
    btn.textContent = 'Verify Email';
    requestOtp('suEmail', 'suSendOtpBtn', 'suOtpSection', 'suOtpBoxes');
  });
});
document.getElementById('suResendOtpLink').addEventListener('click', (e)=>{
  e.preventDefault();
  document.getElementById('suSendOtpBtn').disabled = false;
  requestOtp('suEmail', 'suSendOtpBtn', 'suOtpSection', 'suOtpBoxes');
});
document.getElementById('suChangeEmailLink').addEventListener('click', (e)=>{
  e.preventDefault();
  resetSignUpOtpState();
});
document.getElementById('suVerifyOtpBtn').addEventListener('click', ()=>{
  verifyOtp('suEmail', 'suOtpBoxes', 'suOtpMsg', ()=>{
    suEmailVerified = true;
    document.getElementById('suPassword').disabled = false;
    document.getElementById('suPassword').placeholder = 'Enter password';
    updateCreateAccountBtnState();
  });
});

/* Live check: is this email already registered? Blocks Verify Email until changed. */
let suEmailCheckTimer = null;
document.getElementById('suEmail').addEventListener('input', ()=>{
  const errEl = document.getElementById('suEmailDupError');
  errEl.style.display = 'none';
  document.getElementById('suSendOtpBtn').disabled = false;
  clearTimeout(suEmailCheckTimer);
  const email = document.getElementById('suEmail').value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(email)) return;
  suEmailCheckTimer = setTimeout(()=>{
    db.collection('emailIndex').doc(email.toLowerCase()).get().then((doc)=>{
      if(doc.exists){
        errEl.textContent = 'This email is already registered. Please sign in instead, or use a different email.';
        errEl.style.display = 'block';
        document.getElementById('suSendOtpBtn').disabled = true;
      }
    });
  }, 500);
});

function resetForgotPasswordOtpState(){
  document.getElementById('fpEmail').value = '';
  document.getElementById('forgotPasswordMsg').style.display = 'none';
}

function showError(elId, msg){
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.style.display = 'block';
}
function hideError(elId){
  document.getElementById(elId).style.display = 'none';
}

/* ============================================================
   STUDENT ID GENERATION (transactional, gap-free, never reused)
   ============================================================ */
function generateStudentId(){
  const yearCode = String(new Date().getFullYear()).slice(-2);
  const counterRef = db.collection('counters').doc('AP' + yearCode);
  return db.runTransaction((tx)=>{
    return tx.get(counterRef).then((doc)=>{
      let next = 1;
      if(doc.exists){
        next = (doc.data().lastNumber || 0) + 1;
      }
      tx.set(counterRef, { lastNumber: next }, { merge: true });
      return 'AP' + yearCode + String(next).padStart(4, '0');
    });
  });
}

/* ============================================================
   AUTH MODAL SWITCHING
   ============================================================ */
function resetPasswordChecklist(){
  ['pwRuleLength','pwRuleUpper','pwRuleLower','pwRuleNumber','pwRuleSymbol'].forEach(id=> setRuleState(id, false));
  document.getElementById('suPasswordConfirm').disabled = true;
  resetSignUpOtpState();
}
document.getElementById('signUpBtn').addEventListener('click', ()=> { openOverlay('signUpOverlay'); resetPasswordChecklist(); });
document.getElementById('signInBtn').addEventListener('click', ()=> openOverlay('signInOverlay'));
document.getElementById('switchToSignIn').addEventListener('click', (e)=>{
  e.preventDefault(); closeOverlay('signUpOverlay'); openOverlay('signInOverlay');
});
document.getElementById('switchToSignUp').addEventListener('click', (e)=>{
  e.preventDefault(); closeOverlay('signInOverlay'); openOverlay('signUpOverlay'); resetPasswordChecklist();
});
document.getElementById('forgotPasswordLink').addEventListener('click', (e)=>{
  e.preventDefault(); closeOverlay('signInOverlay'); openOverlay('forgotPasswordOverlay'); resetForgotPasswordOtpState();
});

/* ============================================================
   GOOGLE SIGN-IN / SIGN-UP (same flow — Firebase handles both)
   ============================================================ */
function handleGoogleAuth(intent){
  auth.signInWithPopup(googleProvider).then((result)=>{
    const user = result.user;
    db.collection('users').doc(user.uid).get().then((doc)=>{
      const hasProfile = doc.exists && doc.data().studentId;

      if(intent === 'signup' && hasProfile){
        auth.signOut();
        showToast('This Google account is already registered. Please sign in instead.', 'error');
        return;
      }
      if(intent === 'signin' && !hasProfile){
        auth.signOut();
        showToast('This Google account is not registered yet. Please sign up first.', 'error');
        return;
      }

      closeOverlay('signUpOverlay');
      closeOverlay('signInOverlay');
      if(!hasProfile){
        db.collection('emailIndex').doc((user.email || '').toLowerCase()).set({ registered: true });
        resetGoogleSetPasswordForm();
        openOverlay('googleSetPasswordOverlay');
      } else {
        refreshProfileUI(user);
      }
    });
  }).catch((err)=>{
    if(err.code !== 'auth/popup-closed-by-user'){
      showToast('Google sign-in failed: ' + err.message, 'error');
    }
  });
}
document.getElementById('googleSignUpBtn').addEventListener('click', ()=> handleGoogleAuth('signup'));
document.getElementById('googleSignInBtn').addEventListener('click', ()=> handleGoogleAuth('signin'));

/* ============================================================
   EMAIL/PASSWORD SIGN UP
   ============================================================ */
document.getElementById('emailSignUpForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  hideError('signUpError');
  const email = document.getElementById('suEmail').value.trim();
  const password = document.getElementById('suPassword').value;
  const confirm = document.getElementById('suPasswordConfirm').value;

  if(!suEmailVerified){
    showError('signUpError', 'Please verify your email with the code first.');
    return;
  }
  if(!isStrongPassword(password)){
    showError('signUpError', 'Password must be at least 8 characters and include upper case, lower case, a number, and a symbol.');
    return;
  }
  if(password !== confirm){
    showError('signUpError', 'Passwords do not match.');
    return;
  }

  auth.createUserWithEmailAndPassword(email, password).then((cred)=>{
    const user = cred.user;
    db.collection('emailIndex').doc(email.toLowerCase()).set({ registered: true });
    closeOverlay('signUpOverlay');
    prefillCompleteProfile(user);
    openOverlay('completeProfileOverlay');
  }).catch((err)=>{
    if(err.code === 'auth/email-already-in-use'){
      showError('signUpError', 'An account with this email is already registered.');
    } else {
      showError('signUpError', err.message);
    }
  });
});

/* ============================================================
   EMAIL OR MOBILE SIGN IN
   ============================================================ */
document.getElementById('emailSignInForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  hideError('signInError');
  const identifier = document.getElementById('siIdentifier').value.trim();
  const password = document.getElementById('siPassword').value;

  function doSignIn(email){
    auth.signInWithEmailAndPassword(email, password).then(()=>{
      closeOverlay('signInOverlay');
    }).catch((err)=>{
      showError('signInError', 'Incorrect email/mobile number or password.');
    });
  }

  if(identifier.includes('@')){
    doSignIn(identifier);
  } else {
    // Look up the email tied to this phone number
    db.collection('users').where('phone', '==', identifier).limit(1).get().then((snap)=>{
      if(snap.empty){
        showError('signInError', 'No account found with this mobile number.');
        return;
      }
      const userDoc = snap.docs[0].data();
      doSignIn(userDoc.email);
    }).catch((err)=>{
      showError('signInError', 'Something went wrong. Please try again.');
    });
  }
});

/* ============================================================
   FORGOT PASSWORD
   ============================================================ */
document.getElementById('forgotPasswordForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = document.getElementById('fpEmail').value.trim();
  auth.sendPasswordResetEmail(email).then(()=>{
    const msg = document.getElementById('forgotPasswordMsg');
    msg.style.color = 'var(--red)';
    msg.textContent = 'Reset link sent — check your inbox (and spam folder).';
    msg.style.display = 'block';
  }).catch((err)=>{
    const msg = document.getElementById('forgotPasswordMsg');
    msg.style.color = 'var(--gray)';
    msg.textContent = err.message;
    msg.style.display = 'block';
  });
});

/* ============================================================
   COMPLETE PROFILE (mandatory after signup, before using the site)
   ============================================================ */
let cpPhoneCheckTimer = null;
document.getElementById('cpPhoneNumber').addEventListener('input', ()=>{
  const errEl = document.getElementById('cpPhoneDupError');
  errEl.style.display = 'none';
  clearTimeout(cpPhoneCheckTimer);
  const num = document.getElementById('cpPhoneNumber').value.trim();
  if(num.length < 6) return;
  cpPhoneCheckTimer = setTimeout(()=>{
    const fullPhone = document.getElementById('cpPhoneCode').value + ' ' + num;
    db.collection('users').where('phone', '==', fullPhone).limit(1).get().then((snap)=>{
      if(!snap.empty){
        errEl.textContent = 'This mobile number is already registered to another account.';
        errEl.style.display = 'block';
      }
    });
  }, 500);
});

document.getElementById('completeProfileForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  hideError('completeProfileError');
  const user = auth.currentUser;
  if(!user) return;

  const name = document.getElementById('cpName').value.trim();
  const fathersName = document.getElementById('cpFathersName').value.trim();
  const dob = document.getElementById('cpDob').value;
  const houseNo = document.getElementById('cpHouseNo').value.trim();
  const street = document.getElementById('cpStreet').value.trim();
  const landmark = document.getElementById('cpLandmark').value.trim();
  const pincode = document.getElementById('cpPincode').value.trim();
  const city = document.getElementById('cpCity').value;
  const district = document.getElementById('cpDistrict').value.trim();
  const state = document.getElementById('cpState').value.trim();
  const phone = document.getElementById('cpPhoneCode').value + ' ' + document.getElementById('cpPhoneNumber').value.trim();

  if(!/^[1-9][0-9]{5}$/.test(pincode) || !city || !district || !state){
    showError('completeProfileError', 'Please enter a valid Indian pin code so City, District and State can be filled in.');
    return;
  }

  // Check phone uniqueness before creating the profile
  db.collection('users').where('phone', '==', phone).limit(1).get().then((snap)=>{
    if(!snap.empty){
      showError('completeProfileError', 'This mobile number is already registered to another account.');
      return;
    }
    return generateStudentId().then((studentId)=>{
      return db.collection('users').doc(user.uid).set({
        studentId: studentId,
        name: name,
        fathersName: fathersName,
        dob: dob,
        houseNo: houseNo,
        street: street,
        landmark: landmark,
        pincode: pincode,
        city: city,
        district: district,
        state: state,
        phone: phone,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(()=>{
        return sendToSheet({
          formType: 'studentSignup',
          studentId: studentId,
          name: name,
          fathersName: fathersName,
          dob: dob,
          houseNo: houseNo,
          street: street,
          landmark: landmark,
          pincode: pincode,
          city: city,
          district: district,
          state: state,
          phone: phone,
          email: user.email
        }).then(()=>{
          closeOverlay('completeProfileOverlay');
          refreshProfileUI(user);
        }).catch(()=>{
          // Firestore profile is saved, but we couldn't confirm the Sheet write reached the server.
          closeOverlay('completeProfileOverlay');
          refreshProfileUI(user);
          showToast('Your profile was saved, but we had trouble syncing it — if things look off later, please contact us.', 'error');
        });
      });
    });
  }).catch((err)=>{
    showError('completeProfileError', err.message);
  });
});

/* ============================================================
   MY PROFILE (view/edit anytime — auto-saves on submit)
   ============================================================ */
document.getElementById('myProfileLink').addEventListener('click', (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return;
  db.collection('users').doc(user.uid).get().then((doc)=>{
    const d = doc.data() || {};
    document.getElementById('mpStudentId').textContent = d.studentId || '—';
    document.getElementById('mpName').value = d.name || '';
    document.getElementById('mpFathersName').value = d.fathersName || '';
    document.getElementById('mpDob').value = d.dob || '';
    document.getElementById('mpDob').max = new Date().toISOString().split('T')[0];
    document.getElementById('mpHouseNo').value = d.houseNo || '';
    document.getElementById('mpStreet').value = d.street || '';
    document.getElementById('mpLandmark').value = d.landmark || '';
    document.getElementById('mpPincode').value = d.pincode || '';
    document.getElementById('mpDistrict').value = d.district || '';
    document.getElementById('mpState').value = d.state || '';
    if(d.pincode){
      lookupPincode(d.pincode, 'mp', d.city);
    } else {
      document.getElementById('mpCity').innerHTML = '<option value="">Enter pin code first</option>';
      document.getElementById('mpCity').disabled = true;
    }
    const phoneParts = (d.phone || '+91 ').split(' ');
    document.getElementById('mpPhoneCode').value = phoneParts[0] || '+91';
    document.getElementById('mpPhoneNumber').value = phoneParts.slice(1).join(' ') || '';
    document.getElementById('mpEmail').value = d.email || '';
    openOverlay('myProfileOverlay');
    document.getElementById('profileDropdown').classList.add('pd-closed');
  });
});

document.getElementById('myProfileForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return;
  const name = document.getElementById('mpName').value.trim();
  const fathersName = document.getElementById('mpFathersName').value.trim();
  const dob = document.getElementById('mpDob').value;
  const houseNo = document.getElementById('mpHouseNo').value.trim();
  const street = document.getElementById('mpStreet').value.trim();
  const landmark = document.getElementById('mpLandmark').value.trim();
  const pincode = document.getElementById('mpPincode').value.trim();
  const city = document.getElementById('mpCity').value;
  const district = document.getElementById('mpDistrict').value.trim();
  const state = document.getElementById('mpState').value.trim();
  const phone = document.getElementById('mpPhoneCode').value + ' ' + document.getElementById('mpPhoneNumber').value.trim();

  if(!/^[1-9][0-9]{5}$/.test(pincode) || !city || !district || !state){
    document.getElementById('myProfileSaved').textContent = 'Please enter a valid Indian pin code so City, District and State can be filled in.';
    document.getElementById('myProfileSaved').style.color = 'var(--red)';
    document.getElementById('myProfileSaved').style.display = 'block';
    return;
  }

  db.collection('users').doc(user.uid).update({ name, fathersName, dob, houseNo, street, landmark, pincode, city, district, state, phone }).then(()=>{
    sendToSheet({
      formType: 'studentUpdate',
      studentId: document.getElementById('mpStudentId').textContent,
      name: name,
      fathersName: fathersName,
      dob: dob,
      houseNo: houseNo,
      street: street,
      landmark: landmark,
      pincode: pincode,
      city: city,
      district: district,
      state: state,
      phone: phone,
      email: document.getElementById('mpEmail').value
    });
    document.getElementById('myProfileSaved').textContent = 'Saved.';
    document.getElementById('myProfileSaved').style.color = '';
    document.getElementById('myProfileSaved').style.display = 'block';
    refreshProfileUI(user);
    setTimeout(()=> document.getElementById('myProfileSaved').style.display = 'none', 2500);
  });
});

/* ============================================================
   CHANGE REGISTERED EMAIL
   ============================================================ */
document.getElementById('changeEmailLink').addEventListener('click', (e)=>{
  e.preventDefault();
  closeOverlay('myProfileOverlay');
  openOverlay('changeEmailOverlay');
});

document.getElementById('changeEmailForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return;
  const currentPassword = document.getElementById('ceCurrentPassword').value;
  const newEmail = document.getElementById('ceNewEmail').value.trim();
  const msg = document.getElementById('changeEmailMsg');

  const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
  user.reauthenticateWithCredential(credential).then(()=>{
    return user.verifyBeforeUpdateEmail(newEmail);
  }).then(()=>{
    msg.style.color = 'var(--red)';
    msg.textContent = 'Verification link sent to your new email. Your email will update once you confirm it there.';
    msg.style.display = 'block';
  }).catch((err)=>{
    msg.style.color = 'var(--gray)';
    msg.textContent = err.message;
    msg.style.display = 'block';
  });
});

/* ============================================================
   PROFILE DROPDOWN TOGGLE
   ============================================================ */
document.getElementById('profileAvatarBtn').addEventListener('click', ()=>{
  document.getElementById('profileDropdown').classList.toggle('pd-closed');
});
document.addEventListener('click', (e)=>{
  const wrap = document.getElementById('profileMenuWrap');
  if(!wrap.contains(e.target)){
    document.getElementById('profileDropdown').classList.add('pd-closed');
  }
});

function resetFinderToHome(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '') {
    window.scrollTo({top: 0, behavior: 'smooth'});
  } else {
    window.location.href = 'index.html';
  }
}

document.getElementById('signOutLink').addEventListener('click', (e)=>{
  e.preventDefault();
  auth.signOut();
  resetFinderToHome();
});

/* ============================================================
   DELETE ACCOUNT
   ============================================================ */
document.getElementById('deleteAccountLink').addEventListener('click', (e)=>{
  e.preventDefault();
  document.getElementById('profileDropdown').classList.add('pd-closed');
  document.getElementById('deleteAccountStep1').classList.remove('hidden');
  document.getElementById('deleteAccountStep2').classList.add('hidden');
  document.getElementById('daPassword').value = '';
  hideError('deleteAccountError');
  openOverlay('deleteAccountOverlay');
});

document.getElementById('proceedToDeleteBtn').addEventListener('click', ()=>{
  document.getElementById('deleteAccountStep1').classList.add('hidden');
  document.getElementById('deleteAccountStep2').classList.remove('hidden');
});

document.getElementById('daForgotPasswordLink').addEventListener('click', (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  closeOverlay('deleteAccountOverlay');
  resetForgotPasswordOtpState();
  document.getElementById('fpEmail').value = user ? (user.email || '') : '';
  openOverlay('forgotPasswordOverlay');
});

document.getElementById('deleteAccountForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  hideError('deleteAccountError');
  const user = auth.currentUser;
  if(!user) return;
  const password = document.getElementById('daPassword').value;
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);

  user.reauthenticateWithCredential(credential).then(()=>{
    return db.collection('users').doc(user.uid).get();
  }).then((doc)=>{
    const d = doc.data() || {};
    const studentId = d.studentId;
    const email = d.email || user.email;

    if(studentId){
      sendToSheet({ formType: 'deleteStudent', studentId: studentId });
    }

    return db.collection('users').doc(user.uid).delete()
      .then(()=> db.collection('emailIndex').doc((email || '').toLowerCase()).delete())
      .then(()=> user.delete());
  }).then(()=>{
    closeOverlay('deleteAccountOverlay');
    resetFinderToHome();
    showToast('Your account has been permanently deleted. We\'re sorry to see you go.', 'success');
  }).catch((err)=>{
    if(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'){
      showError('deleteAccountError', 'Incorrect password.');
    } else {
      showError('deleteAccountError', err.message);
    }
  });
});

document.getElementById('cpSignOutLink').addEventListener('click', (e)=>{
  e.preventDefault();
  auth.signOut();
  closeOverlay('completeProfileOverlay');
});

document.getElementById('myOrdersLink').addEventListener('click', (e)=>{
  e.preventDefault();
  document.getElementById('profileDropdown').classList.add('pd-closed');
  renderMyOrders();
  openOverlay('myOrdersOverlay');
});
document.getElementById('myCartLink').addEventListener('click', (e)=>{
  e.preventDefault();
  document.getElementById('profileDropdown').classList.add('pd-closed');
  openCart();
});
document.getElementById('cartIconBtn').addEventListener('click', ()=>{
  openCart();
});

/* ============================================================
   AUTH STATE OBSERVER — drives the whole header UI
   ============================================================ */
function refreshProfileUI(user){
  db.collection('users').doc(user.uid).get().then((doc)=>{
    const d = doc.data() || {};
    document.getElementById('signInBtn').classList.add('hidden');
    document.getElementById('signUpBtn').classList.add('hidden');
    document.getElementById('profileMenuWrap').classList.remove('hidden');
    document.getElementById('profileDropdownName').textContent = d.name || user.email;
    document.getElementById('profileDropdownId').textContent = d.studentId ? ('Student ID: ' + d.studentId) : '';
    const initial = (d.name || user.email || 'A').charAt(0).toUpperCase();
    document.getElementById('profileAvatarInitial').textContent = initial;
    currentUserProfile = { studentId: d.studentId, name: d.name || user.email, email: user.email, phone: d.phone || '' };
    cartItems = d.cart || [];
    updateCartBadge();
    fillHomeCounsellingProfile(currentUserProfile);
    document.getElementById('authArea').classList.remove('auth-checking');

    // Self-healing: if the user verified a "Change Email" since their last visit,
    // Firebase Auth's email is now new but Firestore/Sheet still have the old one — sync them.
    if(d.email && d.email !== user.email && d.studentId){
      db.collection('users').doc(user.uid).update({ email: user.email }).then(()=>{
        sendToSheet({
          formType: 'studentUpdate',
          studentId: d.studentId,
          name: d.name || '',
          fathersName: d.fathersName || '',
          address: d.address || '',
          phone: d.phone || '',
          email: user.email
        });
      });
    }
  });
}

/* ============================================================
   PINCODE LOOKUP — auto-fills City/District/State from an Indian
   PIN code (used by both Complete Profile and My Profile forms).
   ============================================================ */
function lookupPincode(pincode, prefix, preselectCity){
  const cityEl = document.getElementById(prefix + 'City');
  const districtEl = document.getElementById(prefix + 'District');
  const stateEl = document.getElementById(prefix + 'State');
  const errEl = document.getElementById(prefix + 'PincodeError');

  errEl.style.display = 'none';
  districtEl.value = '';
  stateEl.value = '';
  cityEl.innerHTML = '<option value="">Looking up…</option>';
  cityEl.disabled = true;

  if(!/^[1-9][0-9]{5}$/.test(pincode)){
    cityEl.innerHTML = '<option value="">Enter pin code first</option>';
    if(pincode.length === 6){
      errEl.textContent = 'Please enter a valid Indian pin code.';
      errEl.style.display = 'block';
    }
    return;
  }

  fetch('https://api.postalpincode.in/pincode/' + pincode)
    .then(r => r.json())
    .then(data => {
      const result = data && data[0];
      const offices = result && result.Status === 'Success' ? result.PostOffice : null;
      if(!offices || !offices.length){
        cityEl.innerHTML = '<option value="">Enter pin code first</option>';
        errEl.textContent = 'Please enter a valid Indian pin code.';
        errEl.style.display = 'block';
        return;
      }
      cityEl.innerHTML = offices.map(o => '<option value="' + o.Name.replace(/"/g,'&quot;') + '">' + o.Name + '</option>').join('');
      cityEl.disabled = false;
      if(preselectCity && offices.some(o => o.Name === preselectCity)) cityEl.value = preselectCity;
      districtEl.value = offices[0].District || '';
      stateEl.value = offices[0].State || '';
    })
    .catch(()=>{
      cityEl.innerHTML = '<option value="">Enter pin code first</option>';
      errEl.textContent = 'Could not verify this pin code — check your connection and try again.';
      errEl.style.display = 'block';
    });
}
document.getElementById('cpPincode').addEventListener('input', (e)=>{
  const v = e.target.value.replace(/\D/g,'').slice(0,6);
  e.target.value = v;
  if(v.length === 6) lookupPincode(v, 'cp');
});
document.getElementById('mpPincode').addEventListener('input', (e)=>{
  const v = e.target.value.replace(/\D/g,'').slice(0,6);
  e.target.value = v;
  if(v.length === 6) lookupPincode(v, 'mp');
});

function prefillCompleteProfile(user){
  document.getElementById('cpEmail').value = user.email || '';
  document.getElementById('cpSignedInAs').textContent = user.email || user.phoneNumber || 'this account';
  document.getElementById('cpName').value = user.displayName || '';
  document.getElementById('cpFathersName').value = '';
  document.getElementById('cpDob').value = '';
  document.getElementById('cpDob').max = new Date().toISOString().split('T')[0];
  document.getElementById('cpHouseNo').value = '';
  document.getElementById('cpStreet').value = '';
  document.getElementById('cpLandmark').value = '';
  document.getElementById('cpPincode').value = '';
  document.getElementById('cpCity').innerHTML = '<option value="">Enter pin code first</option>';
  document.getElementById('cpCity').disabled = true;
  document.getElementById('cpDistrict').value = '';
  document.getElementById('cpState').value = '';
  document.getElementById('cpPhoneNumber').value = '';
  document.getElementById('cpPhoneCode').value = '+91';
  hideError('completeProfileError');
}

let initialAuthCheckDone = false;

auth.onAuthStateChanged((user)=>{
  if(!user){
    document.getElementById('signInBtn').classList.remove('hidden');
    document.getElementById('signUpBtn').classList.remove('hidden');
    document.getElementById('profileMenuWrap').classList.add('hidden');
    document.getElementById('authArea').classList.remove('auth-checking');
    currentUserProfile = null;
    cartItems = [];
    updateCartBadge();
    fillHomeCounsellingProfile(null);
    initialAuthCheckDone = true;
    return;
  }
  db.collection('users').doc(user.uid).get().then((doc)=>{
    const hasProfile = doc.exists && doc.data().studentId;
    if(!hasProfile){
      // Only auto-resume onboarding on a genuine page-load session restore.
      // Explicit sign-up/sign-in actions handle this themselves (see below) to avoid races.
      if(!initialAuthCheckDone){
        prefillCompleteProfile(user);
        openOverlay('completeProfileOverlay');
      }
      document.getElementById('authArea').classList.remove('auth-checking');
    } else {
      refreshProfileUI(user);
    }
    initialAuthCheckDone = true;
  });
});

/* ===== FAQ ACCORDION (click to expand — works the same on desktop, Android and iOS) ===== */
document.querySelectorAll('.faq-item .faq-q').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const item = btn.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item.open').forEach(other=>{
      if(other!==item) other.classList.remove('open');
    });
    item.classList.toggle('open', !wasOpen);
  });
});

/* ===== WHY CHOOSE US ROWS (tap to toggle on touch — fixes Android "stuck open" hover bug) ===== */
document.querySelectorAll('.wc-row').forEach(row=>{
  row.addEventListener('click', (e)=>{
    if(e.target.closest('a,button')) return;
    const wasOpen = row.classList.contains('open');
    document.querySelectorAll('.wc-row.open').forEach(other=>{
      if(other!==row) other.classList.remove('open');
    });
    row.classList.toggle('open', !wasOpen);
  });
});
