import { db, ref, set, get, child } from './firebase.js';

let count = 0;

window.addEntry = function addEntry(data = null) {
  count++;
  const container = document.getElementById('container');
  const div = document.createElement('div');
  div.className = 'entry';

  div.innerHTML = `
   <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
  <h3>Item ${count}</h3>

  <div>
    <label for="quoteNo" style="margin-right: 10px;">Quote No:</label>
    <input type="text" id="quoteNo" style="width: 120px; padding: 4px;">
  </div>
</div>

<input
  type="text"
  id="itemName"
  class="item-name"
  placeholder="particular name"
  oninput="saveToFirebase()"
  style="width: 100%; max-width: 800px; font-size: 16px; padding: 8px; box-sizing: border-box;"
>


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


    <button onclick="toggleMaterialSummary()" id="summary-toggle-btn">📊 Description</button>
    <div id="material-summary"></div>

    <div class="total-box">
  <!-- Row: Grand Total + Total Cost -->
  
    <div class="item"><strong>Grand Total:</strong> <input type="number" class="grand-total" readonly></div>
    <div class="item"><label>Total Cost:</label> <input type="number" class="total-cost" readonly></div>
  

  <!-- Below rows: Profit % -->
  <div class="item"><label>Profit %:</label> <input type="number" class="profit-percent" value="0" oninput="calculateTotals()"></div>

  <!-- Profit -->
  <div class="item"><label>Profit:</label> <input type="number" class="profit-amount" readonly></div>

  <!-- GROSS -->
  <div class="item"><label>GROSS:</label> <input type="number" class="gross-amount" readonly></div>
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

};



function createMaterialRow() {

  return `
    <tr>
      <td>
        <div style="display:flex; flex-direction:column; gap:4px;">
          <input list="material-options" class="mat-name" placeholder="Material name" onchange="saveToFirebase()">
          <datalist id="material-options">
            <option value="MDF">
            <option value="Paint">
            <option value="Sticker">
            <option value="Plywood">
            <option value="Veneer">
          </datalist>
          <button type="button" class="no-print" style="font-size: 12px; padding: 2px 6px;" onclick="addCustomMaterialOption(this)">+ Add to List</button>
        </div>
      </td>
      <td><input type="number" class="qty" value="0" oninput="updateAllTotals()"></td>
      <td><input type="number" class="unit" value="0" oninput="updateAllTotals()"></td>
      <td><input type="number" class="line-total" readonly></td>
      <td class="no-print"><button onclick="removeMaterialRow(this)">Remove</button></td>
    </tr>
  `;
}

window.addCustomMaterialOption = function (button) {
  const row = button.closest('tr');
  const input = row.querySelector('.mat-name');
  const value = input.value.trim();
  const list = document.getElementById('material-options');
  if (!value) return;
  const exists = Array.from(list.options).some(option => option.value === value);
  if (!exists) {
    const opt = document.createElement('option');
    opt.value = value;
    list.appendChild(opt);
  }
};

window.addMaterialRow = function (button) {
  const tbody = button.closest('.entry').querySelector('.material-body');
  tbody.insertAdjacentHTML('beforeend', createMaterialRow());
  updateAllTotals();
};

window.removeMaterialRow = function (button) {
  if (!confirm('Remove this material?')) return;
  button.closest('tr').remove();
  updateAllTotals();
};

window.removeEntry = function (button) {
  if (!confirm('Remove this item?')) return;
  const itemBox = button.closest('.entry');
  itemBox.remove();
  renumberItems();
  saveToFirebase();
};

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

  saveToFirebase();
}

window.calculateTotals = function () {
  updateAllTotals();
};

window.toggleMaterialSummary = function () {
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
    const name = row.querySelector('.mat-name').value.trim();
    const qty = parseFloat(row.querySelector('.qty').value) || 0;
    const unit = parseFloat(row.querySelector('.unit').value) || 0;
    if (name && qty && unit) {
      summarySet.add(name);
      totalCost += qty * unit;
    }
  });

  summaryDiv.innerHTML = `
    <p>📦 <strong>Total Materials Used:</strong> ${summarySet.size}</p>
    <p>💰 <strong>Total Material Cost:</strong> ₹${totalCost.toFixed(2)}</p>
  `;



  toggleBtn.textContent = '❌ Hide ';
};

function saveToFirebase() {
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

  set(ref(db, 'estimatorData'), data);
}

window.clearAll = function () {
  if (!confirm('⚠️ Are you sure you want to clear everything?')) return;
  set(ref(db, 'estimatorData'), []);
  document.getElementById('container').innerHTML = '';
  count = 0;
};

function loadFromFirebase() {
  const dbRef = ref(db);
  get(child(dbRef, 'estimatorData')).then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      data.forEach(item => addEntry(item));
      updateAllTotals();
    } else {
      showTopUpPrompt(); // Show prompt only if no data
    }
  });
}

window.showTopUpPrompt = function () {
  document.getElementById('topup-warning').style.display = 'block';
};

window.handleTopUpYes = function () {
  document.getElementById('topup-warning').style.display = 'none';
  addEntry({ name: 'Top-Up', materials: [], profit: 10 });
};

window.handleTopUpNo = function () {
  document.getElementById('topup-warning').style.display = 'none';
};

window.addEventListener('load', loadFromFirebase);
