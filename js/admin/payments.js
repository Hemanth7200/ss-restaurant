/* ============================================
   SS Restaurant — Admin Payments (Cash Only)
   ============================================ */

function renderAdminPayments() {
  renderAdminLayout('Payments', (container) => {

    function render() {
      const session = Store.getCurrentSession();
      const allOrders = Store.get('orders').slice().reverse();

      // Get orders that belong to the current active session
      let sessionOrders = [];
      if (session && session.orders) {
        sessionOrders = allOrders.filter(o => session.orders.includes(o.id));
      }

      const paymentMethod = session ? session.paymentMethod : null;
      const paymentStatus = session ? session.paymentStatus : null;
      const isPaid = session ? session.paid : false;
      const tableNum = session ? Utils.getTableNumber(session.tableId) : '—';

      // Only show cash payments here — UPI is handled on customer side
      const isCashPayment = paymentMethod === 'cash';

      // Calculate total
      let sessionTotal = 0;
      if (session) {
        const totals = Store.getFullSessionTotal();
        sessionTotal = totals.total;
      }

      // Status badge
      let statusBadge = '';
      let statusClass = '';
      if (!isCashPayment) {
        statusBadge = '';
        statusClass = '';
      } else if (isPaid || paymentStatus === 'confirmed') {
        statusBadge = 'Cash Received';
        statusClass = 'badge-success';
      } else if (paymentStatus === 'failed') {
        statusBadge = 'Payment Rejected';
        statusClass = 'badge-danger';
      } else {
        statusBadge = 'Pending Cash Payment';
        statusClass = 'badge-warning';
      }

      container.innerHTML = `
        <div style="margin-bottom: var(--space-xl);">
          <p style="color: var(--text-muted); font-size: var(--font-size-sm);">
            Confirm or reject <strong>cash payments</strong> from customers. UPI payments are verified automatically.
          </p>
        </div>

        ${!session || !isCashPayment ? `
          <div class="empty-state">
            <div class="empty-state-icon">💵</div>
            <h3>No Pending Cash Payments</h3>
            <p>When a customer selects cash payment, it will appear here for confirmation.</p>
          </div>
        ` : `
          <div class="order-card" style="max-width: 600px;">
            <div class="order-card-header">
              <div>
                <span style="font-weight: 700; font-size: var(--font-size-lg);">Table ${tableNum}</span>
                <span class="badge ${statusClass}" style="margin-left: 10px;">${statusBadge}</span>
              </div>
              <span class="order-card-time">${Utils.formatTime(session.startedAt)}</span>
            </div>

            <div class="order-card-body">
              <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md); padding: var(--space-md); background: var(--bg-input); border-radius: var(--radius-md);">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
                <div>
                  <div style="font-weight: 600;">Cash Payment</div>
                  <div style="font-size: var(--font-size-xs); color: var(--text-muted);">Customer is waiting at the counter</div>
                </div>
              </div>

              <div style="margin-bottom: var(--space-md);">
                <h4 style="margin-bottom: var(--space-sm); font-size: var(--font-size-sm); color: var(--text-muted);">Order Items</h4>
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

              ${isPaid || paymentStatus === 'confirmed' ? `
                <div style="display: flex; align-items: center; justify-content: center; gap: var(--space-sm); padding: var(--space-md); background: #dcfce7; border-radius: var(--radius-md); color: #166534;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 16 7 13"/></svg>
                  <span style="font-weight: 600;">Cash Payment Confirmed</span>
                </div>
              ` : paymentStatus === 'failed' ? `
                <div style="display: flex; align-items: center; justify-content: center; gap: var(--space-sm); padding: var(--space-md); background: #fef2f2; border-radius: var(--radius-md); color: #991b1b;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <span style="font-weight: 600;">Cash Payment Rejected</span>
                </div>
              ` : `
                <div style="display: flex; gap: var(--space-md);">
                  <button class="btn btn-danger" style="flex: 1;" id="reject-payment-btn">
                    ✕ Reject
                  </button>
                  <button class="btn btn-success" style="flex: 2;" id="confirm-payment-btn">
                    💵 Confirm Cash Received
                  </button>
                </div>
              `}
            </div>
          </div>
        `}
        
        <!-- Payment History Section -->
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
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                ${allOrders.slice(0, 20).map(o => `
                  <tr>
                    <td><strong>${Utils.escapeHtml(o.customerPhone || 'N/A')}</strong></td>
                    <td>#${o.id}</td>
                    <td>Table ${Utils.getTableNumber(o.tableId)}</td>
                    <td>${Utils.escapeHtml(o.customerName)}</td>
                    <td><strong>${Utils.formatPrice(o.total)}</strong></td>
                    <td><span class="badge ${Utils.getStatusBadgeClass(o.status)}">${Utils.getStatusLabel(o.status)}</span></td>
                    <td>${Utils.formatTime(o.createdAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      `;

      // Bind buttons
      const confirmBtn = document.getElementById('confirm-payment-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          Store.confirmPayment(session.id);
          Toast.success('Cash payment confirmed! Customer has been notified.');
          render();
        });
      }

      const rejectBtn = document.getElementById('reject-payment-btn');
      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
          Store.rejectPayment(session.id);
          Toast.error('Cash payment rejected. Customer has been notified.');
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
