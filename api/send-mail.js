// /api/send-mail — sends ALL the website's e-mails straight from Gmail (no Google Apps Script, no Google Sheet).
//
// The e-mails (and ONLY these):
//   1. a student signs up       -> admin notification  +  Welcome e-mail to the student
//   2. a student places an order (lecture order OR test series order)
//                               -> admin notification  +  e-mail to the student with the Order ID, every product
//                                  and its price, the total order value, the UPI QR code with a "Pay now" button
//                                  and a "Track your order" link
//   3. the 4-digit verification code (OTP) that sign-up needs  (made, stored and checked HERE on the server — never in the browser)
//   4. the password-reset e-mail (forgot password)
//   5. the "sorry to see you go" e-mail when a student deletes the account
//
// SETUP (once, in Vercel):  Project -> Settings -> Environment Variables, add
//      GMAIL_ADDRESS       = ambitiousprofessionals12@gmail.com
//      GMAIL_APP_PASSWORD  = the 16-letter Gmail "App Password"      (then Redeploy)
//      FIREBASE_SERVICE_ACCOUNT = the whole contents of the Firebase service-account key (.json) file
// Check it any time by opening  https://ambitiousprofessionals.in/api/send-mail  in a browser:
// it says  "mailConfigured": true  and  "adminConfigured": true  when the settings are in place.

var nodemailer = require('nodemailer');
var crypto = require('crypto');
var adminLib = require('./_admin');

var VERSION = 'v2026-11-16-VercelMail2';
var SITE_URL = 'https://ambitiousprofessionals.in';
var ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ambitiousprofessionals12@gmail.com';
var UPI_ID = 'abanindrasahu@ybl';
var UPI_PAYEE_NAME = 'Ambitious Professionals';
var FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyCOLJmk4RY8cpR8CSyhMAKsQ6XSeIJyey4';   // the public web key of the website
var BRAND_RED = '#AE1029';

var SIGN_OFF_TEXT =
  'Warm regards,\n' +
  'Team Ambitious Professionals\n' +
  'Gandhi Nagar, 1st Line Extn, Brahmapur, Odisha\n' +
  'ambitiousprofessionals12@gmail.com\n' +
  '+91 98531 70049';
var SIGN_OFF_HTML =
  '<p style="margin:24px 0 0;">Warm regards,<br>' +
  '<b>Team Ambitious Professionals</b><br>' +
  'Gandhi Nagar, 1st Line Extn, Brahmapur, Odisha<br>' +
  'ambitiousprofessionals12@gmail.com<br>' +
  '+91 98531 70049</p>';

