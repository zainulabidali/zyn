let count = 0;

function addEntry(data = null, returnDiv = false) {
  count++;
  const container = document.getElementById('container');
  const div = document.createElement('div');
  div.className = 'entry';

  div.innerHTML = `
    <h3>Item ${count}</h3>
    <label>Item Name: </label>
    <input type="text" class="item-name" placeholder="Enter item name" oninput="saveToLocal()"><br><br>

    <table class="material-table">
      <thead>
        <tr>
          <th>Material</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
          <th class="no-print">Action</th>
        </tr>
      </thead>
      <tbody class="material-body"></tbody>
    </table>

    <button class="no-print" onclick="addMaterialRow(this)">+ Add Material</button>

    <button onclick="toggleMaterialSummary()" id="summary-toggle-btn">📊 Show Material Summary</button>
    <div id="material-summary"></div>

    <div class="total-box">
      <div><strong>Grand Total:</strong> <input type="number" class="grand-total" readonly></div>
      <div><label>Total Cost:</label> <input type="number" class="total-cost" readonly></div>
      <div><label>Profit %:</label> <input type="number" class="profit-percent" value="0" oninput="calculateTotals()"></div>
      <div><label>Profit:</label> <input type="number" class="profit-amount" readonly></div>
      <div><label>GROSS:</label> <input type="number" class="gross-amount" readonly></div>
    </div>

    <div style="text-align:right; margin-top:10px;">
      <button class="remove-item-btn no-print" onclick="removeEntry(this)">🗑 Remove Item</button>
    </div>
  `;

  container.appendChild(div);

  if (data) {
    div.querySelector('.item-name').value = data.name || '';
    const tbody = div.querySelector('.material-body');
    data.materials.forEach(m => {
      const row = createMaterialRow();
      tbody.insertAdjacentHTML('beforeend', row);
      const lastRow = tbody.lastElementChild;
      lastRow.querySelector('.mat-name').value = m.name;
      lastRow.querySelector('.qty').value = m.qty;
      lastRow.querySelector('.unit').value = m.unit;
    });
    div.querySelector('.profit-percent').value = data.profit || 0;
    calculateTotals();
  }

  if (returnDiv) return div;
}

function createMaterialRow() {
  return `
    <tr>
      <td><input type="text" class="mat-name" placeholder="Material name" oninput="saveToLocal()"></td>
      <td><input type="number" class="qty" value="0" oninput="updateAllTotals()"></td>
      <td><input type="number" class="unit" value="0" oninput="updateAllTotals()"></td>
      <td><input type="number" class="line-total" readonly></td>
      <td class="no-print"><button onclick="removeMaterialRow(this)">Remove</button></td>
    </tr>
  `;
}

function addMaterialRow(button) {
  const tbody = button.closest('.entry').querySelector('.material-body');
  tbody.insertAdjacentHTML('beforeend', createMaterialRow());
  updateAllTotals();
}

function removeMaterialRow(button) {
  const row = button.closest('tr');
  row.remove();
  updateAllTotals();
}

function removeEntry(button) {
  const itemBox = button.closest('.entry');
  itemBox.remove();
  renumberItems();
  saveToLocal();
}

function renumberItems() {
  const entries = document.querySelectorAll('.entry');
  entries.forEach((entry, index) => {
    const header = entry.querySelector('h3');
    if (header) header.textContent = `Item ${index + 1}`;
  });
}

function updateAllTotals() {
  const entries = document.querySelectorAll('.entry');
  entries.forEach(entry => {
    const rows = entry.querySelectorAll('.material-body tr');
    let total = 0;

    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.qty').value) || 0;
      const unit = parseFloat(row.querySelector('.unit').value) || 0;
      const rowTotal = qty * unit;
      row.querySelector('.line-total').value = rowTotal.toFixed(2);
      total += rowTotal;
    });

    entry.querySelector('.grand-total').value = total.toFixed(2);
    entry.querySelector('.total-cost').value = total.toFixed(2);

    const profitPercent = parseFloat(entry.querySelector('.profit-percent').value) || 0;
    const profitAmount = (total * profitPercent) / 100;
    const grossAmount = total + profitAmount;

    entry.querySelector('.profit-amount').value = profitAmount.toFixed(2);
    entry.querySelector('.gross-amount').value = grossAmount.toFixed(2);
  });

  saveToLocal();
}

function calculateTotals() {
  updateAllTotals();
}

function toggleMaterialSummary() {
  const summaryDiv = document.getElementById('material-summary');
  const toggleBtn = document.getElementById('summary-toggle-btn');

  if (!summaryDiv || !toggleBtn) return;

  if (summaryDiv.innerHTML.trim() !== '') {
    summaryDiv.innerHTML = '';
    toggleBtn.textContent = '📊 Show Material Summary';
    return;
  }

  const summarySet = new Set();
  let totalCost = 0;

  document.querySelectorAll('.material-body tr').forEach(row => {
    const nameInput = row.querySelector('.mat-name');
    const qtyInput = row.querySelector('.qty');
    const unitInput = row.querySelector('.unit');

    if (!nameInput || !qtyInput || !unitInput) return;

    const name = nameInput.value.trim();
    const qty = parseFloat(qtyInput.value) || 0;
    const unit = parseFloat(unitInput.value) || 0;

    if (!name || qty === 0 || unit === 0) return;

    summarySet.add(name);
    totalCost += qty * unit;
  });

  const html = `
    <div class="material-summary-overall">
      <p>📦 <strong>Total Materials Used:</strong> ${summarySet.size}</p>
      <p>💰 <strong>Total Material Cost:</strong> ₹${totalCost.toFixed(2)}</p>
    </div>
  `;

  summaryDiv.innerHTML = html;
  toggleBtn.textContent = '❌ Hide Summary';
}

function saveToLocal() {
  const entries = document.querySelectorAll('.entry');
  const data = [];

  entries.forEach(entry => {
    const itemName = entry.querySelector('.item-name').value;
    const profit = entry.querySelector('.profit-percent').value;
    const materials = [];

    entry.querySelectorAll('.material-body tr').forEach(row => {
      const name = row.querySelector('.mat-name').value;
      const qty = row.querySelector('.qty').value;
      const unit = row.querySelector('.unit').value;

      materials.push({ name, qty, unit });
    });

    data.push({ name: itemName, materials, profit });
  });

  localStorage.setItem('materialEstimatorData', JSON.stringify(data));
}

function clearAll() {
  localStorage.removeItem('materialEstimatorData');
  document.getElementById('container').innerHTML = '';
  count = 0;
}

window.addEventListener('load', () => {
  const saved = localStorage.getItem('materialEstimatorData');
  if (saved) {
    const data = JSON.parse(saved);
    data.forEach(item => addEntry(item));
    updateAllTotals();
  }
});
