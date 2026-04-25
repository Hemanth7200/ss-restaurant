/* ============================================
   SS Restaurant — Admin Menu Management
   ============================================ */

function renderAdminMenu() {
  renderAdminLayout('Menu Items', (container) => {
    const categories = Store.get('categories');
    let filterCat = 'all';
    let searchQuery = '';

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-md);">
        <div class="filter-tabs" style="margin-bottom:0;" id="menu-filters">
          <button class="filter-tab active" data-cat="all">All</button>
          ${categories.map(c => `
            <button class="filter-tab" data-cat="${c.id}">${c.name}</button>
          `).join('')}
        </div>
        <button class="btn btn-primary" id="add-menu-item-btn">+ Add Item</button>
      </div>

      <div class="search-bar" style="max-width: 300px; margin-bottom: var(--space-xl);">
        <span class="search-icon">🔍</span>
        <input type="text" class="form-input" id="menu-search" placeholder="Search menu items..." />
      </div>

      <div class="data-table-wrapper" id="menu-table-container">
        <!-- Table rendered here -->
      </div>
    `;

    function updateTable() {
      let items = Store.get('menuItems');
      if (filterCat !== 'all') items = items.filter(m => m.category === filterCat);
      if (searchQuery) {
        items = items.filter(m => m.name.toLowerCase().includes(searchQuery) || m.description.toLowerCase().includes(searchQuery));
      }

      const tableContainer = document.getElementById('menu-table-container');
      if (!tableContainer) return;

      tableContainer.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Type</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:2rem;">No items found.</td></tr>` : items.map(item => {
              const cat = categories.find(c => c.id === item.category);
              return `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:var(--space-md);">
                      <div style="width: 40px; height: 40px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 20px; background: var(--bg-input); flex-shrink: 0;">
                        ${item.image && (item.image.startsWith('http') || item.image.startsWith('data:') || item.image.startsWith('assets')) 
                          ? `<img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover;" />` 
                          : (item.image || '🍽️')}
                      </div>
                      <div>
                        <div style="font-weight:600;">${Utils.escapeHtml(item.name)}</div>
                        <div style="font-size:var(--font-size-xs);color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Utils.escapeHtml(item.description)}</div>
                      </div>
                    </div>
                  </td>
                  <td>${cat ? cat.name : '—'}</td>
                  <td><strong>${Utils.formatPrice(item.price)}</strong></td>
                  <td><span class="badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}">${item.isVeg ? 'Veg' : 'Non-Veg'}</span></td>
                  <td>
                    <label class="toggle">
                      <input type="checkbox" ${item.active ? 'checked' : ''} onchange="toggleMenuItem('${item.id}', this.checked)" />
                      <span class="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-sm btn-ghost" onclick="editMenuItem('${item.id}')">✏️</button>
                      <button class="btn btn-sm btn-ghost" onclick="deleteMenuItem('${item.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      // Update active state of filter tabs visually
      const filterEls = document.getElementById('menu-filters');
      if (filterEls) {
        filterEls.querySelectorAll('.filter-tab').forEach(tab => {
          tab.classList.toggle('active', tab.dataset.cat === filterCat);
        });
      }
    }

    // Bind Search
    const searchInput = document.getElementById('menu-search');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      updateTable();
    }, 250));

    // Bind Category Filter
    const filterEls = document.getElementById('menu-filters');
    filterEls.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        filterCat = tab.dataset.cat;
        updateTable();
      });
    });

    // Add button
    document.getElementById('add-menu-item-btn').addEventListener('click', () => showMenuItemModal());

    updateTable();
    window._refreshAdminMenu = updateTable;
  });
}

