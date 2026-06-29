// auth.js — loaded ONLY on index.html
// Handles login/signup forms. NO requireAuth here (that's app-auth.js).

// If already logged in, skip straight to dashboard
(function () {
  try {
    var u = JSON.parse(localStorage.getItem('rsi_user') || 'null');
    if (u && u.id && u.email) { window.location.replace('dashboard.html'); }
  } catch (e) { localStorage.removeItem('rsi_user'); }
}());

// ── Tab switching ─────────────────────────────────────────────

function showTab(tab) {
  var lf   = document.getElementById('loginForm');
  var sf   = document.getElementById('signupForm');
  var tabs = document.querySelectorAll('.tab-btn');
  if (tab === 'login') {
    lf.style.display = 'block'; sf.style.display = 'none';
    tabs[0].classList.add('active'); tabs[1].classList.remove('active');
  } else {
    lf.style.display = 'none'; sf.style.display = 'block';
    tabs[0].classList.remove('active'); tabs[1].classList.add('active');
  }
}

// ── Message helpers ───────────────────────────────────────────

function _err(id, msg) { var e = document.getElementById(id); if (e) { e.textContent = msg; e.style.display = 'block'; } }
function _ok(id, msg)  { var e = document.getElementById(id); if (e) { e.textContent = msg; e.style.display = 'block'; } }
function _hide(id)     { var e = document.getElementById(id); if (e) { e.textContent = ''; e.style.display = 'none'; } }

function _setBusy(btnId, label) {
  var b = document.getElementById(btnId);
  if (!b) return;
  b.disabled = true;
  b.textContent = label;
}
function _setIdle(btnId, label) {
  var b = document.getElementById(btnId);
  if (!b) return;
  b.disabled = false;
  b.textContent = label;
}

// ── Login ─────────────────────────────────────────────────────

function handleLogin() {
  _hide('loginError');
  var email = (document.getElementById('loginEmail').value || '').trim();
  var pass  = document.getElementById('loginPassword').value || '';

  if (!email || !pass) { _err('loginError', 'Please enter your email and password.'); return; }

  _setBusy('loginBtn', 'Signing in…');

  // setTimeout lets the button show "Signing in…" before the
  // synchronous XHR blocks the browser thread
  setTimeout(function () {
    var res = doLogin(email, pass);
    _setIdle('loginBtn', 'Sign In');

    if (res.success) {
      localStorage.setItem('rsi_user', JSON.stringify(res.user));
      window.location.href = 'dashboard.html';
    } else {
      _err('loginError', res.message);
    }
  }, 50);
}

// ── Signup ────────────────────────────────────────────────────

function handleSignup() {
  _hide('signupError');
  _hide('signupSuccess');
  var name  = (document.getElementById('signupName').value  || '').trim();
  var email = (document.getElementById('signupEmail').value || '').trim();
  var pass  = document.getElementById('signupPassword').value || '';

  if (!name || !email || !pass)     { _err('signupError', 'Please fill in all fields.'); return; }
  if (pass.length < 6)              { _err('signupError', 'Password must be at least 6 characters.'); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { _err('signupError', 'Please enter a valid email address.'); return; }

  _setBusy('signupBtn', 'Creating account…');

  setTimeout(function () {
    var res = doSignup(name, email, pass);
    _setIdle('signupBtn', 'Create Account');

    if (res.success) {
      _ok('signupSuccess', '✓ Account created! You can now sign in.');
      document.getElementById('signupName').value  = '';
      document.getElementById('signupEmail').value = '';
      document.getElementById('signupPassword').value = '';
      setTimeout(function () {
        showTab('login');
        document.getElementById('loginEmail').value = email;
        _hide('signupSuccess');
      }, 1400);
    } else {
      _err('signupError', res.message);
    }
  }, 50);
}

// ── Enter key ─────────────────────────────────────────────────
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter') return;
  var lv = document.getElementById('loginForm').style.display !== 'none';
  if (lv) handleLogin(); else handleSignup();
});
