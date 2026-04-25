/* ============================================
   SS Restaurant — Admin Login & Layout
   ============================================ */

function renderAdminLogin() {
  const app = document.getElementById('app');

  if (Store.isAdminLoggedIn()) {
    Router.navigate('/admin/dashboard');
    return;
  }

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

  function doLogin() {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');

    if (!email || !password) {
      errorEl.textContent = 'Please enter both email and password';
      errorEl.style.display = 'block';
      return;
    }

    if (Store.adminLogin(email, password)) {
      Toast.success('Welcome back!');
      Router.navigate('/admin/dashboard');
    } else {
      errorEl.textContent = 'Invalid email or password';
      errorEl.style.display = 'block';
    }
  }
}

function renderAdminLayout(pageTitle, contentFn) {
  const app = document.getElementById('app');
  const auth = Store.get('adminAuth');

  const navItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/orders', icon: '📋', label: 'Live Orders' },
    { path: '/admin/payments', icon: '💳', label: 'Payment History' },
    { path: '/admin/menu', icon: '🍽️', label: 'Menu Items' },
    { path: '/admin/categories', icon: '📁', label: 'Categories' },
    { path: '/admin/tables', icon: '🪑', label: 'Tables & QR' },
    { path: '/admin/users', icon: '👥', label: 'Admin Users' }
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
            🚪 <span>Logout</span>
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
  document.getElementById('admin-logout').addEventListener('click', () => {
    Store.adminLogout();
    Toast.info('Logged out');
    Router.navigate('/admin');
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
