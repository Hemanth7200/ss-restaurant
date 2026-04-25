/* ============================================
   SS Restaurant — Admin Live Orders
   ============================================ */

function renderAdminOrders() {
  renderAdminLayout('Live Orders', (container) => {
    let filterStatus = 'all';
    let searchQuery = '';
    let lastRenderSignature = '';

    // Build the skeleton ONCE
    container.innerHTML = `
      <div class="filter-tabs" id="order-filters">
        <!-- Rendered by updateGrid -->
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-lg); align-items: center;">
        <div class="search-bar" style="max-width: 300px;">
          <span class="search-icon">🔍</span>
          <input type="text" class="form-input" id="order-search" placeholder="Search by order ID or table..." />
        </div>
        <button class="btn btn-secondary" id="refresh-orders-btn">🔄 Refresh Orders</button>
      </div>

      <div id="orders-content">
        <!-- Grid goes here -->
      </div>
    `;

    // Bind search
    const searchInput = document.getElementById('order-search');
    searchInput.addEventListener('input', Utils.debounce((e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      updateGrid();
    }, 300));

    async function syncOrdersAndSessions() {
      if (!DB_ENABLED) return;
      const [ordersFromDb, sessionsFromDb] = await Promise.all([DB.getOrders(), DB.getSessions()]);
      if (ordersFromDb) {
        Store.set('orders', ordersFromDb);
      }
      if (sessionsFromDb) {
        Store.set('sessions', sessionsFromDb);
      }
    }

    function getRenderSignature(orders) {
      const paymentSignature = (Store.get('sessions') || [])
        .map(s => `${s.id}:${s.status || ''}:${s.paymentMethod || ''}`)
        .join('|');
      const orderSignature = orders
        .map(o => `${o.id}:${o.status}:${o.total}:${o.createdAt}`)
        .join('|');

      return `${filterStatus}::${searchQuery}::${orderSignature}::${paymentSignature}`;
    }

    // Bind refresh
    const refreshBtn = document.getElementById('refresh-orders-btn');
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.innerHTML = '🔄 ...';
      await syncOrdersAndSessions();
      updateGrid(true);
      refreshBtn.innerHTML = '🔄 Refresh Orders';
    });

    let lastSeenOrderId = Store.get('orders').length > 0 ? Math.max(...Store.get('orders').map(o=>o.id)) : 0;

    function updateGrid(force = false) {
      // 1. Check for new orders to play sound
      const maxId = Store.get('orders').length > 0 ? Math.max(...Store.get('orders').map(o=>o.id)) : 0;
      if (maxId > lastSeenOrderId) {
        lastSeenOrderId = maxId;
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.error("Audio play failed:", e));
      }

      // 2. Render Filters
      const filtersEl = document.getElementById('order-filters');
      if (filtersEl) {
        filtersEl.innerHTML = ['all', 'new', 'preparing', 'delivered', 'cancelled'].map(s => `
          <button class="filter-tab ${filterStatus === s ? 'active' : ''}" data-status="${s}">
            ${s === 'all' ? 'All' : Utils.getStatusLabel(s)}
            ${s !== 'all' ? `<span style="margin-left:4px;font-size:11px;">(${Store.get('orders').filter(o => o.status === s).length})</span>` : ''}
          </button>
        `).join('');
        
        // Re-bind filter clicks
        filtersEl.querySelectorAll('.filter-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            filterStatus = tab.dataset.status;
            updateGrid();
          });
        });
      }

      // 3. Filter and Search Orders
      let orders = Store.get('orders').slice().reverse();
      if (filterStatus !== 'all') {
        orders = orders.filter(o => o.status === filterStatus);
      }
      if (searchQuery) {
        orders = orders.filter(o =>
          String(o.id).includes(searchQuery) ||
          String(Utils.getTableNumber(o.tableId)).includes(searchQuery) ||
          o.customerName.toLowerCase().includes(searchQuery)
        );
      }

      const newSignature = getRenderSignature(orders);
      if (!force && newSignature === lastRenderSignature) {
        return;
      }
      lastRenderSignature = newSignature;

      // 4. Render Grid
      const contentEl = document.getElementById('orders-content');
      if (!contentEl) return;

      if (orders.length === 0) {
        if (searchQuery) {
          contentEl.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🔍</div><h3>No matching orders</h3></div>';
        } else {
          contentEl.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <h3>No ${filterStatus === 'all' ? '' : filterStatus} orders</h3>
              <p>Orders will appear here when customers place them</p>
            </div>
          `;
        }
      } else {
        contentEl.innerHTML = `
          <div class="orders-grid">
            ${orders.map(order => {
              // Find session for this order to check payment status
              const sessions = Store.get('sessions') || [];
              const session = sessions.find(s => s.id === order.sessionId);
              const paymentMethod = session ? session.paymentMethod : null;
              const isPaid = session ? session.status === 'paid' || session.status === 'closed' : false;

              let paymentBadge = '';
              if (paymentMethod) {
                if (isPaid) {
                  paymentBadge = `<span class="badge badge-success" style="margin-left:6px;">Paid (${paymentMethod === 'upi' ? 'UPI' : 'Cash'})</span>`;
                } else {
                  paymentBadge = `<span class="badge badge-warning" style="margin-left:6px;">Pending Payment</span>`;
                }
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
                    <span style="display:flex; flex-direction:column; gap:4px;">
                      <span>👤 ${Utils.escapeHtml(order.customerName)}</span>
                      <span style="font-size:0.85em; color:var(--text-muted);">📞 ${Utils.escapeHtml(order.customerPhone || 'N/A')}</span>
                    </span>
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
                    ${order.status === 'new' ? `
                      <button class="btn btn-sm btn-danger" onclick="adminUpdateOrder(${order.id}, 'cancelled')">Cancel</button>
                      <button class="btn btn-sm" style="background:var(--color-warning);color:#fff;" onclick="adminUpdateOrder(${order.id}, 'preparing')">Preparing</button>
                    ` : ''}
                    ${order.status === 'preparing' ? `
                      <button class="btn btn-sm btn-success" onclick="adminUpdateOrder(${order.id}, 'delivered')">Delivered</button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `}).join('')}
          </div>
        `;
      }
    }

    // Expose for external calls from buttons
    window._updateOrdersGrid = updateGrid;
    updateGrid();

    // Keep data fresh without forcing disruptive re-renders.
    const refreshInterval = setInterval(async () => {
      if (document.getElementById('admin-page-content')) {
         await syncOrdersAndSessions();
         updateGrid();
      } else {
        clearInterval(refreshInterval);
      }
    }, 5000);
  });
}

function adminUpdateOrder(orderId, status) {
  Store.updateOrderStatus(orderId, status);
  Toast.success(`Order #${orderId} marked as ${status}`);
  
  // Directly update local state
  Store.update('orders', orders => orders.map(o => o.id === orderId ? { ...o, status } : o));
  
  // Update UI seamlessly
  if (window._updateOrdersGrid) {
    window._updateOrdersGrid();
  }
}
