(function () {
if (window.taskAppCleanup) window.taskAppCleanup();
var API_BASE = 'https://dummyjson.com/todos';
var USERS_URL = 'https://dummyjson.com/users';

var todos = [], users = {}, brief = {}, shown = 30, stack = [];
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

/* ---------- загрузка ---------- */
fetch(API_BASE + '?limit=0').then(function (r) { return r.json(); })
  .then(function (d) { todos = d.todos; render(); })
  .catch(function () { $('list').innerHTML = '<div class="empty">Не удалось загрузить данные с API</div>'; });

/* краткие данные всех людей: имя, username, аватарка */
fetch(USERS_URL + '?limit=0&select=firstName,lastName,username,image')
  .then(function (r) { return r.json(); })
  .then(function (d) {
    d.users.forEach(function (u) { brief[u.id] = u; });
    refreshAll();
  })
  .catch(function () {});

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
    if (!q) return true;
    var b = brief[t.userId];
    var who = b ? (b.firstName + ' ' + b.lastName + ' ' + b.username).toLowerCase() : '';
    return t.todo.toLowerCase().indexOf(q) > -1 || String(t.id) === q ||
           String(t.userId) === q || who.indexOf(q) > -1;
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

function userChip(uid) {
  var b = brief[uid];
  var inner = b
    ? '<img src="' + esc(b.image || '') + '" alt=""><span>' + esc(b.firstName + ' ' + b.lastName) +
      ' <small>@' + esc(b.username) + '</small></span>'
    : '👤 ' + uid;
  return '<span class="chip user" data-user="' + uid + '" title="Открыть человека">' + inner + '</span>';
}

function taskHTML(t, inProfile) {
  return '<div class="task ' + (t.completed ? 'done' : '') + '" data-id="' + t.id + '">' +
    '<input type="checkbox" class="chk" data-check="' + t.id + '"' + (t.completed ? ' checked' : '') + ' title="Отметить выполненной">' +
    '<span class="chip">#' + t.id + '</span>' +
    '<span class="txt">' + esc(t.todo) + '</span>' +
    '<span class="chip ' + (t.completed ? 'st-done' : 'st-open') + '">' + (t.completed ? 'Выполнена' : 'В работе') + '</span>' +
    (inProfile ? '' : userChip(t.userId)) +
    '<button class="icon" data-edit="' + t.id + '" title="Редактировать">✎</button>' +
    '<button class="icon del" data-del="' + t.id + '" title="Удалить">🗑</button></div>';
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

function byId(id) { return todos.filter(function (t) { return t.id === id; })[0]; }

function deleteTodo(id) {
  var t = byId(id);
  if (!t || !confirm('Удалить задачу #' + t.id + '?')) return false;
  todos = todos.filter(function (x) { return x !== t; });
  fetch(API_BASE + '/' + t.id, { method: 'DELETE' }).catch(function () {});
  refreshAll();
  return true;
}

function toggleTodo(id, checked) {
  var t = byId(id);
  if (!t) return;
  t.completed = checked;
  fetch(API_BASE + '/' + t.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: checked })
  }).catch(function () {});
  refreshAll();
}

