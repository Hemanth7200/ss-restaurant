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
            <button class="cart-btn-pill" id="go-cart" title="View Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Cart
              <span class="cart-count-pill" id="cart-count">${cartCount || ''}</span>
            </button>
          </div>
        </header>

        <div class="menu-search-container" style="padding: var(--space-md) var(--space-base); max-width: 800px; margin: 0 auto;">
          <div style="position: relative; margin-bottom: var(--space-md);">
            <input type="text" class="form-input" id="menu-search" placeholder="Search menu items..." style="border-radius: var(--radius-full); padding-left: 20px; padding-right: 48px; height: 48px; font-size: 15px; border: 1.5px solid var(--border-color); background: #fff;" />
            <button id="clear-search" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: #f0f0f0; border: none; width: 26px; height: 26px; border-radius: 50%; display: none; align-items: center; justify-content: center; cursor: pointer; color: #777; font-size: 10px; z-index: 5;">✕</button>
          </div>
          
          <div style="display: flex; align-items: center; gap: 10px;">
            <select id="sort-select" class="form-input" style="flex: 1; height: 36px; padding: 0 30px 0 10px; font-size: 13px; font-weight: 500; border-radius: var(--radius-md); border: 1.5px solid var(--border-color); cursor: pointer;">
              <option value="default">Default</option>
              <option value="a-z">A to Z</option>
              <option value="z-a">Z to A</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
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
          <div class="menu-card-img">
            ${isUrl
              ? `<img src="${itemImage}" alt="${Utils.escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain';" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;background:${gradient}">${itemImage || '🍽️'}</div>`
            }
          </div>
          <div class="menu-card-info">
            <span class="veg-indicator ${item.isVeg ? '' : 'nonveg'}"></span>
            <div class="menu-card-name">${Utils.escapeHtml(item.name)}</div>
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

  // Sort dropdown
  document.getElementById('sort-select').addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderMenuItems();
  });

  // Search input
  const searchInput = document.getElementById('menu-search');
  searchInput.addEventListener('input', Utils.debounce((e) => {
    searchQuery = e.target.value.trim();
    renderMenuItems();
  }, 200));

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
    cartCountEl.textContent = session.cart.length || '';
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
