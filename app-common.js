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
}
updateFounderYears();

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

/* ============================================================
   MOBILE NAV (hamburger)
   ============================================================ */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mainNav = document.getElementById('mainNav');
hamburgerBtn.addEventListener('click',()=>{
  mainNav.classList.toggle('mobile-open');
});
mainNav.querySelectorAll('a').forEach(a=>{
  a.addEventListener('click',()=>mainNav.classList.remove('mobile-open'));
});

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

function sendToSheet(payload){
  // no-cors: we can't read the response, but the data still reaches the script.
  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).catch(err => console.error('Submission error:', err));
}

/* ============================================================
   CART SYSTEM
   ============================================================ */
let cartItems = [];
let currentUserProfile = null; // { studentId, name, email } cached on sign-in

function requireAuthOrPrompt(){
  if(auth.currentUser && currentUserProfile){
    return true;
  }
  alert('Please sign in or sign up first to add items to your cart.');
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
  } else {
    badge.classList.add('hidden');
  }
}

function describeCartItem(item){
  if(item.kind === 'classPaper'){
    return item.course + ' ' + item.level + ' — ' + item.paperNo + ': ' + item.paperName +
      '<br><span style="color:var(--gray);font-size:12px;">Faculty: ' + item.faculty + ' · Attempt: ' + item.attempt + ' · ' + item.typeOfClass + '</span>';
  }
  return (item.examOrCourse || 'Counselling') + ' — Free Counselling Request' +
    '<br><span style="color:var(--gray);font-size:12px;">' + item.whatWantToKnow.slice(0,80) + (item.whatWantToKnow.length > 80 ? '…' : '') + '</span>';
}

function renderCart(){
  const list = document.getElementById('cartItemsList');
  const emptyMsg = document.getElementById('cartEmptyMsg');
  const placeBtn = document.getElementById('placeCartOrderBtn');
  list.innerHTML = '';
  if(cartItems.length === 0){
    emptyMsg.style.display = 'block';
    placeBtn.disabled = true;
    return;
  }
  emptyMsg.style.display = 'none';
  placeBtn.disabled = false;
  cartItems.forEach((item, idx)=>{
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:13.5px;';
    row.innerHTML = `<div>${describeCartItem(item)}</div><a href="#" data-idx="${idx}" style="color:var(--red);font-size:12px;flex:0 0 auto;">Remove</a>`;
    row.querySelector('a').addEventListener('click',(e)=>{
      e.preventDefault();
      cartItems.splice(idx,1);
      saveCartToFirestore().then(()=>{ updateCartBadge(); renderCart(); });
    });
    list.appendChild(row);
  });
}

function openCart(){
  renderCart();
  openOverlay('cartOverlay');
}

document.getElementById('placeCartOrderBtn').addEventListener('click', ()=>{
  if(cartItems.length === 0 || !currentUserProfile) return;
  const classPaperItems = cartItems.filter(i => i.kind === 'classPaper');
  const counsellingItems = cartItems.filter(i => i.kind === 'counselling');

  if(classPaperItems.length > 0){
    sendToSheet({
      formType: 'order',
      studentId: currentUserProfile.studentId,
      name: currentUserProfile.name,
      email: currentUserProfile.email,
      extraInfo: '',
      papers: classPaperItems
    });
  }
  counsellingItems.forEach(item=>{
    sendToSheet({
      formType: 'counselling',
      studentId: currentUserProfile.studentId,
      name: currentUserProfile.name,
      email: currentUserProfile.email,
      examOrCourse: item.examOrCourse,
      whatWantToKnow: item.whatWantToKnow
    });
  });

  // Log a lightweight summary for "My Orders"
  const uid = auth.currentUser.uid;
  db.collection('users').doc(uid).update({
    orderHistory: firebase.firestore.FieldValue.arrayUnion({
      date: new Date().toISOString(),
      itemCount: cartItems.length,
      summary: cartItems.map(i => i.kind === 'classPaper' ? (i.course + ' ' + i.level + ' ' + i.paperNo) : (i.examOrCourse || 'Counselling')).join(', ')
    })
  });

  cartItems = [];
  saveCartToFirestore().then(()=>{
    updateCartBadge();
    closeOverlay('cartOverlay');
    const emailSpanId = classPaperItems.length > 0 ? 'orderSuccessEmail' : 'bookedSuccessEmail';
    document.getElementById(emailSpanId).textContent = currentUserProfile.email;
    openOverlay(classPaperItems.length > 0 ? 'orderSuccessOverlay' : 'bookedSuccessOverlay');
  });
});

