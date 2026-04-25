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

      <div class="menu-search">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" class="form-input" id="menu-search" placeholder="Search dishes..." />
        </div>
      </div>

      <div class="menu-categories" id="category-chips">
        <button class="chip active" data-cat="all">All</button>
        ${categories.map(c => `
          <button class="chip" data-cat="${c.id}">${c.name}</button>
        `).join('')}
      </div>

      <div class="menu-grid" id="menu-grid">
        <!-- Rendered by JS -->
      </div>
    </div>
  `;

  let activeCategory = 'all';
  let searchQuery = '';

  function renderMenuItems() {
    const grid = document.getElementById('menu-grid');
    let items = menuItems;

    if (activeCategory !== 'all') {
      items = items.filter(m => m.category === activeCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
      );
    }

    const currentSession = Store.getCurrentSession();

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
            <h3>No dishes found</h3>
            <p>Try a different search or category</p>
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
              ${qty > 0 ? `
                <div class="qty-stepper">
                  <button onclick="menuUpdateQty('${item.id}', ${qty - 1})">−</button>
                  <span class="qty-value">${qty}</span>
                  <button onclick="menuUpdateQty('${item.id}', ${qty + 1})">+</button>
                </div>
              ` : `
                <button class="btn-add" onclick="menuAddItem('${item.id}')">+ Add</button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderMenuItems();

  // Category chip clicks
  document.getElementById('category-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#category-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    renderMenuItems();
  });

  // Search
  document.getElementById('menu-search').addEventListener('input',
    Utils.debounce((e) => {
      searchQuery = e.target.value.trim();
      renderMenuItems();
    }, 250)
  );

  // Cart button
  document.getElementById('go-cart').addEventListener('click', () => Router.navigate('/cart'));

  // Expose render function for smooth updates
  window._menuRenderItems = renderMenuItems;
}

// Global functions for menu item buttons
function menuAddItem(itemId) {
  const item = Store.get('menuItems').find(m => m.id === itemId);
  if (item) {
    Store.addToCart(item);
    updateMenuDOM();
  }
}

function menuUpdateQty(itemId, qty) {
  Store.updateCartQty(itemId, qty);
  updateMenuDOM();
}

function updateMenuDOM() {
  const session = Store.getCurrentSession();
  if (!session) return;
  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) {
    const cartCount = session.cart.length;
    cartCountEl.textContent = cartCount || '';
  }
  if (window._menuRenderItems) {
    window._menuRenderItems();
  }
}

