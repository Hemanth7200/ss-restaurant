/* ============================================
   SS Restaurant — Menu Page
   ============================================ */

function renderMenu() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }

  Store.updateSession({ currentStep: 'menu' });

  const categories = (Store.get('categories') || []).filter(c => c.active).sort((a, b) => a.order - b.order);
  const tableNum = Utils.getTableNumber(session.tableId);
  const cartCount = session.cart.length;

  app.innerHTML = `
    <div class="menu-page">
      <!-- Desktop Sidebar -->
      <aside class="menu-sidebar">
        <div class="customer-header-left" style="margin-bottom: var(--space-xl);">
          <img src="assets/logo.png" alt="Logo" class="customer-header-logo" style="width: 48px; height: 48px;" />
          <div>
            <div class="customer-header-title">SS Restaurant</div>
            <div class="customer-header-table">Table ${tableNum}</div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <a href="#/menu" class="nav-item active">
            <span>🏠</span> Menu
          </a>
          <a href="#/cart" class="nav-item">
            <span>🛒</span> Your Cart
          </a>
        </nav>

        <div class="slogan-card">
          <div class="slogan-text">Good food<br>Good mood ♡</div>
          <img src="assets/leaf-decor.png" class="leaf-decor" alt="" onerror="this.style.display='none'" />
        </div>
      </aside>

      <!-- Main Content (Mobile + Desktop Center) -->
      <main class="menu-main">
        <header class="customer-header">
          <div class="customer-header-left" style="cursor: pointer;" onclick="Router.navigate('/')">
            <img src="assets/logo.png" alt="Logo" class="customer-header-logo" />
            <div>
              <div class="customer-header-title">SS Restaurant</div>
              <div class="customer-header-table">Table ${tableNum}</div>
            </div>
          </div>
          <div class="customer-header-right">
            <div class="cart-icon-container" id="go-cart" title="View Cart">
              <div class="cart-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span class="cart-badge" id="cart-count" style="display: ${cartCount > 0 ? 'flex' : 'none'};">${cartCount || ''}</span>
              </div>
            </div>
          </div>
        </header>

        <div class="search-filter-container">
          <div class="search-box-wrapper">
            <span class="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" id="menu-search" class="search-input" placeholder="Search menu items..." autocomplete="off" />
            <button id="clear-search" class="clear-search-btn">✕</button>
          </div>
          
          <div class="filter-btn-wrapper">
            <button id="filter-btn" class="filter-trigger-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              <span>Filters</span>
            </button>
            <div id="filter-dropdown" class="filter-options-dropdown" style="display: none;">
              <div class="filter-option" data-sort="default">Default</div>
              <div class="filter-option" data-sort="a-z">A to Z</div>
              <div class="filter-option" data-sort="z-a">Z to A</div>
              <div class="filter-option" data-sort="price-low">Price: Low to High</div>
              <div class="filter-option" data-sort="price-high">Price: High to Low</div>
            </div>
          </div>
        </div>

        <div class="menu-categories" id="category-chips">
          <button class="chip active" data-cat="all">All</button>
          ${categories.map(c => `
            <button class="chip" data-cat="${c.id}">${c.name}</button>
          `).join('')}
        </div>

        <div class="menu-grid" id="menu-grid"></div>
      </main>

      <!-- Desktop Cart Preview -->
      <aside class="menu-cart-preview" id="desktop-cart-preview"></aside>
    </div>
  `;

  // ---- State ----
  let activeCategory = 'all';
  let searchQuery = '';
  let activeSort = 'default';

  // ---- Helpers ----
  function buildMenuCardAction(itemId, qty) {
    if (qty > 0) {
      return `
        <div class="qty-stepper">
          <button onclick="menuUpdateQty('${itemId}', ${qty - 1})">−</button>
          <span class="qty-value">${qty}</span>
          <button onclick="menuUpdateQty('${itemId}', ${qty + 1})">+</button>
        </div>
      `;
    }
    return `<button class="btn-add" onclick="menuAddItem('${itemId}')">+ Add</button>`;
  }

  function renderDesktopCart() {
    const preview = document.getElementById('desktop-cart-preview');
    if (!preview) return;

    const currentSession = Store.getCurrentSession();
    const cart = currentSession.cart;
    const totals = Store.getSessionTotal();

    if (cart.length === 0) {
      preview.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; color:var(--text-muted);">
          <div style="font-size:48px; margin-bottom:16px;">🛒</div>
          <h4>Your Cart is Empty</h4>
          <p style="font-size:12px;">Add items to see your bill summary here.</p>
        </div>
      `;
      return;
    }

    preview.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-xl);">
        <h3 style="margin:0;">Your Cart</h3>
        <button class="btn btn-ghost btn-sm" onclick="Store.updateSession({cart:[]}); updateMenuDOM();">Clear Cart</button>
      </div>

      <div style="display:flex; flex-direction:column; gap:var(--space-md); margin-bottom:var(--space-2xl);">
        ${cart.map(item => `
          <div class="cart-item" style="padding:10px; margin-bottom:0;">
            <div class="cart-item-info">
              <div class="cart-item-name" style="font-size:14px;">${item.name}</div>
              <div class="cart-item-price">${Utils.formatPrice(item.price)}</div>
            </div>
            <div class="qty-stepper">
              <button onclick="menuUpdateQty('${item.itemId}', ${item.quantity - 1})">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button onclick="menuUpdateQty('${item.itemId}', ${item.quantity + 1})">+</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="bill-summary" style="margin-top:0; padding:var(--space-lg);">
        <div class="bill-row">
          <span>Subtotal</span>
          <span>${Utils.formatPrice(totals.subtotal)}</span>
        </div>
        <div class="bill-row">
          <span>GST (5%)</span>
          <span>${Utils.formatPrice(totals.gst)}</span>
        </div>
        <div class="bill-row total" style="margin-top:var(--space-md); padding-top:var(--space-md);">
          <span>Grand Total</span>
          <span>${Utils.formatPrice(totals.total)}</span>
        </div>
        
        <button class="btn btn-primary btn-full" style="margin-top:var(--space-xl);" onclick="Router.navigate('/details')">
          Proceed to Place Order • ${Utils.formatPrice(totals.total)}
        </button>
      </div>
    `;
  }

  // ---- Main render function ----
  function renderMenuItems() {
    const grid = document.getElementById('menu-grid');
    const clearBtn = document.getElementById('clear-search');
    if (!grid) return;

    // Always get fresh items from Store
    const allItems = Store.get('menuItems') || [];
    const currentMenuItems = allItems.filter(m => m.active);
    let items = [...currentMenuItems];

    // 1. Filter by Category
    if (activeCategory !== 'all') {
      items = items.filter(m => m.category === activeCategory);
    }

    // 2. Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      
      if (q.length === 1) {
        // Very strict for single letter: Only name starts with
        items = items.filter(m => m.name.toLowerCase().startsWith(q));
      } else if (q.length < 3) {
        // Strict for 2 letters: Only in names
        items = items.filter(m => m.name.toLowerCase().includes(q));
      } else {
        // Normal for 3+ letters: Name or description
        items = items.filter(m =>
          m.name.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q))
        );
      }
      
      // Show clear button
      if (clearBtn) clearBtn.style.display = 'flex';
    } else {
      if (clearBtn) clearBtn.style.display = 'none';
    }

    // 3. Sort
    switch (activeSort) {
      case 'a-z':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'z-a':
        items.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-low':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        items.sort((a, b) => b.price - a.price);
        break;
    }

    const currentSession = Store.getCurrentSession();
    renderDesktopCart();

    // Empty state
    if (items.length === 0) {
      if (!Store._dbLoaded && currentMenuItems.length === 0) {
        // Still loading from DB
        grid.innerHTML = Array(6).fill().map(() => `
          <div class="menu-card" style="height: 120px; opacity: 0.4;">
            <div class="menu-card-img" style="background: var(--bg-input);"></div>
            <div class="menu-card-info">
              <div style="height: 16px; width: 60%; background: var(--bg-input); border-radius: 4px; margin-bottom: 8px;"></div>
              <div style="height: 12px; width: 40%; background: var(--bg-input); border-radius: 4px;"></div>
            </div>
          </div>
        `).join('');
      } else {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-state-icon">🔍</div>
            <h3>No results${searchQuery ? ' for "' + Utils.escapeHtml(searchQuery) + '"' : ''}</h3>
            <p>Try a different keyword or clear filters.</p>
            <button class="btn btn-secondary btn-sm" style="margin-top:12px;" onclick="resetMenuFilters()">Clear Filters</button>
          </div>
        `;
      }
      return;
    }

    grid.innerHTML = items.map(item => {
      const cartItem = currentSession.cart.find(c => c.itemId === item.id);
      const qty = cartItem ? cartItem.quantity : 0;
      const itemImage = item.image;
      const isUrl = itemImage && (itemImage.startsWith('http') || itemImage.startsWith('/') || itemImage.startsWith('assets') || itemImage.startsWith('data:image'));
      const gradient = Utils.getFoodGradient(item.image);

      return `
        <div class="menu-card" data-id="${item.id}">
          <div class="menu-card-img" onclick="showItemDetails('${item.id}')">
            ${isUrl
              ? `<img src="${itemImage}" alt="${Utils.escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain';" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;background:${gradient}">${itemImage || '🍽️'}</div>`
            }
          </div>
          <div class="menu-card-info">
            <span class="veg-indicator ${item.isVeg ? '' : 'nonveg'}"></span>
            <div class="menu-card-name" onclick="showItemDetails('${item.id}')">${Utils.escapeHtml(item.name)}</div>
            <div class="menu-card-desc">${Utils.escapeHtml(item.description)}</div>
            <div class="menu-card-bottom">
              <span class="menu-card-price">${Utils.formatPrice(item.price)}</span>
              <div data-actions-id="${item.id}">
                ${buildMenuCardAction(item.id, qty)}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ---- Initial render ----
  renderMenuItems();

  // ---- Store subscription: re-render when DB data arrives ----
  Store.subscribe('menuItems', () => {
    if (document.getElementById('menu-grid')) {
      renderMenuItems();
    }
  });

  // ---- Event Listeners ----

  // Category chips
  document.getElementById('category-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    renderMenuItems();
  });

  // Filter dropdown toggle
  const filterBtn = document.getElementById('filter-btn');
  const filterDropdown = document.getElementById('filter-dropdown');
  if (filterBtn && filterDropdown) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = filterDropdown.style.display === 'block';
      filterDropdown.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      filterDropdown.style.display = 'none';
    });

    filterDropdown.addEventListener('click', (e) => {
      const option = e.target.closest('.filter-option');
      if (option) {
        activeSort = option.dataset.sort;
        document.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        renderMenuItems();
      }
    });
  }

  // Search input
  const searchInput = document.getElementById('menu-search');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce((e) => {
      searchQuery = e.target.value.trim();
      renderMenuItems();
    }, 200));
  }

  // Clear search
  document.getElementById('clear-search').addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    renderMenuItems();
    searchInput.focus();
  });

  // Reset all filters
  window.resetMenuFilters = () => {
    searchInput.value = '';
    searchQuery = '';
    activeCategory = 'all';
    activeSort = 'default';
    document.getElementById('sort-select').value = 'default';
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    const allChip = document.querySelector('#category-chips .chip[data-cat="all"]');
    if (allChip) allChip.classList.add('active');
    renderMenuItems();
  };

  // Cart button
  document.getElementById('go-cart').addEventListener('click', () => Router.navigate('/cart'));

  // Expose for external updates
  window._menuRenderItems = renderMenuItems;
}