/* ============================================================
   MY ORDERS
   ============================================================ */
function renderMyOrders(){
  const list = document.getElementById('myOrdersList');
  const emptyMsg = document.getElementById('myOrdersEmptyMsg');
  list.innerHTML = '';
  if(!auth.currentUser){ emptyMsg.style.display = 'block'; return; }
  db.collection('users').doc(auth.currentUser.uid).get().then((doc)=>{
    const history = (doc.data() || {}).orderHistory || [];
    if(history.length === 0){
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';
    history.slice().reverse().forEach(entry=>{
      const row = document.createElement('div');
      row.style.cssText = 'padding:12px 0;border-bottom:1px solid var(--line);font-size:13.5px;';
      const dateStr = new Date(entry.date).toLocaleString();
      row.innerHTML = `<div style="font-family:var(--head);font-size:12px;color:var(--gray);">${dateStr}</div><div>${entry.summary}</div>`;
      list.appendChild(row);
    });
  });
}


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
let fpEmailVerified = false;

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
  if(!email || !email.includes('@')){ alert('Enter a valid email first.'); return; }
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
  if(!email || !email.includes('@')){ alert('Enter a valid email first.'); return; }
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
  fpEmailVerified = false;
  document.getElementById('fpOtpSection').classList.add('hidden');
  clearOtpBoxes('fpOtpBoxes');
  document.getElementById('fpOtpMsg').style.display = 'none';
  document.getElementById('fpEmail').readOnly = false;
  document.getElementById('fpSendOtpBtn').textContent = 'Verify Email';
  document.getElementById('fpSendOtpBtn').disabled = false;
  document.getElementById('fpSubmitBtn').disabled = true;
}
document.getElementById('fpSendOtpBtn').addEventListener('click', ()=> requestOtp('fpEmail', 'fpSendOtpBtn', 'fpOtpSection', 'fpOtpBoxes'));
document.getElementById('fpResendOtpLink').addEventListener('click', (e)=>{
  e.preventDefault();
  document.getElementById('fpSendOtpBtn').disabled = false;
  requestOtp('fpEmail', 'fpSendOtpBtn', 'fpOtpSection', 'fpOtpBoxes');
});
document.getElementById('fpVerifyOtpBtn').addEventListener('click', ()=>{
  verifyOtp('fpEmail', 'fpOtpBoxes', 'fpOtpMsg', ()=>{
    fpEmailVerified = true;
    document.getElementById('fpSubmitBtn').disabled = false;
  });
});

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
        alert('This Google account is already registered. Please sign in instead.');
        return;
      }
      if(intent === 'signin' && !hasProfile){
        auth.signOut();
        alert('This Google account is not registered yet. Please sign up first.');
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
      alert('Google sign-in failed: ' + err.message);
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
  if(!fpEmailVerified){
    const msg = document.getElementById('forgotPasswordMsg');
    msg.style.color = 'var(--red)';
    msg.textContent = 'Please verify your email with the code first.';
    msg.style.display = 'block';
    return;
  }
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
  const address = document.getElementById('cpAddress').value.trim();
  const phone = document.getElementById('cpPhoneCode').value + ' ' + document.getElementById('cpPhoneNumber').value.trim();

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
        address: address,
        phone: phone,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(()=>{
        sendToSheet({
          formType: 'studentSignup',
          studentId: studentId,
          name: name,
          fathersName: fathersName,
          address: address,
          phone: phone,
          email: user.email
        });
        closeOverlay('completeProfileOverlay');
        refreshProfileUI(user);
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
    document.getElementById('mpAddress').value = d.address || '';
    const phoneParts = (d.phone || '+91 ').split(' ');
    document.getElementById('mpPhoneCode').value = phoneParts[0] || '+91';
    document.getElementById('mpPhoneNumber').value = phoneParts.slice(1).join(' ') || '';
    document.getElementById('mpEmail').value = d.email || '';
    openOverlay('myProfileOverlay');
    document.getElementById('profileDropdown').classList.add('hidden');
  });
});

