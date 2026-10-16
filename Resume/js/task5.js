(function () {
var API_BASE = 'https://dummyjson.com/todos';

var todos = [], shown = 30;
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

/* ---------- загрузка ---------- */
fetch(API_BASE + '?limit=0').then(function (r) { return r.json(); })
  .then(function (d) { todos = d.todos; render(); })
  .catch(function () { $('list').innerHTML = '<div class="empty">Не удалось загрузить данные с API</div>'; });

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
    '<span class="chip">👤 ' + t.userId + '</span>' +
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
})();