/* ---------------------------------------------------------------- helpers */
function escHtml(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function clip(s, n) { return String(s === undefined || s === null ? '' : s).slice(0, n || 300); }

// 1234567 -> "₹12,34,567" (Indian digit grouping; paise only when the amount really has them)
function inr(n) {
  n = Number(n) || 0;
  var whole = Math.abs(n - Math.round(n)) < 0.005;
  var sign = n < 0 ? '-' : '';
  var abs = Math.abs(n);
  var fixed = whole ? String(Math.round(abs)) : abs.toFixed(2);
  var parts = fixed.split('.');
  var s = parts[0];
  var last3 = s.slice(-3);
  var rest = s.slice(0, -3);
  if (rest !== '') {
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    last3 = ',' + last3;
  }
  return sign + '₹' + rest + last3 + (parts[1] ? '.' + parts[1] : '');
}
function firstNameOf(name) {
  var n = String(name || '').trim();
  return n ? n.split(/\s+/)[0] : 'Student';
}
function priceText(p) {
  if (p === null || p === undefined || p === '') return '—';
  if (Number(p) === 0) return 'Free';
  return inr(p);
}
function formatAddress(d) {
  var parts = [];
  if (d.houseNo) parts.push(d.houseNo);
  if (d.street) parts.push(d.street);
  if (d.landmark) parts.push(d.landmark);
  if (d.post) parts.push('P.O. ' + d.post);
  var city = d.cityTown || d.city || '';
  var cityPin = city && d.pincode ? city + ' - ' + d.pincode : (city || d.pincode || '');
  if (cityPin) parts.push(cityPin);
  if (d.district) parts.push(d.district);
  if (d.state) parts.push(d.state);
  return parts.length ? parts.join(', ') : (d.address || '');
}
function trackLinkFor(orderId) { return SITE_URL + '/?track=' + encodeURIComponent(orderId); }

function emailShell(title, subtitle, inner) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;color:#2B2823;font-size:14.5px;line-height:1.6;">' +
    '<div style="background:' + BRAND_RED + ';color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">' +
      '<div style="font-size:19px;font-weight:bold;">' + escHtml(title) + '</div>' +
      (subtitle ? '<div style="font-size:13px;opacity:.9;">' + escHtml(subtitle) + '</div>' : '') +
    '</div>' +
    '<div style="border:1px solid #e6e0d4;border-top:none;padding:24px;border-radius:0 0 8px 8px;">' + inner + '</div>' +
  '</div>';
}
function factsTable(rows) {
  var html = '<table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;font-size:13.5px;margin:10px 0 16px;">';
  rows.forEach(function (r) {
    html += '<tr>' +
      '<td style="padding:9px 10px;border-bottom:1px solid #eee;color:#786F63;width:34%;vertical-align:top;background:#FBF9F5;">' + escHtml(r[0]) + '</td>' +
      '<td style="padding:9px 10px;border-bottom:1px solid #eee;vertical-align:top;">' + escHtml(r[1]) + '</td></tr>';
  });
  return html + '</table>';
}
function dashboardNote(what) {
  return '<div style="background:#FBF9F5;border:1px solid #e6e0d4;border-left:4px solid ' + BRAND_RED + ';border-radius:6px;padding:14px 16px;margin:18px 0 6px;">' +
    '<b>To see the complete ' + escHtml(what) + ' details:</b><br>' +
    'open your <b>Admin Dashboard</b> — double-click <b>start.bat</b> in your admin-tool folder and sign in with ' + escHtml(ADMIN_EMAIL) + '.</div>';
}
function dashboardNoteText(what) {
  return 'To see the complete ' + what + ' details, open your Admin Dashboard: double-click start.bat in your admin-tool folder and sign in with ' + ADMIN_EMAIL + '.';
}

/* ------------------------------------------------------- 1) SIGN-UP mails */
function buildSignupAdminMail(d) {
  var rows = [
    ['Student ID', d.studentId], ['Name', d.name], ["Father's Name", d.fathersName || ''],
    ['Date of Birth', d.dob || ''], ['Address', formatAddress(d)], ['Mobile No.', d.phone], ['E-mail', d.email]
  ];
  var html = emailShell('New Student Sign-Up', 'A student has just registered on the website',
    '<p style="margin-top:0;">Dear Admin,</p>' +
    '<p>A new student has registered on <b>ambitiousprofessionals.in</b>. The details submitted are below.</p>' +
    factsTable(rows) +
    '<p style="font-size:13px;color:#786F63;margin:0;">A Welcome e-mail has automatically been sent to the student.</p>' +
    dashboardNote('student') +
    '<p style="font-size:12px;color:#9a9186;margin:18px 0 0;">Automated notification from your website (' + VERSION + ')</p>');
  var text = 'Dear Admin,\n\nA new student has registered on ambitiousprofessionals.in. The details submitted are below.\n\n';
  rows.forEach(function (r) { text += r[0] + ': ' + r[1] + '\n'; });
  text += '\nA Welcome e-mail has automatically been sent to the student.\n\n' + dashboardNoteText('student') +
    '\n\n— Automated notification from your website (' + VERSION + ')';
  return { to: ADMIN_EMAIL, subject: '🔔 New Student Sign-Up — ' + d.name + ' (' + d.studentId + ')', text: text, html: html };
}

