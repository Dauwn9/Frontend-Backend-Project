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

function taskHTML(t) {
  return '<div class="task ' + (t.completed ? 'done' : '') + '" data-id="' + t.id + '">' +
    '<span class="chip">#' + t.id + '</span>' +
    '<span class="txt">' + esc(t.todo) + '</span>' +
    '<span class="chip ' + (t.completed ? 'st-done' : 'st-open') + '">' + (t.completed ? 'Выполнена' : 'В работе') + '</span>' +
    '<span class="chip user" data-user="' + t.userId + '" title="Открыть человека">👤 ' + t.userId + '</span>' +
    '</div>';
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

/* клики по списку */
function onDocClick(e) {
  if (!e.target.closest('#taskApp')) return;
  var us = e.target.closest('[data-user]');
  if (us) { e.stopPropagation(); openPerson(+us.dataset.user); return; }
  var tk = e.target.closest('.task');
  if (tk) {
    var t = byId(+tk.dataset.id);
    openPerson(t.userId, t.id);
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

/* окно человека: его данные (список его задач добавит часть 3) */
function openPerson(uid, fromTask) {
  var o = openModal('<div class="empty">Загрузка…</div>');
  function draw() {
    getUser(uid).then(function (u) {
      var mine = todos.filter(function (t) { return t.userId === uid; }).sort(function (a, b) { return a.id - b.id; });
      var rows = [['ID', u.id || uid], ['Возраст', u.age], ['Email', u.email], ['Телефон', u.phone],
        ['Компания', u.company && u.company.name], ['Должность', u.company && u.company.title],
        ['Город', u.address && u.address.city], ['Задач', mine.length]]
        .filter(function (r) { return r[1] !== undefined && r[1] !== null && r[1] !== ''; });
      var box = o.querySelector('.box');
      box.innerHTML = '<button class="x">×</button>' +
        '<div class="person">' + (u.image ? '<img src="' + esc(u.image) + '" alt="">' : '<img alt="">') +
        '<div><h2 style="margin:0">' + esc(u.firstName + ' ' + u.lastName) + '</h2>' +
        (u.username ? '<span class="chip">@' + esc(u.username) + '</span>' : '') + '</div></div>' +
        '<div class="kv">' + rows.map(function (r) { return '<span>' + r[0] + '</span><span>' + esc(r[1]) + '</span>'; }).join('') + '</div>';
      box.querySelector('.x').onclick = function () { stack.filter(function (s) { return s.el === o; })[0].close(); };
    });
  }
  o._redraw = draw; draw();
}
})();