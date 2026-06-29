// app-auth.js — loaded ONLY on dashboard.html and inventory.html
// Provides requireAuth() and logout().
// NEVER loaded on index.html — that would cause a redirect loop.

function requireAuth() {
  try {
    var stored = localStorage.getItem('rsi_user');
    if (!stored) throw new Error('no session');
    var user = JSON.parse(stored);
    if (!user || !user.id || !user.email) throw new Error('bad session');
    return user;
  } catch (e) {
    localStorage.removeItem('rsi_user');
    window.location.replace('index.html');
    return null;
  }
}

function logout() {
  localStorage.removeItem('rsi_user');
  window.location.replace('index.html');
}
