/* ============================================
   SS Restaurant — Landing Page
   ============================================ */

function renderLanding() {
  const app = document.getElementById('app');
  const tables = Store.get('tables');
  const availableTables = tables.filter(t => t.status === 'available');

  // Check for QR code table param
  const query = Router.getQuery();
  if (query.table) {
    const table = tables.find(t => t.number === parseInt(query.table));
    if (table) {
      const currentSession = Store.getCurrentSession();
      
      // If we already have an active session for THIS exact table, just resume it
      if (currentSession && currentSession.tableId === table.id) {
        Router.navigate('/' + (currentSession.currentStep || 'menu'));
        return;
      }
      
      // If they have an active session for a DIFFERENT table...
      if (currentSession && currentSession.tableId !== table.id) {
        if (currentSession.orders.length === 0) {
          // Allow switching!
          console.log('🔄 QR Switch table allowed');
        } else {
          // Block if they have real orders
          Toast.error("You already have an active order for Table " + Utils.getTableNumber(currentSession.tableId) + ". Please complete it first.");
          Router.navigate('/' + (currentSession.currentStep || 'menu'));
          return;
        }
      }
      
      // Render a loading state while attempting to lock the table atomically
      app.innerHTML = '<div style="display:flex;min-height:100vh;align-items:center;justify-content:center"><div class="spinner lg"></div></div>';
      
      Store.startSession(table.id).then(session => {
        if (session) {
          Router.navigate('/menu');
        } else {
          // If start session failed (e.g. table occupied by someone else), reset URL and render landing
          window.location.hash = '#/';
          renderLanding();
        }
      });
      return;
    }
  }

  // Only redirect if session is already active for a specific table
  const session = Store.getCurrentSession();
  if (session && session.currentStep) {
     // If we are already in a session, app.js will handle the redirect.
     // We only stay on landing if the user explicitly came here to change table or something.
  }

  app.innerHTML = `
    <div class="landing-page">
      <div class="landing-hero">
        <img src="assets/logo.png" alt="SS Restaurant Logo" class="landing-logo" style="width: 100px; height: 100px; margin-bottom: var(--space-xl);" />
        <h1 class="landing-title" style="color: var(--color-primary); font-size: 2.5rem; margin-bottom: var(--space-xs);">SS Restaurant</h1>
        <p class="landing-subtitle" style="color: var(--text-muted); font-size: var(--font-size-base); font-weight: var(--font-weight-medium);">Welcome to a premium dining experience</p>
        
        <div class="landing-select-wrapper" style="max-width: 400px; margin: var(--space-2xl) auto 0;">
          <label class="form-label" style="text-align: left; display: block; margin-bottom: var(--space-sm);">Choose your Table</label>
          <select id="table-select" class="form-input" style="border-radius: var(--radius-lg); height: 54px; font-size: var(--font-size-base);">
            <option value="">— Select a Table —</option>
            ${availableTables.map(t => `
              <option value="${t.id}">Table ${t.number} (${t.capacity} seats)</option>
            `).join('')}
          </select>
        </div>
        
        <button id="landing-cta" class="btn btn-primary landing-cta" style="max-width: 400px; width: 100%; margin-top: var(--space-lg); border-radius: var(--radius-full); padding: 18px;" disabled>
          Continue
        </button>

        ${availableTables.length === 0 ? `
          <p style="color: var(--color-error); margin-top: var(--space-lg); font-size: var(--font-size-sm); font-weight: 600;">
            ⚠️ All tables are currently occupied.
          </p>
        ` : ''}
      </div>

      <div class="landing-footer">
        <div class="landing-footer-inner">
          <div class="landing-contact">
            <h4 style="margin-bottom: var(--space-md);">Contact Us</h4>
            <a href="tel:+919876543210">📞 +91 9876543210</a>
            <a href="mailto:hello@ssrestaurant.com">📧 hello@ssrestaurant.com</a>
          </div>
          <div class="landing-social">
            <h4 style="margin-bottom: var(--space-md);">Follow Us</h4>
            <a href="https://www.instagram.com/" target="_blank">📸 Instagram</a>
            <a href="https://www.facebook.com/" target="_blank">📘 Facebook</a>
          </div>
        </div>
      </div>

    </div>
  `;

  // Event Listeners
  const selectEl = document.getElementById('table-select');
  const ctaBtn = document.getElementById('landing-cta');

  selectEl.addEventListener('change', () => {
    const val = selectEl.value;
    if (val) {
      const table = tables.find(t => t.id === val);
      ctaBtn.textContent = `Continue with Table ${table.number}`;
      ctaBtn.disabled = false;
    } else {
      ctaBtn.textContent = 'Select a Table to Continue';
      ctaBtn.disabled = true;
    }
  });

  ctaBtn.addEventListener('click', async () => {
    const tableId = selectEl.value;
    if (!tableId) return;
    
    ctaBtn.disabled = true;
    const originalText = ctaBtn.textContent;
    ctaBtn.innerHTML = '<span class="payment-spinner" style="width: 16px; height: 16px; border-width: 2px; border-color: white white transparent; display: inline-block;"></span>';

    const session = await Store.startSession(tableId);
    if (session) {
      Router.navigate('/menu');
    } else {
      ctaBtn.disabled = false;
      ctaBtn.textContent = originalText;
    }
  });
}
