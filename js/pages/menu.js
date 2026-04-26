/* ============================================
   SS Restaurant — Menu Page
   ============================================ */

function renderMenu() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }

  Store.updateSession({ currentStep: 'menu' });

  const categories = Store.get('categories').filter(c => c.active).sort((a, b) => a.order - b.order);
  const menuItems = Store.get('menuItems').filter(m => m.active);
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
          <div class="search-bar-wrapper" style="position: relative; margin-bottom: var(--space-md);">
            <input type="text" class="form-input" id="menu-search" placeholder="Search dishes..." style="border-radius: var(--radius-lg); padding-right: 45px; height: 50px; font-size: 16px; border: 2px solid var(--border-color); background: white;" />
            <button id="clear-search" class="search-clear-btn hidden" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: #eee; border: none; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #666; font-size: 14px; font-weight: bold; transition: all 0.2s;">✕</button>
          </div>
          
          <div class="menu-filters-premium" style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div class="filter-label" style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Sort By:</div>
            <select id="sort-select" class="form-input" style="width: auto; height: 38px; padding: 0 32px 0 12px; font-size: 13px; font-weight: 600; border-radius: 10px; border: 1.5px solid var(--border-color); cursor: pointer; background-position: right 8px center;">
              <option value="default">Default (Recommended)</option>
              <option value="a-z">A to Z</option>
              <option value="z-a">Z to A</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div class="menu-categories" id="category-chips">
          <button class="chip active" data-cat="all">All Categories</button>
          ${categories.map(c => `
            <button class="chip" data-cat="${c.id}">${c.name}</button>
          `).join('')}
        </div>

        <div class="menu-grid" id="menu-grid">
          <!-- Items will be injected here -->
        </div>
      </main>

      <!-- Desktop Cart Preview -->
      <aside class="menu-cart-preview" id="desktop-cart-preview">
        <!-- Rendered by JS -->
      </aside>
    </div>
  `;

  let activeCategory = 'all';
  let searchQuery = '';

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
    return `<button class="btn-add" onclick="menuAddItem('${itemId}')">+</button>`;
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

  function renderMenuItems() {
    const grid = document.getElementById('menu-grid');
    const clearBtn = document.getElementById('clear-search');
    if (!grid) return;

    // Get fresh items from store (in case they just loaded)
    const currentMenuItems = Store.get('menuItems').filter(m => m.active);
    let items = [...currentMenuItems];

    // 1. Filter by Category
    if (activeCategory !== 'all') {
      items = items.filter(m => m.category === activeCategory);
    }

    // 2. Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (q.length === 1) {
        items = items.filter(m => m.name.toLowerCase().startsWith(q));
      } else if (q.length < 3) {
        items = items.filter(m => m.name.toLowerCase().includes(q));
      } else {
        items = items.filter(m =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      if (clearBtn) clearBtn.classList.remove('hidden');
    } else {
      if (clearBtn) clearBtn.classList.add('hidden');
    }

    // 3. Sort
    if (activeSort === 'a-z') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activeSort === 'z-a') {
      items.sort((a, b) => b.name.localeCompare(a.name));
    } else if (activeSort === 'price-low') {
      items.sort((a, b) => a.price - b.price);
    } else if (activeSort === 'price-high') {
      items.sort((a, b) => b.price - a.price);
    }

    const currentSession = Store.getCurrentSession();
    renderDesktopCart();

    if (items.length === 0) {
      if (!Store._dbLoaded) {
        // Show Skeleton Loader while waiting for DB
        grid.innerHTML = Array(6).fill().map(() => `
          <div class="menu-card skeleton" style="height: 140px; display: flex; flex-direction: row; gap: 10px; padding: 10px;">
            <div class="skeleton" style="width: 100px; height: 100px; border-radius: 8px;"></div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 10px 0;">
              <div class="skeleton" style="height: 20px; width: 70%; border-radius: 4px;"></div>
              <div class="skeleton" style="height: 15px; width: 50%; border-radius: 4px;"></div>
              <div class="skeleton" style="height: 20px; width: 30%; border-radius: 4px; margin-top: auto;"></div>
            </div>
          </div>
        `).join('');
      } else {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-state-icon">🍽️</div>
            <h3>No results for "${Utils.escapeHtml(searchQuery || activeCategory)}"</h3>
            <p>Try a different keyword or check your spelling.</p>
            <button class="btn btn-secondary btn-sm" style="margin-top:16px;" onclick="resetMenuFilters()">Clear All Filters</button>
          </div>
        `;
      }
      return;
    }

    grid.innerHTML = items.map(item => {
      const cartItem = currentSession.cart.find(c => c.itemId === item.id);
      const qty = cartItem ? cartItem.quantity : 0;

      // Use the actual item image stored in DB
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

  renderMenuItems();

  // 1. Subscribe to Store updates
  const unsubscribeMenu = Store.subscribe('menuItems', () => renderMenuItems());
  const unsubscribeCategories = Store.subscribe('categories', () => {
    // If categories load after initial render, we might need to refresh the category chips too
    // but for now let's just focus on the items
    renderMenuItems();
  });

  // 2. Category clicks
  document.getElementById('category-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    renderMenuItems();
  });

  // 3. Sort Select
  const sortSelect = document.getElementById('sort-select');
  sortSelect.addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderMenuItems();
  });

  // 4. Search Input
  const searchInput = document.getElementById('menu-search');
  searchInput.addEventListener('input',
    Utils.debounce((e) => {
      searchQuery = e.target.value.trim();
      renderMenuItems();
    }, 250)
  );

  // 5. Clear Search
  const clearSearchBtn = document.getElementById('clear-search');
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    renderMenuItems();
    searchInput.focus();
  });

  // 6. Global Reset Helper
  window.resetMenuFilters = () => {
    searchInput.value = '';
    searchQuery = '';
    activeCategory = 'all';
    activeSort = 'default';
    sortSelect.value = 'default';
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#category-chips .chip[data-cat="all"]').classList.add('active');
    renderMenuItems();
  };

  // Cart button
  document.getElementById('go-cart').addEventListener('click', () => Router.navigate('/cart'));

  // Expose for smooth updates
  window._menuRenderItems = renderMenuItems;
}

// Global functions for menu item buttons
function menuAddItem(itemId) {
  const item = Store.get('menuItems').find(m => m.id === itemId);
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
    const cartCount = session.cart.length;
    cartCountEl.textContent = cartCount || '';
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
        actionContainer.innerHTML = `<button class="btn-add" onclick="menuAddItem('${changedItemId}')">+</button>`;
      }
    }
  }

  if (window._menuRenderItems) {
    window._menuRenderItems();
  }
}
