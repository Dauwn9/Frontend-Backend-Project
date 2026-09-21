// Всё ищем и добавляем только внутри #task1Root, а не во всём document.body —
// так скрипт безопасно работает и как отдельная страница, и как вкладка,
// которую можно открывать и закрывать много раз подряд без дублирования элементов.
(function () {
  var root = document.getElementById('task1Root');
  if (!root) return;

  // 1. Найти элемент по ID и изменить текст
  var target = root.querySelector('#task1Target');
  if (target) {
    target.textContent = 'Привет, мир!';
  }

  // 2. Создать <div class="new-div"> и добавить в конец контейнера
  var newDiv = document.createElement('div');
  newDiv.classList.add('new-div', 'card', 'card-content');
  newDiv.textContent = 'Я новый элемент';
  root.appendChild(newDiv);

  // 3. Удалить элемент с классом old-element (тут: task1-old-element,
  // чтобы не конфликтовать с другими страницами)
  var oldElement = root.querySelector('.task1-old-element');
  if (oldElement) {
    oldElement.remove();
  }

  // 4. Создать <p> с текстом
  var paragraph = document.createElement('p');
  paragraph.classList.add('card', 'card-content');
  paragraph.textContent = 'Это изменяемый абзац.';
  root.appendChild(paragraph);

  // 5. При клике на абзац менять цвет и размер шрифта
  paragraph.addEventListener('click', function () {
    paragraph.style.color = 'crimson';
    paragraph.style.fontSize = '28px';
  });
})();
