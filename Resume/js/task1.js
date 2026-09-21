// Всё ищем и добавляем внутри #task1Root — так скрипт безопасно работает
// и как отдельная страница, и как вкладка, которую можно открывать
// и закрывать много раз подряд без дублирования элементов.
(function () {
  var root = document.getElementById('task1Root');
  if (!root) return;

  var dynamicArea = root.querySelector('#task1Dynamic');
  var dynamicText = null;   // элемент, которым управляют кнопки 1-3
  var paragraph = null;     // появится только после клика на кнопку 4

  root.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.dataset.action;

      // 1. Добавить текст ("Я новый элемент")
      if (action === 'add-text') {
        if (!dynamicText) {
          dynamicText = document.createElement('div');
          dynamicText.classList.add('new-div', 'card', 'card-content');
          dynamicText.textContent = 'Я новый элемент';
          dynamicArea.appendChild(dynamicText);
        }
      }

      // 2. Заменить текст этого же элемента на "Привет, мир!"
      if (action === 'replace-text') {
        if (dynamicText) {
          dynamicText.textContent = 'Привет, мир!';
        }
      }

      // 3. Удалить этот же элемент
      if (action === 'remove-text') {
        if (dynamicText) {
          dynamicText.remove();
          dynamicText = null; // чтобы кнопка 1 могла создать его заново
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