document.getElementById('myProfileForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const user = auth.currentUser;
  if(!user) return;
  const name = document.getElementById('mpName').value.trim();
  const fathersName = document.getElementById('mpFathersName').value.trim();
  const address = document.getElementById('mpAddress').value.trim();
  const phone = document.getElementById('mpPhoneCode').value + ' ' + document.getElementById('mpPhoneNumber').value.trim();

  db.collection('users').doc(user.uid).update({ name, fathersName, address, phone }).then(()=>{
    sendToSheet({
      formType: 'studentUpdate',
      studentId: document.getElementById('mpStudentId').textContent,
      name: name,
      fathersName: fathersName,
      address: address,
      phone: phone,
      email: document.getElementById('mpEmail').value
    });
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
  document.getElementById('profileDropdown').classList.toggle('hidden');
});
document.addEventListener('click', (e)=>{
  const wrap = document.getElementById('profileMenuWrap');
  if(!wrap.contains(e.target)){
    document.getElementById('profileDropdown').classList.add('hidden');
  }
});

function resetFinderToHome(){
  // Only the Courses page has these elements — safely does nothing extra elsewhere.
  const cb = document.querySelectorAll('#courseButtons .big-choice');
  if(cb.length > 0){
    if(typeof currentCourse !== 'undefined') currentCourse = null;
    if(typeof currentLevel !== 'undefined') currentLevel = null;
    cb.forEach(b=>b.classList.remove('active'));
    const levelWrapEl = document.getElementById('levelWrap');
    const tableWrapEl = document.getElementById('tableWrap');
    const mbaWrapEl = document.getElementById('mbaWrap');
    const levelButtonsEl = document.getElementById('levelButtons');
    if(levelWrapEl) levelWrapEl.classList.add('hidden');
    if(tableWrapEl) tableWrapEl.classList.add('hidden');
    if(mbaWrapEl) mbaWrapEl.classList.add('hidden');
    if(levelButtonsEl) levelButtonsEl.innerHTML = '';
  }
  window.scrollTo({top: 0, behavior: 'smooth'});
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
  document.getElementById('profileDropdown').classList.add('hidden');
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
    alert('Your account has been permanently deleted. We\'re sorry to see you go.');
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
  document.getElementById('profileDropdown').classList.add('hidden');
  renderMyOrders();
  openOverlay('myOrdersOverlay');
});
document.getElementById('myCartLink').addEventListener('click', (e)=>{
  e.preventDefault();
  document.getElementById('profileDropdown').classList.add('hidden');
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
    currentUserProfile = { studentId: d.studentId, name: d.name || user.email, email: user.email };
    cartItems = d.cart || [];
    updateCartBadge();

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

function prefillCompleteProfile(user){
  document.getElementById('cpEmail').value = user.email || '';
  document.getElementById('cpSignedInAs').textContent = user.email || user.phoneNumber || 'this account';
  document.getElementById('cpName').value = user.displayName || '';
  document.getElementById('cpFathersName').value = '';
  document.getElementById('cpAddress').value = '';
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
    currentUserProfile = null;
    cartItems = [];
    updateCartBadge();
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
    } else {
      refreshProfileUI(user);
    }
    initialAuthCheckDone = true;
  });
});
