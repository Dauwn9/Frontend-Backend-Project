(function () {
  var root = document.getElementById('task1Root');
  if (!root) return;

  var dynamicArea = root.querySelector('#task1Dynamic'); // для кнопки 4 (абзац остаётся внутри карточки)
  var dynamicText = null;   // элемент, которым управляют кнопки 1-3
  var paragraph = null;     // появится только после клика на кнопку 4
  var paragraphChanged = false; // в каком сейчас состоянии абзац


  var leftover = document.getElementById('task1OutsideText');
  if (leftover) leftover.remove();

  root.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.dataset.action;

      // 1. Добавить текст ("Я новый элемент")
      if (action === 'add-text') {
        if (!dynamicText) {
          dynamicText = document.createElement('div');
          dynamicText.id = 'task1OutsideText';
          dynamicText.classList.add('new-div'); 
          dynamicText.textContent = 'Я новый элемент';
          document.body.appendChild(dynamicText); 
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
          dynamicText = null; 
        }
      }

      // 4. Создать изменяемый абзац
      if (action === 'toggle-paragraph') {
        if (!paragraph) {
          paragraph = document.createElement('p');
          paragraph.classList.add('card', 'card-content');
          paragraph.textContent = 'Это изменяемый абзац.';

          
          paragraph.addEventListener('click', function () {
            paragraphChanged = !paragraphChanged;

            if (paragraphChanged) {
              paragraph.style.color = 'crimson';
              paragraph.style.fontSize = '28px';
            } else {
              paragraph.style.color = '';
              paragraph.style.fontSize = '';
            }
          });

          dynamicArea.appendChild(paragraph);
        }
      }
    });
  });
})();