function buildWelcomeMail(d) {
  var name = firstNameOf(d.name);
  var html = emailShell('Welcome to Ambitious Professionals', 'Your student account is ready',
    '<p style="margin-top:0;">Dear ' + escHtml(name) + ',</p>' +
    '<p>Welcome to <b>Ambitious Professionals</b> — we are delighted to have you with us, and we look forward to growing together with you on your professional journey.</p>' +
    '<p>Your student account has been created successfully. Here are your details:</p>' +
    '<div style="background:#FBF9F5;border:1px solid #e6e0d4;border-radius:8px;padding:16px 20px;margin:16px 0;">' +
      '<div style="font-size:12px;color:#786F63;text-transform:uppercase;letter-spacing:.06em;">Your Student ID</div>' +
      '<div style="font-size:24px;font-weight:bold;letter-spacing:.04em;">' + escHtml(d.studentId) + '</div>' +
      '<div style="font-size:13px;color:#786F63;margin-top:8px;">Registered e-mail: ' + escHtml(d.email) + '</div>' +
    '</div>' +
    '<p>You can now explore our lectures and test series, place your orders and track them any time from your account. ' +
      'Please sign in with your registered e-mail and the password you created (or with Google, if that is how you signed up).</p>' +
    '<p style="text-align:center;margin:20px 0;"><a href="' + SITE_URL + '" style="display:inline-block;padding:12px 28px;background:' + BRAND_RED + ';color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Visit Ambitious Professionals</a></p>' +
    '<p style="font-size:13px;color:#786F63;"><b>Please keep your Student ID and login details private.</b> Our team will never ask you for your password.</p>' +
    '<p>Should you need any help, simply reply to this e-mail or call us on +91 98531 70049.</p>' +
    '<p>Wishing you a bright and successful career ahead.</p>' + SIGN_OFF_HTML);
  var text =
    'Dear ' + name + ',\n\n' +
    'Welcome to Ambitious Professionals — we are delighted to have you with us, and we look forward to growing together with you on your professional journey.\n\n' +
    'Your student account has been created successfully.\n' +
    'Your Student ID: ' + d.studentId + '\nRegistered e-mail: ' + d.email + '\n\n' +
    'You can now explore our lectures and test series, place your orders and track them any time from your account: ' + SITE_URL + '\n\n' +
    'Please keep your Student ID and login details private. Our team will never ask you for your password.\n\n' +
    'Should you need any help, reply to this e-mail or call us on +91 98531 70049.\n\n' +
    'Wishing you a bright and successful career ahead.\n\n' + SIGN_OFF_TEXT;
  return { to: d.email, subject: 'Welcome to Ambitious Professionals — your Student ID is ' + d.studentId, text: text, html: html };
}

/* --------------------------------------------------------- 2) ORDER mails */
function buildOrderAdminMail(type, d) {
  var total = Number(d.totalAmount);
  var hasTotal = isFinite(total) && total > 0;
  var isTest = /test series/i.test(type);
  var lines = d.lines || [];
  var rowsHtml = '', plainLines = [];
  lines.forEach(function (ln, i) {
    rowsHtml += '<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#777;width:26px;vertical-align:top;">' + (i + 1) + '.</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;">' + escHtml(ln.text) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;vertical-align:top;">' + priceText(ln.price) + '</td></tr>';
    plainLines.push((i + 1) + '. ' + ln.text + ' — ' + priceText(ln.price));
  });
  var html = emailShell('New ' + type + ' received', 'Order ID #' + d.orderId,
    '<p style="margin-top:0;">Dear Admin,</p>' +
    '<p>A new <b>' + escHtml(type.toLowerCase()) + '</b> has been placed on <b>ambitiousprofessionals.in</b>.</p>' +
    factsTable([['Order ID', d.orderId], ['Student ID', d.studentId], ['Student name', d.name], ['E-mail', d.email],
                ['Total order value', hasTotal ? inr(total) : 'not available']]) +
    (rowsHtml ? '<table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;font-size:13.5px;margin:4px 0 6px;">' +
      '<tr><td colspan="3" style="padding:8px;background:#F4EFE6;font-weight:bold;">' + (isTest ? 'Test series ordered' : 'Lectures ordered') + '</td></tr>' + rowsHtml + '</table>' : '') +
    '<p style="font-size:13px;color:#786F63;margin:12px 0 0;">The student has automatically been e-mailed the order details with the UPI QR code, the Pay button and the Track Order link.</p>' +
    dashboardNote(isTest ? 'test series order' : 'lecture order') +
    '<p style="font-size:12px;color:#9a9186;margin:18px 0 0;">Automated notification from your website (' + VERSION + ')</p>');
  var text = 'Dear Admin,\n\nA new ' + type.toLowerCase() + ' has been placed on ambitiousprofessionals.in.\n\n' +
    'Order ID: ' + d.orderId + '\nStudent ID: ' + d.studentId + '\nStudent name: ' + d.name + '\nE-mail: ' + d.email + '\n' +
    'Total order value: ' + (hasTotal ? inr(total) : 'not available') + '\n\n' +
    (plainLines.length ? ((isTest ? 'Test series ordered:\n' : 'Lectures ordered:\n') + plainLines.join('\n') + '\n\n') : '') +
    'The student has automatically been e-mailed the order details with the UPI QR code, the Pay button and the Track Order link.\n\n' +
    dashboardNoteText(isTest ? 'test series order' : 'lecture order') + '\n\n— Automated notification from your website (' + VERSION + ')';
  return { to: ADMIN_EMAIL, subject: '🔔 New ' + type + ' received — ' + d.name + ' (Order #' + d.orderId + ')', text: text, html: html };
}

