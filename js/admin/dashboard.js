/* ============================================
   SS Restaurant — Admin Dashboard
   ============================================ */

function renderAdminDashboard() {
  let chartRange = '7days'; // 7days, 1month, 1year

  function renderDashboardContent(container) {
    const todayOrders = Store.getTodayOrders();
    const todayRevenue = Store.getTodayRevenue();
    const activeTables = Store.get('tables').filter(t => t.status === 'occupied').length;
    const totalOrders = todayOrders.filter(o => o.status !== 'cancelled').length;

    // Chart Data Generation
    const chartData = [];
    const allOrders = Store.get('orders').filter(o => o.status !== 'cancelled');
    
    if (chartRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayOrders = allOrders.filter(o => o.createdAt.startsWith(dateStr));
        const dayRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
        chartData.push({
          label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          value: dayRevenue
        });
      }
    } else if (chartRange === '1month') {
      // Last 4 weeks
      for (let i = 4; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - (i * 7 + 7));
        const end = new Date();
        end.setDate(end.getDate() - (i * 7));
        const periodOrders = allOrders.filter(o => {
          const d = new Date(o.createdAt);
          return d >= start && d < end;
        });
        const periodRevenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
        chartData.push({
          label: `Week -${i}`,
          value: periodRevenue
        });
      }
    } else if (chartRange === '1year') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
        const monthOrders = allOrders.filter(o => o.createdAt.startsWith(monthStr));
        const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
        chartData.push({
          label: d.toLocaleDateString('en-IN', { month: 'short' }),
          value: monthRevenue
        });
      }
    }

    const maxRevenue = Math.max(...chartData.map(d => d.value), 1);
    const recentOrders = Store.get('orders').slice(-10).reverse();

    container.innerHTML = `
      <div class="dashboard-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Today's Orders</h4>
            <div class="stat-value">${totalOrders}</div>
          </div>
          <div class="stat-card-icon" style="background: var(--color-info-bg); color: var(--color-info);">📋</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Today's Revenue</h4>
            <div class="stat-value">${Utils.formatPrice(todayRevenue)}</div>
          </div>
          <div class="stat-card-icon" style="background: var(--color-success-bg); color: var(--color-success);">💰</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-info">
            <h4>Active Tables</h4>
            <div class="stat-value">${activeTables}</div>
          </div>
          <div class="stat-card-icon" style="background: var(--color-warning-bg); color: var(--color-warning);">🪑</div>
        </div>
      </div>

      <div class="chart-container" style="margin-bottom: var(--space-2xl);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
          <h3>Revenue Overview</h3>
          <select id="chart-range-select" class="form-input" style="width: auto; padding: 4px 12px; font-size: 14px;">
            <option value="7days" ${chartRange === '7days' ? 'selected' : ''}>Last 7 Days</option>
            <option value="1month" ${chartRange === '1month' ? 'selected' : ''}>Last 1 Month</option>
            <option value="1year" ${chartRange === '1year' ? 'selected' : ''}>Last 1 Year</option>
          </select>
        </div>
        <div class="bar-chart">
          ${chartData.map(d => `
            <div class="bar-group">
              <span class="bar-value" style="font-size: 10px;">${d.value > 0 ? Utils.formatPrice(d.value) : ''}</span>
              <div class="bar" style="height: ${Math.max((d.value / maxRevenue) * 160, 4)}px;"></div>
              <span class="bar-label" style="font-size: 11px;">${d.label}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="data-table-wrapper">
        <div class="data-table-header">
          <h3 style="font-size: var(--font-size-base);">Recent Orders</h3>
        </div>
        ${recentOrders.length === 0 ? `
          <div class="empty-state" style="padding: var(--space-3xl);">
            <div class="empty-state-icon">📋</div>
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers place them</p>
          </div>
        ` : `
          <table class="data-table">
            <thead>
              <tr>
                <th>Phone Number</th>
                <th>Order ID</th>
                <th>Table</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              ${recentOrders.map(o => `
                <tr>
                  <td><strong>${Utils.escapeHtml(o.customerPhone || 'N/A')}</strong></td>
                  <td>#${o.id}</td>
                  <td>Table ${Utils.getTableNumber(o.tableId)}</td>
                  <td>${Utils.escapeHtml(o.customerName)}</td>
                  <td>${o.items.length} items</td>
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

    document.getElementById('chart-range-select').addEventListener('change', (e) => {
      chartRange = e.target.value;
      renderDashboardContent(container);
    });
  }

  renderAdminLayout('Dashboard', (container) => {
    renderDashboardContent(container);
  });
}
