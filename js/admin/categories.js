/* ============================================
   SS Restaurant — Admin Categories
   ============================================ */

function renderAdminCategories() {
  renderAdminLayout('Categories', (container) => {
    function render() {
      const categories = Store.get('categories').sort((a, b) => a.order - b.order);

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xl);">
          <p style="color:var(--text-muted);font-size:var(--font-size-sm);">Drag to reorder categories. Changes save automatically.</p>
          <button class="btn btn-primary" id="add-cat-btn">+ Add Category</button>
        </div>

        <div class="data-table-wrapper" style="padding:var(--space-lg);">
          <div class="category-list" id="category-list">
            ${categories.map((cat, idx) => `
              <div class="category-item" draggable="true" data-id="${cat.id}" data-order="${cat.order}">
                <span class="drag-handle">⠿</span>
                <span class="cat-name">${Utils.escapeHtml(cat.name)}</span>
                <label class="toggle" style="margin-left:auto;">
                  <input type="checkbox" ${cat.active ? 'checked' : ''} onchange="toggleCategory('${cat.id}', this.checked)" />
                  <span class="toggle-slider"></span>
                </label>
                <div class="table-actions" style="margin-left:var(--space-md);">
                  <button class="btn btn-sm btn-ghost" onclick="editCategory('${cat.id}')">✏️</button>
                  <button class="btn btn-sm btn-ghost" onclick="deleteCategory('${cat.id}')" title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Drag and drop
      const list = document.getElementById('category-list');
      let draggedItem = null;

      list.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
          draggedItem = item;
          item.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          draggedItem = null;
          // Save new order
          const newOrder = [...list.querySelectorAll('.category-item')].map((el, idx) => ({
            id: el.dataset.id,
            order: idx + 1
          }));
          Store.update('categories', cats => cats.map(c => {
            const no = newOrder.find(n => n.id === c.id);
            return no ? { ...c, order: no.order } : c;
          }));
          // Sync reorder to DB
          Store.get('categories').forEach(c => DB.upsertCategory(c));
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (draggedItem && draggedItem !== item) {
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
              list.insertBefore(draggedItem, item);
            } else {
              list.insertBefore(draggedItem, item.nextSibling);
            }
          }
        });
      });

      // Add category button
      document.getElementById('add-cat-btn').addEventListener('click', () => showCategoryModal());
    }

    render();
    window._refreshAdminCategories = render;
  });
}

function showCategoryModal(editId) {
  const cat = editId ? Store.get('categories').find(c => c.id === editId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${cat ? 'Edit' : 'Add'} Category</h3>
        <button class="modal-close" id="modal-close-btn">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Category Name *</label>
          <input type="text" id="cat-name" class="form-input" value="${cat ? Utils.escapeHtml(cat.name) : ''}" placeholder="e.g., Appetizers" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="modal-save-btn">${cat ? 'Save' : 'Add'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#modal-cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('#modal-save-btn').addEventListener('click', () => {
    const name = document.getElementById('cat-name').value.trim();
    if (!name) { Toast.error('Name is required'); return; }

    if (cat) {
      const updated = { ...cat, name };
      Store.update('categories', cats => cats.map(c => c.id === editId ? updated : c));
      DB.upsertCategory(updated);
      Toast.success('Category updated');
    } else {
      const maxOrder = Math.max(0, ...Store.get('categories').map(c => c.order));
      const newCat = { id: Utils.generateId('cat'), name, order: maxOrder + 1, active: true };
      Store.update('categories', cats => [...cats, newCat]);
      DB.upsertCategory(newCat);
      Toast.success('Category added');
    }

    close();
    if (window._refreshAdminCategories) window._refreshAdminCategories();
  });
}

function toggleCategory(id, active) {
  Store.update('categories', cats => cats.map(c => c.id === id ? { ...c, active } : c));
  const cat = Store.get('categories').find(c => c.id === id);
  if (cat) DB.upsertCategory(cat);
}

function editCategory(id) { showCategoryModal(id); }

function deleteCategory(id) {
  if (confirm('Delete this category? Items in this category will not be deleted.')) {
    Store.update('categories', cats => cats.filter(c => c.id !== id));
    DB.deleteCategory(id);
    Toast.success('Category deleted');
    if (window._refreshAdminCategories) window._refreshAdminCategories();
  }
}