function upiLinks(orderId, total) {
  var upiNote = ('Order ' + orderId).substring(0, 40);
  var upiUri = 'upi://pay?pa=' + encodeURIComponent(UPI_ID) + '&pn=' + encodeURIComponent(UPI_PAYEE_NAME) +
    '&am=' + encodeURIComponent(total.toFixed(2)) + '&cu=INR&tn=' + encodeURIComponent(upiNote);
  return { upiUri: upiUri, payLink: SITE_URL + '/pay.html?upi=' + encodeURIComponent(upiUri) };
}

// qrPng = a Buffer with the QR picture (or null when it could not be drawn — the e-mail still goes out with the Pay button)
function buildOrderStudentMail(kindLabel, d, qrPng) {
  var orderId = d.orderId;
  var total = Number(d.totalAmount);
  var hasTotal = isFinite(total) && total > 0;
  var kindText = kindLabel === 'test series order' ? 'Test Series order' : 'Lecture order';
  var lines = d.lines || [];
  var trackLink = trackLinkFor(orderId);
  var payLink = hasTotal ? upiLinks(orderId, total).payLink : '';

  var rowsHtml = '', plainRows = [];
  lines.forEach(function (ln, i) {
    rowsHtml += '<tr><td style="padding:10px 8px;border-bottom:1px solid #eee;color:#777;width:28px;vertical-align:top;">' + (i + 1) + '.</td>' +
      '<td style="padding:10px 8px;border-bottom:1px solid #eee;vertical-align:top;">' + escHtml(ln.text) + '</td>' +
      '<td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;vertical-align:top;">' + priceText(ln.price) + '</td></tr>';
    plainRows.push((i + 1) + '. ' + ln.text + ' — ' + priceText(ln.price));
  });
  var summaryHtml = '<table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0 4px;">' +
    '<tr><td colspan="3" style="padding:8px;background:#F4EFE6;font-weight:bold;">Your order summary — Order ID #' + escHtml(orderId) + '</td></tr>' + rowsHtml +
    (hasTotal ? '<tr><td></td><td style="padding:12px 8px;text-align:right;font-weight:bold;">Total order value</td>' +
      '<td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:16px;white-space:nowrap;">' + inr(total) + '</td></tr>' : '') +
    '</table>';
  var payHtml = hasTotal
    ? '<div style="text-align:center;background:#FBF9F5;border:1px solid #e6e0d4;border-radius:8px;padding:20px;margin:18px 0;">' +
        '<div style="font-size:13px;color:#786F63;">Total amount payable against Order ID #' + escHtml(orderId) + '</div>' +
        '<div style="font-size:30px;font-weight:bold;margin:4px 0 14px;">' + inr(total) + '</div>' +
        (qrPng ? '<img src="cid:paymentqr" width="220" height="220" alt="UPI payment QR code" style="display:block;margin:0 auto 14px;">' +
          '<div style="font-size:13px;color:#786F63;margin-bottom:14px;">Scan this QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM…)</div>' : '') +
        '<a href="' + payLink + '" style="display:inline-block;padding:13px 30px;background:' + BRAND_RED + ';color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Pay ' + inr(total) + ' via UPI</a>' +
        '<div style="font-size:12px;color:#786F63;margin-top:12px;">On a phone, the button opens your UPI app directly with the amount already filled in.</div>' +
      '</div>' : '';
  var trackHtml = '<div style="background:#ffffff;border:1px solid #e6e0d4;border-radius:8px;padding:16px 20px;margin:18px 0;text-align:center;">' +
    '<div style="font-weight:bold;margin-bottom:4px;">Track your order</div>' +
    '<div style="font-size:13px;color:#786F63;margin-bottom:12px;">You can follow the progress of this order any time — payment confirmation and delivery status.</div>' +
    '<a href="' + trackLink + '" style="display:inline-block;padding:11px 26px;border:2px solid ' + BRAND_RED + ';color:' + BRAND_RED + ';text-decoration:none;border-radius:6px;font-weight:bold;">Track Order #' + escHtml(orderId) + '</a>' +
    '<div style="font-size:11.5px;color:#9a9186;margin-top:10px;word-break:break-all;">' + escHtml(trackLink) + '</div></div>';

  var html = emailShell('Ambitious Professionals', hasTotal ? 'Order confirmed — payment details inside' : 'Order confirmed',
    '<p style="margin-top:0;">Dear ' + escHtml(firstNameOf(d.name)) + ',</p>' +
    '<p>Thank you for choosing Ambitious Professionals. We have received your <b>' + kindText + '</b> against <b>Order ID #' + escHtml(orderId) + '</b> (Student ID: ' + escHtml(d.studentId) + '). Here are the details:</p>' +
    summaryHtml + payHtml + trackHtml +
    '<p>' + (hasTotal ? 'Once your payment is received, we will confirm it and take your order forward. ' : '') +
      'If you have already paid, or have any questions, simply reply to this e-mail or call us on +91 98531 70049 and quote your Order ID.</p>' +
    (hasTotal ? '<p style="font-size:12.5px;color:#786F63;">Please pay only the amount shown above, using the QR code or button in this e-mail.</p>' : '') +
    SIGN_OFF_HTML);
  var text = 'Dear ' + firstNameOf(d.name) + ',\n\n' +
    'Thank you for choosing Ambitious Professionals. We have received your ' + kindText + ' against Order ID #' + orderId + ' (Student ID: ' + d.studentId + ').\n\n' +
    'Your order summary:\n' + plainRows.join('\n') + '\n\n' +
    (hasTotal ? 'Total order value: ' + inr(total) + '\n\nPay now (on your phone): ' + payLink + '\n\n' : '') +
    'Track your order any time: ' + trackLink + '\n\n' +
    (hasTotal ? 'Once your payment is received, we will confirm it and take your order forward. ' : '') +
    'For any questions, reply to this e-mail or call +91 98531 70049 and quote your Order ID.\n\n' + SIGN_OFF_TEXT;
  var mail = {
    to: d.email,
    subject: 'Ambitious Professionals — Order #' + orderId + ' confirmed' + (hasTotal ? ' | Total ' + inr(total) : ''),
    text: text, html: html
  };
  if (qrPng && hasTotal) mail.attachments = [{ filename: 'payment-qr.png', content: qrPng, cid: 'paymentqr' }];
  return mail;
}