/* клики (общий обработчик для главного списка и окна человека) */
function onDocClick(e) {
  if (!e.target.closest('#taskApp')) return;
  var ck = e.target.closest('[data-check]');
  if (ck) { e.stopPropagation(); toggleTodo(+ck.dataset.check, ck.checked); return; }
  var dl = e.target.closest('[data-del]');
  if (dl) { e.stopPropagation(); deleteTodo(+dl.dataset.del); return; }
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

/* окно человека: слева его данные, справа его задачи */
/* окно человека: слева его данные, справа его задачи + фильтр */
function openPerson(uid, fromTask) {
  var o = openModal('<div class="empty">Загрузка…</div>');
  o.querySelector('.box').classList.add('wide');
  var f = { q: '', st: 'all', s: 'id-asc' };   /* состояние фильтра окна */

  function mineAll() {
    return todos.filter(function (t) { return t.userId === uid; });
  }

  function mineFiltered() {
    var q = f.q.trim().toLowerCase();
    var a = mineAll().filter(function (t) {
      if (f.st === 'done' && !t.completed) return false;
      if (f.st === 'open' && t.completed) return false;
      return !q || t.todo.toLowerCase().indexOf(q) > -1 || String(t.id) === q;
    });
    a.sort(function (x, y) {
      switch (f.s) {
        case 'id-desc': return y.id - x.id;
        case 'text-asc': return x.todo.localeCompare(y.todo);
        case 'text-desc': return y.todo.localeCompare(x.todo);
        case 'status': return (x.completed - y.completed) || (x.id - y.id);
        default: return x.id - y.id;
      }
    });
    return a;
  }

  /* перерисовывает только список и счётчик, чтобы поле поиска не теряло фокус */
  function drawTasks() {
    var all = mineAll(), a = mineFiltered();
    var done = all.filter(function (t) { return t.completed; }).length;
    var stats = o.querySelector('#pStats'), list = o.querySelector('.split-tasks');
    if (!stats || !list) return;
    stats.textContent = 'задач: ' + all.length + ', выполнено: ' + done +
      (a.length !== all.length ? ' · показано: ' + a.length : '');
    list.innerHTML = a.map(function (t) { return taskHTML(t, true); }).join('') ||
      '<div class="empty">' + (all.length ? 'Ничего не найдено' : 'Задач пока нет') + '</div>';
  }

  function draw() {
    getUser(uid).then(function (u) {
      var count = mineAll().length;
      var rows = [['ID', u.id || uid], ['Возраст', u.age], ['Email', u.email], ['Телефон', u.phone],
        ['Компания', u.company && u.company.name], ['Должность', u.company && u.company.title],
        ['Город', u.address && u.address.city], ['Задач', count]]
        .filter(function (r) { return r[1] !== undefined && r[1] !== null && r[1] !== ''; });
      var box = o.querySelector('.box');
      box.innerHTML = '<button class="x">×</button>' +
        '<div class="split"><div class="split-left">' +
        '<div class="person">' + (u.image ? '<img src="' + esc(u.image) + '" alt="">' : '<img alt="">') +
        '<div><h2 style="margin:0">' + esc(u.firstName + ' ' + u.lastName) + '</h2>' +
        (u.username ? '<span class="chip">@' + esc(u.username) + '</span>' : '') + '</div></div>' +
        '<div class="kv">' + rows.map(function (r) { return '<span>' + r[0] + '</span><span>' + esc(r[1]) + '</span>'; }).join('') + '</div>' +
        '</div><div class="split-right">' +
        '<h2>Задачи</h2>' +
        '<div class="sub" id="pStats"></div>' +
        '<div class="bar mini">' +
          '<input type="search" id="pq" placeholder="Поиск задач или ID…">' +
          '<select id="pst">' +
            '<option value="all">Все статусы</option>' +
            '<option value="open">Не выполнены</option>' +
            '<option value="done">Выполнены</option>' +
          '</select>' +
          '<select id="psort">' +
            '<option value="id-asc">ID ↑</option>' +
            '<option value="id-desc">ID ↓</option>' +
            '<option value="text-asc">Текст А→Я</option>' +
            '<option value="text-desc">Текст Я→А</option>' +
            '<option value="status">Сначала невыполненные</option>' +
          '</select>' +
          '<button class="primary" id="pAdd">+ Добавить</button>' +
        '</div>' +
        '<div class="split-tasks"></div>' +
        '</div></div>';

      /* возвращаем сохранённые значения фильтра */
      box.querySelector('#pq').value = f.q;
      box.querySelector('#pst').value = f.st;
      box.querySelector('#psort').value = f.s;

      box.querySelector('#pq').addEventListener('input', function (e) { f.q = e.target.value; drawTasks(); });
      box.querySelector('#pst').addEventListener('input', function (e) { f.st = e.target.value; drawTasks(); });
      box.querySelector('#psort').addEventListener('input', function (e) { f.s = e.target.value; drawTasks(); });

      box.querySelector('.x').onclick = function () {
        var it = stack.filter(function (s) { return s.el === o; })[0];
        if (it) it.close();
      };
      box.querySelector('#pAdd').onclick = function () { openForm(null, uid); };
      drawTasks();
    });
  }
  o._redraw = draw; draw();
}

function refreshAll() {
  render();
  stack.forEach(function (s) { if (s.el._redraw) s.el._redraw(); });
}

/* добавление / редактирование */
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
    if (deleteTodo(t.id)) me.close();
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
      fetch(API_BASE + '/' + t.id, { method: 'PUT', headers: hdr, body: body }).catch(function () {});
      t.id = nid; t.todo = text; t.completed = done; t.userId = nuser;
    } else {
      fetch(API_BASE + '/add', { method: 'POST', headers: hdr, body: body }).catch(function () {});
      todos.unshift({ id: nid, todo: text, completed: done, userId: nuser });
    }
    me.close(); refreshAll();
  };
}
})();