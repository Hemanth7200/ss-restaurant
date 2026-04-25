/* ============================================
   SS Restaurant — Admin Tables & QR Codes
   ============================================ */

function renderAdminTables() {
  renderAdminLayout('Tables & QR Codes', (container) => {
    function render() {
      const tables = Store.get('tables');

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md);">
          <p style="color:var(--text-muted);font-size:var(--font-size-sm);">${tables.length} tables configured</p>
          <button class="btn btn-primary" id="add-table-btn">+ Add Table</button>
        </div>

        <div class="data-table-wrapper" style="margin-bottom:var(--space-2xl);">
          <table class="data-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tables.map(t => `
                <tr>
                  <td><strong>Table ${t.number}</strong></td>
                  <td>${t.capacity} seats</td>
                  <td>
                    <span class="status-dot ${t.status}"></span>
                    <span style="margin-left:6px;text-transform:capitalize;">${t.status}</span>
                  </td>
                  <td>
                    <div class="table-actions">
                      ${t.status === 'occupied' || t.status === 'blocked' ? `
                        <button class="btn btn-sm btn-success" onclick="adminReleaseTable('${t.id}')">Release</button>
                      ` : `
                        <button class="btn btn-sm" style="background:var(--color-warning);color:#fff;" onclick="adminBlockTable('${t.id}')">Block</button>
                      `}
                      <button class="btn btn-sm btn-ghost" onclick="editTable('${t.id}')">✏️</button>
                      <button class="btn btn-sm btn-ghost" onclick="deleteTable('${t.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h3 style="margin-bottom:var(--space-lg);font-size:var(--font-size-lg);">QR Codes</h3>
        <p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:var(--space-xl);">Each QR code links directly to the ordering page for that table. Click to download.</p>

        <div class="qr-grid" id="qr-grid">
          ${tables.map(t => `
            <div class="qr-card">
              <canvas id="qr-${t.id}" width="160" height="160" style="margin:0 auto var(--space-md);"></canvas>
              <h4>Table ${t.number}</h4>
              <p>${t.capacity} seats</p>
              <button class="btn btn-sm btn-secondary" style="margin-top:var(--space-md);" onclick="downloadQR('${t.id}', ${t.number})">
                ⬇️ Download
              </button>
            </div>
          `).join('')}
        </div>
      `;

      // Generate functional QR codes
      tables.forEach(t => {
        const canvas = document.getElementById(`qr-${t.id}`);
        if (canvas) generateRealQR(canvas, t.number);
      });

      document.getElementById('add-table-btn').addEventListener('click', () => showTableModal());
    }

    render();
    window._refreshAdminTables = render;
  });
}

function generateRealQR(canvas, tableNumber) {
  // Construct the exact URL that points to the customer ordering page with this table parameter
  const baseUrl = window.location.origin + window.location.pathname;
  const targetUrl = `${baseUrl}?table=${tableNumber}`;

  // Use QRious library to render a functional QR code directly to the canvas
  new QRious({
    element: canvas,
    value: targetUrl,
    size: 160,
    background: '#ffffff',
    foreground: '#000000',
    level: 'H' // High error correction
  });
}

function downloadQR(tableId, tableNumber) {
  const canvas = document.getElementById(`qr-${tableId}`);
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `SS-Restaurant-Table-${tableNumber}-QR.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  Toast.success(`QR code for Table ${tableNumber} downloaded`);
}

function showTableModal(editId) {
  const table = editId ? Store.get('tables').find(t => t.id === editId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${table ? 'Edit' : 'Add'} Table</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="details-form">
          <div class="form-group">
            <label class="form-label">Table Number *</label>
            <input type="number" id="tbl-number" class="form-input" value="${table ? table.number : ''}" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Capacity (seats)</label>
            <input type="number" id="tbl-capacity" class="form-input" value="${table ? table.capacity : 4}" min="1" max="20" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="modal-save-btn">${table ? 'Save' : 'Add'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#modal-cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#modal-save-btn').addEventListener('click', () => {
    const number = parseInt(document.getElementById('tbl-number').value);
    const capacity = parseInt(document.getElementById('tbl-capacity').value) || 4;

    if (!number) { Toast.error('Table number is required'); return; }

    // Check duplicate
    const existing = Store.get('tables').find(t => t.number === number && t.id !== editId);
    if (existing) { Toast.error('Table number already exists'); return; }

    if (table) {
      const updated = { ...table, number, capacity };
      Store.update('tables', tables => tables.map(t => t.id === editId ? updated : t));
      DB.upsertTable(updated);
      Toast.success('Table updated');
    } else {
      const newTable = { id: Utils.generateId('table'), number, capacity, status: 'available' };
      Store.update('tables', tables => [...tables, newTable]);
      DB.upsertTable(newTable);
      Toast.success('Table added');
    }

    close();
    if (window._refreshAdminTables) window._refreshAdminTables();
  });
}

function adminReleaseTable(id) {
  Store.releaseTable(id);
  Toast.success('Table released');
  renderAdminTables();
}

function adminBlockTable(id) {
  Store.blockTable(id);
  Toast.warning('Table blocked');
  renderAdminTables();
}

function editTable(id) { showTableModal(id); }

function deleteTable(id) {
  if (confirm('Delete this table?')) {
    Store.update('tables', tables => tables.filter(t => t.id !== id));
    DB.deleteTable(id);
    Toast.success('Table deleted');
    if (window._refreshAdminTables) window._refreshAdminTables();
  }
}
