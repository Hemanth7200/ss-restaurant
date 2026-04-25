/* ============================================
   SS Restaurant — Admin Live Orders
   ============================================ */

function renderAdminOrders() {
  renderAdminLayout('Live Orders', (container) => {
    let filterStatus = 'all';

    function render() {
      let orders = Store.get('orders').slice().reverse();
      if (filterStatus !== 'all') {
        orders = orders.filter(o => o.status === filterStatus);
      }

      container.innerHTML = `
        <div class="filter-tabs" id="order-filters">
          ${['all', 'new', 'preparing', 'completed', 'cancelled'].map(s => `
            <button class="filter-tab ${filterStatus === s ? 'active' : ''}" data-status="${s}">
              ${s === 'all' ? 'All' : Utils.getStatusLabel(s)}
              ${s !== 'all' ? `<span style="margin-left:4px;font-size:11px;">(${Store.get('orders').filter(o => o.status === s).length})</span>` : ''}
            </button>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-lg); align-items: center;">
          <div class="search-bar" style="max-width: 300px;">
            <span class="search-icon">🔍</span>
            <input type="text" class="form-input" id="order-search" placeholder="Search by order ID or table..." />
          </div>
          <button class="btn btn-secondary" id="refresh-orders-btn">🔄 Refresh Orders</button>
        </div>

        ${orders.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3>No ${filterStatus === 'all' ? '' : filterStatus} orders</h3>
            <p>Orders will appear here when customers place them</p>
          </div>
        ` : `
          <div class="orders-grid">
            ${orders.map(order => {
              // Find session for this order to check payment status
              const session = Store.getCurrentSession();
              const isSessionOrder = session && session.orders && session.orders.includes(order.id);
              const paymentMethod = isSessionOrder ? session.paymentMethod : null;
              const paymentStatus = isSessionOrder ? session.paymentStatus : null;
              const isPaid = isSessionOrder ? session.paid : false;

              let paymentBadge = '';
              if (paymentMethod) {
                if (isPaid || paymentStatus === 'confirmed') {
                  paymentBadge = `<span class="badge badge-success" style="margin-left:6px;">Paid (${paymentMethod === 'upi' ? 'UPI' : 'Cash'})</span>`;
                } else {
                  paymentBadge = `<span class="badge badge-warning" style="margin-left:6px;">Pending Payment</span>`;
                }
              }

              let paymentAction = '';
              if (isSessionOrder && paymentMethod === 'cash' && !isPaid && paymentStatus !== 'confirmed') {
                 paymentAction = `<button class="btn btn-sm btn-success" onclick="adminConfirmPayment('${session.id}')">💵 Mark Cash Received</button>`;
              }

              return `
              <div class="order-card">
                <div class="order-card-header">
                  <div>
                    <span class="order-card-id">#${order.id}</span>
                    <span class="badge ${Utils.getStatusBadgeClass(order.status)}" style="margin-left: 8px;">${Utils.getStatusLabel(order.status)}</span>
                    ${paymentBadge}
                  </div>
                  <span class="order-card-time">${Utils.formatTime(order.createdAt)}</span>
                </div>
                <div class="order-card-body">
                  <div class="order-card-customer">
                    <span>👤 ${Utils.escapeHtml(order.customerName)}</span>
                    <span>📍 Table ${Utils.getTableNumber(order.tableId)}</span>
                  </div>
                  <div class="order-items-list">
                    ${order.items.map(item => `
                      <div class="order-item-row">
                        <span class="order-item-name">
                          <span class="veg-indicator ${item.isVeg ? '' : 'nonveg'}" style="width:12px;height:12px;display:inline-flex;vertical-align:middle;margin-right:4px;"></span>
                          ${Utils.escapeHtml(item.name)}
                        </span>
                        <span class="order-item-qty">×${item.quantity} — ${Utils.formatPrice(item.price * item.quantity)}</span>
                      </div>
                    `).join('')}
                  </div>
                  ${order.specialInstructions ? `
                    <div class="order-notes">📝 ${Utils.escapeHtml(order.specialInstructions)}</div>
                  ` : ''}
                </div>
                <div class="order-card-footer">
                  <span class="order-total">${Utils.formatPrice(order.total)}</span>
                  <div class="order-actions">
                    ${paymentAction}
                    ${order.status === 'new' ? `
                      <button class="btn btn-sm btn-danger" onclick="adminUpdateOrder(${order.id}, 'cancelled')">Cancel</button>
                      <button class="btn btn-sm" style="background:var(--color-warning);color:#fff;" onclick="adminUpdateOrder(${order.id}, 'preparing')">Preparing</button>
                    ` : ''}
                    ${order.status === 'preparing' ? `
                      <button class="btn btn-sm btn-success" onclick="adminUpdateOrder(${order.id}, 'completed')">Completed</button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `}).join('')}
          </div>
        `}
      `;

      // Filter clicks
      container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          filterStatus = tab.dataset.status;
          render();
        });
      });

      const refreshBtn = document.getElementById('refresh-orders-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
          refreshBtn.innerHTML = '🔄 ...';
          if (DB_ENABLED) {
            await Promise.all([DB.getOrders(), DB.getSessions()]);
          }
          render();
        });
      }

      // Search
      const searchInput = document.getElementById('order-search');
      if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce((e) => {
          const q = e.target.value.trim().toLowerCase();
          if (!q) { render(); return; }
          const filteredOrders = Store.get('orders').filter(o =>
            String(o.id).includes(q) ||
            String(Utils.getTableNumber(o.tableId)).includes(q) ||
            o.customerName.toLowerCase().includes(q)
          ).reverse();
          // Re-render with filtered
          const grid = container.querySelector('.orders-grid');
          if (grid && filteredOrders.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🔍</div><h3>No matching orders</h3></div>';
          }
        }, 300));
      }
    }

    render();

    // Auto-refresh every 5 seconds to pick up new orders from DB
    const refreshInterval = setInterval(async () => {
      if (document.getElementById('admin-page-content')) {
        const searchInput = document.getElementById('order-search');
        // Only refresh if not actively searching/typing
        if (searchInput && document.activeElement !== searchInput && filterStatus === 'all') {
           if (DB_ENABLED) {
             await Promise.all([DB.getOrders(), DB.getSessions()]);
           }
           render();
        }
      } else {
        clearInterval(refreshInterval);
      }
    }, 5000);
  });
}

function adminUpdateOrder(orderId, status) {
  Store.updateOrderStatus(orderId, status);
  Toast.success(`Order #${orderId} marked as ${status}`);
  renderAdminOrders();
}

function adminConfirmPayment(sessionId) {
  Store.confirmPayment(sessionId);
  Toast.success('Payment confirmed! Customer has been notified.');
  renderAdminOrders();
}
