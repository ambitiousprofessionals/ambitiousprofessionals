/* ============================================================
   FULL-PAGE "MY CART" and "MY ORDERS"
   Needs (loaded before it): app-common.js, app-coursedata.js, app-cards.js
   ============================================================ */

/* ---------- small helpers ---------- */
function cpMoney(n){
  return (n === null || n === undefined || isNaN(n)) ? '---' : ('₹' + Number(n).toLocaleString('en-IN') + '/-');
}

function cpKind(it){
  const k = it.kind || it._type || 'classPaper';
  if(k === 'testSeries') return 'ts';
  if(k === 'counselling') return 'counselling';
  return 'lecture';
}

/* a product can be made of several cart lines (a combo): lines added together share a groupId */
function cpGroup(items){
  const groups = [];
  const byId = {};
  items.forEach((it, idx)=>{
    let g = it.groupId ? byId[it.groupId] : null;
    if(!g){
      g = { kind:cpKind(it), items:[], idxs:[] };
      groups.push(g);
      if(it.groupId) byId[it.groupId] = g;
    }
    g.items.push(it);
    g.idxs.push(idx);
  });
  return groups;
}

/* total of a list of products: a number, 0 (only free items), or null while some price is unknown */
function cpTotal(groups){
  let sum = 0, missing = false, any = false;
  groups.forEach(g=>{
    if(g.kind === 'counselling') return;
    any = true;
    const pr = g.items[0].price;
    if(typeof pr === 'number') sum += pr; else missing = true;
  });
  if(!any) return 0;
  return missing ? null : sum;
}

/* rebuilds the product (or Test Series card) a saved line belongs to */
const cpCatCache = {};
function cpLectureProduct(it){
  const c = it.course, l = it.level;
  if(typeof COURSES !== 'undefined' && COURSES[c] && COURSES[c][l]){
    const key = c + '|' + l;
    if(!cpCatCache[key]) cpCatCache[key] = buildCatalog(c, l);
    let p = it.productId ? cpCatCache[key].find(x => x.id === it.productId) : null;
    if(p) return p;
    const paper = COURSES[c][l].find(pp => pp.no === it.paperNo);
    if(paper){
      const batch = /fast/i.test(it.typeOfClass || '') ? 'fasttrack' : 'regular';
      return makeSingleProduct(c, l, paper, it.faculty, batch);
    }
  }
  const batch = /fast/i.test(it.typeOfClass || '') ? 'fasttrack' : 'regular';
  return {
    id:'x', category:'single', course:c, level:l, examLabel:getExamLabel(c, l), examFull:getExamLabel(c, l), batch, group:'',
    subjects:[it.paperName || ''], faculties:[it.faculty || ''], items:[{ paperNo:it.paperNo, paperName:it.paperName, faculty:it.faculty }],
    paperNo:it.paperNo, title:(getExamLabel(c, l) + ' ' + (it.paperName || '') + ' ' + (it.typeOfClass || '') + ' Lectures by ' + (it.faculty || ''))
  };
}
function cpTSProduct(it){
  let course = it.course, level = it.level, typeKey = it.typeKey;
  if(!course){
    const m = String(it.examToAppear || '').match(/^(CA|CMA)\s+(Foundation|Intermediate|Final)/);
    if(m){ course = m[1]; level = m[2]; }
  }
  if(!typeKey){
    const t = String(it.testSeriesType || '');
    typeKey = /group/i.test(t) ? 'group' : (/all/i.test(t) ? 'all' : (/subject/i.test(t) ? 'subject' : null));
  }
  if(course && level && typeKey && tsIsValidExam(course, level)) return makeTSProduct(course, level, typeKey);
  return null;
}
function cpGenericTSPoster(it){
  return '<div class="pc-poster pc-single pc-ts"><div class="pc-panel"><span class="pc-rect"></span>' + TS_ILLUS +
    '<div class="pc-left"><div class="pc-badge">' + esc(it.examToAppear || 'TEST SERIES') + '</div>' +
    '<div class="pc-tagline">TEST SERIES</div><div class="pc-subject">' + esc(it.testSeriesType || 'TEST SERIES') + '</div></div>' +
    '<span class="pc-lectag">Test<br>Series</span></div></div>';
}
function cpPoster(g){
  const it = g.items[0];
  if(g.kind === 'lecture') return posterHTML(cpLectureProduct(it));
  if(g.kind === 'ts'){
    const p = cpTSProduct(it);
    return p ? tsPosterHTML(p) : cpGenericTSPoster(it);
  }
  return counsellingPosterHTML(it);
}

