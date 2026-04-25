/* ============================================
   SS Restaurant — Store (State Management)
   Syncs with Supabase when connected,
   falls back to sessionStorage when not.
   ============================================ */

const Store = {
  _state: {},
  _listeners: [],
  _dbLoaded: false,

  async init() {
    // 1. Load from sessionStorage first (instant)
    const saved = sessionStorage.getItem('ss_restaurant_state');
    if (saved) {
      try {
        this._state = JSON.parse(saved);
        this._ensureDefaults();
      } catch (e) {
        this._resetToDefaults();
      }
    } else {
      this._resetToDefaults();
    }

    // 2. Initialize Supabase
    initSupabase();

    // 3. If Supabase is connected, load fresh data from DB
    if (DB_ENABLED) {
      const dbSession = await DB.getAdminSession();
      if (dbSession && dbSession.user) {
        this.set('adminAuth', {
          id: dbSession.user.id,
          email: dbSession.user.email,
          role: 'Admin'
        });
      } else {
        this.set('adminAuth', null);
      }
      this._loadFromDB().then(() => {
        if (Router && Router.currentRoute === '/menu') {
          // Re-render menu to clear skeletons
          const evt = new Event('hashchange');
          window.dispatchEvent(evt);
        }
      });
    }
  },

  async _loadFromDB() {
    try {
      const [categories, menuItems, tables, adminUsers, orders, sessions] = await Promise.all([
        DB.getCategories(),
        DB.getMenuItems(),
        DB.getTables(),
        DB.getAdminUsers(),
        DB.getOrders(),
        DB.getSessions()
      ]);

      if (categories) this._state.categories = categories;
      if (menuItems) this._state.menuItems = menuItems;
      if (tables) this._state.tables = tables;
      if (adminUsers) this._state.adminUsers = adminUsers;
      if (orders) this._state.orders = orders;
      if (sessions) this._state.sessions = sessions;

      // Update nextOrderId based on DB
      if (orders && orders.length > 0) {
        const maxId = Math.max(...orders.map(o => o.id));
        this._state.nextOrderId = Math.max(maxId + 1, this._state.nextOrderId);
      }

      this._dbLoaded = true;
      this._persist();
      console.log('✅ Data loaded from Supabase');
    } catch (e) {
      console.error('Failed to load from DB, using sessionStorage:', e);
    }
  },

  _ensureDefaults() {
    if (!this._state.categories) this._state.categories = [...DEFAULT_CATEGORIES];
    if (!this._state.menuItems) this._state.menuItems = [...DEFAULT_MENU_ITEMS];
    if (!this._state.tables) this._state.tables = [...DEFAULT_TABLES];
    if (!this._state.adminUsers) this._state.adminUsers = [...DEFAULT_ADMIN_USERS];
    if (!this._state.orders) this._state.orders = [];
    if (!this._state.sessions) this._state.sessions = [];
    if (!this._state.reviews) this._state.reviews = [];
    if (this._state.nextOrderId === undefined) this._state.nextOrderId = STARTING_ORDER_ID;
    if (!this._state.currentSession) this._state.currentSession = null;
    if (!this._state.adminAuth) this._state.adminAuth = null;
    if (!this._state.complaints) this._state.complaints = [];
  },

  _resetToDefaults() {
    this._state = {
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      menuItems: JSON.parse(JSON.stringify(DEFAULT_MENU_ITEMS)),
      tables: JSON.parse(JSON.stringify(DEFAULT_TABLES)),
      adminUsers: JSON.parse(JSON.stringify(DEFAULT_ADMIN_USERS)),
      orders: [],
      sessions: [],
      reviews: [],
      nextOrderId: STARTING_ORDER_ID,
      currentSession: null,
      adminAuth: null,
      complaints: []
    };
    this._persist();
  },

  get(key) {
    return this._state[key];
  },

  set(key, value) {
    this._state[key] = value;
    this._persist();
    this._notify(key);
  },

  update(key, updater) {
    this._state[key] = updater(this._state[key]);
    this._persist();
    this._notify(key);
  },

  _persist() {
    try {
      sessionStorage.setItem('ss_restaurant_state', JSON.stringify(this._state));
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  },

  _notify(key) {
    this._listeners.forEach(l => {
      if (!l.key || l.key === key) l.fn(key, this._state[key]);
    });
  },

  subscribe(keyOrFn, fn) {
    if (typeof keyOrFn === 'function') {
      this._listeners.push({ fn: keyOrFn });
    } else {
      this._listeners.push({ key: keyOrFn, fn });
    }
  },

  // ---- Session Helpers ----
  async startSession(tableId) {
    // Check local state quickly first
    const localTable = this._state.tables.find(t => t.id === tableId);
    if (localTable && localTable.status === 'occupied') {
      Toast.error('This table is already occupied!');
      return null;
    }

    // Atomic DB Check: Attempt to update table status to 'occupied' ONLY IF it is currently 'available'
    if (DB_ENABLED) {
      const locked = await DB.updateTableStatus(tableId, 'occupied', 'available');
      if (!locked) {
        Toast.error('This table was just taken by someone else!');
        return null;
      }
    }

    const sessionId = 'sess-' + Date.now();
    const session = {
      id: sessionId,
      tableId: tableId,
      cart: [],
      orders: [],
      customerInfo: null,
      currentStep: 'menu',
      startedAt: new Date().toISOString(),
      status: 'active',
      paymentMethod: null,
      paid: false
    };
    
    this.set('currentSession', session);
    // Mark table as occupied locally
    this.update('tables', tables =>
      tables.map(t => t.id === tableId ? { ...t, status: 'occupied' } : t)
    );
    // Create session in DB
    DB.createSession(session);
    return session;
  },

  getCurrentSession() {
    return this._state.currentSession;
  },

  updateSession(updates) {
    const session = this._state.currentSession;
    if (!session) return;
    Object.assign(session, updates);
    this.set('currentSession', session);
  },

  addToCart(menuItem) {
    const session = this._state.currentSession;
    if (!session) return;
    const existing = session.cart.find(c => c.itemId === menuItem.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      session.cart.push({
        itemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        isVeg: menuItem.isVeg,
        image: menuItem.image
      });
    }
    this.set('currentSession', session);
  },

  updateCartQty(itemId, qty) {
    const session = this._state.currentSession;
    if (!session) return;
    if (qty <= 0) {
      session.cart = session.cart.filter(c => c.itemId !== itemId);
    } else {
      const item = session.cart.find(c => c.itemId === itemId);
      if (item) item.quantity = qty;
    }
    this.set('currentSession', session);
  },

  removeFromCart(itemId) {
    this.updateCartQty(itemId, 0);
  },

  getCartTotal() {
    const session = this._state.currentSession;
    if (!session) return { subtotal: 0, gst: 0, total: 0 };
    const subtotal = Number(session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
    const gst = Number((subtotal * GST_RATE).toFixed(2));
    return { subtotal, gst, total: Number((subtotal + gst).toFixed(2)) };
  },

  getSessionTotal() {
    const session = this._state.currentSession;
    if (!session) return { subtotal: 0, gst: 0, total: 0 };
    let subtotal = 0;
    session.orders.forEach(orderId => {
      const order = this._state.orders.find(o => o.id === orderId);
      if (order) subtotal += order.subtotal;
    });
    subtotal += session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    subtotal = Number(subtotal.toFixed(2));
    const gst = Number((subtotal * GST_RATE).toFixed(2));
    return { subtotal, gst, total: Number((subtotal + gst).toFixed(2)) };
  },

  getFullSessionTotal() {
    const session = this._state.currentSession;
    if (!session) return { subtotal: 0, gst: 0, total: 0 };
    let subtotal = 0;
    session.orders.forEach(orderId => {
      const order = this._state.orders.find(o => o.id === orderId);
      if (order) subtotal += order.subtotal;
    });
    subtotal = Number(subtotal.toFixed(2));
    const gst = Number((subtotal * GST_RATE).toFixed(2));
    return { subtotal, gst, total: Number((subtotal + gst).toFixed(2)) };
  },

  async placeOrder(customerInfo, specialInstructions) {
    const session = this._state.currentSession;
    if (!session || session.cart.length === 0) return null;

    const subtotal = Number(session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
    const gst = Number((subtotal * GST_RATE).toFixed(2));
    const total = Number((subtotal + gst).toFixed(2));
    
    let orderId = this._state.nextOrderId;
    let finalOrder = null;
    let orderSuccess = false;

    // Try up to 5 times to avoid duplicate Order IDs if multiple devices order simultaneously
    for (let attempt = 0; attempt < 5; attempt++) {
      if (DB_ENABLED) {
        const dbNextId = await DB.getNextOrderId();
        if (dbNextId) orderId = dbNextId;
      }

      const order = {
        id: orderId,
        sessionId: session.id,
        tableId: session.tableId,
        items: [...session.cart],
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        specialInstructions: specialInstructions || '',
        subtotal: subtotal,
        gst: gst,
        total: total,
        status: 'new',
        createdAt: new Date().toISOString()
      };

      if (DB_ENABLED) {
        const success = await DB.createOrder(order);
        if (success) {
          orderSuccess = true;
          finalOrder = order;
          break;
        } else {
          // Collision occurred, wait a bit and retry
          await new Promise(r => setTimeout(r, Math.random() * 500));
          // Will fetch nextOrderId in next loop iteration
        }
      } else {
        // Local mode
        orderSuccess = true;
        finalOrder = order;
        break;
      }
    }

    if (!orderSuccess) {
      return null;
    }

    this.update('orders', orders => [...orders, finalOrder]);
    this.set('nextOrderId', finalOrder.id + 1);

    // Update session
    session.orders.push(finalOrder.id);
    session.customerInfo = customerInfo;
    session.cart = [];
    session.currentStep = 'confirmation';
    this.set('currentSession', session);

    // Sync session to DB
    if (DB_ENABLED) {
      DB.updateSession(session.id, {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone
      });
    }

    return finalOrder;
  },

  // ---- Payment Helpers ----
  confirmPayment(sessionId) {
    // If it's the current session
    const session = this._state.currentSession;
    let tableId = null;
    
    if (session && session.id === sessionId) {
      session.paymentStatus = 'confirmed';
      session.paid = true;
      tableId = session.tableId;
      this.set('currentSession', session);
    }
    // Update in sessions array if exists
    if (this._state.sessions) {
      const s = this._state.sessions.find(s => s.id === sessionId);
      if (s) {
        s.status = 'paid';
        tableId = tableId || s.tableId;
      }
    }
    this._persist();
    this._notify('currentSession');
    
    // Sync to DB
    DB.updateSession(sessionId, { status: 'paid' });
    
    // Release the table automatically
    if (tableId) {
      this.releaseTable(tableId);
    }
  },

  rejectPayment(sessionId) {
    const session = this._state.currentSession;
    if (session && session.id === sessionId) {
      session.paymentStatus = 'failed';
      session.paid = false;
      this.set('currentSession', session);
    }
    if (this._state.sessions) {
      const s = this._state.sessions.find(s => s.id === sessionId);
      if (s) {
        s.status = 'active';
        s.paymentMethod = null;
      }
    }
    this._persist();
    this._notify('currentSession');
    DB.updateSession(sessionId, { status: 'active', paymentMethod: null });
  },

  getActivePaymentSessions() {
    const session = this._state.currentSession;
    if (session && session.paymentMethod && !session.paid) {
      return [session];
    }
    return [];
  },

  endSession() {
    const session = this._state.currentSession;
    if (!session) return;
    // Release table
    this.update('tables', tables =>
      tables.map(t => t.id === session.tableId ? { ...t, status: 'available' } : t)
    );
    // Sync to DB
    DB.updateTableStatus(session.tableId, 'available');
    DB.updateSession(session.id, { status: 'closed', ended: true });
    this.set('currentSession', null);
  },

  // ---- Admin Helpers (Secure Auth) ----
  async adminLogin(email, password) {
    if (DB_ENABLED) {
      const { data, error } = await DB.adminLogin(email, password);
      if (error) return { success: false, error: error.message };
      if (!data || !data.session) return { success: false, error: 'No session established. Did you verify your email in Supabase?' };
      
      this.set('adminAuth', {
        id: data.user.id,
        email: data.user.email,
        role: 'Admin'
      });
      return { success: true };
    }
    return { success: false, error: 'Database is not connected' };
  },

  async adminLogout() {
    if (DB_ENABLED) {
      await DB.adminLogout();
    }
    this.set('adminAuth', null);
  },

  isAdminLoggedIn() {
    return !!this._state.adminAuth;
  },

  updateOrderStatus(orderId, status) {
    this.update('orders', orders =>
      orders.map(o => o.id === orderId ? { ...o, status } : o)
    );
    // Sync to DB
    DB.updateOrderStatus(orderId, status);
  },

  releaseTable(tableId) {
    const session = this._state.currentSession;
    if (session && session.tableId === tableId) {
      this.set('currentSession', null);
    }
    this.update('tables', tables =>
      tables.map(t => t.id === tableId ? { ...t, status: 'available' } : t)
    );
    // Sync to DB
    DB.updateTableStatus(tableId, 'available');
  },

  blockTable(tableId) {
    this.update('tables', tables =>
      tables.map(t => t.id === tableId ? { ...t, status: 'blocked' } : t)
    );
    // Sync to DB
    DB.updateTableStatus(tableId, 'blocked');
  },

  getTodayOrders() {
    const today = new Date().toISOString().split('T')[0];
    return this._state.orders.filter(o => o.createdAt.startsWith(today));
  },

  getTodayRevenue() {
    return this.getTodayOrders()
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
  },

  // ---- Admin data sync (force refresh from DB) ----
  async refreshFromDB() {
    if (DB_ENABLED) {
      await this._loadFromDB();
    }
  }
};
