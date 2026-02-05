const { wireTable } = require('../assets/js/app');

test('Verificar si la tabla permite la búsqueda', () => {

  const table = document.createElement('table');
  table.id = 'test-table';
  document.body.appendChild(table);
  
  const tbody = document.createElement('tbody');
  const row1 = document.createElement('tr');
  row1.innerHTML = '<td>test row 1</td>';
  const row2 = document.createElement('tr');
  row2.innerHTML = '<td>test row 2</td>';
  tbody.appendChild(row1);
  tbody.appendChild(row2);
  table.appendChild(tbody);

  wireTable(table);

  const searchInput = document.createElement('input');
  searchInput.className = 'js-search';
  searchInput.dataset.target = 'test-table';
  document.body.appendChild(searchInput); 

  searchInput.value = 'test row 1';
  searchInput.dispatchEvent(new Event('input')); 

  const rows = table.querySelectorAll('tr');
  expect(rows.length).toBeGreaterThan(1);
});
