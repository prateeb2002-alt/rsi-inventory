// inventory.js — loaded on inventory.html only

var currentUser = requireAuth();
if (!currentUser) throw new Error('not authenticated');
document.getElementById('userGreeting').textContent = 'Hi, ' + currentUser.name;

var allItems     = [];
var editingId    = null;
var currentPhoto = '';
var currentQrId  = null;

// ── Toast ─────────────────────────────────────────────────────

function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast-show ' + (type || 'toast-ok');
  clearTimeout(t._t);
  t._t = setTimeout(function () { t.className = ''; }, 3000);
}

// ── Spinner overlay ───────────────────────────────────────────

function _showSpinner(msg) {
  document.getElementById('spinnerMsg').textContent = msg || 'Please wait…';
  document.getElementById('spinner').style.display = 'flex';
}
function _hideSpinner() {
  document.getElementById('spinner').style.display = 'none';
}

// ── Load & render ─────────────────────────────────────────────

function loadItems() {
  _showSpinner('Loading items…');
  setTimeout(function () {
    var res = doGetItems();
    _hideSpinner();
    if (!res.success) {
      showToast('Could not load items: ' + (res.message || 'Unknown error'), 'toast-del');
      allItems = [];
    } else {
      allItems = res.items || [];
    }
    renderTable();
  }, 50);
}