function showMenuItemModal(editId) {
  const categories = Store.get('categories');
  const item = editId ? Store.get('menuItems').find(m => m.id === editId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${item ? 'Edit' : 'Add'} Menu Item</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="details-form">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" id="mi-name" class="form-input" value="${item ? Utils.escapeHtml(item.name) : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="mi-desc" class="form-input" rows="2">${item ? Utils.escapeHtml(item.description) : ''}</textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="form-group">
              <label class="form-label">Price (₹) *</label>
              <input type="number" id="mi-price" class="form-input" value="${item ? item.price : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select id="mi-category" class="form-input">
                ${categories.map(c => `<option value="${c.id}" ${item && item.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);">
            <div class="form-group">
              <label class="form-label">Type *</label>
              <select id="mi-veg" class="form-input">
                <option value="" disabled ${!item ? 'selected' : ''}>Select Type...</option>
                <option value="true" ${item && item.isVeg === true ? 'selected' : ''}>Veg</option>
                <option value="false" ${item && item.isVeg === false ? 'selected' : ''}>Non-Veg</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Item Image</label>
              <div style="display: flex; gap: var(--space-sm); align-items: center;">
                <div id="mi-image-preview" style="width: 40px; height: 40px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 20px; background: var(--bg-input);">
                  ${item && (item.image.startsWith('http') || item.image.startsWith('data:') || item.image.startsWith('assets')) 
                    ? `<img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover;" />` 
                    : (item ? item.image : '🍽️')}
                </div>
                <div style="flex: 1;">
                  <input type="file" id="mi-image-file" accept="image/*" class="form-input" style="padding: 6px; font-size: 12px;" />
                  <input type="hidden" id="mi-image" value="${item ? Utils.escapeHtml(item.image) : '🍽️'}" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="modal-save-btn">${item ? 'Save Changes' : 'Add Item'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#modal-cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const fileInput = overlay.querySelector('#mi-image-file');
  const previewBox = overlay.querySelector('#mi-image-preview');
  const hiddenImage = overlay.querySelector('#mi-image');
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        hiddenImage.value = base64;
        previewBox.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;" />`;
      };
      reader.readAsDataURL(file);
    }
  });

  overlay.querySelector('#modal-save-btn').addEventListener('click', () => {
    const name = document.getElementById('mi-name').value.trim();
    const desc = document.getElementById('mi-desc').value.trim();
    const price = parseInt(document.getElementById('mi-price').value);
    const category = document.getElementById('mi-category').value;
    const typeVal = document.getElementById('mi-veg').value;
    const isVeg = typeVal === 'true';
    const image = document.getElementById('mi-image').value.trim() || '🍽️';

    if (!name || !price || !category || typeVal === "") {
      Toast.error('Please fill in all required fields, including Type');
      return;
    }

    if (item) {
      const updated = { ...item, name, description: desc, price, category, isVeg, image };
      Store.update('menuItems', items => items.map(m =>
        m.id === editId ? updated : m
      ));
      DB.upsertMenuItem(updated);
      Toast.success('Item updated');
    } else {
      const newItem = {
        id: Utils.generateId('m'),
        name, description: desc, price, category, isVeg, image, active: true
      };
      Store.update('menuItems', items => [...items, newItem]);
      DB.upsertMenuItem(newItem);
      Toast.success('Item added');
    }

    close();
    if (window._refreshAdminMenu) window._refreshAdminMenu();
  });
}

function toggleMenuItem(id, active) {
  Store.update('menuItems', items => items.map(m => m.id === id ? { ...m, active } : m));
  const item = Store.get('menuItems').find(m => m.id === id);
  if (item) DB.upsertMenuItem(item);
  Toast.info(active ? 'Item activated' : 'Item deactivated');
}

function editMenuItem(id) { showMenuItemModal(id); }

function deleteMenuItem(id) {
  if (confirm('Delete this menu item?')) {
    Store.update('menuItems', items => items.filter(m => m.id !== id));
    DB.deleteMenuItem(id);
    Toast.success('Item deleted');
    if (window._refreshAdminMenu) window._refreshAdminMenu();
  }
}
