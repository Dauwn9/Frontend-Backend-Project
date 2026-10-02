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

  var rowsInput  = root.querySelector('#task3Rows');
  var colsInput  = root.querySelector('#task3Cols');
  var createBtn  = root.querySelector('#task3Create');
  var message    = root.querySelector('#task3Message');
  var tableBox   = root.querySelector('#task3TableBox');
  var liveCounts = root.querySelector('#task3LiveCounts');

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

  // Пересчитывает количество ячеек каждого цвета и сразу выводит внизу,
  // например: "Белый: 12". Вызывается после создания таблицы и после каждого клика.
  function updateLiveCounts() {
    liveCounts.innerHTML = '';

    PALETTE.forEach(function (color, index) {
      var total = countCells(index);
      var span = document.createElement('span');
      span.textContent = color.name + ': ' + total;
      liveCounts.appendChild(span);
    });
  }

  createBtn.addEventListener('click', function () {
    var rows = readSize(rowsInput);
    var cols = readSize(colsInput);

    if (rows === null || cols === null) {
      message.textContent = 'Введите целые числа от 1 до ' + MAX_SIZE + '.';
      return;
    }

    message.textContent = '';
    generateTable(rows, cols);
    updateLiveCounts();
  });

  // Один обработчик на весь контейнер таблицы (делегирование событий):
  // не нужно вешать отдельный обработчик на каждую ячейку
  tableBox.addEventListener('click', function (e) {
    var cell = e.target.closest('td');
    if (!cell) return;

    var next = (Number(cell.dataset.color) + 1) % PALETTE.length;
    cell.dataset.color = next;
    cell.style.backgroundColor = PALETTE[next].value;
    updateLiveCounts();
  });
})();