function renderTable() {
  var tbody = document.getElementById('itemsBody');
  if (!allItems.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty"><div style="font-size:2rem;margin-bottom:.5rem">📦</div>No items yet. Click "+ Add Item" to get started.</td></tr>';
    return;
  }
  tbody.innerHTML = allItems.map(function (item) {
    var low   = Number(item.quantity) <= Number(item.threshold);
    var thumb = item.photoUrl
      ? '<img class="item-thumb" src="' + item.photoUrl + '" alt="">'
      : '<div class="item-thumb thumb-placeholder"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>';
    return '<tr>' +
      '<td><div class="item-name-cell">' + thumb +
        '<div><div class="item-name">' + _esc(item.name) + '</div>' +
        (item.description ? '<div class="item-desc">' + _esc(item.description.slice(0, 50)) + (item.description.length > 50 ? '…' : '') + '</div>' : '') +
      '</div></div></td>' +
      '<td class="td-loc">'    + _esc(item.location) + '</td>' +
      '<td class="' + (low ? 'qty-low' : 'qty-ok') + '">' + item.quantity + '</td>' +
      '<td class="td-thresh">' + item.threshold + '</td>' +
      '<td><div class="row-actions">' +
        '<button class="btn-icon" title="QR Code"  onclick="openQr(\''   + item.id + '\')">' + _qrIco()   + '</button>' +
        '<button class="btn-icon" title="Edit"     onclick="openEdit(\'' + item.id + '\')">' + _editIco() + '</button>' +
        '<button class="btn-icon btn-del" title="Delete" onclick="confirmDel(\'' + item.id + '\',\'' + _esc(item.name).replace(/'/g, "\\'") + '\')">' + _delIco() + '</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

function _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function _qrIco()   { return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/><rect x="19" y="19" width="2" height="2"/></svg>'; }
function _editIco() { return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'; }
function _delIco()  { return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>'; }

// ── Modal: Add ────────────────────────────────────────────────

function openAdd() {
  editingId = null; currentPhoto = '';
  _setF('itemName', ''); _setF('itemLocation', ''); _setF('itemQty', '0'); _setF('itemThreshold', '5'); _setF('itemDesc', '');
  _setModalErr('');
  document.getElementById('photoPreview').style.display = 'none';
  document.getElementById('photoInput').value = '';
  document.getElementById('modalTitle').textContent = 'Add New Item';
  document.getElementById('saveBtn').textContent    = 'Create Item';
  _showModal('itemModal');
  setTimeout(function () { document.getElementById('itemName').focus(); }, 120);
}

// ── Modal: Edit ───────────────────────────────────────────────

function openEdit(id) {
  var item = null;
  for (var i = 0; i < allItems.length; i++) { if (allItems[i].id === id) { item = allItems[i]; break; } }
  if (!item) return;
  editingId = id; currentPhoto = item.photoUrl || '';
  _setF('itemName',      item.name);
  _setF('itemLocation',  item.location);
  _setF('itemQty',       item.quantity);
  _setF('itemThreshold', item.threshold);
  _setF('itemDesc',      item.description || '');
  _setModalErr('');
  var prev = document.getElementById('photoPreview');
  if (currentPhoto) { prev.src = currentPhoto; prev.style.display = 'block'; } else { prev.style.display = 'none'; }
  document.getElementById('modalTitle').textContent = 'Edit Item';
  document.getElementById('saveBtn').textContent    = 'Save Changes';
  _showModal('itemModal');
  setTimeout(function () { document.getElementById('itemName').focus(); }, 120);
}

// ── Save ──────────────────────────────────────────────────────

function saveItem() {
  var name     = (_getF('itemName')     || '').trim();
  var location = (_getF('itemLocation') || '').trim();
  var qty      = parseInt(_getF('itemQty'))       || 0;
  var thresh   = parseInt(_getF('itemThreshold')) || 0;
  var desc     = (_getF('itemDesc') || '').trim();
  if (!name)     { _setModalErr('Item name is required.');  return; }
  if (!location) { _setModalErr('Location is required.');   return; }
  _setModalErr('');

  var btn = document.getElementById('saveBtn');
  btn.disabled = true; btn.textContent = 'Saving…';
  var data = { name: name, location: location, quantity: qty, threshold: thresh, description: desc, photoUrl: currentPhoto };

  setTimeout(function () {
    var res = editingId ? doUpdateItem(editingId, data) : doAddItem(data);
    btn.disabled = false; btn.textContent = editingId ? 'Save Changes' : 'Create Item';

    if (res.success) {
      _closeModal('itemModal');
      showToast(editingId ? '✓ Item updated' : '✓ Item added', 'toast-ok');
      loadItems();
    } else {
      _setModalErr(res.message || 'Could not save. Please try again.');
    }
  }, 50);
}

// ── Delete ────────────────────────────────────────────────────

function confirmDel(id, name) {
  if (!confirm('Delete "' + name + '"?\nThis cannot be undone.')) return;
  _showSpinner('Deleting…');
  setTimeout(function () {
    var res = doDeleteItem(id);
    _hideSpinner();
    if (res.success) { showToast('Item deleted', 'toast-del'); loadItems(); }
    else showToast('Delete failed: ' + (res.message || 'error'), 'toast-del');
  }, 50);
}

// ── Photo ─────────────────────────────────────────────────────

function handlePhoto(e) {
  var file = e.target.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    currentPhoto = ev.target.result;
    var prev = document.getElementById('photoPreview');
    prev.src = currentPhoto; prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ── QR Code ───────────────────────────────────────────────────

function openQr(id) {
  var item = null;
  for (var i = 0; i < allItems.length; i++) { if (allItems[i].id === id) { item = allItems[i]; break; } }
  if (!item) return;
  currentQrId = id;
  document.getElementById('qrItemName').textContent     = item.name;
  document.getElementById('qrItemLocation').textContent = item.location;
  var div = document.getElementById('qrCodeDiv');
  div.innerHTML = '';
  var url = window.location.href.split('?')[0] + '?edit=' + id;
  if (typeof QRCode !== 'undefined') {
    new QRCode(div, { text: url, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.H });
  } else {
    div.innerHTML = '<p style="color:#ef4444;font-size:13px">QR library not loaded. Needs internet connection.</p>';
  }
  _showModal('qrModal');
}

function downloadQr() {
  var canvas = document.querySelector('#qrCodeDiv canvas');
  if (!canvas) { showToast('QR not ready', 'toast-del'); return; }
  var a = document.createElement('a');
  a.download = 'rsi-qr-' + currentQrId + '.png';
  a.href = canvas.toDataURL('image/png'); a.click();
  showToast('QR downloaded ✓');
}

// ── Modal helpers ─────────────────────────────────────────────

function _showModal(id)  { document.getElementById(id).style.display = 'flex'; }
function _closeModal(id) { document.getElementById(id).style.display = 'none'; }
function _setF(id, val)  { var e = document.getElementById(id); if (e) e.value = val; }
function _getF(id)       { var e = document.getElementById(id); return e ? e.value : ''; }
function _setModalErr(m) { var e = document.getElementById('modalError'); if (e) { e.textContent = m; e.style.display = m ? 'block' : 'none'; } }

document.getElementById('itemModal').addEventListener('click', function (e) { if (e.target === this) _closeModal('itemModal'); });
document.getElementById('qrModal').addEventListener('click',  function (e) { if (e.target === this) _closeModal('qrModal'); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { _closeModal('itemModal'); _closeModal('qrModal'); } });

// ── QR scan redirect ──────────────────────────────────────────
(function () {
  var p = new URLSearchParams(window.location.search);
  var editId = p.get('edit');
  if (editId) {
    history.replaceState({}, '', window.location.pathname);
    setTimeout(function () { openEdit(editId); }, 400);
  }
}());

// ── Init ──────────────────────────────────────────────────────
loadItems();
