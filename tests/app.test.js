// test para pruebas
const { wireTable } = require('../assets/js/app');

test('Verificar si la tabla permite la búsqueda', () => {
  const table = document.createElement('table');
  table.id = 'test-table';
  document.body.appendChild(table);

  wireTable(table);

  const searchInput = document.createElement('input');
  searchInput.className = 'js-search';
  searchInput.dataset.target = 'test-table';
  document.body.appendChild(searchInput);

  searchInput.value = 'test';
  searchInput.dispatchEvent(new Event('input'));

  const rows = table.querySelectorAll('tr');
  expect(rows.length).toBeGreaterThan(0);
});
