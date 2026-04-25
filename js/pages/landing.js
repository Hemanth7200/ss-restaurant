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
      
      // If they have an active session for a DIFFERENT table, block them!
      if (currentSession && currentSession.tableId !== table.id) {
        Toast.error("You already have an active order for Table " + Utils.getTableNumber(currentSession.tableId) + ". Please complete it first.");
        Router.navigate('/' + (currentSession.currentStep || 'menu'));
        return;
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

  // Check if there's already an active session (manual fallback)
  const session = Store.getCurrentSession();
  if (session) {
    Router.navigate('/' + (session.currentStep || 'menu'));
    return;
  }

  app.innerHTML = `
    <div class="landing-page">
      <div class="landing-hero">
        <img src="assets/logo.png" alt="SS Restaurant Logo" class="landing-logo" />
        <h1 class="landing-title">SS Restaurant</h1>
        <p class="landing-subtitle">Please select your table to continue</p>
        
        <div class="landing-select-wrapper">
          <select id="table-select" class="form-input">
            <option value="">— Select a Table —</option>
            ${availableTables.map(t => `
              <option value="${t.id}">Table ${t.number} (${t.capacity} seats)</option>
            `).join('')}
          </select>
        </div>
        
        <button id="landing-cta" class="btn btn-primary landing-cta" disabled>
          Select a Table to Continue
        </button>

        ${availableTables.length === 0 ? `
          <p style="color: var(--text-muted); margin-top: var(--space-md); font-size: var(--font-size-sm);">
            All tables are currently occupied. Please wait or ask staff for assistance.
          </p>
        ` : ''}
      </div>

      <div class="landing-footer">
        <div class="landing-footer-inner">
          <div class="landing-contact">
            <a href="tel:+919876543210">📞 +91 9876543210</a>
            <a href="mailto:hello@ssrestaurant.com">📧 hello@ssrestaurant.com</a>
          </div>
          <div class="landing-social">
            <a href="https://www.instagram.com/" target="_blank">📸 Instagram</a>
            <a href="https://www.facebook.com/" target="_blank">📘 Facebook</a>
          </div>
        </div>
      </div>

      <!-- Chat Widget -->
      <button class="chat-widget-btn" id="chat-widget-toggle" title="Complaints & Requests">💬</button>
      <div class="chat-panel hidden" id="chat-panel">
        <div class="chat-panel-header">
          <h4>Complaints & Requests</h4>
          <button class="modal-close" id="chat-close">✕</button>
        </div>
        <div class="chat-panel-body">
          <div class="form-group">
            <label class="form-label">Your Message</label>
            <textarea id="chat-message" class="form-input" placeholder="Tell us how we can help..." rows="4"></textarea>
          </div>
          <button class="btn btn-primary btn-full" id="chat-send">Send Message</button>
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

  // Chat Widget
  const chatToggle = document.getElementById('chat-widget-toggle');
  const chatPanel = document.getElementById('chat-panel');
  const chatClose = document.getElementById('chat-close');
  const chatSend = document.getElementById('chat-send');

  chatToggle.addEventListener('click', () => chatPanel.classList.toggle('hidden'));
  chatClose.addEventListener('click', () => chatPanel.classList.add('hidden'));

  chatSend.addEventListener('click', () => {
    const msg = document.getElementById('chat-message').value.trim();
    if (msg) {
      const complaint = {
        id: Utils.generateId('comp'),
        message: msg,
        createdAt: new Date().toISOString(),
        tableId: null
      };
      Store.update('complaints', complaints => [...complaints, complaint]);
      DB.saveComplaint(complaint);
      document.getElementById('chat-message').value = '';
      chatPanel.classList.add('hidden');
      Toast.success('Your message has been sent. Thank you!');
    }
  });
}
