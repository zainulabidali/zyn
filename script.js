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
        <label>Quote No:</label>
        <input type="text" class="quote-no" style="width: 120px; padding: 4px;">
      </div>
    </div>

    <input
      type="text"
      class="item-name"
      placeholder="Particular name"
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

    <div style="margin-top: 10px;">
      <label><strong>Description:</strong></label><br>
      <textarea class="description" placeholder="Add notes or description..." oninput="saveToFirebase()" style="width: 100%; max-width: 800px; height: 60px; padding: 6px;"></textarea>
    </div>

    <div class="total-box">
      <div class="item"><strong>Grand Total:</strong> <input type="number" class="grand-total" readonly></div>
      <div class="item"><label>Total Cost:</label> <input type="number" class="total-cost" readonly></div>
      <div class="item"><label>Profit %:</label> <input type="number" class="profit-percent" value="0" oninput="calculateTotals()"></div>
      <div class="item"><label>Profit:</label> <input type="number" class="profit-amount" readonly></div>
      <div class="item"><label>GROSS:</label> <input type="number" class="gross-amount" readonly></div>
    </div>

    <div style="text-align:right; margin-top:10px;">
      <button class="remove-item-btn no-print" onclick="removeEntry(this)">🗑 Remove Item</button>
    </div>
  `;

  container.appendChild(div);

  if (data) {
    div.querySelector('.item-name').value = data.name || '';
    div.querySelector('.profit-percent').value = data.profit || 0;
    div.querySelector('.description').value = data.description || '';
    div.querySelector('.quote-no').value = data.quoteNo || '';

    const tbody = div.querySelector('.material-body');
    if (data.materials) {
      data.materials.forEach(m => {
        const row = createMaterialRow();
        tbody.insertAdjacentHTML('beforeend', row);
        const lastRow = tbody.lastElementChild;
        lastRow.querySelector('.mat-name').value = m.name;
        lastRow.querySelector('.qty').value = m.qty;
        lastRow.querySelector('.unit').value = m.unit;
      });
    }
  }

  updateAllTotals();

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
          <button type="button" class="no-print" style="font-size: 12px;" onclick="addCustomMaterialOption(this)">+ Add to List</button>
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
  button.closest('.entry').remove();
  renumberItems();
  saveToFirebase();
};

function renumberItems() {
  document.querySelectorAll('.entry h3').forEach((h3, index) => {
    h3.textContent = `Item ${index + 1}`;
  });
}

function updateAllTotals() {
  document.querySelectorAll('.entry').forEach(entry => {
    let total = 0;
    entry.querySelectorAll('.material-body tr').forEach(row => {
      const qty = parseFloat(row.querySelector('.qty').value) || 0;
      const unit = parseFloat(row.querySelector('.unit').value) || 0;
      const line = qty * unit;
      row.querySelector('.line-total').value = line.toFixed(2);
      total += line;
    });

    const profitPercent = parseFloat(entry.querySelector('.profit-percent').value) || 0;
    const profit = total * profitPercent / 100;
    const gross = total + profit;

    entry.querySelector('.grand-total').value = total.toFixed(2);
    entry.querySelector('.total-cost').value = total.toFixed(2);
    entry.querySelector('.profit-amount').value = profit.toFixed(2);
    entry.querySelector('.gross-amount').value = gross.toFixed(2);
  });

  saveToFirebase();
}

window.calculateTotals = function () {
  updateAllTotals();
};



function saveToFirebase() {

  
  const data = [];

  document.querySelectorAll('.entry').forEach(entry => {
    const name = entry.querySelector('.item-name').value;
    const profit = entry.querySelector('.profit-percent').value;
    const description = entry.querySelector('.description').value;
    const quoteNo = entry.querySelector('.quote-no').value;

    const materials = Array.from(entry.querySelectorAll('.material-body tr')).map(row => ({
      name: row.querySelector('.mat-name').value,
      qty: row.querySelector('.qty').value,
      unit: row.querySelector('.unit').value
    }));

    data.push({ name, profit, description, quoteNo, materials });
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
  get(child(ref(db), 'estimatorData')).then(snapshot => {
    if (snapshot.exists()) {
      snapshot.val().forEach(item => addEntry(item));
    } else {
      showTopUpPrompt();
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