/* "2026-01-05T..." -> "05-Jan-2026" */
function cpDate(iso){
  const d = new Date(iso);
  if(isNaN(d.getTime())) return '';
  return String(d.getDate()).padStart(2, '0') + '-' + MONTH_NAMES[d.getMonth()] + '-' + d.getFullYear();
}

/* the sentence shown in the 3rd column of the cart */
function cpDescribe(g){
  const it = g.items[0];
  if(g.kind === 'lecture'){
    const title = cpLectureProduct(it).title;
    const noBooks = /without|not applicable/i.test(it.bookPreference || '');
    return title + ' for the attempt ' + (it.attempt || '') +
      (noBooks ? ' without books' : (' with ' + (it.bookPreference || '') + ' books')) +
      ' in the mode ' + (it.modeOfClass || '');
  }
  if(g.kind === 'ts'){
    const p = cpTSProduct(it);
    const title = p ? p.title : ((it.examToAppear || '') + ' – ' + (it.testSeriesType || 'Test Series'));
    let text = title + ' for the attempt ' + (it.attempt || '');
    if(p && p.typeKey === 'group') text += ' (' + (it.attemptingFor || '') + ')';
    else if(p && p.typeKey === 'subject') text += ' (' + (it.attemptingFor || '') + ')';
    return text;
  }
  return 'Free Counselling Request' + (it.examOrCourse ? (' – ' + it.examOrCourse) : '');
}

const CP_TRASH = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';

/* ============================================================
   PAGE LAYERS
   ============================================================ */
function cpGetLayer(id, label){
  let el = document.getElementById(id);
  if(el) return el;
  el = document.createElement('div');
  el.id = id;
  el.className = 'cp hidden';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', label);
  el.innerHTML =
    '<div class="cp-top">' +
      '<button type="button" class="cp-back hidden" aria-label="Back">' + ICON_BACK + '</button>' +
      '<h2 class="cp-title"></h2>' +
      '<button type="button" class="cp-close" aria-label="Close">✕</button>' +
    '</div>' +
    '<div class="cp-body"><div class="cp-inner"></div></div>' +
    '<div class="cp-bottom hidden"><div class="cp-bottom-inner"></div></div>';
  document.body.appendChild(el);
  el._backs = [];
  el.querySelector('.cp-close').addEventListener('click', ()=> cpHide(el));
  el.querySelector('.cp-back').addEventListener('click', ()=>{
    const fn = el._backs.pop();
    if(fn) fn();
  });
  return el;
}
function cpInner(layer){ return layer.querySelector('.cp-inner'); }
function cpSetTitle(layer, title, showBack){
  layer.querySelector('.cp-title').textContent = title;
  layer.querySelector('.cp-back').classList.toggle('hidden', !showBack);
}
function cpShow(layer){
  layer.classList.remove('hidden');
  document.body.classList.add('cp-lock');
}
function cpHide(layer){
  layer.classList.add('hidden');
  layer._backs = [];
  if(!document.querySelector('.cp:not(.hidden)')) document.body.classList.remove('cp-lock');
}
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  if(document.querySelector('.overlay:not(.hidden-overlay)')) return;     // a pop-up is open above the page: let it handle Escape
  const open = Array.prototype.slice.call(document.querySelectorAll('.cp:not(.hidden)')).pop();
  if(!open) return;
  const fn = open._backs.pop();
  if(fn) fn(); else cpHide(open);
});

