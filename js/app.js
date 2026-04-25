/* ============================================
   SS Restaurant — Main App
   ============================================ */

(async function () {
  'use strict';

  // Initialize store (loads from sessionStorage + Supabase)
  await Store.init();

  // Initialize toast
  Toast.init();

  // Register routes
  Router.register('/', renderLanding);
  Router.register('/menu', renderMenu);
  Router.register('/cart', renderCart);
  Router.register('/details', renderDetails);
  Router.register('/confirmation', renderConfirmation);
  Router.register('/payment', renderPayment);
  Router.register('/review', renderReview);

  // Admin routes
  Router.register('/admin', renderAdminLogin);
  Router.register('/admin/dashboard', renderAdminDashboard);
  Router.register('/admin/orders', renderAdminOrders);
  Router.register('/admin/payments', renderAdminPayments);
  Router.register('/admin/menu', renderAdminMenu);
  Router.register('/admin/categories', renderAdminCategories);
  Router.register('/admin/tables', renderAdminTables);
  Router.register('/admin/users', renderAdminUsers);

  // Session restore — if there's an active session and user is on landing, redirect
  const session = Store.getCurrentSession();
  const hash = window.location.hash;

  if (session && (!hash || hash === '#/' || hash === '#')) {
    const step = session.currentStep || 'menu';
    window.location.hash = '#/' + step;
  }

  // Initialize router
  Router.init();

  // Show connection status
  if (DB_ENABLED) {
    Toast.success('Connected to database');
  }
})();
