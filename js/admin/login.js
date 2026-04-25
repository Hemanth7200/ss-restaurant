/* ============================================
   SS Restaurant — Admin Login & Layout
   ============================================ */

function renderAdminLogin() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="admin-login-page">
      <div class="admin-login-card">
        <div class="login-logo">
          <img src="assets/logo.png" alt="SS Restaurant" />
          <h2>SS Restaurant</h2>
          <p>Admin Portal</p>
        </div>
        <div class="admin-login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="admin-email" class="form-input" placeholder="Enter your email" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="admin-password" class="form-input" placeholder="Enter your password" />
          </div>
          <div id="login-error" class="form-error" style="display: none;"></div>
          <button class="btn btn-primary btn-full btn-lg" id="admin-login-btn">
            Sign In
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('admin-login-btn').addEventListener('click', doLogin);
  document.getElementById('admin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
  });

  async function doLogin() {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('admin-login-btn');

    if (!email || !password) {
      errorEl.textContent = 'Please enter both email and password';
      errorEl.style.display = 'block';
      return;
    }

    // Account Lockout Check
    const attemptsKey = `login_attempts_${email}`;
    let attemptsData = JSON.parse(localStorage.getItem(attemptsKey) || '{"count":0, "lockUntil":0}');
    if (attemptsData.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((attemptsData.lockUntil - Date.now()) / 60000);
      errorEl.textContent = `Account locked due to multiple failed attempts. Try again in ${minutesLeft} minutes.`;
      errorEl.style.display = 'block';
      return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner"></div>';
    btn.disabled = true;
    errorEl.style.display = 'none';

    const result = await Store.adminLogin(email, password);
    if (result && result.success) {
      localStorage.removeItem(attemptsKey); // Clear on success
      Toast.success('Welcome back!');
      Router.navigate('/admin/dashboard');
    } else {
      attemptsData.count += 1;
      if (attemptsData.count >= 5) {
        attemptsData.lockUntil = Date.now() + 15 * 60000; // 15 mins lock
      }
      localStorage.setItem(attemptsKey, JSON.stringify(attemptsData));

      if (attemptsData.count >= 5) {
        errorEl.textContent = 'Account locked due to multiple failed attempts. Try again in 15 minutes.';
      } else {
        errorEl.textContent = result.error || 'Invalid email or password';
      }
      
      errorEl.style.display = 'block';
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
}

function renderAdminLayout(pageTitle, contentFn) {
  const app = document.getElementById('app');
  const auth = Store.get('adminAuth');

  const navItems = [
    { path: '/admin/dashboard', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>', label: 'Dashboard' },
    { path: '/admin/orders', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', label: 'Live Orders' },
    { path: '/admin/payments', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>', label: 'Cash Approvals' },
    { path: '/admin/menu', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>', label: 'Menu Items' },
    { path: '/admin/categories', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', label: 'Categories' },
    { path: '/admin/tables', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>', label: 'Tables & QR' },
    { path: '/admin/users', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', label: 'Admin Users' }
  ];

  const currentPath = Router.currentRoute;

  app.innerHTML = `
    <div class="admin-layout">
      <div class="admin-sidebar-overlay" id="sidebar-overlay"></div>
      <aside class="admin-sidebar" id="admin-sidebar">
        <div class="admin-sidebar-header">
          <img src="assets/logo.png" alt="Logo" class="admin-sidebar-logo" />
          <span class="admin-sidebar-brand">SS Restaurant</span>
        </div>
        <nav class="admin-sidebar-nav">
          ${navItems.map(item => `
            <div class="admin-nav-item ${currentPath === item.path ? 'active' : ''}" data-path="${item.path}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
            </div>
          `).join('')}
        </nav>
        <div class="admin-sidebar-footer">
          <div style="font-size: var(--font-size-xs); color: var(--color-sidebar-text); margin-bottom: var(--space-sm);">
            ${auth ? auth.name : 'Admin'}
          </div>
          <button class="admin-logout-btn" id="admin-logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> 
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main class="admin-main">
        <div class="admin-topbar">
          <div style="display: flex; align-items: center; gap: var(--space-md);">
            <button class="admin-mobile-toggle" id="mobile-menu-toggle">☰</button>
            <h1>${pageTitle}</h1>
          </div>
          <div class="admin-topbar-right">
            <span style="font-size: var(--font-size-sm); color: var(--text-muted);">
              ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
        <div class="admin-content" id="admin-page-content">
          <!-- Page content injected here -->
        </div>
      </main>
    </div>
  `;

  // Nav clicks
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      Router.navigate(item.dataset.path);
      document.getElementById('admin-sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('open');
    });
  });

  // Logout
  document.getElementById('admin-logout').addEventListener('click', async () => {
    await Store.adminLogout();
    Toast.info('Logged out');
    window.location.replace(window.location.origin + window.location.pathname + '#/admin');
  });

  // Mobile toggle
  document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
    document.getElementById('admin-sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
  });

  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('admin-sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  });

  // Render page content
  contentFn(document.getElementById('admin-page-content'));
}
