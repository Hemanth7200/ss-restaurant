/* ============================================
   SS Restaurant — Store (State Management)
   Syncs with Supabase when connected,
   falls back to browser storage when not.
   ============================================ */

const STORE_KEY = 'ss_restaurant_state';
const SHARED_STORE_KEY = `${STORE_KEY}_shared`;
const SESSION_STORE_KEY = `${STORE_KEY}_session`;

const Store = {
  _state: {},
  _listeners: [],
  _dbLoaded: false,
  _storageListenerReady: false,
  _realtimeReady: false,

  async init() {
    // 1. Load shared browser state + tab-scoped session state.
    this._hydrateFromStorage();

    // 1b. Proactive cleanup: remove legacy key and trim old data
    try { localStorage.removeItem(STORE_KEY); } catch(e) {}
    try { sessionStorage.removeItem(STORE_KEY); } catch(e) {}
    this._trimOldData();

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
      
      // CRITICAL: Await the DB load so we don't render stale/empty tables on landing
      await this._loadFromDB();
      
      if (Router && Router.currentRoute === '/menu') {
        // Re-render menu to clear skeletons
        const evt = new Event('hashchange');
        window.dispatchEvent(evt);
      }
    }

    this._listenForTabSync();
    this._startRealtimeSync();
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
      console.error('Failed to load from DB, using browser storage:', e);
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

  _hydrateFromStorage() {
    const sharedRaw = localStorage.getItem(SHARED_STORE_KEY) || localStorage.getItem(STORE_KEY);
    const sessionRaw = sessionStorage.getItem(SESSION_STORE_KEY) || sessionStorage.getItem(STORE_KEY);

    if (sharedRaw) {
      try {
        this._state = JSON.parse(sharedRaw);
      } catch (e) {
        this._resetToDefaults();
        return;
      }
    } else {
      this._resetToDefaults();
      return;
    }

    // Never trust shared storage for per-tab active customer/admin sessions.
    this._state.currentSession = null;
    this._state.adminAuth = null;

    if (sessionRaw) {
      try {
        const sessionState = JSON.parse(sessionRaw);
        if (sessionState && sessionState.currentSession) {
          this._state.currentSession = sessionState.currentSession;
        }
        if (sessionState && sessionState.adminAuth) {
          this._state.adminAuth = sessionState.adminAuth;
        }
      } catch (e) {
        // Ignore corrupted session state for this tab.
      }
    }

    this._ensureDefaults();
    this._persist();
  },

  _getSharedStateSnapshot() {
    const sharedState = { ...this._state };
    // Per-tab only, never shared between tabs.
    sharedState.currentSession = null;
    sharedState.adminAuth = null;
    return sharedState;
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
    const sessionSerialized = JSON.stringify({
      currentSession: this._state.currentSession || null,
      adminAuth: this._state.adminAuth || null
    });

    // Always persist session state (small, rarely exceeds quota)
    try {
      sessionStorage.setItem(SESSION_STORE_KEY, sessionSerialized);
    } catch (e) { /* sessionStorage full — non-critical */ }

    // Persist shared state with quota-exceeded recovery
    try {
      const sharedSerialized = JSON.stringify(this._getSharedStateSnapshot());
      localStorage.setItem(SHARED_STORE_KEY, sharedSerialized);
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        console.warn('⚠️ localStorage quota exceeded — trimming old data...');
        this._trimOldData();
        try {
          // Remove legacy key to free space
          localStorage.removeItem(STORE_KEY);
          const sharedSerialized = JSON.stringify(this._getSharedStateSnapshot());
          localStorage.setItem(SHARED_STORE_KEY, sharedSerialized);
        } catch (e2) {
          console.warn('⚠️ Still over quota after trim — clearing localStorage');
          localStorage.clear();
          try {
            const sharedSerialized = JSON.stringify(this._getSharedStateSnapshot());
            localStorage.setItem(SHARED_STORE_KEY, sharedSerialized);
          } catch (e3) {
            console.error('Cannot persist state at all:', e3);
          }
        }
      } else {
        console.warn('Failed to persist state:', e);
      }
    }
  },

  _trimOldData() {
    // Aggressive trimming to prevent QuotaExceededError
    if (this._state.orders && this._state.orders.length > 30) {
      this._state.orders = this._state.orders.slice(-30);
    }
    if (this._state.sessions && this._state.sessions.length > 10) {
      this._state.sessions = this._state.sessions.slice(-10);
    }
    if (this._state.reviews && this._state.reviews.length > 10) {
      this._state.reviews = this._state.reviews.slice(-10);
    }
    if (this._state.complaints && this._state.complaints.length > 10) {
      this._state.complaints = this._state.complaints.slice(-10);
    }
    // Strip large image data from stored orders to save space
    if (this._state.orders) {
      this._state.orders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            if (item.image && item.image.startsWith('data:')) {
              item.image = ''; // Remove base64 blobs
            }
          });
        }
      });
    }
  },

  _listenForTabSync() {
    if (this._storageListenerReady) return;
    this._storageListenerReady = true;

    window.addEventListener('storage', (event) => {
      if ((event.key !== SHARED_STORE_KEY && event.key !== STORE_KEY) || !event.newValue) return;
      try {
        const incomingShared = JSON.parse(event.newValue);
        const activeSession = this._state.currentSession || null;
        const activeAdminAuth = this._state.adminAuth || null;

        this._state = incomingShared;
        this._state.currentSession = activeSession;
        this._state.adminAuth = activeAdminAuth;
        this._ensureDefaults();
        this._notify('orders');
        this._notify('tables');
        this._enforceTableLockForCurrentSession();
      } catch (e) {
        console.warn('Failed to sync state from another tab:', e);
      }
    });
  },

  _startRealtimeSync() {
    if (!DB_ENABLED || this._realtimeReady) return;
    this._realtimeReady = true;

    DB.subscribeToTables(async () => {
      const tables = await DB.getTables();
      if (!tables) return;
      this._state.tables = tables;
      this._persist();
      this._notify('tables');
      this._enforceTableLockForCurrentSession();
    });

    DB.subscribeToOrders(async () => {
      const orders = await DB.getOrders();
      if (!orders) return;
      this._state.orders = orders;
      this._persist();
      this._notify('orders');
    });
  },

  _enforceTableLockForCurrentSession() {
    // One Table = One Session: If a user has joined this table's session,
    // they are part of the group. Don't kick them out.
    const session = this._state.currentSession;
    if (!session) return;
    // If they already have tableLocked, they're the original owner — always allow
    if (session.tableLocked) return;
    // If they have the same sessionId as the active DB session, they've joined — allow
    // Only kick if the table is occupied and their session doesn't match
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
    const currentSession = this.getCurrentSession();
    
    // If we have an active session for this exact table, just return it
    if (currentSession && currentSession.tableId === tableId) {
      return currentSession;
    }

    // If they have an active session for a DIFFERENT table...
    if (currentSession && currentSession.tableId !== tableId) {
      // If they haven't placed any orders yet, allow them to switch tables!
      if (currentSession.orders.length === 0) {
        console.log('🔄 Switching table from', currentSession.tableId, 'to', tableId);
        // We will create a new session below
      } else {
        // They have real orders, don't let them switch without completing/paying
        Toast.error('You already have an active order for Table ' + Utils.getTableNumber(currentSession.tableId) + '. Please complete it first.');
        return null;
      }
    }

    // Allow users to browse a table until first order is placed.
    // If table is occupied, attempt to resume the active session for that table
    const localTable = this._state.tables.find(t => t.id === tableId);
    if (localTable && localTable.status === 'occupied') {
      console.log('🔗 Table is occupied. Attempting to join existing session...');
      return await this.resumeSessionForTable(tableId);
    }
    
    // If blocked or some other status, then stop
    if (localTable && localTable.status !== 'available' && localTable.status !== 'occupied') {
      Toast.error('This table is currently unavailable. Please contact staff.');
      return null;
    }

    const sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    const session = {
      id: sessionId,
      tableId: tableId,
      cart: [],
      orders: [],
      customerInfo: null,
      currentStep: 'menu',
      startedAt: new Date().toISOString(),
      status: 'active',
      tableLocked: false,
      paymentMethod: null,
      paid: false
    };
    
    this.set('currentSession', session);
    // Create session in DB
    await DB.createSession(session);
    return session;
  },

  async resumeSessionForTable(tableId) {
    let dbSession = null;

    // Try DB first
    if (DB_ENABLED) {
      try {
        dbSession = await DB.getActiveSessionByTable(tableId);
      } catch (e) {
        console.warn('DB lookup failed, falling back to local:', e);
      }
    }

    // Fallback: search local sessions array
    if (!dbSession && this._state.sessions) {
      dbSession = this._state.sessions.find(s =>
        s.tableId === tableId && s.status !== 'paid' && s.status !== 'closed'
      );
    }

    if (!dbSession) return null;

    const sessionOrders = this._state.orders
      .filter(order => order.sessionId === dbSession.id)
      .map(order => order.id);

    const session = {
      id: dbSession.id,
      tableId: dbSession.tableId,
      cart: [],
      orders: sessionOrders,
      customerInfo: dbSession.customerName || dbSession.customerPhone ? {
        name: dbSession.customerName || '',
        phone: dbSession.customerPhone || ''
      } : null,
      currentStep: 'menu',
      startedAt: dbSession.startedAt,
      status: dbSession.status || 'active',
      tableLocked: true,
      paymentMethod: dbSession.paymentMethod || null,
      paid: dbSession.status === 'paid',
      paymentStatus: dbSession.status === 'paid' ? 'confirmed' : null
    };

    this.set('currentSession', session);
    this.update('tables', tables =>
      tables.map(t => t.id === tableId ? { ...t, status: 'occupied' } : t)
    );

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
    // Fire-and-forget DB sync — never block the UI
    if (DB_ENABLED) {
      DB.updateSession(session.id, updates).catch(e => 
        console.warn('DB session sync failed (non-blocking):', e)
      );
    }
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
    if (!session || session.cart.length === 0) return { success: false, error: 'Session not found or cart is empty' };

    // Helper: wrap any promise with a timeout
    const withTimeout = (promise, ms = 8000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
      ]);
    };

    // First successful order claims the table atomically.
    // For shared sessions: if the table is already occupied and this user has
    // resumed the same session, just mark them as locked and proceed.
    if (!session.tableLocked) {
      const localTable = this._state.tables.find(t => t.id === session.tableId);
      
      if (DB_ENABLED) {
        try {
          // Try to lock the table. If already occupied, that's OK for shared sessions.
          const lockAcquired = await withTimeout(DB.updateTableStatus(session.tableId, 'occupied', 'available'));
          if (!lockAcquired) {
            // Table is already occupied — allowed if this user joined the session
            console.log('Table already occupied. Shared session — proceeding with order.');
          }
        } catch (e) {
          console.warn('Table lock timed out, proceeding with order anyway:', e.message);
        }
      }

      // Mark this user's local session as locked (they're part of the table)
      this.updateSession({ tableLocked: true });
      this.update('tables', tables =>
        tables.map(t => t.id === session.tableId ? { ...t, status: 'occupied' } : t)
      );
    }

    const subtotal = Number(session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
    const gst = Number((subtotal * GST_RATE).toFixed(2));
    const total = Number((subtotal + gst).toFixed(2));
    
    let orderId = this._state.nextOrderId;
    let finalOrder = null;

    // Get next order ID from DB if available
    if (DB_ENABLED) {
      try {
        const dbNextId = await withTimeout(DB.getNextOrderId(), 5000);
        if (dbNextId) orderId = dbNextId;
      } catch (e) {
        console.warn('getNextOrderId timed out, using local ID:', orderId);
      }
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

    // Try to save to DB, but don't block on failure
    if (DB_ENABLED) {
      try {
        const orderResult = await withTimeout(DB.createOrder(order), 8000);
        if (orderResult === true || (orderResult && orderResult.success)) {
          finalOrder = order;
        } else if (orderResult && orderResult.code === '23505') {
          // Duplicate ID - increment and try once more
          order.id = orderId + 1;
          try {
            const retry = await withTimeout(DB.createOrder(order), 5000);
            if (retry === true || (retry && retry.success)) {
              finalOrder = order;
            }
          } catch (e2) {
            console.warn('DB retry failed, saving locally');
            finalOrder = order;
          }
        } else {
          // DB error but we still want to place the order locally
          console.warn('DB createOrder failed, saving locally:', orderResult);
          finalOrder = order;
        }
      } catch (e) {
        // Timeout or network error - save locally anyway
        console.warn('DB createOrder timed out, saving locally:', e.message);
        finalOrder = order;
      }
    } else {
      finalOrder = order;
    }

    if (finalOrder) {
      // Update local state
      this.update('orders', orders => [...orders, finalOrder]);
      this.update('nextOrderId', id => Math.max(id, finalOrder.id + 1));
      
      // Update session and clear cart
      this.updateSession({ 
        cart: [], 
        orders: [...session.orders, finalOrder.id],
        customerInfo: customerInfo 
      });

      return { success: true, order: finalOrder };
    }

    return { success: false, error: 'Failed to place order. Please try again.' };
  },

  // ---- Payment Helpers ----
  confirmPayment(sessionId) {
    // === AUTO CLOSE SESSION ===
    // Payment confirmed → close session → archive bill → clear cart → unlock table
    
    let tableId = null;

    // 1. If this is the current tab's session, mark it paid
    const session = this._state.currentSession;
    if (session && session.id === sessionId) {
      session.paymentStatus = 'confirmed';
      session.paid = true;
      tableId = session.tableId;
      this.set('currentSession', session);
    }

    // 2. Archive the session as 'closed' in the sessions array
    if (this._state.sessions) {
      const s = this._state.sessions.find(s => s.id === sessionId);
      if (s) {
        s.status = 'closed';
        s.paymentStatus = 'confirmed';
        s.paid = true;
        s.closedAt = new Date().toISOString();
        tableId = tableId || s.tableId;
      }
    }

    this._persist();
    this._notify('currentSession');
    this._notify('sessions');

    // 3. Sync to DB — mark session as paid + closed
    if (DB_ENABLED) {
      DB.updateSession(sessionId, { status: 'paid', paymentMethod: this._state.currentSession?.paymentMethod || 'cash' });
    }

    // 4. Release the table automatically → available for next customer
    if (tableId) {
      this.update('tables', tables =>
        tables.map(t => t.id === tableId ? { ...t, status: 'available' } : t)
      );
      if (DB_ENABLED) {
        DB.updateTableStatus(tableId, 'available');
      }
    }

    console.log(`✅ Auto-closed session ${sessionId} — table released`);
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

  async endSession() {
    const session = this._state.currentSession;
    if (!session) return;

    // Release table only for sessions that had actually claimed it.
    if (session.tableLocked) {
      this.update('tables', tables =>
        tables.map(t => t.id === session.tableId ? { ...t, status: 'available' } : t)
      );
      if (DB_ENABLED) {
        await DB.updateTableStatus(session.tableId, 'available');
      }
    }

    // Sync session closure to DB
    if (DB_ENABLED) {
      await DB.updateSession(session.id, { status: 'closed', ended: true });
    }
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
