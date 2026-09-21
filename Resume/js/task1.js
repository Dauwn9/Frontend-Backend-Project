// Всё ищем и добавляем внутри #task1Root — так скрипт безопасно работает
// и как отдельная страница, и как вкладка, которую можно открывать
// и закрывать много раз подряд без дублирования элементов.
(function () {
  var root = document.getElementById('task1Root');
  if (!root) return;

  var target = root.querySelector('#task1Target');
  var oldElement = root.querySelector('.task1-old-element');
  var dynamicArea = root.querySelector('#task1Dynamic');
  var paragraph = null; // появится только после клика на кнопку 4

  root.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.dataset.action;

      // 1. Добавить текст ("Я новый элемент")
      if (action === 'add-text') {
        var newDiv = document.createElement('div');
        newDiv.classList.add('new-div', 'card', 'card-content');
        newDiv.textContent = 'Я новый элемент';
        dynamicArea.appendChild(newDiv);
      }

      // 2. Заменить текст на "Привет, мир!"
      if (action === 'replace-text') {
        if (target) {
          target.textContent = 'Привет, мир!';
        }
      }

      // 3. Удалить текст (карточку с task1-old-element)
      if (action === 'remove-text') {
        if (oldElement) {
          oldElement.remove();
          oldElement = null; // чтобы повторный клик ничего не ломал
        }
      }

      // 4. Создать изменяемый абзац (по клику на сам абзац меняются цвет и размер)
      if (action === 'toggle-paragraph') {
        if (!paragraph) {
          paragraph = document.createElement('p');
          paragraph.classList.add('card', 'card-content');
          paragraph.textContent = 'Это изменяемый абзац.';

          paragraph.addEventListener('click', function () {
            paragraph.style.color = 'crimson';
            paragraph.style.fontSize = '28px';
          });

          dynamicArea.appendChild(paragraph);
        }
      }
    });
  });
})();
