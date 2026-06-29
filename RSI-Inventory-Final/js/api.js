// ================================================================
//  RSI INVENTORY — api.js
//  Google Sheets URL is already set. No changes needed.
//  All data reads and writes go directly to Google Sheets.
//  Accounts work from any device and any browser.
// ================================================================

var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx8-7Tm1h_akqPBbOsKcAFkK9DJ1u5e0Z4ISFUNlHUwM6yIf9DlS6Jax9sWvWnvvclK/exec';

// ── Low-level GET request to Apps Script ─────────────────────
// Data is sent as ?payload=<JSON> in the URL.
// This is the only method that works cross-origin with Apps Script.
// Uses synchronous XHR so the rest of the code stays simple.
function _call(payload) {
  var url = SHEETS_URL + '?payload=' + encodeURIComponent(JSON.stringify(payload));
  var xhr = new XMLHttpRequest();
  try {
    xhr.open('GET', url, false); // false = synchronous
    xhr.send(null);
    if (xhr.status === 200 || xhr.status === 0) {
      return JSON.parse(xhr.responseText);
    }
    console.error('Sheets request failed, status:', xhr.status);
    return null;
  } catch (e) {
    console.error('Sheets request error:', e.message);
    return null;
  }
}

// ── ID generator ─────────────────────────────────────────────
function _id() {
  return 'rsi_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
}

// ================================================================
//  AUTH
// ================================================================

function doSignup(name, email, password) {
  var res = _call({
    action: 'addUser',
    id: _id(),
    name: name,
    email: email,
    password: password,
    createdAt: Date.now()
  });
  if (!res) return { success: false, message: 'Could not reach the server. Check your internet connection.' };
  if (!res.ok) {
    if (res.error === 'EMAIL_EXISTS') return { success: false, message: 'An account with this email already exists.' };
    return { success: false, message: res.error || 'Signup failed. Please try again.' };
  }
  return { success: true, user: { id: res.id || _id(), name: name, email: email } };
}

function doLogin(email, password) {
  var res = _call({ action: 'getUsers' });
  if (!res) return { success: false, message: 'Could not reach the server. Check your internet connection.' };
  if (!res.ok) return { success: false, message: 'Login service error. Please try again.' };

  var found = null;
  (res.users || []).forEach(function (u) {
    if (u.email.toLowerCase() === email.toLowerCase() && u.password === password) {
      found = u;
    }
  });

  if (found) return { success: true, user: { id: found.id, name: found.name, email: found.email } };
  return { success: false, message: 'Incorrect email or password.' };
}

// ================================================================
//  ITEMS
// ================================================================

function doAddItem(data) {
  var item = {
    id:          _id(),
    name:        data.name        || '',
    location:    data.location    || '',
    quantity:    Number(data.quantity)  || 0,
    threshold:   Number(data.threshold) || 0,
    description: data.description || '',
    photoUrl:    data.photoUrl    || '',
    addedAt:     Date.now(),
    editedAt:    null
  };
  var res = _call({ action: 'addItem', item: item });
  if (!res || !res.ok) return { success: false, message: 'Could not save item to server.' };
  return { success: true, item: item };
}

function doGetItems() {
  var res = _call({ action: 'getItems' });
  if (!res) return { success: false, message: 'Could not load items. Check your internet connection.', items: [] };
  if (!res.ok) return { success: false, message: 'Server error loading items.', items: [] };
  return { success: true, items: res.items || [] };
}

function doUpdateItem(id, data) {
  var updated = {
    id:          id,
    name:        data.name        || '',
    location:    data.location    || '',
    quantity:    Number(data.quantity)  || 0,
    threshold:   Number(data.threshold) || 0,
    description: data.description || '',
    photoUrl:    data.photoUrl    || '',
    editedAt:    Date.now()
  };
  var res = _call({ action: 'updateItem', item: updated });
  if (!res || !res.ok) return { success: false, message: 'Could not update item on server.' };
  return { success: true, item: updated };
}

function doDeleteItem(id) {
  var res = _call({ action: 'deleteItem', id: id });
  if (!res || !res.ok) return { success: false, message: 'Could not delete item on server.' };
  return { success: true };
}
