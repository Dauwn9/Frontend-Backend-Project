(function () {
  var root = document.getElementById('task3Root');
  if (!root) return;

  var MAX_SIZE = 20;

  // Палитра: клик по ячейке переключает цвет на следующий, после последнего — снова первый
  var PALETTE = [
    { name: 'Белый',   value: '#ffffff' },
    { name: 'Красный', value: '#ef5350' },
    { name: 'Зелёный', value: '#66bb6a' },
    { name: 'Синий',   value: '#42a5f5' },
    { name: 'Жёлтый',  value: '#ffee58' }
  ];

  var rowsInput   = root.querySelector('#task3Rows');
  var colsInput   = root.querySelector('#task3Cols');
  var createBtn   = root.querySelector('#task3Create');
  var message     = root.querySelector('#task3Message');
  var tableBox    = root.querySelector('#task3TableBox');
  var colorSelect = root.querySelector('#task3ColorSelect');
  var countBtn    = root.querySelector('#task3Count');
  var result      = root.querySelector('#task3Result');

  // Заполняем выпадающий список цветами из палитры
  PALETTE.forEach(function (color, index) {
    var option = document.createElement('option');
    option.value = index;
    option.textContent = color.name;
    colorSelect.appendChild(option);
  });

  // Превращает значение поля ввода в число от 1 до MAX_SIZE, иначе возвращает null
  function readSize(input) {
    var n = parseInt(input.value, 10);
    if (isNaN(n) || n < 1 || n > MAX_SIZE) return null;
    return n;
  }

  // Генерация таблицы заданного размера
  function generateTable(rows, cols) {
    var table = document.createElement('table');

    for (var r = 0; r < rows; r++) {
      var tr = document.createElement('tr');

      for (var c = 0; c < cols; c++) {
        var td = document.createElement('td');
        td.dataset.color = 0; // индекс цвета в PALETTE
        td.style.backgroundColor = PALETTE[0].value;
        tr.appendChild(td);
      }

      table.appendChild(tr);
    }

    tableBox.innerHTML = '';
    tableBox.appendChild(table);
  }

  // Подсчёт ячеек определённого цвета (по индексу в палитре)
  function countCells(colorIndex) {
    return tableBox.querySelectorAll('td[data-color="' + colorIndex + '"]').length;
  }

  createBtn.addEventListener('click', function () {
    var rows = readSize(rowsInput);
    var cols = readSize(colsInput);

    if (rows === null || cols === null) {
      message.textContent = 'Введите целые числа от 1 до ' + MAX_SIZE + '.';
      return;
    }

    message.textContent = '';
    result.textContent = '';
    generateTable(rows, cols);
  });

  // Один обработчик на весь контейнер таблицы (делегирование событий):
  // не нужно вешать отдельный обработчик на каждую ячейку
  tableBox.addEventListener('click', function (e) {
    var cell = e.target.closest('td');
    if (!cell) return;

    var next = (Number(cell.dataset.color) + 1) % PALETTE.length;
    cell.dataset.color = next;
    cell.style.backgroundColor = PALETTE[next].value;
  });

  countBtn.addEventListener('click', function () {
    if (!tableBox.querySelector('table')) {
      result.textContent = 'Сначала создайте таблицу.';
      return;
    }

    var index = Number(colorSelect.value);
    var total = countCells(index);
    result.textContent = 'Ячеек цвета «' + PALETTE[index].name + '»: ' + total;
  });
})();