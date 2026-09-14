var buttons = document.querySelectorAll('.tabs__btn');
var content = document.getElementById('tabsContent');
var cache = {};

function loadTab(btn) {
  var src = btn.dataset.src;

  buttons.forEach(function (b) {
    var active = b === btn;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', active);
  });

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

      // страницы внутри pages/ ссылаются на images/../css как на "../images/..",
      // но так как их HTML вставляется прямо в index.html (который лежит в корне),
      // нужно вернуть пути к виду "images/..." без "../"
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

loadTab(buttons[0]);
