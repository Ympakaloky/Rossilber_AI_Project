const API_URL = '/.netlify/functions/sheet';

const form = document.getElementById('entry-form');
const rowIdInput = document.getElementById('row-id');
const partyInput = document.getElementById('party');
const productInput = document.getElementById('product');
const quantityInput = document.getElementById('quantity');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const tableBody = document.getElementById('table-body');
const statusMessage = document.getElementById('status-message');

function setStatus(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.classList.toggle('error', isError);
}

function resetForm() {
  form.reset();
  rowIdInput.value = '';
  submitBtn.textContent = 'Добавить';
  cancelEditBtn.classList.add('hidden');
}

async function loadData() {
  setStatus('Загрузка...');
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Не удалось загрузить данные');
    const rows = await res.json();
    renderTable(rows);
    setStatus('');
  } catch (err) {
    setStatus(err.message, true);
  }
}

function renderTable(rows) {
  tableBody.innerHTML = '';
  if (rows.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4">Нет данных</td></tr>';
    return;
  }

  rows.forEach(item => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${escapeHtml(item.party)}</td>
      <td>${escapeHtml(item.product)}</td>
      <td>${escapeHtml(item.quantity)}</td>
      <td class="actions-cell">
        <button class="btn-edit">Изменить</button>
        <button class="btn-delete">Удалить</button>
      </td>
    `;

    tr.querySelector('.btn-edit').addEventListener('click', () => startEdit(item));
    tr.querySelector('.btn-delete').addEventListener('click', () => deleteRow(item.row));

    tableBody.appendChild(tr);
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function startEdit(item) {
  rowIdInput.value = item.row;
  partyInput.value = item.party;
  productInput.value = item.product;
  quantityInput.value = item.quantity;
  submitBtn.textContent = 'Сохранить';
  cancelEditBtn.classList.remove('hidden');
  partyInput.focus();
}

async function deleteRow(row) {
  if (!confirm('Удалить эту строку?')) return;
  setStatus('Удаление...');
  try {
    const res = await fetch(`${API_URL}?row=${row}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Не удалось удалить строку');
    await loadData();
  } catch (err) {
    setStatus(err.message, true);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    party: partyInput.value.trim(),
    product: productInput.value.trim(),
    quantity: quantityInput.value.trim()
  };

  const isEdit = Boolean(rowIdInput.value);
  setStatus(isEdit ? 'Сохранение...' : 'Добавление...');

  try {
    const res = await fetch(API_URL, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { ...payload, row: rowIdInput.value } : payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка сохранения');
    }

    resetForm();
    await loadData();
  } catch (err) {
    setStatus(err.message, true);
  }
});

cancelEditBtn.addEventListener('click', resetForm);

loadData();
