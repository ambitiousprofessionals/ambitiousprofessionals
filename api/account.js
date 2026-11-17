// /api/account — two small account helpers that must run on the server so that other students' data
// never has to be readable from the browser:
//   phoneTaken     : "is this mobile number already registered to ANOTHER account?"  (sign-up form; needs sign-in)
//   loginByPhone   : sign in with a mobile number + password (the server finds the e-mail, checks the password,
//                    and hands the browser a one-time sign-in token — the e-mail address is never shown to anyone)
//   claimStudentId : gives a new student their Student ID. The ID is tied to the E-MAIL ADDRESS for life — if the same
//                    e-mail signs up again after deleting its account, it gets the SAME Student ID back.
//   rememberStudentId : called just before an account is deleted, so the Student ID is kept for that e-mail.
//                    (kept in the private collection  studentIds  — browsers cannot read or write it)
// Needs the Vercel setting FIREBASE_SERVICE_ACCOUNT (see send-mail.js).

var adminLib = require('./_admin');

var SITE_URL = 'https://ambitiousprofessionals.in';
var FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyCOLJmk4RY8cpR8CSyhMAKsQ6XSeIJyey4';   // the public web key of the website

var limitLog = {};
function allowed(key, max) {
  var now = Date.now(), win = 10 * 60 * 1000;
  var arr = (limitLog[key] || []).filter(function (t) { return now - t < win; });
  if (arr.length >= max) { limitLog[key] = arr; return false; }
  arr.push(now); limitLog[key] = arr;
  return true;
}
function clientIp(req) {
  return String((req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')) || '').split(',')[0].trim() || 'unknown';
}
function clip(s, n) { return String(s === undefined || s === null ? '' : s).slice(0, n || 200); }

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: true, service: 'Ambitious Professionals account helper', adminConfigured: adminLib.isConfigured() });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  var body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'Bad request' });

  var A = adminLib.get();
  if (!A) { console.error('account: ' + adminLib.lastError()); return res.status(500).json({ ok: false, error: 'ADMIN_NOT_CONFIGURED' }); }
  var ip = clientIp(req);

  try {
    /* ---------- is this number already used by another student? ---------- */
    if (body.action === 'phoneTaken') {
      var phone = clip(body.phone, 30).trim();
      if (!phone) return res.status(400).json({ ok: false, error: 'Bad request' });
      if (!allowed('pt-i:' + ip, 60)) return res.status(429).json({ ok: false, error: 'Too many requests' });
      var decoded;
      try { decoded = await A.auth().verifyIdToken(clip(body.idToken, 4000)); }
      catch (e) { return res.status(401).json({ ok: false, error: 'Not signed in' }); }
      var snap = await A.firestore().collection('users').where('phone', '==', phone).limit(2).get();
      var taken = snap.docs.some(function (doc) { return doc.id !== decoded.uid; });
      return res.status(200).json({ ok: true, taken: taken });
    }

    /* ---------- sign in with mobile number + password ---------- */
    if (body.action === 'loginByPhone') {
      var ph = clip(body.phone, 30).trim();
      var pw = clip(body.password, 200);
      if (!ph || !pw) return res.status(400).json({ ok: false, error: 'Bad request' });
      if (!allowed('lp-p:' + ph, 8) || !allowed('lp-i:' + ip, 30)) return res.status(429).json({ ok: false, error: 'Too many attempts. Please try again after a few minutes.' });
      var found = await A.firestore().collection('users').where('phone', '==', ph).limit(1).get();
      var fail = { ok: false, error: 'Incorrect mobile number or password.' };       // the same answer for "no such number" and "wrong password"
      if (found.empty) return res.status(200).json(fail);
      var userDoc = found.docs[0];
      var email = String((userDoc.data() || {}).email || '').toLowerCase();
      if (!email) return res.status(200).json(fail);
      var r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + encodeURIComponent(FIREBASE_API_KEY), {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Referer': SITE_URL + '/' },
        body: JSON.stringify({ email: email, password: pw, returnSecureToken: false })
      });
      if (!r.ok) return res.status(200).json(fail);
      var token = await A.auth().createCustomToken(userDoc.id);
      return res.status(200).json({ ok: true, token: token });
    }

    /* ---------- Student ID for this e-mail address (kept for life) ---------- */
    if (body.action === 'claimStudentId' || body.action === 'rememberStudentId') {
      if (!allowed('sid-i:' + ip, 40)) return res.status(429).json({ ok: false, error: 'Too many requests' });
      var who;
      try { who = await A.auth().verifyIdToken(clip(body.idToken, 4000)); }
      catch (e) { return res.status(401).json({ ok: false, error: 'Not signed in' }); }
      var mail = String(who.email || '').trim().toLowerCase();
      if (!mail) return res.status(400).json({ ok: false, error: 'No e-mail on this account' });
      var fdb = A.firestore();
      var mapRef = fdb.collection('studentIds').doc(mail);

      if (body.action === 'rememberStudentId') {
        var prof = await fdb.collection('users').doc(who.uid).get();
        var sid = prof.exists ? String((prof.data() || {}).studentId || '') : '';
        if (sid) {
          var existing = await mapRef.get();
          if (!existing.exists || existing.data().studentId !== sid) {
            await mapRef.set({ studentId: sid, updatedAt: A.firestore.FieldValue.serverTimestamp() });
          }
        }
        return res.status(200).json({ ok: true });
      }

      var yy = String(new Date(Date.now() + 5.5 * 3600 * 1000).getUTCFullYear()).slice(-2);
      var counterRef = fdb.collection('counters').doc('AP' + yy);
      var studentId = await fdb.runTransaction(async function (tx) {
        var mine = await tx.get(fdb.collection('users').doc(who.uid));
        if (mine.exists && mine.data().studentId) return String(mine.data().studentId);          // already has one
        var saved = await tx.get(mapRef);
        var keep = saved.exists ? String(saved.data().studentId || '') : '';
        if (keep) {
          // only hand it back if no OTHER live account is using it right now
          var inUse = await tx.get(fdb.collection('users').where('studentId', '==', keep).limit(2));
          var usedByOther = inUse.docs.some(function (d) { return d.id !== who.uid; });
          if (!usedByOther) return keep;
        }
        var c = await tx.get(counterRef);
        var next = (c.exists ? (c.data().lastNumber || 0) : 0) + 1;
        var fresh = 'AP' + yy + String(next).padStart(4, '0');
        tx.set(counterRef, { lastNumber: next }, { merge: true });
        tx.set(mapRef, { studentId: fresh, updatedAt: A.firestore.FieldValue.serverTimestamp() });
        return fresh;
      });
      return res.status(200).json({ ok: true, studentId: studentId });
    }

    return res.status(400).json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    console.error('account error:', err && err.message);
    return res.status(500).json({ ok: false, error: 'Something went wrong' });
  }
}

module.exports = handler;