function buildOtpMail(email, code) {
  var digits = String(code).split('').map(function (c) {
    return '<span style="display:inline-block;width:52px;height:52px;line-height:52px;margin:0 4px;border:2px solid #e6e0d4;border-radius:8px;background:#ffffff;font-size:30px;font-weight:bold;text-align:center;">' + escHtml(c) + '</span>';
  }).join('');
  var html = emailShell('Verify your e-mail address', 'Ambitious Professionals — account verification',
    '<p style="margin-top:0;">Hello,</p>' +
    '<p>Thank you for signing up with <b>Ambitious Professionals</b>. Please enter the verification code below on the website to confirm that this e-mail address belongs to you:</p>' +
    '<div style="text-align:center;background:#FBF9F5;border:1px solid #e6e0d4;border-radius:8px;padding:20px;margin:18px 0;">' +
      '<div style="font-size:12px;color:#786F63;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Your verification code</div>' +
      '<div>' + digits + '</div>' +
      '<div style="font-size:13px;color:#786F63;margin-top:12px;">This code is valid for <b>10 minutes</b>.</div>' +
    '</div>' +
    '<p style="font-size:13px;color:#786F63;"><b>For your security, never share this code with anyone.</b> Our team will never ask you for it. If you did not request it, you can safely ignore this e-mail — no account will be created.</p>' +
    SIGN_OFF_HTML);
  var text = 'Hello,\n\nThank you for signing up with Ambitious Professionals. Your verification code is: ' + code + '\n\n' +
    'This code is valid for 10 minutes. For your security, never share it with anyone — our team will never ask you for it.\n' +
    'If you did not request this, you can safely ignore this e-mail; no account will be created.\n\n' + SIGN_OFF_TEXT;
  return { to: email, subject: 'Your Ambitious Professionals verification code: ' + code, text: text, html: html };
}

