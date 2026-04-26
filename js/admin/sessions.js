/* ============================================
   SS Restaurant — Admin Sessions
   ============================================ */

function renderAdminSessions() {
  renderAdminLayout('Table Sessions', (container) => {
    let filter = 'active';

    async function refreshSessions() {
      if (DB_ENABLED) {
        const dbSessions = await DB.getSessions();
        if (dbSessions) Store.set('sessions', dbSessions);
      }
    }

    function renderList() {
      const sessions = (Store.get('sessions') || []).slice().sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
      const orders = Store.get('orders') || [];
      const filtered = sessions.filter(s => {
        if (filter === 'all') return true;
        if (filter === 'active') return s.status === 'active';
        if (filter === 'paid') return s.status === 'paid';
        if (filter === 'closed') return s.status === 'closed';
        return true;
      });

      container.innerHTML = `
        <div class="filter-tabs" style="margin-bottom:var(--space-lg);">
          ${['active', 'paid', 'closed', 'all'].map(s => `
            <button class="filter-tab ${filter === s ? 'active' : ''}" data-filter="${s}">
              ${s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          `).join('')}
          <button class="btn btn-secondary" id="sessions-refresh-btn" style="margin-left:auto;">🔄 Refresh</button>
        </div>

        ${filtered.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🪑</div>
            <h3>No ${filter} sessions</h3>
            <p>Table sessions will appear here.</p>
          </div>
        ` : `
          <div class="orders-grid">
            ${filtered.map(s => {
              const sessionOrders = orders.filter(o => String(o.sessionId) === String(s.id));
              const total = sessionOrders.reduce((sum, o) => sum + (o.total || 0), 0);
              const tableNum = Utils.getTableNumber(s.tableId);
              return `
                <div class="order-card">
                  <div class="order-card-header">
                    <div>
                      <span class="order-card-id">Table ${tableNum}</span>
                      <span class="badge ${s.status === 'active' ? 'badge-warning' : s.status === 'paid' ? 'badge-success' : 'badge-info'}" style="margin-left:8px;text-transform:capitalize;">
                        ${s.status || 'active'}
                      </span>
                    </div>
                    <span class="order-card-time">${Utils.formatTime(s.startedAt)}</span>
                  </div>
                  <div class="order-card-body">
                    <div class="order-card-customer">
                      <span>Session: ${Utils.escapeHtml(s.id)}</span>
                    </div>
                    <div class="order-item-row"><span>Orders</span><span>${sessionOrders.length}</span></div>
                    <div class="order-item-row"><span>Payment Method</span><span>${Utils.escapeHtml(s.paymentMethod || '—')}</span></div>
                    <div class="order-item-row"><span>Total</span><span><strong>${Utils.formatPrice(total)}</strong></span></div>
                  </div>
                  <div class="order-card-footer">
                    <span class="order-total">${Utils.formatPrice(total)}</span>
                    <div class="order-actions">
                      ${s.status === 'active' ? `
                        <button class="btn btn-sm btn-success" onclick="adminMarkSessionPaid('${s.id}')">Mark Paid</button>
                      ` : ''}
                      ${s.status !== 'closed' ? `
                        <button class="btn btn-sm btn-secondary" onclick="adminCloseSession('${s.id}', '${s.tableId}')">Close Session</button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;

      container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          filter = tab.dataset.filter;
          renderList();
        });
      });
      const refreshBtn = document.getElementById('sessions-refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
          await refreshSessions();
          renderList();
        });
      }
    }

    refreshSessions().then(renderList);
  });
}

function adminMarkSessionPaid(sessionId) {
  Store.confirmPayment(sessionId);
  Toast.success('Session marked as paid and table released.');
  if (Router.currentRoute === '/admin/sessions') renderAdminSessions();
}

function adminCloseSession(sessionId, tableId) {
  if (DB_ENABLED) {
    DB.updateSession(sessionId, { status: 'closed', ended: true });
  }
  Store.update('sessions', sessions => sessions.map(s => (
    String(s.id) === String(sessionId) ? { ...s, status: 'closed', endedAt: new Date().toISOString() } : s
  )));
  Store.releaseTable(tableId);
  Toast.success('Session closed and table released.');
  if (Router.currentRoute === '/admin/sessions') renderAdminSessions();
}