/* ============================================================
   PRODUCT DETAILS (read-only version of the product page)
   ============================================================ */
function cpStaticField(label, value){
  return '<div class="pv-field"><label>' + esc(label) + '</label><div class="pv-val">' + value + '</div></div>';
}
function cpPriceHTML(it){
  const price = (typeof it.price === 'number') ? it.price : null;
  const mrp = (typeof it.mrp === 'number') ? it.mrp : null;
  return '<div class="pv-price"><div class="pv-price-row">' +
      '<s class="pv-mrp' + (mrp ? '' : ' pc-na') + '">' + esc(formatRupees(mrp)) + '</s>' +
      '<b class="pv-final">' + esc(formatRupees(price)) + '</b>' +
      '<span class="pc-off">' + esc(it.discount ? (it.discount + '% off') : '---% off') + '</span>' +
    '</div>' +
    (it.coupon ? '<div class="pv-saved">Coupon ' + esc(it.coupon) + ' applied: −' + esc(formatRupees(it.couponOff || 0)) + '</div>' : '') +
  '</div>';
}

function cpDetailHTML(g){
  const it = g.items[0];
  if(g.kind === 'lecture'){
    const p = cpLectureProduct(it);
    const includes = g.items.length > 1
      ? cpStaticField('Includes', g.items.map(x => esc(x.paperName) + ' — ' + esc(x.faculty)).join('<br>'))
      : '';
    return '<div class="pv pv-readonly">' +
      '<div class="pv-top">' +
        '<div class="pv-visual">' + posterHTML(p) + '</div>' +
        '<div class="pv-info">' +
          '<h1 class="pv-title">' + esc(p.title) + '</h1>' +
          '<div class="pv-selects">' +
            cpStaticField('For the Attempt', esc(it.attempt)) +
            cpStaticField('Book Preference', esc(it.bookPreference)) +
            cpStaticField('Mode of Class', esc(it.modeOfClass)) +
            includes +
          '</div>' +
          cpPriceHTML(it) +
        '</div>' +
      '</div>' +
      productTabsHTML(p) +
    '</div>';
  }
  if(g.kind === 'ts'){
    const p = cpTSProduct(it);
    let fields = cpStaticField('For the Attempt', esc(it.attempt));
    if(p && p.typeKey === 'group'){
      fields += cpStaticField('Group', esc(it.attemptingFor));
    } else if(p && p.typeKey === 'subject'){
      const m = String(it.attemptingFor || '').match(/^Any\s+(\d+)/i);
      const names = (it.subjects && it.subjects.length) ? it.subjects : String(it.attemptingFor || '').replace(/^[^:]*:\s*/, '').split(/,\s*/);
      fields += cpStaticField('Number of Subjects', esc(m ? ('Any ' + m[1]) : ''));
      fields += cpStaticField('Subjects', names.map(esc).join('<br>'));
    } else if(!p){
      fields += cpStaticField('Attempting For', esc(it.attemptingFor)) + cpStaticField('Type', esc(it.testSeriesType));
    }
    return '<div class="pv pv-readonly">' +
      '<div class="pv-top">' +
        '<div class="pv-visual">' + (p ? tsPosterHTML(p) : cpGenericTSPoster(it)) + '</div>' +
        '<div class="pv-info">' +
          '<h1 class="pv-title">' + esc(p ? p.title : ((it.examToAppear || '') + ' – ' + (it.testSeriesType || 'Test Series'))) + '</h1>' +
          '<div class="pv-selects">' + fields + '</div>' +
          cpPriceHTML(it) +
        '</div>' +
      '</div>' +
    '</div>';
  }
  return '<div class="pv pv-readonly">' +
    '<div class="pv-top">' +
      '<div class="pv-visual">' + counsellingPosterHTML(it) + '</div>' +
      '<div class="pv-info">' +
        '<h1 class="pv-title">Free Counselling Request</h1>' +
        '<div class="pv-selects">' +
          cpStaticField('Exam / Course', esc(it.examOrCourse || '—')) +
          cpStaticField('What you want to know', esc(it.whatWantToKnow || '—')) +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function cpShowDetail(layer, g, title, backFn){
  layer._backs.push(backFn);
  cpSetTitle(layer, title || 'Product Details', true);
  layer.querySelector('.cp-bottom').classList.add('hidden');
  const inner = cpInner(layer);
  inner.innerHTML = cpDetailHTML(g);
  const tabs = inner.querySelector('.pv-tabs-wrap');
  if(tabs) wireProductTabs(inner);
  fitPosterText(inner);
  layer.querySelector('.cp-body').scrollTop = 0;
}

/* ============================================================
   MY CART
   ============================================================ */
function openCartPage(){
  const layer = cpGetLayer('cartPage', 'My Cart');
  layer._backs = [];
  cpShow(layer);
  renderCartPage();
}

function renderCartPage(){
  const layer = cpGetLayer('cartPage', 'My Cart');
  layer._backs = [];
  cpSetTitle(layer, 'My Cart', false);
  const inner = cpInner(layer);
  const bottom = layer.querySelector('.cp-bottom');
  const groups = cpGroup(cartItems);

  if(groups.length === 0){
    inner.innerHTML = '<div class="cp-empty"><div class="cp-empty-icon" aria-hidden="true">🛒</div><h3>Your cart is empty</h3>' +
      '<p>Add lectures or a test series and they will appear here.</p>' +
      '<a class="btn btn-primary" href="courses.html">Browse Lectures</a></div>';
    bottom.classList.add('hidden');
    return;
  }

  inner.innerHTML = '<div class="cp-list">' + groups.map((g, i) =>
    '<div class="cp-row cp-crow" data-g="' + i + '">' +
      '<div class="cp-sl">' + (i + 1) + '</div>' +
      '<div class="cp-thumb">' + cpPoster(g) + '</div>' +
      '<div class="cp-name">' + esc(cpDescribe(g)) + '</div>' +
      '<div class="cp-mid"><button type="button" class="btn btn-outline cp-detail-btn">Product Details</button></div>' +
      '<button type="button" class="cp-del" aria-label="Remove from cart" title="Remove">' + CP_TRASH + '</button>' +
    '</div>'
  ).join('') + '</div>';
  fitPosterText(inner);

  inner.querySelectorAll('.cp-crow').forEach(row => {
    const g = groups[parseInt(row.dataset.g, 10)];
    row.querySelector('.cp-detail-btn').addEventListener('click', ()=>{
      cpShowDetail(layer, g, 'Product Details', ()=>{ renderCartPage(); });
    });
    row.querySelector('.cp-del').addEventListener('click', ()=>{
      row.classList.add('is-removing');
      setTimeout(()=>{
        g.idxs.slice().sort((a, b) => b - a).forEach(ix => cartItems.splice(ix, 1));
        saveCartToFirestore().then(()=>{ updateCartBadge(); renderCartPage(); });
      }, 260);
    });
  });

  const total = cpTotal(groups);
  bottom.classList.remove('hidden');
  bottom.querySelector('.cp-bottom-inner').innerHTML =
    '<div class="cp-total"><span class="cp-total-label">Total Amount</span><b class="cp-total-val">' +
      esc(total === 0 ? 'Free' : cpMoney(total)) + '</b></div>' +
    '<button type="button" class="btn btn-primary cp-checkout">Checkout</button>';
  bottom.querySelector('.cp-checkout').addEventListener('click', ()=>{ cpAskToPlaceOrder(layer); });
}

/* "Are you sure you want to place this order?"  Yes -> the Attention! pop-up,  No -> straight back to My Cart */
function cpAskToPlaceOrder(layer){
  let ov = document.getElementById('orderAskOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.className = 'overlay hidden-overlay';
    ov.id = 'orderAskOverlay';
    ov.innerHTML =
      '<div class="modal ask-modal">' +
        '<h3 id="orderAskTitle">Place this order?</h3>' +
        '<div class="sub" id="orderAskText"></div>' +
        '<div class="ask-btns">' +
          '<button type="button" class="btn btn-outline" id="orderAskNo">No</button>' +
          '<button type="button" class="btn btn-primary" id="orderAskYes">Yes</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector('#orderAskNo').addEventListener('click', ()=>{ closeOverlay('orderAskOverlay'); });   // the cart page is still right behind it
    ov.querySelector('#orderAskYes').addEventListener('click', ()=>{
      closeOverlay('orderAskOverlay');
      cpHide(document.getElementById('cartPage'));
      const old = document.getElementById('placeCartOrderBtn');       // the existing steps carry on from here
      if(old) old.click();
    });
  }
  const onlyCounselling = cartItems.length > 0 && cartItems.every(it => cpKind(it) === 'counselling');
  ov.querySelector('#orderAskTitle').textContent = onlyCounselling ? 'Submit this request?' : 'Place this order?';
  ov.querySelector('#orderAskText').textContent = onlyCounselling
    ? 'Are you sure you want to submit your counselling request?'
    : 'Are you sure you want to place this order?';
  openOverlay('orderAskOverlay');
}

/* ============================================================
   MY ORDERS
   ============================================================ */
function cpOrderStack(groups){
  const shown = groups.slice(-6);                       // the front card is the last one
  const n = shown.length;
  return '<div class="cp-stack" style="--n:' + n + '">' + shown.map((g, i) =>
    '<div class="cp-stack-card" style="--i:' + i + '">' + cpPoster(g) + '</div>'
  ).join('') + '</div>';
}

function openMyOrdersPage(){
  const layer = cpGetLayer('ordersPage', 'My Orders');
  layer._backs = [];
  cpShow(layer);
  cpSetTitle(layer, 'My Orders', false);
  layer.querySelector('.cp-bottom').classList.add('hidden');
  const inner = cpInner(layer);
  if(typeof auth === 'undefined' || !auth.currentUser){
    inner.innerHTML = '<div class="cp-empty"><h3>Please sign in</h3><p>Sign in to see your orders.</p></div>';
    return;
  }
  inner.innerHTML = '<div class="cp-empty"><p>Loading your orders…</p></div>';
  const uid = auth.currentUser.uid;
  Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('orders').where('uid', '==', uid).get().catch(()=> null),
    db.collection('testSeriesOrders').where('uid', '==', uid).get().catch(()=> null)
  ]).then(res=>{
    const history = (res[0].data() || {}).orderHistory || [];
    const status = {};            // orderId -> { paid, cancelled }
    [res[1], res[2]].forEach(snap=>{
      if(!snap) return;
      snap.forEach(d=>{
        const x = d.data();
        status[x.orderId] = { paid: !!(x.paymentRecdAt || x.paymentRecd === 'yes'), cancelled: x.deliveryStatus === 'cancelled' };
      });
    });
    renderOrdersList(layer, history, status);
  }).catch(()=>{
    inner.innerHTML = '<div class="cp-empty"><h3>Could not load your orders</h3><p>Please try again in a moment.</p></div>';
  });
}

