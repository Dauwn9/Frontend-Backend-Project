// ЧЕЛОВЕК 2: Update (добавляется поверх части Create+Read от человека 1)
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
        todos = data.todos;
        showMessage('');
        renderList();
      })
      .catch(function (err) {
        showMessage('Не удалось загрузить список: ' + err.message, true);
      });
  }

  // Отрисовывает список. Чекбокс теперь реально переключает "выполнено",
  // добавлена кнопка "Изменить" для редактирования текста.
  // Кнопки "Удалить" пока нет — её добавит человек 3.
  function renderList() {
    list.innerHTML = '';

    todos.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'crud-item' + (item.completed ? ' is-done' : '');
      li.dataset.id = item.id;

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.completed;
      checkbox.addEventListener('change', function () {
        toggleComplete(item.id, checkbox.checked);
      });

      var text = document.createElement('span');
      text.className = 'crud-item-text';
      text.textContent = item.todo;

      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Изменить';
      editBtn.addEventListener('click', function () {
        startEdit(li, item);
      });

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(editBtn);
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
        todos.push(created);
        renderList();
        newTextInput.value = '';
        showMessage('');
      })
      .catch(function (err) {
        showMessage('Не удалось добавить задачу: ' + err.message, true);
      });
  }

  // ---------- UPDATE: отметка "выполнено" ----------

  function toggleComplete(id, completed) {
    fetch(API_BASE + '/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: completed })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function () {
        var item = todos.find(function (t) { return t.id === id; });
        if (item) item.completed = completed;
        renderList();
      })
      .catch(function (err) {
        showMessage('Не удалось обновить задачу: ' + err.message, true);
      });
  }

  // ---------- UPDATE: редактирование текста ----------

  function startEdit(li, item) {
    li.innerHTML = '';

    var input = document.createElement('input');
    input.type = 'text';
    input.value = item.todo;

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Сохранить';
    saveBtn.addEventListener('click', function () {
      saveEdit(item.id, input.value.trim());
    });

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Отмена';
    cancelBtn.addEventListener('click', renderList);

    li.appendChild(input);
    li.appendChild(saveBtn);
    li.appendChild(cancelBtn);
    input.focus();
  }

  function saveEdit(id, newText) {
    if (!newText) {
      showMessage('Текст задачи не может быть пустым.', true);
      return;
    }

    fetch(API_BASE + '/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todo: newText })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function () {
        var item = todos.find(function (t) { return t.id === id; });
        if (item) item.todo = newText;
        showMessage('');
        renderList();
      })
      .catch(function (err) {
        showMessage('Не удалось сохранить изменения: ' + err.message, true);
      });
  }

  addBtn.addEventListener('click', addTodo);
  newTextInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTodo();
  });

  loadTodos();
})();
