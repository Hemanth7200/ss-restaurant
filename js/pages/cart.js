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
              const defaultItem = DEFAULT_MENU_ITEMS.find(d => d.id === item.itemId || d.name === item.name);
              const itemImage = (defaultItem && (defaultItem.image.startsWith('http') || defaultItem.image.startsWith('assets'))) ? defaultItem.image : item.image;
              const isUrl = itemImage && (itemImage.startsWith('http') || itemImage.startsWith('/') || itemImage.startsWith('assets'));
              const gradient = Utils.getFoodGradient(item.image);
              return `
                <div class="cart-item">
                  <div class="cart-item-img ${isUrl ? 'has-photo' : ''}" style="${isUrl ? '' : `background: ${gradient}; display: flex; align-items: center; justify-content: center; font-size: 24px;`}">
                    ${isUrl ? `<img src="${itemImage}" alt="${Utils.escapeHtml(item.name)}" />` : itemImage}
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

        ${cart.length > 0 || prevOrders.length > 0 ? `
          <div class="bill-summary">
            <h4>${prevOrders.length > 0 ? 'Running Bill Summary' : 'Bill Summary'}</h4>
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
          </div>
        ` : ''}
      `}
    </div>

    ${cart.length > 0 ? `
      <div class="sticky-bottom">
        <button class="btn btn-primary" id="proceed-order">
          Proceed to Place Order • ${Utils.formatPrice(totals.total)}
        </button>
      </div>
    ` : prevOrders.length > 0 ? `
      <div class="sticky-bottom">
        <button class="btn btn-primary" id="view-bill-pay" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
          View Bill & Pay
        </button>
      </div>
    ` : ''}
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
