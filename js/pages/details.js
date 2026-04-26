/* ============================================
   SS Restaurant — Customer Details Page
   ============================================ */

function renderDetails() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }
  if (session.cart.length === 0) { Router.navigate('/menu'); return; }

  // ── AUTO-PLACE on repeat orders ──
  // If the customer already provided their info in a previous order
  // during this session, skip the form and place the order directly.
  if (session.customerInfo && session.customerInfo.name && session.customerInfo.phone && session.orders.length > 0) {
    app.innerHTML = `
      <div style="display:flex;min-height:100vh;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
        <div class="payment-spinner" style="width:36px;height:36px;border-width:3px;"></div>
        <p style="color:var(--text-muted);font-weight:600;">Placing your order...</p>
      </div>
    `;

    Store.placeOrder(session.customerInfo, '').then(result => {
      if (result.success) {
        Router.navigate('/confirmation');
      } else {
        // If auto-place fails, fall back to showing the form
        showDetailsForm(app, session);
      }
    }).catch(() => {
      showDetailsForm(app, session);
    });
    return;
  }

  // ── First-time order: show the details form ──
  showDetailsForm(app, session);
}

function showDetailsForm(app, session) {
  Store.updateSession({ currentStep: 'details' });
  const tableNum = Utils.getTableNumber(session.tableId);

  // Pre-fill from previous order info
  const prevName = session.customerInfo ? session.customerInfo.name : '';
  const prevPhone = session.customerInfo ? session.customerInfo.phone : '';

  app.innerHTML = `
    <div class="menu-page">
      <!-- Desktop Sidebar -->
      <aside class="menu-sidebar">
        <div class="customer-header-left" style="margin-bottom: var(--space-xl);">
          <img src="assets/logo.png" alt="Logo" class="customer-header-logo" style="width: 48px; height: 48px;" />
          <div>
            <div class="customer-header-title">SS Restaurant</div>
            <div class="customer-header-table">Table ${tableNum}</div>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <a href="#/menu" class="nav-item">
            <span>🏠</span> Menu
          </a>
          <a href="#/cart" class="nav-item">
            <span>🛒</span> Your Cart
          </a>
          <a href="#/info" class="nav-item">
            <span>ℹ️</span> Table Info
          </a>
          <a href="#/call" class="nav-item">
            <span>📞</span> Call Waiter
          </a>
        </nav>

        <div class="slogan-card">
          <div class="slogan-text">Good food<br>Good mood ♡</div>
          <img src="assets/leaf-decor.png" class="leaf-decor" alt="" onerror="this.style.display='none'" />
        </div>
      </aside>

      <!-- Main Content -->
      <main class="menu-main">
        <header class="customer-header">
          <div class="customer-header-left">
            <button class="cart-back-btn" id="details-back">←</button>
            <div>
              <div class="customer-header-title">Your Details</div>
              <div class="customer-header-table">Table ${tableNum}</div>
            </div>
          </div>
        </header>

        <div class="details-page">
          <h2>Almost there!</h2>
          <p style="color: var(--text-muted); margin-bottom: var(--space-xl);">Please provide your details to place the order.</p>

          <div class="details-form">
            <div class="form-group">
              <label class="form-label">Mobile Number *</label>
              <div class="form-input-group">
                <span class="input-prefix">+91</span>
                <input type="tel" id="input-phone" class="form-input" placeholder="Enter 10-digit number" maxlength="10" value="${prevPhone}" />
              </div>
              <span class="form-error" id="phone-error" style="display: none;"></span>
            </div>

            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" id="input-name" class="form-input" placeholder="Enter your name" value="${Utils.escapeHtml(prevName)}" />
              <span class="form-error" id="name-error" style="display: none;"></span>
            </div>

            <div class="form-group">
              <label class="form-label">Special Instructions (Optional)</label>
              <textarea id="input-instructions" class="form-input" placeholder="Any allergies, preferences, or special requests..." rows="3"></textarea>
            </div>
            
            <button class="btn btn-primary btn-full" style="margin-top: var(--space-xl);" id="confirm-order">
              Confirm & Place Order
            </button>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('details-back').addEventListener('click', () => Router.navigate('/cart'));

  document.getElementById('confirm-order').addEventListener('click', async () => {
    const phone = document.getElementById('input-phone').value.trim();
    const name = document.getElementById('input-name').value.trim();
    const instructions = document.getElementById('input-instructions').value.trim();

    let valid = true;

    // Validate phone
    const phoneErr = document.getElementById('phone-error');
    if (!Utils.validatePhone(phone)) {
      phoneErr.textContent = 'Please enter a valid 10-digit Indian mobile number';
      phoneErr.style.display = 'block';
      document.getElementById('input-phone').classList.add('error');
      valid = false;
    } else {
      phoneErr.style.display = 'none';
      document.getElementById('input-phone').classList.remove('error');
    }

    // Validate name
    const nameErr = document.getElementById('name-error');
    const nameRegex = /^[A-Za-z\s]{2,50}$/;
    if (!name || name.length < 2) {
      nameErr.textContent = 'Please enter your name';
      nameErr.style.display = 'block';
      document.getElementById('input-name').classList.add('error');
      valid = false;
    } else if (!nameRegex.test(name)) {
      nameErr.textContent = 'Name can only contain letters and spaces';
      nameErr.style.display = 'block';
      document.getElementById('input-name').classList.add('error');
      valid = false;
    } else {
      nameErr.style.display = 'none';
      document.getElementById('input-name').classList.remove('error');
    }

    if (!valid) return;

    // Show loading state
    const confirmBtn = document.getElementById('confirm-order');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="payment-spinner" style="width: 20px; height: 20px; border-width: 2px;"></span> Placing Order...';

    // Place order
    try {
      const result = await Store.placeOrder({ name, phone }, instructions);
      if (result.success) {
        Toast.success('Order placed successfully!');
        Router.navigate('/confirmation');
      } else {
        Toast.error(result.error || 'Failed to place order. Please try again.');
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
      }
    } catch (e) {
      console.error(e);
      Toast.error('An error occurred. Please try again.');
      confirmBtn.disabled = false;
      confirmBtn.textContent = originalText;
    }
  });

  // Auto-format phone input
  document.getElementById('input-phone').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });
}
