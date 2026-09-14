var buttons = document.querySelectorAll('.tabs__btn');
var content = document.getElementById('tabsContent');
var homeTemplate = document.getElementById('homeTemplate');
var cache = {};

function setActiveButton(btn) {
  buttons.forEach(function (b) {
    var active = b === btn;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', active);
  });
}

// находит кнопку вкладки по data-src (используется, когда кликают по карточке)
function findButtonBySrc(src) {
  var found = null;
  buttons.forEach(function (b) {
    if (b.dataset.src === src) found = b;
  });
  return found;
}

// после вставки карточек — клик по карточке переключает вкладку, а не открывает файл
function wireHomeCards() {
  content.querySelectorAll('[data-target]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var target = el.dataset.target;
      var btn = findButtonBySrc(target);
      if (btn) loadTab(btn);
    });
  });
}

function loadTab(btn) {
  setActiveButton(btn);

  // вкладка "Главная" — просто показываем карточки из template, без fetch
  if (btn.dataset.home) {
    content.innerHTML = homeTemplate.innerHTML;
    wireHomeCards();
    return;
  }

  var src = btn.dataset.src;

  if (cache[src]) {
    content.innerHTML = cache[src];
    return;
  }

  content.textContent = 'Загрузка...';

  fetch(src)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (html) {
      var match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      var inner = match ? match[1] : html;

      // убираем ссылку "вернуться на главную" — она не нужна внутри вкладки
      inner = inner.replace(/<a href="[^"]*index\.html"[^>]*>[\s\S]*?<\/a>/i, '');

      // "../css/..", "../images/.." -> без "../", т.к. вставляется в index.html,
      // который лежит на уровень выше, чем pages/
      inner = inner.replace(/(src|href)="\.\.\//g, '$1="');

      cache[src] = inner;
      content.innerHTML = inner;
    })
    .catch(function (err) {
      content.textContent = 'Не удалось загрузить "' + src + '": ' + err.message;
    });
}

buttons.forEach(function (btn) {
  btn.addEventListener('click', function () { loadTab(btn); });
});

// загрузить активную вкладку сразу при открытии страницы
loadTab(document.querySelector('.tabs__btn.is-active'));