function renderOrdersList(layer, history, status){
  layer._backs = [];
  cpSetTitle(layer, 'My Orders', false);
  layer.querySelector('.cp-bottom').classList.add('hidden');
  const inner = cpInner(layer);
  if(history.length === 0){
    inner.innerHTML = '<div class="cp-empty"><div class="cp-empty-icon" aria-hidden="true">📦</div><h3>No orders yet</h3><p>Your orders will appear here once you place one.</p></div>';
    return;
  }
  const rows = history.map((entry, realIdx) => ({ entry, realIdx })).reverse();
  inner.innerHTML = '<div class="cp-list">' + rows.map(r => {
    const entry = r.entry;
    const items = entry.items || [];
    const groups = cpGroup(items);
    const isCounselling = !entry.orderId && items.length > 0 && items.every(it => cpKind(it) === 'counselling');
    const st = (entry.orderId && status[entry.orderId]) || { paid:false, cancelled:false };
    const total = cpTotal(groups);
    let priceHTML;
    if(isCounselling){
      priceHTML = '<span class="cp-oprice cp-free">Free</span>';
    } else {
      priceHTML = '<span class="cp-oprice ' + (st.paid ? 'cp-paid' : 'cp-unpaid') + '">' + esc(total === 0 ? 'Free' : cpMoney(total)) + '</span>' +
        (st.cancelled ? '<span class="cp-ocancel">Cancelled</span>' : '');
    }
    return '<div class="cp-row cp-orow" data-i="' + r.realIdx + '">' +
      '<div class="cp-oid"><span class="cp-oid-label">' + (isCounselling ? 'Request' : 'Order ID') + '</span><b>' + (isCounselling ? 'Counselling' : ('#' + esc(entry.orderId || '—'))) + '</b>' +
        (cpDate(entry.date) ? '<span class="cp-odate">' + esc(cpDate(entry.date)) + '</span>' : '') + '</div>' +
      '<div class="cp-ostack">' + cpOrderStack(groups) + '</div>' +
      '<div class="cp-obtns">' +
        '<button type="button" class="btn btn-outline cp-view-btn">View Details</button>' +
        '<button type="button" class="btn btn-outline cp-track-btn">Track Order</button>' +
      '</div>' +
      '<div class="cp-oprice-wrap">' + priceHTML + '</div>' +
    '</div>';
  }).join('') + '</div>';
  fitPosterText(inner);

  inner.querySelectorAll('.cp-orow').forEach(row => {
    const entry = history[parseInt(row.dataset.i, 10)];
    row.querySelector('.cp-track-btn').addEventListener('click', ()=>{ openTrackOrder(entry); });
    row.querySelector('.cp-view-btn').addEventListener('click', ()=>{ renderOrderDetail(layer, entry, history, status); });
  });
}

