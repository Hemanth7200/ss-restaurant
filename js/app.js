/* ============================================
   SS Restaurant — Main App
   ============================================ */

(async function () {
  'use strict';

  // Initialize store (loads from shared browser storage + Supabase)
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
  Router.register('/track', renderTrackOrder);
  Router.register('/info', renderTableInfo);
  Router.register('/call', renderCallWaiter);
  Router.register('/review', renderReview);
  Router.register('/menuitems', renderMenuItems);

  // Admin routes
  Router.register('/admin', renderAdminLogin);
  Router.register('/admin/dashboard', renderAdminDashboard);
  Router.register('/admin/orders', renderAdminOrders);
  Router.register('/admin/payments', renderAdminPayments);
  Router.register('/admin/sessions', renderAdminSessions);
  Router.register('/admin/menu', renderAdminMenu);
  Router.register('/admin/categories', renderAdminCategories);
  Router.register('/admin/tables', renderAdminTables);
  Router.register('/admin/users', renderAdminUsers);

  // Session restore — if there's an active session, ensure we are on the right step
  const session = Store.getCurrentSession();
  const hash = window.location.hash;
  const currentPath = hash.replace('#', '').split('?')[0] || '/';

  if (session) {
    const savedStep = '/' + (session.currentStep || 'menu');
    // If on landing or a different customer page, redirect to the saved step
    if (currentPath === '/' || currentPath === '') {
      Router.navigate(savedStep);
    }
  }

  // Initialize router
  Router.init();
})();
