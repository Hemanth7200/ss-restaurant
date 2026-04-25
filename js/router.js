/* ============================================
   SS Restaurant — Router
   ============================================ */

const Router = {
  routes: {},
  currentRoute: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  init() {
    window.addEventListener('hashchange', () => this._handleRoute());
    this._handleRoute();
  },

  navigate(path) {
    window.location.hash = path;
  },

  async _handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '') || '/';
    const basePath = path.split('?')[0] || '/';

    // Find matching route
    let handler = this.routes[basePath];
    if (!handler) {
      // Try to match partial paths
      const routeKeys = Object.keys(this.routes).sort((a, b) => b.length - a.length);
      for (const key of routeKeys) {
        if (basePath.startsWith(key)) {
          handler = this.routes[key];
          break;
        }
      }
    }

    if (!handler) {
      handler = () => {
        document.getElementById('app').innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;padding:20px;">
            <h1 style="font-size:4rem;margin-bottom:10px;color:var(--primary-color);">404</h1>
            <h2 style="margin-bottom:20px;">Page Not Found</h2>
            <p style="color:var(--text-muted);margin-bottom:30px;">The page you are looking for doesn't exist or has been moved.</p>
            <button class="btn btn-primary" onclick="Router.navigate('/')">Return to Home</button>
          </div>
        `;
      };
    }

    // Route guards
    if (basePath.startsWith('/admin') && basePath !== '/admin') {
      if (!Store.isAdminLoggedIn()) {
        this.navigate('/admin');
        return;
      }
    }

    // Customer flow guards
    const customerPages = ['/menu', '/cart', '/details', '/confirmation', '/payment', '/review'];
    if (customerPages.includes(basePath)) {
      const session = Store.getCurrentSession();
      if (!session && basePath !== '/review') {
        // Check for URL table param
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const tableParam = urlParams.get('table');
        if (tableParam) {
          // Auto-select table from QR scan
          const tables = Store.get('tables');
          const table = tables.find(t => t.number === parseInt(tableParam));
          if (table) {
            const newSession = await Store.startSession(table.id);
            if (!newSession) {
              this.navigate('/');
              return;
            }
          } else {
            this.navigate('/');
            return;
          }
        } else {
          this.navigate('/');
          return;
        }
      }
    }

    this.currentRoute = basePath;
    handler(basePath);
  },

  getQuery() {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return {};
    return Object.fromEntries(new URLSearchParams(hash.substring(qIndex + 1)));
  }
};
