// dashboard.js — loaded on dashboard.html only

var currentUser = requireAuth();
if (!currentUser) throw new Error('not authenticated');
document.getElementById('userGreeting').textContent = 'Hi, ' + currentUser.name;

function loadDashboard() {
  var res   = doGetItems();
  var items = (res.success ? res.items : []) || [];
  var now   = Date.now();

  var totalQty = 0, lowList = [], edited = [];
  items.forEach(function (i) {
    totalQty += Number(i.quantity);
    if (Number(i.quantity) <= Number(i.threshold)) lowList.push(i);
    if (i.editedAt) edited.push(i);
  });
  var last5  = items.slice().sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); }).slice(0, 5);
  var recent = items.filter(function (i) { return i.addedAt && (now - i.addedAt) < 86400000; }).length;

  document.getElementById('statTotal').textContent    = items.length;
  document.getElementById('statLowStock').textContent = lowList.length;
  document.getElementById('statQty').textContent      = totalQty;
  document.getElementById('statRecent').textContent   = recent;

  var lowEl = document.getElementById('lowStockList');
  lowEl.innerHTML = lowList.length
    ? lowList.map(function (i) { return '<div class="panel-item"><span class="panel-item-name">' + i.name + '</span><span class="badge-low">' + i.quantity + ' / ' + i.threshold + '</span></div>'; }).join('')
    : '<div class="panel-empty">No low stock alerts ✓</div>';

  var recEl = document.getElementById('recentAddedList');
  recEl.innerHTML = last5.length
    ? last5.map(function (i) { return '<div class="panel-item"><span class="panel-item-name">' + i.name + '</span><span class="panel-item-sub">' + i.location + '</span></div>'; }).join('')
    : '<div class="panel-empty">No items added yet.</div>';

  edited.sort(function (a, b) { return b.editedAt - a.editedAt; });
  var editEl = document.getElementById('recentEditedList');
  editEl.innerHTML = edited.length
    ? edited.slice(0, 5).map(function (i) { return '<div class="panel-item"><span class="panel-item-name">' + i.name + '</span><span class="panel-item-sub">' + i.location + '</span></div>'; }).join('')
    : '<div class="panel-empty">No recent edits.</div>';
}

loadDashboard();
