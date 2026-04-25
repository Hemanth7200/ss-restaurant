-- ============================================
-- SS Restaurant — Supabase Setup SQL
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- 1. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  is_veg BOOLEAN DEFAULT true,
  image TEXT DEFAULT '🍽️',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLES
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  number INT NOT NULL UNIQUE,
  capacity INT DEFAULT 4,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SESSIONS (dining sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  table_id TEXT REFERENCES tables(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'closed')),
  payment_method TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  table_id TEXT REFERENCES tables(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  special_instructions TEXT,
  subtotal INT DEFAULT 0,
  gst INT DEFAULT 0,
  total INT DEFAULT 0,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  item_id TEXT,
  item_name TEXT NOT NULL,
  item_price INT NOT NULL,
  quantity INT DEFAULT 1,
  is_veg BOOLEAN DEFAULT true,
  image TEXT
);

-- 7. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  food_rating INT,
  service_rating INT,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. COMPLAINTS
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  table_id TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. ORDER ID SEQUENCE
CREATE SEQUENCE IF NOT EXISTS order_id_seq START WITH 101;

-- ============================================
-- SEED DATA
-- ============================================

-- Admin User
INSERT INTO admin_users (id, name, email, password, role) VALUES
  ('admin-1', 'Steve Rogers', 'steverogers122345@gmail.com', 'Steverogers122345', 'Admin')
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, sort_order, active) VALUES
  ('cat-1', 'Veg Starters', 1, true),
  ('cat-2', 'Non-Veg Starters', 2, true),
  ('cat-3', 'Main Course Veg', 3, true),
  ('cat-4', 'Main Course Non-Veg', 4, true),
  ('cat-5', 'Breads', 5, true),
  ('cat-6', 'Rice & Biryani', 6, true),
  ('cat-7', 'Drinks', 7, true),
  ('cat-8', 'Desserts', 8, true)
ON CONFLICT (id) DO NOTHING;

-- Menu Items
INSERT INTO menu_items (id, name, description, price, category_id, is_veg, image, active) VALUES
  ('m-1', 'Paneer Tikka', 'Marinated cottage cheese cubes grilled in tandoor with bell peppers', 280, 'cat-1', true, '🧀', true),
  ('m-2', 'Veg Spring Rolls', 'Crispy rolls stuffed with vegetables and glass noodles', 220, 'cat-1', true, '🥟', true),
  ('m-3', 'Hara Bhara Kebab', 'Spinach and green pea patties with mild spices', 240, 'cat-1', true, '🥬', true),
  ('m-4', 'Crispy Corn', 'Golden fried corn kernels tossed in spicy seasoning', 200, 'cat-1', true, '🌽', true),
  ('m-5', 'Chicken Tikka', 'Tender chicken marinated in yogurt and spices, chargrilled', 320, 'cat-2', false, '🍗', true),
  ('m-6', 'Mutton Seekh Kebab', 'Minced lamb kebabs with aromatic herbs on skewers', 380, 'cat-2', false, '🥩', true),
  ('m-7', 'Fish Amritsari', 'Batter-fried fish fillets with Amritsari masala', 350, 'cat-2', false, '🐟', true),
  ('m-8', 'Tandoori Prawns', 'Jumbo prawns marinated in tandoori spices', 420, 'cat-2', false, '🦐', true),
  ('m-9', 'Paneer Butter Masala', 'Cottage cheese in rich tomato-cashew gravy', 300, 'cat-3', true, '🧈', true),
  ('m-10', 'Dal Makhani', 'Slow-cooked black lentils in creamy butter sauce', 260, 'cat-3', true, '🫘', true),
  ('m-11', 'Veg Kolhapuri', 'Mixed vegetables in spicy Kolhapuri masala', 270, 'cat-3', true, '🍛', true),
  ('m-12', 'Palak Paneer', 'Cottage cheese cubes in creamy spinach gravy', 280, 'cat-3', true, '🥗', true),
  ('m-13', 'Butter Chicken', 'Tender chicken in smoky tomato-butter sauce', 340, 'cat-4', false, '🍖', true),
  ('m-14', 'Mutton Rogan Josh', 'Aromatic Kashmiri lamb curry with whole spices', 420, 'cat-4', false, '🍲', true),
  ('m-15', 'Chicken Chettinad', 'South Indian style chicken with roasted spices', 360, 'cat-4', false, '🌶️', true),
  ('m-16', 'Fish Curry', 'Traditional coastal fish curry with coconut base', 380, 'cat-4', false, '🐠', true),
  ('m-17', 'Butter Naan', 'Soft leavened bread brushed with butter', 60, 'cat-5', true, '🫓', true),
  ('m-18', 'Garlic Naan', 'Naan topped with garlic and fresh coriander', 70, 'cat-5', true, '🧄', true),
  ('m-19', 'Tandoori Roti', 'Whole wheat bread baked in clay oven', 40, 'cat-5', true, '🍞', true),
  ('m-20', 'Laccha Paratha', 'Layered flaky whole wheat paratha', 60, 'cat-5', true, '🥞', true),
  ('m-21', 'Veg Biryani', 'Fragrant basmati rice with mixed vegetables and herbs', 260, 'cat-6', true, '🍚', true),
  ('m-22', 'Chicken Biryani', 'Hyderabadi dum biryani with succulent chicken', 320, 'cat-6', false, '🍛', true),
  ('m-23', 'Mutton Biryani', 'Royal mutton biryani with saffron and rose water', 380, 'cat-6', false, '🥘', true),
  ('m-24', 'Steamed Rice', 'Plain steamed basmati rice', 120, 'cat-6', true, '🍙', true),
  ('m-25', 'Mango Lassi', 'Creamy yogurt smoothie with fresh mango pulp', 140, 'cat-7', true, '🥭', true),
  ('m-26', 'Masala Chaas', 'Spiced buttermilk with roasted cumin', 80, 'cat-7', true, '🥛', true),
  ('m-27', 'Fresh Lime Soda', 'Refreshing lime with soda and mint', 100, 'cat-7', true, '🍋', true),
  ('m-28', 'Cold Coffee', 'Chilled creamy coffee with ice cream', 160, 'cat-7', true, '☕', true),
  ('m-29', 'Gulab Jamun', 'Soft milk dumplings soaked in rose-cardamom syrup', 120, 'cat-8', true, '🍩', true),
  ('m-30', 'Rasmalai', 'Cottage cheese patties in saffron-pistachio milk', 140, 'cat-8', true, '🍮', true),
  ('m-31', 'Brownie with Ice Cream', 'Warm chocolate brownie with vanilla ice cream', 200, 'cat-8', true, '🍫', true),
  ('m-32', 'Kulfi', 'Traditional Indian ice cream with pistachios', 120, 'cat-8', true, '🍦', true)
ON CONFLICT (id) DO NOTHING;

-- Tables
INSERT INTO tables (id, number, capacity, status) VALUES
  ('table-1', 1, 4, 'available'),
  ('table-2', 2, 4, 'available'),
  ('table-3', 3, 6, 'available'),
  ('table-4', 4, 2, 'available')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (Permissive for restaurant use)
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Allow full access via anon key (internal restaurant tool)
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tables" ON tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on admin_users" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on complaints" ON complaints FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for orders and tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