// ---- Global functions for menu item buttons ----
function menuAddItem(itemId) {
  const items = Store.get('menuItems') || [];
  const item = items.find(m => m.id === itemId);
  if (item) {
    Store.addToCart(item);
    updateMenuDOM(itemId);
  }
}

function menuUpdateQty(itemId, qty) {
  Store.updateCartQty(itemId, qty);
  updateMenuDOM(itemId);
}

function updateMenuDOM(changedItemId) {
  const session = Store.getCurrentSession();
  if (!session) return;

  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) {
    const count = session.cart.length;
    cartCountEl.textContent = count || '';
    cartCountEl.style.display = count > 0 ? 'flex' : 'none';
  }

  if (changedItemId) {
    const actionContainer = document.querySelector(`[data-actions-id="${changedItemId}"]`);
    if (actionContainer) {
      const cartItem = session.cart.find(c => c.itemId === changedItemId);
      const qty = cartItem ? cartItem.quantity : 0;
      if (qty > 0) {
        actionContainer.innerHTML = `
          <div class="qty-stepper">
            <button onclick="menuUpdateQty('${changedItemId}', ${qty - 1})">−</button>
            <span class="qty-value">${qty}</span>
            <button onclick="menuUpdateQty('${changedItemId}', ${qty + 1})">+</button>
          </div>
        `;
      } else {
        actionContainer.innerHTML = `<button class="btn-add" onclick="menuAddItem('${changedItemId}')">+ Add</button>`;
      }
    }
  }

  if (window._menuRenderItems) {
    window._menuRenderItems();
  }
}

