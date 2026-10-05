// Фейковый API: https://dummyjson.com/docs/todos
(function () {
  var root = document.getElementById('crudRoot');
  if (!root) return;

  var API_BASE = 'https://dummyjson.com/todos';

  var newTextInput = root.querySelector('#crudNewText');
  var addBtn       = root.querySelector('#crudAddBtn');
  var message      = root.querySelector('#crudMessage');
  var list         = root.querySelector('#crudList');

  var todos = []; // локальная копия списка задач

  function showMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle('is-error', !!isError);
  }

  // ---------- READ: загрузка списка ----------

  function loadTodos() {
    showMessage('Загрузка...');

    fetch(API_BASE + '?limit=10')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        todos = data.todos; // у каждого объекта: id, todo (текст), completed
        showMessage('');
        renderList();
      })
      .catch(function (err) {
        showMessage('Не удалось загрузить список: ' + err.message, true);
      });
  }

  // Отрисовывает список заново на основе массива todos.
  // Чекбокс пока только для отображения (disabled) — отметку "выполнено"
  // добавит человек 2 в блоке Update. Кнопок "Изменить"/"Удалить" тоже
  // пока нет — их добавят следующие части.
  function renderList() {
    list.innerHTML = '';

    todos.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'crud-item' + (item.completed ? ' is-done' : '');
      li.dataset.id = item.id;

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.completed;
      checkbox.disabled = true; // временно, пока не подключили Update

      var text = document.createElement('span');
      text.className = 'crud-item-text';
      text.textContent = item.todo;

      li.appendChild(checkbox);
      li.appendChild(text);
      list.appendChild(li);
    });
  }

  // ---------- CREATE: добавление новой задачи ----------

  function addTodo() {
    var text = newTextInput.value.trim();
    if (!text) {
      showMessage('Введите текст задачи.', true);
      return;
    }

    fetch(API_BASE + '/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todo: text,
        completed: false,
        userId: 1
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (created) {
        todos.push(created); // сервер вернул объект с "новым" id
        renderList();
        newTextInput.value = '';
        showMessage('');
      })
      .catch(function (err) {
        showMessage('Не удалось добавить задачу: ' + err.message, true);
      });
  }

  addBtn.addEventListener('click', addTodo);
  newTextInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTodo();
  });

  loadTodos();
})();