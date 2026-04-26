/* ============================================
   SS Restaurant — Toast Notifications
   ============================================ */

const Toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 3000) {
    // Disabled as requested: "No need the action pop made in the admin portal & customer portal"
    console.log(`[Toast ${type}] ${message}`);
    return;
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  warning(msg) { this.show(msg, 'warning'); },
  info(msg) { this.show(msg, 'info'); }
};
