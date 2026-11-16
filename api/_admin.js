// Shared by the website's server functions: opens the Firebase "Admin" connection (needed for the verification codes,
// the password-reset mail and the phone-number checks). It uses the service-account key you store in Vercel as the
// environment variable  FIREBASE_SERVICE_ACCOUNT  (the whole contents of the key .json file).
// The file name starts with an underscore, so Vercel does not publish it as a web address.
var admin = require('firebase-admin');

var initError = '';
function get() {
  if (admin.apps.length) return admin;
  var raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) { initError = 'FIREBASE_SERVICE_ACCOUNT is not set'; return null; }
  var cred = null;
  try { cred = JSON.parse(raw); } catch (e) {
    try { cred = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')); } catch (e2) { cred = null; }
  }
  if (!cred || !cred.private_key || !cred.client_email) { initError = 'FIREBASE_SERVICE_ACCOUNT is not a valid key file'; return null; }
  cred.private_key = String(cred.private_key).replace(/\\n/g, '\n');
  try {
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  } catch (e) { initError = 'Firebase could not start: ' + e.message; return null; }
  return admin;
}
function isConfigured() { return !!get(); }
function lastError() { return initError; }

module.exports = { get: get, isConfigured: isConfigured, lastError: lastError };
