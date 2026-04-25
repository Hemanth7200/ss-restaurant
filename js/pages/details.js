/* ============================================
   SS Restaurant — Customer Details Page
   ============================================ */

function renderDetails() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }
  if (session.cart.length === 0) { Router.navigate('/menu'); return; }

  Store.updateSession({ currentStep: 'details' });
  const tableNum = Utils.getTableNumber(session.tableId);

  // Pre-fill from previous order info
  const prevName = session.customerInfo ? session.customerInfo.name : '';
  const prevPhone = session.customerInfo ? session.customerInfo.phone : '';

  app.innerHTML = `
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
      </div>
    </div>

    <div class="sticky-bottom">
      <button class="btn btn-primary" id="confirm-order">
        Confirm & Place Order
      </button>
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
      const order = await Store.placeOrder({ name, phone }, instructions);
      if (order) {
        Toast.success('Order placed successfully!');
        Router.navigate('/confirmation');
      } else {
        Toast.error('Failed to place order. Please try again.');
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
