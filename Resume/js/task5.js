(function () {
  var root = document.getElementById('crudRoot');
  if (!root) return;

  var API_BASE = 'https://dummyjson.com/todos';

  var newTextInput = root.querySelector('#crudNewText');
  var userIdInput = root.querySelector('#crudUserId');
  var addBtn       = root.querySelector('#crudAddBtn');
  var message      = root.querySelector('#crudMessage');
  var list         = root.querySelector('#crudList');

  var todos = []; 
  // наша локальная копия списка задач
var nextLocalId = -1;
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
        todos = data.todos; // у каждого объекта есть id, todo (текст), completed
        showMessage('');
        renderList();
      })
      .catch(function (err) {
        showMessage('Не удалось загрузить список: ' + err.message, true);
      });
  }

  // Отрисовывает весь список заново на основе массива todos
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
      text.textContent =
        item.todo + ' (User ID: ' + item.userId + ')';

      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Изменить';
      editBtn.addEventListener('click', function () {
        startEdit(li, item);
      });

      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Удалить';
      deleteBtn.addEventListener('click', function () {
        deleteTodo(item.id);
      });

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  }
  
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
  

  // ---------- CREATE: добавление новой задачи ----------

  function addTodo() {
  var text = newTextInput.value.trim();
  var userId = Number(userIdInput.value);

  if (!text) {
    showMessage('Введите текст задачи.', true);
    return;
  }

  if (!userId) {
    showMessage('Введите User ID.', true);
    return;
  }

  fetch(API_BASE + '/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      todo: text,
      completed: false,
      userId: userId
    })
  })
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function () {

      var newTodo = {
        id: nextLocalId--,
        todo: text,
        completed: false,
        userId: userId
      };

      todos.push(newTodo);

      renderList();

      newTextInput.value = '';
      userIdInput.value = '';

      showMessage('');
    })
    .catch(function (err) {
      showMessage(
        'Не удалось добавить задачу: ' + err.message,
        true
      );
    });
}

  todos.push(newTodo);
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
  var item = todos.find(function (t) {
    return t.id === id;
  });

  if (!item) return;

  // Если задача создана локально
  if (id < 0) {
    item.completed = completed;
    renderList();
    showMessage('');
    return;
  }

  // Если задача загружена с сервера
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
      item.completed = completed;
      renderList();
      showMessage('');
    })
    .catch(function (err) {
      showMessage(
        'Не удалось обновить задачу: ' + err.message,
        true
      );
      renderList();
    });
}
function saveEdit(id, newText) {
  if (!newText) {
    showMessage('Текст задачи не может быть пустым.', true);
    return;
  }

  var item = todos.find(function (t) {
    return t.id === id;
  });

  if (!item) return;

  // Если задача новая и хранится локально
  if (id < 0) {
    item.todo = newText;
    showMessage('');
    renderList();
    return;
  }

  // Если задача загружена с сервера
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
      item.todo = newText;
      showMessage('');
      renderList();
    })
    .catch(function (err) {
      showMessage('Не удалось сохранить изменения: ' + err.message, true);
    });
}



function deleteTodo(id) {

  // Если задача создана локально
  if (id < 0) {
    todos = todos.filter(function (t) {
      return t.id !== id;
    });

    renderList();
    showMessage('');
    return;
  }

  // Если задача загружена с сервера
  fetch(API_BASE + '/' + id, { method: 'DELETE' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function () {
      todos = todos.filter(function (t) {
        return t.id !== id;
      });

      renderList();
    })
    .catch(function (err) {
      showMessage(
        'Не удалось удалить задачу: ' + err.message,
        true
      );
    });
}

  addBtn.addEventListener('click', addTodo);
  newTextInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') addTodo();
  });

  loadTodos();
})();