// ---- Menu Item Details Modal ----
function showItemDetails(itemId) {
  const items = Store.get('menuItems') || [];
  const item = items.find(m => m.id === itemId);
  if (!item) return;

  const session = Store.getCurrentSession();
  const cartItem = session.cart.find(c => c.itemId === itemId);
  const qty = cartItem ? cartItem.quantity : 1;

  // Resolve category name
  const categories = Store.get('categories') || [];
  const cat = categories.find(c => c.id === item.category);
  const categoryName = cat ? cat.name : '';

  // Remove existing modal if present
  const existing = document.getElementById('item-details-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'item-details-modal';
  
  const itemImage = item.image;
  const isUrl = itemImage && (itemImage.startsWith('http') || itemImage.startsWith('/') || itemImage.startsWith('assets') || itemImage.startsWith('data:image'));
  const gradient = Utils.getFoodGradient(item.image);

  // Generate ingredients from description keywords
  const desc = item.description || '';
  const ingredientsList = desc.replace(/[.!]/g, '').split(/,\s*| with | and | in | on | stuffed | tossed | soaked | brushed /).map(s => s.trim()).filter(s => s.length > 2 && s.length < 40).join(', ');

  const startQty = cartItem ? cartItem.quantity : 1;

  overlay.innerHTML = `
    <div class="item-modal-content">
      <button class="modal-close-btn" onclick="closeItemDetails()">✕</button>
      
      <div class="item-modal-left">
        <div class="item-modal-img-container">
          ${isUrl
            ? `<img src="${itemImage}" alt="${Utils.escapeHtml(item.name)}" onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain';" />`
            : `<div class="item-modal-placeholder" style="background:${gradient}">${itemImage || '🍽️'}</div>`
          }
        </div>
      </div>
      
      <div class="item-modal-right">
        <div class="item-modal-header">
          <div class="item-modal-title-row">
            <h2 class="item-modal-name">${Utils.escapeHtml(item.name)}</h2>
            <span class="item-modal-bestseller">⭐ Bestseller</span>
          </div>
          <p class="item-modal-desc">${Utils.escapeHtml(desc || 'Delicious dish prepared with fresh ingredients.')}</p>
          
          <div class="item-modal-tags">
            <span class="item-tag ${item.isVeg ? 'tag-veg' : 'tag-nonveg'}">
              <span class="veg-indicator ${item.isVeg ? '' : 'nonveg'}"></span>
              ${item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
            <span class="item-tag tag-spice">🌶️ ${item.isVeg ? 'Mild' : 'Medium Spicy'}</span>
          </div>
        </div>
        
        <div class="item-modal-ingredients">
          <h4>Ingredients</h4>
          <p>${ingredientsList || Utils.escapeHtml(desc)}</p>
        </div>

        <div class="item-modal-footer">
          <div class="item-modal-qty-row">
            <div class="modal-qty-stepper" id="modal-qty-stepper-${item.id}">
              <button class="modal-qty-btn" onclick="modalStepQty('${item.id}', -1)">−</button>
              <span class="modal-qty-value" id="modal-qty-val-${item.id}">${startQty}</span>
              <button class="modal-qty-btn" onclick="modalStepQty('${item.id}', 1)">+</button>
            </div>
            <span class="item-modal-price" id="modal-price-${item.id}">${Utils.formatPrice(item.price * startQty)}</span>
          </div>
          <button class="modal-add-cart-btn" id="modal-add-btn-${item.id}" onclick="modalConfirmAdd('${item.id}')">
            🛒 ${cartItem ? 'Update Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  
  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeItemDetails();
  });

  // Close on Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeItemDetails();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeItemDetails() {
  const modal = document.getElementById('item-details-modal');
  if (modal) modal.remove();
}

