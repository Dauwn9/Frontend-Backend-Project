(function () {
if (window.taskAppCleanup) window.taskAppCleanup();
var API_BASE = 'https://dummyjson.com/todos';
var USERS_URL = 'https://dummyjson.com/users';

var todos = [], users = {}, shown = 30, stack = [];
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

/* ---------- загрузка ---------- */
fetch(API_BASE + '?limit=0').then(function (r) { return r.json(); })
  .then(function (d) { todos = d.todos; render(); })
  .catch(function () { $('list').innerHTML = '<div class="empty">Не удалось загрузить данные с API</div>'; });

function getUser(id) {
  if (users[id]) return Promise.resolve(users[id]);
  return fetch(USERS_URL + '/' + id).then(function (r) {
    if (!r.ok) throw 0; return r.json();
  }).catch(function () {
    return { id: id, firstName: 'Пользователь', lastName: '#' + id, _local: true };
  }).then(function (u) { users[id] = u; return u; });
}

/* ---------- список ---------- */
function filtered() {
  var q = $('q').value.trim().toLowerCase(), st = $('status').value, s = $('sort').value;
  var a = todos.filter(function (t) {
    if (st === 'done' && !t.completed) return false;
    if (st === 'open' && t.completed) return false;
    return !q || t.todo.toLowerCase().indexOf(q) > -1 || String(t.id) === q || String(t.userId) === q;
  });
  a.sort(function (x, y) {
    switch (s) {
      case 'id-desc': return y.id - x.id;
      case 'text-asc': return x.todo.localeCompare(y.todo);
      case 'text-desc': return y.todo.localeCompare(x.todo);
      case 'status': return (x.completed - y.completed) || (x.id - y.id);
      case 'user': return (x.userId - y.userId) || (x.id - y.id);
      default: return x.id - y.id;
    }
  });
  return a;
}

function taskHTML(t, inProfile) {
  return '<div class="task ' + (t.completed ? 'done' : '') + '" data-id="' + t.id + '">' +
    '<span class="chip">#' + t.id + '</span>' +
    '<span class="txt">' + esc(t.todo) + '</span>' +
    '<span class="chip ' + (t.completed ? 'st-done' : 'st-open') + '">' + (t.completed ? 'Выполнена' : 'В работе') + '</span>' +
    (inProfile ? '' : '<span class="chip user" data-user="' + t.userId + '" title="Открыть человека">👤 ' + t.userId + '</span>') +
    '<button class="icon" data-edit="' + t.id + '" title="Редактировать">✎</button></div>';
}

function render() {
  var a = filtered();
  $('stats').textContent = 'Найдено: ' + a.length + ' из ' + todos.length;
  $('list').innerHTML = a.slice(0, shown).map(function (t) { return taskHTML(t); }).join('') || '<div class="empty">Ничего не найдено</div>';
  $('more').style.display = a.length > shown ? '' : 'none';
}

['q', 'status', 'sort'].forEach(function (id) {
  $(id).addEventListener('input', function () { shown = 30; render(); });
});
$('more').onclick = function () { shown += 30; render(); };
$('addBtn').onclick = function () { openForm(null, ''); };

/* клики по списку (общий обработчик для главного списка и профиля) */
function onDocClick(e) {
  if (!e.target.closest('#taskApp')) return;
  var ed = e.target.closest('[data-edit]');
  if (ed) { e.stopPropagation(); openForm(+ed.dataset.edit); return; }
  var us = e.target.closest('[data-user]');
  if (us) { e.stopPropagation(); openPerson(+us.dataset.user); return; }
  var tk = e.target.closest('.task');
  if (tk) {
    var t = byId(+tk.dataset.id);
    if (tk.closest('.box')) { openForm(t.id); } else openPerson(t.userId, t.id);
  }
}
document.addEventListener('click', onDocClick);

function byId(id) { return todos.filter(function (t) { return t.id === id; })[0]; }

/* ---------- модальные окна ---------- */
function openModal(html, onClose) {
  var o = document.createElement('div');
  o.className = 'overlay';
  o.style.zIndex = 10 + stack.length;
  o.innerHTML = '<div class="box"><button class="x" aria-label="Закрыть">×</button>' + html + '</div>';
  var item = { el: o, onClose: onClose };
  function close() { o.remove(); stack = stack.filter(function (s) { return s !== item; }); if (onClose) onClose(); }
  item.close = close;
  o.addEventListener('mousedown', function (e) { if (e.target === o) close(); });
  o.querySelector('.x').onclick = close;
  $('taskApp').appendChild(o);
  stack.push(item);
  return o;
}
function onDocKey(e) {
  if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close();
}
document.addEventListener('keydown', onDocKey);
window.taskAppCleanup = function () {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onDocKey);
};

/* окно 1: данные человека */
function openPerson(uid, fromTask) {
  var o = openModal('<div class="empty">Загрузка…</div>');
  getUser(uid).then(function (u) {
    var cnt = todos.filter(function (t) { return t.userId === uid; }).length;
    var rows = [['ID', u.id || uid], ['Возраст', u.age], ['Email', u.email], ['Телефон', u.phone],
      ['Компания', u.company && u.company.name], ['Должность', u.company && u.company.title],
      ['Город', u.address && u.address.city], ['Задач', cnt]]
      .filter(function (r) { return r[1] !== undefined && r[1] !== null && r[1] !== ''; });
    o.querySelector('.box').innerHTML = '<button class="x">×</button>' +
      '<div class="person">' + (u.image ? '<img src="' + esc(u.image) + '" alt="">' : '<img alt="">') +
      '<div><h2 style="margin:0">' + esc(u.firstName + ' ' + u.lastName) + '</h2>' +
      (u.username ? '<span class="chip">@' + esc(u.username) + '</span>' : '') + '</div></div>' +
      '<div class="kv">' + rows.map(function (r) { return '<span>' + r[0] + '</span><span>' + esc(r[1]) + '</span>'; }).join('') + '</div>' +
      '<div class="row"><button class="primary" id="toProfile">Открыть профиль и задачи →</button></div>';
    o.querySelector('.x').onclick = function () { stack.filter(function (s) { return s.el === o; })[0].close(); };
    o.querySelector('#toProfile').onclick = function () { openProfile(uid); };
  });
}

/* окно 2: профиль с задачами */
function openProfile(uid) {
  var o = openModal('<div class="empty">Загрузка…</div>');
  function draw() {
    getUser(uid).then(function (u) {
      var mine = todos.filter(function (t) { return t.userId === uid; }).sort(function (a, b) { return a.id - b.id; });
      var done = mine.filter(function (t) { return t.completed; }).length;
      var box = o.querySelector('.box');
      box.innerHTML = '<button class="x">×</button>' +
        '<h2>Профиль: ' + esc(u.firstName + ' ' + u.lastName) + '</h2>' +
        '<div class="sub">' + (u.email ? esc(u.email) + ' · ' : '') + 'задач: ' + mine.length + ', выполнено: ' + done + '</div>' +
        '<div class="row" style="margin:0 0 12px"><button class="primary" id="pAdd">+ Добавить задачу</button></div>' +
        (mine.map(function (t) { return taskHTML(t, true); }).join('') || '<div class="empty">Задач пока нет</div>');
      box.querySelector('.x').onclick = function () { stack.filter(function (s) { return s.el === o; })[0].close(); };
      box.querySelector('#pAdd').onclick = function () { openForm(null, uid); };
    });
  }
  o._redraw = draw; draw();
}

function refreshAll() {
  render();
  stack.forEach(function (s) { if (s.el._redraw) s.el._redraw(); });
}

/* окно 3: добавление / редактирование */
function openForm(id, uid) {
  var t = id != null ? byId(id) : null;
  var nextId = todos.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1;
  var o = openModal(
    '<h2>' + (t ? 'Редактировать задачу' : 'Новая задача') + '</h2>' +
    '<label>Текст задачи</label><textarea id="fText" rows="3">' + (t ? esc(t.todo) : '') + '</textarea>' +
    '<label>ID задачи</label><input type="number" id="fId" min="1" value="' + (t ? t.id : nextId) + '">' +
    '<label>ID человека</label><input type="number" id="fUser" min="1" value="' + (t ? t.userId : (uid || 1)) + '">' +
    '<label><input type="checkbox" id="fDone"' + (t && t.completed ? ' checked' : '') + '> Выполнена</label>' +
    '<div class="err" id="fErr"></div>' +
    '<div class="row"><button class="primary" id="fSave">Сохранить</button><button id="fCancel">Отмена</button>' +
    (t ? '<button id="fDel" style="margin-left:auto;color:var(--danger)">Удалить</button>' : '') + '</div>');
  var me = stack[stack.length - 1];
  o.querySelector('#fCancel').onclick = me.close;
  o.querySelector('#fText').focus();
  if (t) o.querySelector('#fDel').onclick = function () {
    if (!confirm('Удалить задачу #' + t.id + '?')) return;
    todos = todos.filter(function (x) { return x !== t; });
    fetch(API_BASE + '/' + t.id, { method: 'DELETE' }).catch(function () {});
    me.close(); refreshAll();
  };
  o.querySelector('#fSave').onclick = function () {
    var text = o.querySelector('#fText').value.trim();
    var nid = parseInt(o.querySelector('#fId').value, 10);
    var nuser = parseInt(o.querySelector('#fUser').value, 10);
    var done = o.querySelector('#fDone').checked, err = o.querySelector('#fErr');
    if (!text) { err.textContent = 'Введите текст задачи'; return; }
    if (!(nid > 0) || !(nuser > 0)) { err.textContent = 'ID должны быть положительными числами'; return; }
    var clash = byId(nid);
    if (clash && clash !== t) { err.textContent = 'Задача с ID ' + nid + ' уже существует'; return; }
    var body = JSON.stringify({ todo: text, completed: done, userId: nuser });
    var hdr = { 'Content-Type': 'application/json' };
    if (t) {
      var oldUser = t.userId;
      fetch(API_BASE + '/' + t.id, { method: 'PUT', headers: hdr, body: body }).catch(function () {});
      t.id = nid; t.todo = text; t.completed = done; t.userId = nuser;
    } else {
      fetch(API_BASE + '/add', { method: 'POST', headers: hdr, body: body }).catch(function () {});
      todos.unshift({ id: nid, todo: text, completed: done, userId: nuser });
    }
    me.close(); refreshAll();
    if (t && oldUser !== nuser) { /* задача переехала к другому человеку */ }
  };
}
})();