/* the products inside one order — same look as the cart rows, without the delete button */
function renderOrderDetail(layer, entry, history, status){
  layer._backs = [ ()=>{ renderOrdersList(layer, history, status); } ];
  const items = entry.items || [];
  const groups = cpGroup(items);
  const isCounselling = !entry.orderId && items.length > 0 && items.every(it => cpKind(it) === 'counselling');
  cpSetTitle(layer, isCounselling ? 'Counselling Request' : ('Order ID #' + (entry.orderId || '—')), true);
  layer.querySelector('.cp-bottom').classList.add('hidden');
  const inner = cpInner(layer);
  inner.innerHTML = '<div class="cp-list">' + groups.map((g, i) =>
    '<div class="cp-row cp-drow" data-g="' + i + '">' +
      '<div class="cp-sl">' + (i + 1) + '</div>' +
      '<div class="cp-thumb">' + cpPoster(g) + '</div>' +
      '<div class="cp-name">' + esc(cpDescribe(g)) + '</div>' +
      '<div class="cp-mid"><button type="button" class="btn btn-outline cp-detail-btn">Product Details</button></div>' +
    '</div>'
  ).join('') + '</div>';
  fitPosterText(inner);
  layer.querySelector('.cp-body').scrollTop = 0;
  inner.querySelectorAll('.cp-drow').forEach(row => {
    const g = groups[parseInt(row.dataset.g, 10)];
    row.querySelector('.cp-detail-btn').addEventListener('click', ()=>{
      cpShowDetail(layer, g, 'Product Details', ()=>{ renderOrderDetail(layer, entry, history, status); });
    });
  });
}