function modalStepQty(itemId, delta) {
  const valEl = document.getElementById(`modal-qty-val-${itemId}`);
  const priceEl = document.getElementById(`modal-price-${itemId}`);
  if (!valEl) return;
  
  let current = parseInt(valEl.textContent) || 1;
  current = Math.max(1, current + delta);
  valEl.textContent = current;

  const items = Store.get('menuItems') || [];
  const item = items.find(m => m.id === itemId);
  if (item && priceEl) {
    priceEl.textContent = Utils.formatPrice(item.price * current);
  }
}

function modalConfirmAdd(itemId) {
  const valEl = document.getElementById(`modal-qty-val-${itemId}`);
  const qty = valEl ? parseInt(valEl.textContent) || 1 : 1;

  const items = Store.get('menuItems') || [];
  const item = items.find(m => m.id === itemId);
  if (!item) return;

  // Set quantity in cart
  const session = Store.getCurrentSession();
  const cartItem = session.cart.find(c => c.itemId === itemId);
  
  if (cartItem) {
    Store.updateCartQty(itemId, qty);
  } else {
    // Add item then set quantity
    Store.addToCart(item);
    if (qty > 1) {
      Store.updateCartQty(itemId, qty);
    }
  }

  updateMenuDOM(itemId);
  closeItemDetails();
  
  // Show toast
  if (window.showToast) {
    showToast(`${item.name} × ${qty} added to cart!`, 'success');
  }
}
