/* ============================================
   SS Restaurant — Utilities
   ============================================ */

const Utils = {
  formatPrice(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  },

  formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  },

  formatDateTime(isoString) {
    return this.formatDate(isoString) + ', ' + this.formatTime(isoString);
  },

  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  },

  generateId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
  },

  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  getTableNumber(tableId) {
    const table = Store.get('tables').find(t => t.id === tableId);
    return table ? table.number : '?';
  },

  formatSessionNumber(num) {
    if (!num) return '---';
    return 'S-' + String(num).padStart(3, '0');
  },

  getStatusBadgeClass(status) {
    const map = {
      'new': 'badge-info',
      'preparing': 'badge-warning',
      'completed': 'badge-success',
      'delivered': 'badge-success',
      'cancelled': 'badge-error'
    };
    return map[status] || 'badge-info';
  },

  getStatusLabel(status) {
    const map = {
      'new': 'New',
      'preparing': 'Preparing',
      // Backward compatibility: old "completed" records are treated as delivered.
      'completed': 'Delivered',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return map[status] || status;
  },

  getFoodGradient(emoji) {
    const gradients = {
      '🧀': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      '🥟': 'linear-gradient(135deg, #fde68a 0%, #d97706 100%)',
      '🥬': 'linear-gradient(135deg, #86efac 0%, #22c55e 100%)',
      '🌽': 'linear-gradient(135deg, #fde047 0%, #eab308 100%)',
      '🍗': 'linear-gradient(135deg, #fdba74 0%, #ea580c 100%)',
      '🥩': 'linear-gradient(135deg, #fca5a5 0%, #dc2626 100%)',
      '🐟': 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',
      '🦐': 'linear-gradient(135deg, #fda4af 0%, #f43f5e 100%)',
      '🧈': 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
      '🫘': 'linear-gradient(135deg, #d4a373 0%, #8b5e34 100%)',
      '🍛': 'linear-gradient(135deg, #fdba74 0%, #ea580c 100%)',
      '🥗': 'linear-gradient(135deg, #86efac 0%, #16a34a 100%)',
      '🍖': 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)',
      '🍲': 'linear-gradient(135deg, #d4a373 0%, #92400e 100%)',
      '🌶️': 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
      '🐠': 'linear-gradient(135deg, #67e8f9 0%, #0891b2 100%)',
      '🫓': 'linear-gradient(135deg, #e8d5b7 0%, #b08d57 100%)',
      '🧄': 'linear-gradient(135deg, #f5f0e8 0%, #c4a35a 100%)',
      '🍞': 'linear-gradient(135deg, #e8d5b7 0%, #a0845c 100%)',
      '🥞': 'linear-gradient(135deg, #fde68a 0%, #ca8a04 100%)',
      '🍚': 'linear-gradient(135deg, #f0f0f0 0%, #d1d5db 100%)',
      '🥘': 'linear-gradient(135deg, #fdba74 0%, #c2410c 100%)',
      '🍙': 'linear-gradient(135deg, #f5f5f5 0%, #d4d4d4 100%)',
      '🥭': 'linear-gradient(135deg, #fde047 0%, #f97316 100%)',
      '🥛': 'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)',
      '🍋': 'linear-gradient(135deg, #fef08a 0%, #84cc16 100%)',
      '☕': 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)',
      '🍩': 'linear-gradient(135deg, #d4a373 0%, #92400e 100%)',
      '🍮': 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%)',
      '🍫': 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
      '🍦': 'linear-gradient(135deg, #fbcfe8 0%, #ec4899 100%)'
    };
    return gradients[emoji] || 'linear-gradient(135deg, #f5f5f5 0%, #d4d4d4 100%)';
  }
};
