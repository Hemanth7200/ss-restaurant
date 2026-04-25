/* ============================================
   SS Restaurant — Supabase Client
   ============================================
   
   HOW TO SET UP:
   1. Go to your Supabase dashboard → Settings → API
   2. Copy your Project URL and paste below
   3. Copy your anon/public key and paste below
   ============================================ */

// ✅ SUPABASE CREDENTIALS CONFIGURED
const SUPABASE_URL = 'https://szjehotidiaoghtozlbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6amVob3RpZGlhb2dodG96bGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTkyOTgsImV4cCI6MjA5MjUzNTI5OH0.ovpO2pUkfHkbz1o3-NVWgMX-nDlkqWTZLF5xpUHAhn8';

// Initialize Supabase client
let supabaseClient = null;
let DB_ENABLED = false;

function initSupabase() {
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.warn('⚠️ Supabase not configured. Running in localStorage-only mode. Edit js/supabase.js to connect.');
    DB_ENABLED = false;
    return;
  }

  try {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    DB_ENABLED = true;
    console.log('✅ Supabase connected');
  } catch (e) {
    console.error('❌ Supabase init failed:', e);
    DB_ENABLED = false;
  }
}

// ============================================
// Database Operations
// ============================================

const DB = {

  // ---- Categories ----
  async getCategories() {
    if (!DB_ENABLED) return null;
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) { console.error('DB getCategories:', error); return null; }
    return data.map(c => ({
      id: c.id, name: c.name, order: c.sort_order, active: c.active
    }));
  },

  async upsertCategory(cat) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('categories').upsert({
      id: cat.id, name: cat.name, sort_order: cat.order, active: cat.active
    });
    if (error) console.error('DB upsertCategory:', error);
  },

  async deleteCategory(id) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('categories').delete().eq('id', id);
    if (error) console.error('DB deleteCategory:', error);
  },

  // ---- Menu Items ----
  async getMenuItems() {
    if (!DB_ENABLED) return null;
    const { data, error } = await supabaseClient
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('DB getMenuItems:', error); return null; }
    return data.map(m => ({
      id: m.id, name: m.name, description: m.description, price: m.price,
      category: m.category_id, isVeg: m.is_veg, image: m.image, active: m.active
    }));
  },

  async upsertMenuItem(item) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('menu_items').upsert({
      id: item.id, name: item.name, description: item.description, price: item.price,
      category_id: item.category, is_veg: item.isVeg, image: item.image, active: item.active
    });
    if (error) console.error('DB upsertMenuItem:', error);
  },

  async deleteMenuItem(id) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
    if (error) console.error('DB deleteMenuItem:', error);
  },

  // ---- Tables ----
  async getTables() {
    if (!DB_ENABLED) return null;
    const { data, error } = await supabaseClient
      .from('tables')
      .select('*')
      .order('number', { ascending: true });
    if (error) { console.error('DB getTables:', error); return null; }
    return data.map(t => ({
      id: t.id, number: t.number, capacity: t.capacity, status: t.status
    }));
  },

  async upsertTable(table) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('tables').upsert({
      id: table.id, number: table.number, capacity: table.capacity, status: table.status
    });
    if (error) console.error('DB upsertTable:', error);
  },

  async updateTableStatus(id, status) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('tables').update({ status }).eq('id', id);
    if (error) console.error('DB updateTableStatus:', error);
  },

  async deleteTable(id) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('tables').delete().eq('id', id);
    if (error) console.error('DB deleteTable:', error);
  },

  // ---- Sessions ----
  async createSession(session) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('sessions').insert({
      id: session.id, table_id: session.tableId,
      customer_name: session.customerName || null,
      customer_phone: session.customerPhone || null,
      status: 'active'
    });
    if (error) console.error('DB createSession:', error);
  },

  async updateSession(id, updates) {
    if (!DB_ENABLED) return;
    const mapped = {};
    if (updates.customerName !== undefined) mapped.customer_name = updates.customerName;
    if (updates.customerPhone !== undefined) mapped.customer_phone = updates.customerPhone;
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.paymentMethod !== undefined) mapped.payment_method = updates.paymentMethod;
    if (updates.ended) mapped.ended_at = new Date().toISOString();
    const { error } = await supabaseClient.from('sessions').update(mapped).eq('id', id);
    if (error) console.error('DB updateSession:', error);
  },

  // ---- Orders ----
  async getNextOrderId() {
    if (!DB_ENABLED) return null;
    const { data, error } = await supabaseClient.rpc('nextval', { seq_name: 'order_id_seq' });
    if (error) {
      const { data: orders } = await supabaseClient
        .from('orders').select('id').order('id', { ascending: false }).limit(1);
      return orders && orders.length > 0 ? orders[0].id + 1 : 101;
    }
    return data;
  },

  async createOrder(order) {
    if (!DB_ENABLED) return true;
    const { error: orderErr } = await supabaseClient.from('orders').insert({
      id: order.id,
      session_id: order.sessionId,
      table_id: order.tableId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      special_instructions: order.specialInstructions || '',
      subtotal: order.subtotal,
      gst: order.gst,
      total: order.total,
      status: order.status || 'new',
      created_at: order.createdAt
    });
    if (orderErr) { 
      console.error('DB createOrder:', orderErr); 
      return false; 
    }

    if (order.items && order.items.length > 0) {
      const items = order.items.map(item => ({
        order_id: order.id,
        item_id: item.itemId,
        item_name: item.name,
        item_price: item.price,
        quantity: item.quantity,
        is_veg: item.isVeg,
        image: item.image
      }));
      const { error: itemsErr } = await supabaseClient.from('order_items').insert(items);
      if (itemsErr) console.error('DB createOrder items:', itemsErr);
    }
    return true;
  },

  async getOrders() {
    if (!DB_ENABLED) return null;
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('DB getOrders:', error); return null; }

    const orderIds = orders.map(o => o.id);
    let allItems = [];
    if (orderIds.length > 0) {
      const { data: items } = await supabaseClient
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      allItems = items || [];
    }

    return orders.map(o => ({
      id: o.id,
      sessionId: o.session_id,
      tableId: o.table_id,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      specialInstructions: o.special_instructions,
      subtotal: o.subtotal,
      gst: o.gst,
      total: o.total,
      status: o.status,
      createdAt: o.created_at,
      items: allItems.filter(i => i.order_id === o.id).map(i => ({
        itemId: i.item_id,
        name: i.item_name,
        price: i.item_price,
        quantity: i.quantity,
        isVeg: i.is_veg,
        image: i.image
      }))
    }));
  },

  async updateOrderStatus(orderId, status) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('orders').update({ status }).eq('id', orderId);
    if (error) console.error('DB updateOrderStatus:', error);
  },

  // ---- Admin Users ----
  async getAdminUsers() {
    if (!DB_ENABLED) return null;
    const { data, error } = await supabaseClient.from('admin_users').select('*');
    if (error) { console.error('DB getAdminUsers:', error); return null; }
    return data.map(u => ({
      id: u.id, name: u.name, email: u.email, password: u.password, role: u.role
    }));
  },

  async upsertAdminUser(user) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('admin_users').upsert({
      id: user.id, name: user.name, email: user.email, password: user.password, role: user.role
    });
    if (error) console.error('DB upsertAdminUser:', error);
  },

  async deleteAdminUser(id) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('admin_users').delete().eq('id', id);
    if (error) console.error('DB deleteAdminUser:', error);
  },

  // ---- Reviews ----
  async saveReview(review) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('reviews').insert({
      id: review.id,
      session_id: review.sessionId,
      food_rating: review.foodRating,
      service_rating: review.serviceRating,
      feedback: review.feedback,
      created_at: review.createdAt
    });
    if (error) console.error('DB saveReview:', error);
  },

  // ---- Complaints ----
  async saveComplaint(complaint) {
    if (!DB_ENABLED) return;
    const { error } = await supabaseClient.from('complaints').insert({
      id: complaint.id,
      table_id: complaint.tableId,
      message: complaint.message,
      created_at: complaint.createdAt
    });
    if (error) console.error('DB saveComplaint:', error);
  },

  // ---- Realtime ----
  subscribeToOrders(callback) {
    if (!DB_ENABLED) return null;
    return supabaseClient
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
      .subscribe();
  },

  subscribeToTables(callback) {
    if (!DB_ENABLED) return null;
    return supabaseClient
      .channel('tables-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, callback)
      .subscribe();
  }
};