function buildPasswordResetMail(email, link) {
  var html = emailShell('Reset your password', 'Ambitious Professionals — account security',
    '<p style="margin-top:0;">Hello,</p>' +
    '<p>We received a request to reset the password of your <b>Ambitious Professionals</b> account (' + escHtml(email) + '). Click the button below to choose a new password:</p>' +
    '<p style="text-align:center;margin:22px 0;"><a href="' + escHtml(link) + '" style="display:inline-block;padding:13px 30px;background:' + BRAND_RED + ';color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Reset my password</a></p>' +
    '<p style="font-size:13px;color:#786F63;">If the button does not work, copy and paste this link into your browser:<br><span style="word-break:break-all;">' + escHtml(link) + '</span></p>' +
    '<p style="font-size:13px;color:#786F63;"><b>If you did not ask for this, please ignore this e-mail</b> — your password will stay exactly as it is. For your security, never share this link with anyone.</p>' +
    SIGN_OFF_HTML);
  var text = 'Hello,\n\nWe received a request to reset the password of your Ambitious Professionals account (' + email + ').\n\n' +
    'Choose a new password here:\n' + link + '\n\n' +
    'If you did not ask for this, please ignore this e-mail — your password will stay exactly as it is. Never share this link with anyone.\n\n' + SIGN_OFF_TEXT;
  return { to: email, subject: 'Reset your Ambitious Professionals password', text: text, html: html };
}

function buildAccountDeletedMail(d) {
  var name = firstNameOf(d.name);
  var when = '';
  try { when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' (IST)'; } catch (e) { when = ''; }
  var idLine = d.studentId ? ('Student ID ' + d.studentId) : 'Your account';
  var html = emailShell('We are sorry to see you go', 'Your account has been deleted',
    '<p style="margin-top:0;">Dear ' + escHtml(name) + ',</p>' +
    '<p>As you requested, your Ambitious Professionals account (<b>' + escHtml(idLine) + '</b>) and the personal details linked to it have been permanently deleted from our website' + (when ? ' on <b>' + escHtml(when) + '</b>' : '') + '.</p>' +
    '<p>It has been a pleasure to have you with us, and we are truly sorry to see you go. If there was anything we could have done better, we would genuinely like to hear it — just reply to this e-mail.</p>' +
    '<p>You will always be welcome back. Whenever you are ready, you can create a new account on <a href="' + SITE_URL + '" style="color:' + BRAND_RED + ';">ambitiousprofessionals.in</a> and continue your journey with us.</p>' +
    '<div style="background:#FBF9F5;border:1px solid #e6e0d4;border-left:4px solid ' + BRAND_RED + ';border-radius:6px;padding:14px 16px;margin:18px 0;font-size:13.5px;">' +
      '<b>Was this not you?</b> If you did not delete your account, please contact us immediately at ambitiousprofessionals12@gmail.com or +91 98531 70049, and we will help you right away.' +
    '</div>' +
    '<p>Wishing you the very best for your studies and your career.</p>' + SIGN_OFF_HTML);
  var text = 'Dear ' + name + ',\n\n' +
    'As you requested, your Ambitious Professionals account (' + idLine + ') and the personal details linked to it have been permanently deleted from our website' + (when ? ' on ' + when : '') + '.\n\n' +
    'It has been a pleasure to have you with us, and we are truly sorry to see you go. If there was anything we could have done better, we would genuinely like to hear it — just reply to this e-mail.\n\n' +
    'You will always be welcome back. Whenever you are ready, you can create a new account on ' + SITE_URL + ' and continue your journey with us.\n\n' +
    'Was this not you? If you did not delete your account, please contact us immediately at ambitiousprofessionals12@gmail.com or +91 98531 70049.\n\n' +
    'Wishing you the very best for your studies and your career.\n\n' + SIGN_OFF_TEXT;
  return { to: d.email, subject: 'We are sorry to see you go — your account has been deleted', text: text, html: html };
}

/* ---------------------------------------------------------------- plumbing */
var transport = null;
function getTransport() {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: process.env.GMAIL_ADDRESS, pass: String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '') }
  });
  return transport;
}
function isConfigured() { return !!(process.env.GMAIL_ADDRESS && process.env.GMAIL_APP_PASSWORD); }

function sendOne(mail) {
  var from = '"Ambitious Professionals" <' + process.env.GMAIL_ADDRESS + '>';
  var msg = Object.assign({ from: from, replyTo: ADMIN_EMAIL }, mail);
  return getTransport().sendMail(msg);
}

function fetchWithTimeout(url, options, ms) {
  var ctl = new AbortController();
  var timer = setTimeout(function () { ctl.abort(); }, ms || 6000);
  return fetch(url, Object.assign({ signal: ctl.signal }, options || {})).finally(function () { clearTimeout(timer); });
}

