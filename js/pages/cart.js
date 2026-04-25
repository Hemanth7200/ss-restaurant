/* ============================================
   SS Restaurant — Cart Page
   ============================================ */

function renderCart() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }

  Store.updateSession({ currentStep: 'cart' });

  const tableNum = Utils.getTableNumber(session.tableId);
  const cart = session.cart;
  const totals = Store.getCartTotal();

  // Get previously ordered items
  const prevOrders = session.orders.map(orderId => Store.get('orders').find(o => o.id === orderId)).filter(Boolean);

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
          <a href="#/menu" class="nav-item">
            <span>🏠</span> Menu
          </a>
          <a href="#/cart" class="nav-item active">
            <span>🛒</span> Your Cart
          </a>
          <a href="#/info" class="nav-item">
            <span>ℹ️</span> Table Info
          </a>
          <a href="#/call" class="nav-item">
            <span>📞</span> Call Waiter
          </a>
        </nav>

        <div class="slogan-card">
          <div class="slogan-text">Good food<br>Good mood ♡</div>
          <img src="assets/leaf-decor.png" class="leaf-decor" alt="" onerror="this.style.display='none'" />
        </div>
      </aside>

      <!-- Main Content -->
      <main class="menu-main">
        <header class="customer-header">
          <div class="customer-header-left">
            <button class="cart-back-btn" id="cart-back">←</button>
            <div>
              <div class="customer-header-title">Your Cart</div>
              <div class="customer-header-table">Table ${tableNum}</div>
            </div>
          </div>
        </header>

        <div class="cart-page">
      ${cart.length === 0 && prevOrders.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse our menu and add some delicious dishes!</p>
          <button class="btn btn-primary" style="margin-top: var(--space-lg);" onclick="Router.navigate('/menu')">Browse Menu</button>
        </div>
      ` : `
        ${cart.length > 0 ? `
          <div class="cart-items">
            ${cart.map(item => {
              const menuItem = Store.get('menuItems').find(m => m.id === item.itemId);
              const fallbackItem = DEFAULT_MENU_ITEMS.find(d => d.id === item.itemId || d.name === item.name);
              const itemImage = (menuItem && menuItem.image) || item.image || (fallbackItem ? fallbackItem.image : '');
              const isUrl = itemImage && (
                itemImage.startsWith('http') ||
                itemImage.startsWith('/') ||
                itemImage.startsWith('assets') ||
                itemImage.startsWith('data:image')
              );
              const gradient = Utils.getFoodGradient(itemImage);
              return `
                <div class="cart-item">
                  <div class="cart-item-img ${isUrl ? 'has-photo' : ''}" style="${isUrl ? '' : `background: ${gradient}; display: flex; align-items: center; justify-content: center; font-size: 24px;`}">
                    ${isUrl ? `<img src="${itemImage}" alt="${Utils.escapeHtml(item.name)}" loading="lazy" onerror="this.onerror=null; this.src='assets/logo.png'; this.style.objectFit='contain';" />` : itemImage}
                  </div>
                  <div class="cart-item-info">
                    <div class="cart-item-name">${Utils.escapeHtml(item.name)}</div>
                    <div class="cart-item-price">${Utils.formatPrice(item.price)}</div>
                  </div>
                  <div class="qty-stepper">
                    <button onclick="cartUpdateQty('${item.itemId}', ${item.quantity - 1})">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button onclick="cartUpdateQty('${item.itemId}', ${item.quantity + 1})">+</button>
                  </div>
                  <button class="cart-item-remove" onclick="cartRemoveItem('${item.itemId}')" title="Remove">🗑️</button>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${prevOrders.length > 0 ? `
          <div class="prev-orders-section">
            <h4>Previously Ordered</h4>
            ${prevOrders.map(order => `
              <div style="margin-bottom: var(--space-md); padding: var(--space-md); background: var(--bg-input); border-radius: var(--radius-md);">
                <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-sm);">Order #${order.id} • ${Utils.formatTime(order.createdAt)}</div>
                ${order.items.map(item => `
                  <div class="prev-order-item">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>${Utils.formatPrice(item.price * item.quantity)}</span>
                  </div>
                `).join('')}
                <div style="text-align: right; font-weight: 600; padding-top: var(--space-sm); font-size: var(--font-size-sm);">
                  ${Utils.formatPrice(order.total)}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${cart.length > 0 ? `
          <div class="bill-summary">
            <h4>Bill Summary</h4>
            <div class="bill-row">
              <span>Subtotal</span>
              <span>${Utils.formatPrice(totals.subtotal)}</span>
            </div>
            <div class="bill-row">
              <span>GST (5%)</span>
              <span>${Utils.formatPrice(totals.gst)}</span>
            </div>
            <div class="bill-row total">
              <span>Grand Total</span>
              <span>${Utils.formatPrice(totals.total)}</span>
            </div>
            <button class="btn btn-primary btn-full" style="margin-top: var(--space-xl);" id="proceed-order">
              Proceed to Place Order • ${Utils.formatPrice(totals.total)}
            </button>
          </div>
        ` : prevOrders.length > 0 ? `
          <div class="bill-summary">
            <h4>Running Bill Summary</h4>
            <div class="bill-row">
              <span>Subtotal</span>
              <span>${Utils.formatPrice(Store.getSessionTotal().subtotal)}</span>
            </div>
            <div class="bill-row">
              <span>GST (5%)</span>
              <span>${Utils.formatPrice(Store.getSessionTotal().gst)}</span>
            </div>
            <div class="bill-row total">
              <span>Grand Total</span>
              <span>${Utils.formatPrice(Store.getSessionTotal().total)}</span>
            </div>
            <button class="btn btn-primary btn-full" style="margin-top: var(--space-xl);" id="view-bill-pay">
              View Bill & Pay
            </button>
          </div>
        ` : ''}
      `}
      </div>
      </main>
    </div>
  `;

  // Events
  document.getElementById('cart-back').addEventListener('click', () => Router.navigate('/menu'));

  const proceedBtn = document.getElementById('proceed-order');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => Router.navigate('/details'));
  }

  const billPayBtn = document.getElementById('view-bill-pay');
  if (billPayBtn) {
    billPayBtn.addEventListener('click', () => Router.navigate('/payment'));
  }
}

function cartUpdateQty(itemId, qty) {
  Store.updateCartQty(itemId, qty);
  renderCart();
}

function cartRemoveItem(itemId) {
  Store.removeFromCart(itemId);
  renderCart();
  Toast.info('Item removed from cart');
}
