/* ============================================
   SS Restaurant — Data (Seed Data)
   ============================================ */

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Veg Starters', order: 1, active: true },
  { id: 'cat-2', name: 'Non-Veg Starters', order: 2, active: true },
  { id: 'cat-3', name: 'Main Course Veg', order: 3, active: true },
  { id: 'cat-4', name: 'Main Course Non-Veg', order: 4, active: true },
  { id: 'cat-5', name: 'Breads', order: 5, active: true },
  { id: 'cat-6', name: 'Rice & Biryani', order: 6, active: true },
  { id: 'cat-7', name: 'Drinks', order: 7, active: true },
  { id: 'cat-8', name: 'Desserts', order: 8, active: true }
];

const DEFAULT_MENU_ITEMS = [
  // Veg Starters (Generated images)
  { id: 'm-1', name: 'Paneer Tikka', description: 'Marinated cottage cheese cubes grilled in tandoor with bell peppers', price: 280, category: 'cat-1', isVeg: true, active: true, image: 'assets/food/paneer_tikka.png' },
  { id: 'm-2', name: 'Veg Spring Rolls', description: 'Crispy rolls stuffed with vegetables and glass noodles', price: 220, category: 'cat-1', isVeg: true, active: true, image: 'assets/food/veg_spring_rolls.png' },
  { id: 'm-3', name: 'Hara Bhara Kebab', description: 'Spinach and green pea patties with mild spices', price: 240, category: 'cat-1', isVeg: true, active: true, image: 'assets/food/hara_bhara_kebab.png' },
  { id: 'm-4', name: 'Crispy Corn', description: 'Golden fried corn kernels tossed in spicy seasoning', price: 200, category: 'cat-1', isVeg: true, active: true, image: 'assets/food/crispy_corn.png' },

  // Non-Veg Starters (Generated images)
  { id: 'm-5', name: 'Chicken Tikka', description: 'Tender chicken marinated in yogurt and spices, chargrilled', price: 320, category: 'cat-2', isVeg: false, active: true, image: 'assets/food/chicken_tikka.png' },
  { id: 'm-6', name: 'Mutton Seekh Kebab', description: 'Minced lamb kebabs with aromatic herbs on skewers', price: 380, category: 'cat-2', isVeg: false, active: true, image: 'assets/food/seekh_kebab.png' },
  { id: 'm-7', name: 'Fish Amritsari', description: 'Batter-fried fish fillets with Amritsari masala', price: 350, category: 'cat-2', isVeg: false, active: true, image: 'assets/food/fish_amritsari.png' },
  { id: 'm-8', name: 'Tandoori Prawns', description: 'Jumbo prawns marinated in tandoori spices', price: 420, category: 'cat-2', isVeg: false, active: true, image: 'assets/food/tandoori_prawns.png' },

  // Main Course Veg (Generated images)
  { id: 'm-9', name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato-cashew gravy', price: 300, category: 'cat-3', isVeg: true, active: true, image: 'assets/food/paneer_butter_masala.png' },
  { id: 'm-10', name: 'Dal Makhani', description: 'Slow-cooked black lentils in creamy butter sauce', price: 260, category: 'cat-3', isVeg: true, active: true, image: 'assets/food/dal_makhani.png' },
  { id: 'm-11', name: 'Veg Kolhapuri', description: 'Mixed vegetables in spicy Kolhapuri masala', price: 270, category: 'cat-3', isVeg: true, active: true, image: 'assets/food/veg_kolhapuri.png' },
  { id: 'm-12', name: 'Palak Paneer', description: 'Cottage cheese cubes in creamy spinach gravy', price: 280, category: 'cat-3', isVeg: true, active: true, image: 'assets/food/palak_paneer.png' },

  // Main Course Non-Veg (Generated images)
  { id: 'm-13', name: 'Butter Chicken', description: 'Tender chicken in smoky tomato-butter sauce', price: 340, category: 'cat-4', isVeg: false, active: true, image: 'assets/food/butter_chicken.png' },
  { id: 'm-14', name: 'Mutton Rogan Josh', description: 'Aromatic Kashmiri lamb curry with whole spices', price: 420, category: 'cat-4', isVeg: false, active: true, image: 'assets/food/mutton_rogan_josh.png' },
  { id: 'm-15', name: 'Chicken Chettinad', description: 'South Indian style chicken with roasted spices', price: 360, category: 'cat-4', isVeg: false, active: true, image: 'assets/food/chicken_chettinad.png' },
  { id: 'm-16', name: 'Fish Curry', description: 'Traditional coastal fish curry with coconut base', price: 380, category: 'cat-4', isVeg: false, active: true, image: 'assets/food/fish_curry.png' },

  // Breads (Unsplash - quota reached for generation)
  { id: 'm-17', name: 'Butter Naan', description: 'Soft leavened bread brushed with butter', price: 60, category: 'cat-5', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=300&fit=crop' },
  { id: 'm-18', name: 'Garlic Naan', description: 'Naan topped with garlic and fresh coriander', price: 70, category: 'cat-5', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1600628421060-939639517883?w=300&h=300&fit=crop' },
  { id: 'm-19', name: 'Tandoori Roti', description: 'Whole wheat bread baked in clay oven', price: 40, category: 'cat-5', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=300&fit=crop' },
  { id: 'm-20', name: 'Laccha Paratha', description: 'Layered flaky whole wheat paratha', price: 60, category: 'cat-5', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&h=300&fit=crop' },

  // Rice & Biryani (Unsplash)
  { id: 'm-21', name: 'Veg Biryani', description: 'Fragrant basmati rice with mixed vegetables and herbs', price: 260, category: 'cat-6', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=300&fit=crop' },
  { id: 'm-22', name: 'Chicken Biryani', description: 'Hyderabadi dum biryani with succulent chicken', price: 320, category: 'cat-6', isVeg: false, active: true, image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=300&h=300&fit=crop' },
  { id: 'm-23', name: 'Mutton Biryani', description: 'Royal mutton biryani with saffron and rose water', price: 380, category: 'cat-6', isVeg: false, active: true, image: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=300&h=300&fit=crop' },
  { id: 'm-24', name: 'Steamed Rice', description: 'Plain steamed basmati rice', price: 120, category: 'cat-6', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1536304993881-460e32f50647?w=300&h=300&fit=crop' },

  // Drinks (Unsplash)
  { id: 'm-25', name: 'Mango Lassi', description: 'Creamy yogurt smoothie with fresh mango pulp', price: 140, category: 'cat-7', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&h=300&fit=crop' },
  { id: 'm-26', name: 'Masala Chaas', description: 'Spiced buttermilk with roasted cumin', price: 80, category: 'cat-7', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300&h=300&fit=crop' },
  { id: 'm-27', name: 'Fresh Lime Soda', description: 'Refreshing lime with soda and mint', price: 100, category: 'cat-7', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=300&h=300&fit=crop' },
  { id: 'm-28', name: 'Cold Coffee', description: 'Chilled creamy coffee with ice cream', price: 160, category: 'cat-7', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=300&fit=crop' },

  // Desserts (Unsplash)
  { id: 'm-29', name: 'Gulab Jamun', description: 'Soft milk dumplings soaked in rose-cardamom syrup', price: 120, category: 'cat-8', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1615832494873-b0c52d519696?w=300&h=300&fit=crop' },
  { id: 'm-30', name: 'Rasmalai', description: 'Cottage cheese patties in saffron-pistachio milk', price: 140, category: 'cat-8', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=300&fit=crop' },
  { id: 'm-31', name: 'Brownie with Ice Cream', description: 'Warm chocolate brownie with vanilla ice cream', price: 200, category: 'cat-8', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&h=300&fit=crop' },
  { id: 'm-32', name: 'Kulfi', description: 'Traditional Indian ice cream with pistachios', price: 120, category: 'cat-8', isVeg: true, active: true, image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=300&h=300&fit=crop' }
];

const DEFAULT_TABLES = [
  { id: 'table-1', number: 1, capacity: 4, status: 'available' },
  { id: 'table-2', number: 2, capacity: 4, status: 'available' },
  { id: 'table-3', number: 3, capacity: 6, status: 'available' },
  { id: 'table-4', number: 4, capacity: 2, status: 'available' }
];

const DEFAULT_ADMIN_USERS = [
  {
    id: 'admin-1',
    name: 'Steve Rogers',
    email: 'steverogers122345@gmail.com',
    password: 'Steverogers122345',
    role: 'Admin'
  }
];

const GST_RATE = 0.05; // 5% GST
const STARTING_ORDER_ID = 101;