// the e-mail address that belongs to a signed-in website visitor (checked with Firebase) — so mails can only go to the person who is signed in
async function verifyIdToken(idToken) {
  if (!idToken) return null;
  try {
    // the Referer header is sent so that it also works if the Firebase key is limited to your website address in Google Cloud
    var r = await fetchWithTimeout('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(FIREBASE_API_KEY), {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Referer': SITE_URL + '/' }, body: JSON.stringify({ idToken: idToken })
    }, 7000);
    if (!r.ok) {
      var detail = '';
      try { detail = ((await r.json()).error || {}).message || ''; } catch (e) {}
      console.error('send-mail: sign-in check failed (' + r.status + ') ' + detail);
      return null;
    }
    var j = await r.json();
    var u = j && j.users && j.users[0];
    return u && u.email ? { uid: u.localId, email: String(u.email).toLowerCase() } : null;
  } catch (e) { console.error('send-mail: sign-in check error — ' + (e && e.message)); return null; }
}

async function makeQrPng(total, orderId) {
  try {
    var QR = require('qrcode');
    return await QR.toBuffer(upiLinks(orderId, total).upiUri, { width: 320, margin: 2, errorCorrectionLevel: 'M' });
  } catch (e) { console.error('send-mail: QR code could not be drawn — ' + (e && e.message)); return null; }
}

