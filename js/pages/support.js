/* ============================================
   SS Restaurant — Customer Support Pages
   ============================================ */

function getCustomerSidebar(tableNum) {
  return `
    <aside class="menu-sidebar">
      <div class="customer-header-left" style="margin-bottom: var(--space-xl);">
        <img src="assets/logo.png" alt="Logo" class="customer-header-logo" style="width: 48px; height: 48px;" />
        <div>
          <div class="customer-header-title">SS Restaurant</div>
          <div class="customer-header-table">Table ${tableNum}</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <a href="#/menu" class="nav-item"><span>🏠</span> Menu</a>
        <a href="#/cart" class="nav-item"><span>🛒</span> Your Cart</a>
        <a href="#/track" class="nav-item"><span>📋</span> Track Order</a>
        <a href="#/info" class="nav-item"><span>ℹ️</span> Table Info</a>
        <a href="#/call" class="nav-item"><span>📞</span> Call Waiter</a>
      </nav>
      <div class="slogan-card">
        <div class="slogan-text">Good food<br>Good mood ♡</div>
        <img src="assets/leaf-decor.png" class="leaf-decor" alt="" onerror="this.style.display='none'" />
      </div>
    </aside>
  `;
}

function getOrderStatusLabel(status) {
  if (status === 'new') return 'Order Accepted';
  if (status === 'preparing') return 'Preparing';
  if (status === 'delivered') return 'Delivered';
  if (status === 'cancelled') return 'Cancelled';
  return status || 'Accepted';
}

function getOrderStatusStep(status) {
  if (status === 'cancelled') return -1;
  if (status === 'new') return 1;
  if (status === 'preparing') return 2;
  if (status === 'delivered') return 3;
  return 1;
}

