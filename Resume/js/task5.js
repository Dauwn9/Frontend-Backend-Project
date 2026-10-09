(function () {
  var root = document.getElementById('crudRoot');
  if (!root) return;

  var API_BASE = 'https://dummyjson.com/todos';

  var addBtn  = root.querySelector('#crudAddBtn');
  var message = root.querySelector('#crudMessage');
  var list    = root.querySelector('#crudList');

  var todos = [];          // локальная копия списка задач
  var nextLocalId = -1;    // отрицательные id у задач, созданных локально
  var editingId = null;    // null = добавление, число = изменение задачи с этим id

  function showMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle('is-error', !!isError);
  }

  // Отправляет запрос и возвращает { method, url, status, data } —
  // то же самое, что видно в DevTools (Network)
  function sendRequest(method, url, body) {
    var options = { method: method };

    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }

    return fetch(url, options).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json().then(function (data) {
        return { method: method, url: url, status: res.status, data: data };
      });
    });
  }

  // ---------- МОДАЛЬНОЕ ОКНО (стили в style.css) ----------

  var overlay = document.createElement('div');
  overlay.className = 'crud-modal';
  overlay.hidden = true;
  overlay.innerHTML =
    '<div class="crud-modal-box">' +
      '<h3 id="crudModalTitle"></h3>' +
      '<label>Название задачи' +
        '<input type="text" id="crudModalText" placeholder="Что нужно сделать?">' +
      '</label>' +
      '<label>User ID' +
        '<input type="number" id="crudModalUserId" min="1">' +
      '</label>' +
      '<div class="crud-modal-error" id="crudModalError"></div>' +
      '<pre class="crud-modal-response" id="crudModalResponse" hidden></pre>' +
      '<div class="crud-modal-actions">' +
        '<button type="button" id="crudModalCancel">Отмена</button>' +
        '<button type="button" id="crudModalSave">Сохранить</button>' +
      '</div>' +
    '</div>';
  root.appendChild(overlay);

  var modalTitle    = overlay.querySelector('#crudModalTitle');
  var modalText     = overlay.querySelector('#crudModalText');
  var modalUserId   = overlay.querySelector('#crudModalUserId');
  var modalError    = overlay.querySelector('#crudModalError');
  var modalResponse = overlay.querySelector('#crudModalResponse');
  var modalSave     = overlay.querySelector('#crudModalSave');
  var modalCancel   = overlay.querySelector('#crudModalCancel');

  // item = объект задачи (изменение) или undefined (добавление)
  function openModal(item) {
    editingId = item ? item.id : null;
    modalTitle.textContent = item ? 'Изменить задачу' : 'Новая задача';
    modalText.value   = item ? item.todo : '';
    modalUserId.value = item ? item.userId : '';
    modalError.textContent = '';
    modalResponse.hidden = true;
    modalResponse.textContent = '';
    modalSave.hidden = false;
    modalSave.disabled = false;
    modalCancel.textContent = 'Отмена';
    overlay.hidden = false;
    modalText.focus();
  }

  function closeModal() {
    overlay.hidden = true;
    editingId = null;
  }

  // показывает в окне запрос и ответ сервера (как в логе Network)
  function showResponse(log) {
    modalResponse.textContent =
      log.method + ' ' + log.url + ' (' + log.status + ')\n\n' +
      JSON.stringify(log.data, null, 2);
    modalResponse.hidden = false;
    modalSave.hidden = true;
    modalCancel.textContent = 'Закрыть';
  }

  function submitModal() {
    var text = modalText.value.trim();
    var userId = Number(modalUserId.value);

    if (!text) {
      modalError.textContent = 'Введите название задачи.';
      return;
    }
    if (!userId) {
      modalError.textContent = 'Введите User ID.';
      return;
    }

    modalError.textContent = '';
    modalSave.disabled = true;

    var request = editingId === null
      ? createTodo(text, userId)
      : updateTodo(editingId, text, userId);

    request
      .then(function (log) {
        showMessage('');
        renderList();
        showResponse(log);
      })
      .catch(function (err) {
        modalError.textContent = 'Ошибка: ' + err.message;
        modalSave.disabled = false;
      });
  }

  addBtn.addEventListener('click', function () { openModal(); });
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', submitModal);

  // клик по тёмному фону закрывает окно
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  // Enter = сохранить, Esc = закрыть
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !modalSave.hidden) submitModal();
    if (e.key === 'Escape') closeModal();
  });

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
      text.textContent = item.todo + ' (User ID: ' + item.userId + ')';

      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Изменить';
      editBtn.addEventListener('click', function () {
        openModal(item);
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

  // ---------- CREATE ----------
  // возвращает промис с { method, url, status, data }

  function createTodo(text, userId) {
    return sendRequest('POST', API_BASE + '/add', {
      todo: text,
      completed: false,
      userId: userId
    }).then(function (log) {
      // dummyjson ничего не сохраняет, поэтому добавляем в локальный список сами
      todos.push({
        id: nextLocalId--,
        todo: text,
        completed: false,
        userId: userId
      });
      return log;
    });
  }

  // ---------- UPDATE: название и User ID ----------

  function updateTodo(id, text, userId) {
    var item = todos.find(function (t) {
      return t.id === id;
    });

    if (!item) return Promise.reject(new Error('задача не найдена'));

    // Если задача создана локально: на сервере её нет, поэтому PUT вернул бы 404.
    // Отправляем POST /add (dummyjson его симулирует)
    if (id < 0) {
      return sendRequest('POST', API_BASE + '/add', {
        todo: text,
        completed: item.completed,
        userId: userId
      }).then(function (log) {
        item.todo = text;
        item.userId = userId;
        return log;
      });
    }

    // Если задача загружена с сервера
    return sendRequest('PUT', API_BASE + '/' + id, {
      todo: text,
      userId: userId
    }).then(function (log) {
      item.todo = text;
      item.userId = userId;
      return log;
    });
  }

  // ---------- UPDATE: отметка "выполнено" ----------

  function toggleComplete(id, completed) {
    var item = todos.find(function (t) {
      return t.id === id;
    });

    if (!item) return;

    if (id < 0) {
      item.completed = completed;
      renderList();
      showMessage('');
      return;
    }

    sendRequest('PUT', API_BASE + '/' + id, { completed: completed })
      .then(function () {
        item.completed = completed;
        renderList();
        showMessage('');
      })
      .catch(function (err) {
        showMessage('Не удалось обновить задачу: ' + err.message, true);
        renderList();
      });
  }

  // ---------- DELETE ----------

  function deleteTodo(id) {
    if (id < 0) {
      todos = todos.filter(function (t) {
        return t.id !== id;
      });
      renderList();
      showMessage('');
      return;
    }

    sendRequest('DELETE', API_BASE + '/' + id)
      .then(function () {
        todos = todos.filter(function (t) {
          return t.id !== id;
        });
        renderList();
      })
      .catch(function (err) {
        showMessage('Не удалось удалить задачу: ' + err.message, true);
      });
  }

  loadTodos();
})();