/* small memory-based brake against anyone using the code-mail for spam (per warm server instance) */
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
function sha(x) { return crypto.createHash('sha256').update(x).digest('hex'); }

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'Ambitious Professionals mail', version: VERSION, mailConfigured: isConfigured(), adminConfigured: adminLib.isConfigured() });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  var body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'Bad request' });

  var type = body.formType;
  if (['order', 'testSeries', 'studentSignup', 'sendOtp', 'verifyOtp', 'passwordReset', 'accountDeleted'].indexOf(type) === -1) {
    return res.status(200).json({ ok: true, ignored: true });         // nothing to send for anything else
  }
  if (!isConfigured()) {
    console.error('send-mail: GMAIL_ADDRESS / GMAIL_APP_PASSWORD are not set in Vercel');
    return res.status(500).json({ ok: false, error: 'MAIL_NOT_CONFIGURED' });
  }

  try {
    var ip = clientIp(req);

    /* ---- verification code: made, stored (only as a scrambled "hash") and checked on the server ---- */
    if (type === 'sendOtp') {
      var email = clip(body.email, 200).trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'Bad request' });
      if (!allowed('otp-e:' + email, 5) || !allowed('otp-i:' + ip, 25)) return res.status(429).json({ ok: false, error: 'Too many requests' });
      var A = adminLib.get();
      if (!A) { console.error('send-mail: ' + adminLib.lastError()); return res.status(500).json({ ok: false, error: 'ADMIN_NOT_CONFIGURED' }); }
      var code = String(crypto.randomInt(1000, 10000));
      var salt = crypto.randomBytes(8).toString('hex');
      await A.firestore().collection('otps').doc(sha(email)).set({
        salt: salt, hash: sha(salt + ':' + email + ':' + code), expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0
      });
      await sendOne(buildOtpMail(email, code));
      return res.status(200).json({ ok: true });
    }

    if (type === 'verifyOtp') {
      var vEmail = clip(body.email, 200).trim().toLowerCase();
      var vCode = clip(body.code, 8).trim();
      if (!EMAIL_RE.test(vEmail) || !/^\d{4}$/.test(vCode)) return res.status(400).json({ ok: false, error: 'Bad request' });
      if (!allowed('otpv-i:' + ip, 60)) return res.status(429).json({ ok: false, error: 'Too many requests' });
      var A2 = adminLib.get();
      if (!A2) return res.status(500).json({ ok: false, error: 'ADMIN_NOT_CONFIGURED' });
      var ref = A2.firestore().collection('otps').doc(sha(vEmail));
      var snap = await ref.get();
      if (!snap.exists) return res.status(200).json({ ok: false, reason: 'notfound' });
      var o = snap.data();
      if (Date.now() > o.expiresAt) return res.status(200).json({ ok: false, reason: 'expired' });
      if ((o.attempts || 0) >= 5) return res.status(200).json({ ok: false, reason: 'toomany' });
      var given = Buffer.from(sha(o.salt + ':' + vEmail + ':' + vCode), 'hex');
      var real = Buffer.from(o.hash, 'hex');
      if (given.length === real.length && crypto.timingSafeEqual(given, real)) {
        await ref.delete();
        return res.status(200).json({ ok: true });
      }
      await ref.update({ attempts: (o.attempts || 0) + 1 });
      return res.status(200).json({ ok: false, reason: 'wrong' });
    }

    /* ---- forgot password: a professional reset e-mail (the same answer whether or not the address is registered) ---- */
    if (type === 'passwordReset') {
      var rEmail = clip(body.email, 200).trim().toLowerCase();
      if (!EMAIL_RE.test(rEmail)) return res.status(400).json({ ok: false, error: 'Bad request' });
      if (!allowed('pw-e:' + rEmail, 3) || !allowed('pw-i:' + ip, 15)) return res.status(429).json({ ok: false, error: 'Too many requests' });
      var A3 = adminLib.get();
      if (!A3) { console.error('send-mail: ' + adminLib.lastError()); return res.status(500).json({ ok: false, error: 'ADMIN_NOT_CONFIGURED' }); }
      try { await A3.auth().getUserByEmail(rEmail); }
      catch (e) {
        if (e && e.code === 'auth/user-not-found') return res.status(200).json({ ok: true });     // say nothing about who is registered
        throw e;
      }
      var link = await A3.auth().generatePasswordResetLink(rEmail);
      await sendOne(buildPasswordResetMail(rEmail, link));
      return res.status(200).json({ ok: true });
    }

    /* ---- sign-up and orders: the visitor must be signed in, and the mail goes to THEIR e-mail address ---- */
    var who = await verifyIdToken(body.idToken);
    if (!who) return res.status(401).json({ ok: false, error: 'Not signed in' });
    if (String(body.email || '').trim().toLowerCase() !== who.email) return res.status(403).json({ ok: false, error: 'E-mail mismatch' });

    var d = {
      orderId: clip(body.orderId, 60), studentId: clip(body.studentId, 60), name: clip(body.name, 120), email: who.email,
      totalAmount: Number(body.totalAmount),
      lines: (Array.isArray(body.lines) ? body.lines : []).slice(0, 60).map(function (l) {
        return { text: clip(l && l.text, 700), price: (l && l.price !== null && l.price !== undefined && l.price !== '') ? Number(l.price) : null };
      }),
      fathersName: clip(body.fathersName, 120), dob: clip(body.dob, 40), houseNo: clip(body.houseNo, 120), street: clip(body.street, 160),
      landmark: clip(body.landmark, 160), post: clip(body.post, 120), cityTown: clip(body.cityTown, 120), pincode: clip(body.pincode, 12),
      district: clip(body.district, 120), state: clip(body.state, 120), phone: clip(body.phone, 20)
    };

    var mails = [];
    if (type === 'accountDeleted') {
      mails.push(buildAccountDeletedMail(d));
    } else if (type === 'studentSignup') {
      mails.push(buildSignupAdminMail(d), buildWelcomeMail(d));
    } else {
      if (!d.orderId) return res.status(400).json({ ok: false, error: 'Bad request' });
      var label = type === 'testSeries' ? 'Test Series Order' : 'Lecture Order';
      var hasTotal = isFinite(d.totalAmount) && d.totalAmount > 0;
      var qr = hasTotal ? await makeQrPng(d.totalAmount, d.orderId) : null;
      mails.push(buildOrderAdminMail(label, d), buildOrderStudentMail(type === 'testSeries' ? 'test series order' : 'lecture order', d, qr));
    }

    var results = await Promise.allSettled(mails.map(sendOne));
    var failed = results.filter(function (r) { return r.status === 'rejected'; });
    failed.forEach(function (r) { console.error('send-mail: could not send —', r.reason && r.reason.message); });
    return res.status(failed.length === results.length ? 502 : 200).json({ ok: failed.length === 0, sent: results.length - failed.length, failed: failed.length });

  } catch (err) {
    console.error('send-mail error:', err && err.message);
    return res.status(500).json({ ok: false, error: 'Mail could not be sent' });
  }
}

module.exports = handler;
module.exports._test = { buildOtpMail2: buildOtpMail, buildPasswordResetMail: buildPasswordResetMail, buildAccountDeletedMail: buildAccountDeletedMail, buildOrderStudentMail: buildOrderStudentMail, buildOrderAdminMail: buildOrderAdminMail, buildWelcomeMail: buildWelcomeMail,
  buildSignupAdminMail: buildSignupAdminMail, buildOtpMail: buildOtpMail, setTransport: function (t) { transport = t; } };
