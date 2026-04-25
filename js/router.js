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

    // Find matching route
    let handler = this.routes[path];
    if (!handler) {
      // Try to match partial paths
      const routeKeys = Object.keys(this.routes).sort((a, b) => b.length - a.length);
      for (const key of routeKeys) {
        if (path.startsWith(key)) {
          handler = this.routes[key];
          break;
        }
      }
    }

    if (!handler) {
      handler = this.routes['/'] || (() => {});
    }

    // Route guards
    if (path.startsWith('/admin') && path !== '/admin') {
      if (!Store.isAdminLoggedIn()) {
        this.navigate('/admin');
        return;
      }
    }

    // Customer flow guards
    const customerPages = ['/menu', '/cart', '/details', '/confirmation', '/payment', '/review'];
    if (customerPages.includes(path)) {
      const session = Store.getCurrentSession();
      if (!session && path !== '/review') {
        // Check for URL table param
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const tableParam = urlParams.get('table');
        if (tableParam) {
          // Auto-select table from QR scan
          const tables = Store.get('tables');
          const table = tables.find(t => t.number === parseInt(tableParam));
          if (table && table.status === 'available') {
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

    this.currentRoute = path;
    handler(path);
  },

  getQuery() {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return {};
    return Object.fromEntries(new URLSearchParams(hash.substring(qIndex + 1)));
  }
};
