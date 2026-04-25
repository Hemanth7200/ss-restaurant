/* ============================================
   SS Restaurant — Admin Payments (Cash Only)
   ============================================ */

function renderAdminPayments() {
  let filterDate = ''; // YYYY-MM-DD

  renderAdminLayout('Pending Payments', (container) => {

    async function render() {
      // Fetch all sessions from DB to get the latest status across all devices
      let dbSessions = [];
      if (DB_ENABLED) {
         dbSessions = await DB.getSessions() || [];
      } else {
         dbSessions = Store.get('sessions') || []; // Fallback
      }

      let html = `
        <div style="margin-bottom: var(--space-xl); display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: var(--space-md);">
          <div>
            <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
              Confirm or reject payments from customers. Both Cash and UPI payments require your confirmation.
            </p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Filter by Date</label>
            <input type="date" id="payments-date-filter" class="form-input" value="${filterDate}" style="width: auto; padding: 6px 12px;">
          </div>
        </div>
      `;

      // Find sessions that have a paymentMethod selected but are not yet 'paid'
      let pendingSessions = dbSessions.filter(s => s.paymentMethod && s.status !== 'paid' && s.status !== 'closed');
      
      const allOrders = Store.get('orders') || [];
      let filteredHistory = allOrders.slice();
      
      if (filterDate) {
        pendingSessions = pendingSessions.filter(s => s.startedAt && s.startedAt.startsWith(filterDate));
        filteredHistory = filteredHistory.filter(o => o.createdAt && o.createdAt.startsWith(filterDate));
      }
      
      filteredHistory = filteredHistory.reverse(); // Newest first after filtering

      if (pendingSessions.length === 0) {
        html += `
          <div class="empty-state">
            <div class="empty-state-icon">💵</div>
            <h3>No Pending Payments</h3>
            <p>When a customer selects a payment method, it will appear here for confirmation.</p>
          </div>
        `;
      } else {
        html += `<div style="display: flex; flex-direction: column; gap: var(--space-lg);">`;
        for (const session of pendingSessions) {
          const tableNum = Utils.getTableNumber(session.tableId);
          // Find orders for this session
          const sessionOrders = allOrders.filter(o => o.sessionId === session.id);
          const sessionTotal = sessionOrders.reduce((sum, o) => sum + o.total, 0);

          const isCash = session.paymentMethod === 'cash';
          const methodColor = isCash ? '#16a34a' : '#7c3aed';
          const methodLabel = isCash ? 'Cash Payment' : 'UPI Payment';
          const methodIcon = isCash 
            ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${methodColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>`
            : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${methodColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/><path d="M9 8l3-2 3 2"/><path d="M9 12l3 2 3-2"/></svg>`;

          html += `
            <div class="order-card" style="max-width: 600px;">
              <div class="order-card-header">
                <div>
                  <span style="font-weight: 700; font-size: var(--font-size-lg);">Table ${tableNum}</span>
                  <span class="badge badge-warning" style="margin-left: 10px;">Pending ${isCash ? 'Cash' : 'UPI'}</span>
                </div>
                <span class="order-card-time">${Utils.formatTime(session.startedAt)}</span>
              </div>

              <div class="order-card-body">
                <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md); padding: var(--space-md); background: var(--bg-input); border-radius: var(--radius-md);">
                  ${methodIcon}
                  <div>
                    <div style="font-weight: 600;">${methodLabel}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-muted);">${isCash ? 'Customer is waiting to pay cash' : 'Customer is completing UPI payment'}</div>
                  </div>
                </div>

                <div style="margin-bottom: var(--space-md);">
                  <h4 style="margin-bottom: var(--space-sm); font-size: var(--font-size-sm); color: var(--text-muted);">Order Summary</h4>
                  ${sessionOrders.map(order => order.items.map(item => `
                    <div class="order-item-row">
                      <span class="order-item-name">
                        <span class="veg-indicator ${item.isVeg ? '' : 'nonveg'}" style="width:12px;height:12px;display:inline-flex;vertical-align:middle;margin-right:4px;"></span>
                        ${Utils.escapeHtml(item.name)}
                      </span>
                      <span class="order-item-qty">×${item.quantity} — ${Utils.formatPrice(item.price * item.quantity)}</span>
                    </div>
                  `).join('')).join('')}
                </div>
              </div>

              <div class="order-card-footer" style="flex-direction: column; align-items: stretch; gap: var(--space-md);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: var(--font-size-sm); color: var(--text-muted);">Total Amount</span>
                  <span class="order-total" style="font-size: var(--font-size-xl);">${Utils.formatPrice(sessionTotal)}</span>
                </div>

                <div style="display: flex; gap: var(--space-md);">
                  <button class="btn btn-danger reject-btn" style="flex: 1;" data-id="${session.id}">
                    ✕ Reject
                  </button>
                  <button class="btn btn-success confirm-btn" style="flex: 2;" data-id="${session.id}">
                    ✓ Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          `;
        }
        html += `</div>`;
      }
        
      // Append Payment History Section
      html += `
        <div class="data-table-wrapper" style="margin-top: var(--space-3xl);">
          <div class="data-table-header">
            <h3 style="font-size: var(--font-size-base);">Payment History</h3>
          </div>
          ${allOrders.length === 0 ? `
            <div class="empty-state" style="padding: var(--space-3xl);">
              <div class="empty-state-icon">💳</div>
              <h3>No history yet</h3>
              <p>Completed payments will appear here.</p>
            </div>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th>Order ID</th>
                  <th>Table</th>
                  <th>Customer Name</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                ${filteredHistory.slice(0, 50).map(o => `
                  <tr>
                    <td><strong>${Utils.escapeHtml(o.customerPhone || 'N/A')}</strong></td>
                    <td>#${o.id}</td>
                    <td>Table ${Utils.getTableNumber(o.tableId)}</td>
                    <td>${Utils.escapeHtml(o.customerName)}</td>
                    <td><strong>${Utils.formatPrice(o.total)}</strong></td>
                    <td><span class="badge ${Utils.getStatusBadgeClass(o.status)}">${Utils.getStatusLabel(o.status)}</span></td>
                    <td>${Utils.formatDate(o.createdAt)}</td>
                    <td>${Utils.formatTime(o.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      `;
      
      container.innerHTML = html;

      // Bind buttons
      container.querySelectorAll('.confirm-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sessionId = btn.dataset.id;
          Store.confirmPayment(sessionId);
          Toast.success('Payment confirmed! Customer has been notified.');
          render();
        });
      });

      container.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sessionId = btn.dataset.id;
          Store.rejectPayment(sessionId);
          Toast.error('Payment rejected. Customer has been notified.');
          render();
        });
      });

      // Bind filter
      const filterInput = container.querySelector('#payments-date-filter');
      if (filterInput) {
        filterInput.addEventListener('change', (e) => {
          filterDate = e.target.value;
          render();
        });
      }
    }

    render();

    // Auto-refresh every 5 seconds to pick up new payments
    const refreshInterval = setInterval(() => {
      if (document.getElementById('admin-page-content')) {
        render();
      } else {
        clearInterval(refreshInterval);
      }
    }, 5000);
  });
}