function renderTrackOrder() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }
  Store.updateSession({ currentStep: 'track' });

  const tableNum = Utils.getTableNumber(session.tableId);
  const sessionOrders = (Store.get('orders') || [])
    .filter(o => String(o.sessionId) === String(session.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  app.innerHTML = `
    <div class="menu-page">
      ${getCustomerSidebar(tableNum)}
      <main class="menu-main">
        <header class="customer-header">
          <div class="customer-header-left">
            <button class="cart-back-btn" id="track-back">←</button>
            <div>
              <div class="customer-header-title">Track Order</div>
              <div class="customer-header-table">Table ${tableNum}</div>
            </div>
          </div>
        </header>

        <div class="details-page" style="max-width: 620px;">
          <h2 style="margin-bottom: var(--space-md);">Live Order Status</h2>
          <p style="color: var(--text-muted); margin-bottom: var(--space-xl);">
            Track each order placed in this session. This page auto-refreshes.
          </p>

          ${sessionOrders.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">🍽️</div>
              <h3>No orders placed yet</h3>
              <p>Place your order from the menu to track status here.</p>
            </div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:var(--space-lg);">
              ${sessionOrders.map(order => {
                const step = getOrderStatusStep(order.status);
                const isCancelled = order.status === 'cancelled';
                return `
                  <div class="order-card" style="max-width:100%;">
                    <div class="order-card-header">
                      <div>
                        <span class="order-card-id">#${order.id}</span>
                        <span class="badge ${Utils.getStatusBadgeClass(order.status)}" style="margin-left:8px;">
                          ${getOrderStatusLabel(order.status)}
                        </span>
                      </div>
                      <span class="order-card-time">${Utils.formatTime(order.createdAt)}</span>
                    </div>
                    <div class="order-card-body">
                      ${isCancelled ? `
                        <div style="padding:var(--space-md);border-radius:var(--radius-md);background:var(--color-error-bg);color:var(--color-error);font-weight:600;">
                          This order was cancelled by restaurant staff.
                        </div>
                      ` : `
                        <div class="track-steps">
                          <div class="track-step ${step >= 1 ? 'done' : ''}">
                            <span>1</span><p>Order Accepted</p>
                          </div>
                          <div class="track-step-line ${step >= 2 ? 'done' : ''}"></div>
                          <div class="track-step ${step >= 2 ? 'done' : ''}">
                            <span>2</span><p>Preparing</p>
                          </div>
                          <div class="track-step-line ${step >= 3 ? 'done' : ''}"></div>
                          <div class="track-step ${step >= 3 ? 'done' : ''}">
                            <span>3</span><p>Delivered</p>
                          </div>
                        </div>
                      `}
                      <div style="margin-top:var(--space-md);color:var(--text-muted);font-size:var(--font-size-sm);">
                        ${order.items.length} items • ${Utils.formatPrice(order.total)}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </main>
    </div>
  `;

  document.getElementById('track-back').addEventListener('click', () => Router.navigate('/menu'));

  if (window._trackRefreshTimer) clearInterval(window._trackRefreshTimer);
  window._trackRefreshTimer = setInterval(async () => {
    if (Router.currentRoute !== '/track') {
      clearInterval(window._trackRefreshTimer);
      window._trackRefreshTimer = null;
      return;
    }
    if (DB_ENABLED) {
      const dbOrders = await DB.getOrders();
      if (dbOrders) Store.set('orders', dbOrders);
    }
    renderTrackOrder();
  }, 5000);
}

function renderTableInfo() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }
  Store.updateSession({ currentStep: 'info' });

  const tableNum = Utils.getTableNumber(session.tableId);
  const orders = (Store.get('orders') || []).filter(o => String(o.sessionId) === String(session.id));
  const subtotal = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const gst = orders.reduce((sum, o) => sum + (o.gst || 0), 0);
  const total = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  app.innerHTML = `
    <div class="menu-page">
      ${getCustomerSidebar(tableNum)}
      <main class="menu-main">
        <header class="customer-header">
          <div class="customer-header-left">
            <button class="cart-back-btn" id="info-back">←</button>
            <div>
              <div class="customer-header-title">Table Information</div>
              <div class="customer-header-table">Table ${tableNum}</div>
            </div>
          </div>
        </header>
        <div class="details-page">
          <h2>Current Session</h2>
          <div class="bill-summary">
            <h4>Bill Snapshot</h4>
            <div class="bill-row"><span>Session ID</span><span>${Utils.escapeHtml(session.id)}</span></div>
            <div class="bill-row"><span>Orders Placed</span><span>${orders.length}</span></div>
            <div class="bill-row"><span>Subtotal</span><span>${Utils.formatPrice(subtotal)}</span></div>
            <div class="bill-row"><span>GST</span><span>${Utils.formatPrice(gst)}</span></div>
            <div class="bill-row total"><span>Grand Total</span><span>${Utils.formatPrice(total)}</span></div>
          </div>
          <div style="display:flex;gap:var(--space-md);margin-top:var(--space-xl);">
            <button class="btn btn-secondary" style="flex:1;" id="info-track-btn">Track Orders</button>
            <button class="btn btn-primary" style="flex:1;" id="info-pay-btn">View Bill & Pay</button>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('info-back').addEventListener('click', () => Router.navigate('/menu'));
  document.getElementById('info-track-btn').addEventListener('click', () => Router.navigate('/track'));
  document.getElementById('info-pay-btn').addEventListener('click', () => Router.navigate('/payment'));
}

function renderCallWaiter() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }
  Store.updateSession({ currentStep: 'call' });

  const tableNum = Utils.getTableNumber(session.tableId);
  const requests = [
    { id: 'water', label: 'Need Water' },
    { id: 'bill', label: 'Need Bill' },
    { id: 'assistance', label: 'Need Assistance' },
    { id: 'cleaning', label: 'Need Table Cleaning' }
  ];

  app.innerHTML = `
    <div class="menu-page">
      ${getCustomerSidebar(tableNum)}
      <main class="menu-main">
        <header class="customer-header">
          <div class="customer-header-left">
            <button class="cart-back-btn" id="call-back">←</button>
            <div>
              <div class="customer-header-title">Call Waiter</div>
              <div class="customer-header-table">Table ${tableNum}</div>
            </div>
          </div>
        </header>
        <div class="details-page">
          <h2>How can we help?</h2>
          <div style="display:grid;gap:var(--space-md);margin-top:var(--space-lg);">
            ${requests.map(r => `
              <button class="btn btn-secondary waiter-req-btn" data-request="${r.id}" style="justify-content:flex-start;padding:14px 16px;">
                ${r.label}
              </button>
            `).join('')}
          </div>
          <div class="form-group" style="margin-top:var(--space-xl);">
            <label class="form-label">Additional Note (optional)</label>
            <textarea id="waiter-note" class="form-input" rows="3" placeholder="Any specific request..."></textarea>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('call-back').addEventListener('click', () => Router.navigate('/menu'));
  document.querySelectorAll('.waiter-req-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const requestType = btn.dataset.request;
      const note = (document.getElementById('waiter-note').value || '').trim();
      const req = {
        id: Utils.generateId('req'),
        sessionId: session.id,
        tableId: session.tableId,
        type: requestType,
        note,
        status: 'new',
        createdAt: new Date().toISOString()
      };
      Store.update('complaints', list => [...list, req]);
      Toast.success('Waiter has been notified.');
    });
  });
}
