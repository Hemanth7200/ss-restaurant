/* ============================================
   SS Restaurant — Order Confirmation Page
   ============================================ */

function renderConfirmation() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }

  Store.updateSession({ currentStep: 'confirmation' });

  const sessionOrders = Array.isArray(session.orders) ? session.orders : [];
  const tableNum = Utils.getTableNumber(session.tableId);
  const lastOrderId = sessionOrders[sessionOrders.length - 1];
  const allOrders = Store.get('orders') || [];
  const lastOrder = allOrders.find(o => String(o.id) === String(lastOrderId));
  const menuItems = Store.get('menuItems') || [];
  const orderIdDisplay = lastOrder
    ? String(lastOrder.id).replace(/^ord-/, '')
    : '---';

  // Calculate totals for the last order
  let subtotal = 0;
  if (lastOrder) {
    lastOrder.items.forEach(item => {
      subtotal += item.price * item.quantity;
    });
  }
  const tax = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + tax;

  // Build order items HTML with images
  let orderItemsHtml = '';
  if (lastOrder) {
    orderItemsHtml = lastOrder.items.map(item => {
      const menuItem = menuItems.find(m => m.name === item.name);
      const img = menuItem ? menuItem.image : '';
      const isUrl = img && (img.startsWith('http') || img.startsWith('/') || img.startsWith('assets') || img.startsWith('data:image'));
      const imgHtml = isUrl
        ? `<img src="${img}" alt="${Utils.escapeHtml(item.name)}" class="confirm-item-img" />`
        : `<div class="confirm-item-img confirm-item-emoji">${img || '🍽️'}</div>`;

      return `
        <div class="confirm-order-item">
          <div class="confirm-item-left">
            ${imgHtml}
            <div>
              <div class="confirm-item-name">${Utils.escapeHtml(item.name)}</div>
              <div class="confirm-item-qty">x ${item.quantity}</div>
            </div>
          </div>
          <div class="confirm-item-price">${Utils.formatPrice(item.price * item.quantity)}</div>
        </div>
      `;
    }).join('');
  }

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
        <div class="confirm-wrapper">
          <!-- Hero Banner -->
          <div class="confirm-hero">
            <div class="confirm-hero-pattern">🍕 🌶️ 🍗 🥗 🍰 🍜 🧁 🍕 🌶️ 🍗 🥗</div>
            <div class="confirm-check-badge">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#16a34a"/>
                <polyline points="16 8.5 10.5 15 8 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- Title -->
          <div class="confirm-title-section">
            <h2 class="confirm-heading">Order Placed!</h2>
            <p class="confirm-subtitle">Your delicious food is being prepared</p>
          </div>

          <!-- Order ID Card -->
          <div class="confirm-id-card">
            <span class="confirm-id-label">ORDER ID</span>
            <div class="confirm-id-number">
              ${orderIdDisplay}
            </div>
          </div>

          <!-- Table Info -->
          <div class="confirm-table-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Table ${tableNum}
          </div>

          <!-- Order Details Card -->
          ${lastOrder ? `
          <div class="confirm-details-card">
            <div class="confirm-details-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>ORDER DETAILS</span>
            </div>

            <div class="confirm-items-list">
              ${orderItemsHtml}
            </div>

            <div class="confirm-totals">
              <div class="confirm-total-row">
                <span>Subtotal</span>
                <span>${Utils.formatPrice(subtotal)}</span>
              </div>
              <div class="confirm-total-row">
                <span>Tax & Charges</span>
                <span>${Utils.formatPrice(tax)}</span>
              </div>
              <div class="confirm-total-row confirm-grand-total">
                <span>Total Amount</span>
                <span>${Utils.formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Action Buttons -->
          <div class="confirm-actions">
            <button class="confirm-btn-primary" id="back-to-menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Order More Items
            </button>
            <button class="confirm-btn-outline" id="go-to-payment">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              View Bill & Pay
            </button>
          </div>

          <!-- Thank You Section -->
          <div class="confirm-thankyou">
            <div class="confirm-thankyou-icon">🍛</div>
            <div class="confirm-thankyou-text">
              <p class="confirm-thankyou-title">Thank you for choosing us!</p>
              <p class="confirm-thankyou-sub">We hope you enjoy your meal. ♡</p>
            </div>
          </div>

          <!-- Bottom Feature Icons -->
          <div class="confirm-features">
            <div class="confirm-feature">
              <span class="confirm-feature-icon">🥬</span>
              <span class="confirm-feature-title">Fresh Ingredients</span>
              <span class="confirm-feature-desc">Always fresh & quality</span>
            </div>
            <div class="confirm-feature">
              <span class="confirm-feature-icon">⏱️</span>
              <span class="confirm-feature-title">On Time Delivery</span>
              <span class="confirm-feature-desc">Fast & reliable</span>
            </div>
            <div class="confirm-feature">
              <span class="confirm-feature-icon">✨</span>
              <span class="confirm-feature-title">Hygienic Food</span>
              <span class="confirm-feature-desc">100% safe & clean</span>
            </div>
            <div class="confirm-feature">
              <span class="confirm-feature-icon">❤️</span>
              <span class="confirm-feature-title">Made with Love</span>
              <span class="confirm-feature-desc">Cooked with care</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('back-to-menu').addEventListener('click', () => Router.navigate('/menu'));
  document.getElementById('go-to-payment').addEventListener('click', () => {
    if (!sessionOrders.length) {
      Toast.error('No order found yet. Please place an order first.');
      Router.navigate('/menu');
      return;
    }
    Router.navigate('/payment');
  });
}


/* ============================================
   SS Restaurant — Payment Page
   ============================================ */

function renderPayment() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }
  if (session.paymentStatus === 'confirmed') { Router.navigate('/review'); return; }

  Store.updateSession({ currentStep: 'payment' });

  const tableNum = Utils.getTableNumber(session.tableId);
  const totals = Store.getFullSessionTotal();
  const customerInfo = session.customerInfo || { name: '', phone: '' };

  const cashSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 6v0a2 2 0 0 0-2 2"/><path d="M18 6v0a2 2 0 0 1 2 2"/><path d="M6 18v0a2 2 0 0 1-2-2"/><path d="M18 18v0a2 2 0 0 0 2-2"/></svg>`;
  const upiSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/><path d="M9 8l3-2 3 2"/><path d="M9 12l3 2 3-2"/></svg>`;
  const onlineSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><path d="M7 15h.01"/><path d="M11 15h2"/></svg>`;

  app.innerHTML = `
    <div class="menu-page">
      <aside class="menu-sidebar">
        <div class="customer-header-left" style="margin-bottom: var(--space-xl);">
          <img src="assets/logo.png" alt="Logo" class="customer-header-logo" style="width: 48px; height: 48px;" />
          <div>
            <div class="customer-header-title">SS Restaurant</div>
            <div class="customer-header-table">Table ${tableNum}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <a href="#/menu" class="nav-item"><span>🏠</span> Menu</a>
          <a href="#/cart" class="nav-item"><span>🛒</span> Your Cart</a>
          <a href="#/info" class="nav-item"><span>ℹ️</span> Table Info</a>
          <a href="#/call" class="nav-item"><span>📞</span> Call Waiter</a>
        </nav>
        <div class="slogan-card">
          <div class="slogan-text">Good food<br>Good mood ♡</div>
          <img src="assets/leaf-decor.png" class="leaf-decor" alt="" onerror="this.style.display='none'" />
        </div>
      </aside>
      <main class="menu-main">
        <header class="customer-header">
          <div class="customer-header-left">
            <button class="cart-back-btn" id="payment-back">←</button>
            <div>
              <div class="customer-header-title">Payment</div>
              <div class="customer-header-table">Table ${tableNum}</div>
            </div>
          </div>
        </header>
        <div class="payment-page">
          <h2>Your Bill</h2>
          <div class="bill-summary" style="margin-top: 0; max-width: 500px;">
            <h4>Order Summary</h4>
            ${session.orders.map(orderId => {
              const order = (Store.get('orders') || []).find(o => String(o.id) === String(orderId));
              if (!order) return '';
              return (order.items || []).map(item => `
                <div class="bill-row">
                  <span>${Utils.escapeHtml(item.name)} × ${item.quantity}</span>
                  <span>${Utils.formatPrice(item.price * item.quantity)}</span>
                </div>
              `).join('');
            }).join('')}
            <div class="bill-row" style="margin-top: var(--space-sm); padding-top: var(--space-sm); border-top: 1px dashed var(--border-color);">
              <span>Subtotal</span><span>${Utils.formatPrice(totals.subtotal)}</span>
            </div>
            <div class="bill-row"><span>GST (5%)</span><span>${Utils.formatPrice(totals.gst)}</span></div>
            <div class="bill-row total"><span>Total Amount</span><span>${Utils.formatPrice(totals.total)}</span></div>
          </div>

          <h3 style="margin-top: var(--space-2xl); margin-bottom: var(--space-md); font-size: var(--font-size-base);">Select Payment Method</h3>
          <div class="payment-options" style="max-width: 500px;">
            <div class="payment-option" data-method="cash"><div class="payment-option-icon">${cashSvg}</div><div class="payment-option-text"><h4>Cash</h4><p>Pay at the reception counter</p></div></div>
            <div class="payment-option" data-method="upi"><div class="payment-option-icon">${upiSvg}</div><div class="payment-option-text"><h4>UPI</h4><p>Pay via UPI app</p></div></div>
            <div class="payment-option" data-method="online"><div class="payment-option-icon">${onlineSvg}</div><div class="payment-option-text"><h4>Online</h4><p>Cards, Netbanking, Wallets</p></div></div>
          </div>
          <div id="payment-action-area" style="max-width: 500px; width: 100%;"></div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('payment-back').addEventListener('click', () => Router.navigate('/confirmation'));
  let paymentPollInterval = null;

  function startPaymentPolling() {
    if (paymentPollInterval) clearInterval(paymentPollInterval);
    paymentPollInterval = setInterval(async () => {
      const current = Store.getCurrentSession();
      if (!current) return;
      if (DB_ENABLED) {
        const dbSession = await DB.getSession(current.id);
        if (dbSession && dbSession.status === 'paid') Store.updateSession({ paymentStatus: 'confirmed', paid: true });
      }
      const updated = Store.getCurrentSession();
      if (!updated) return;
      if (updated.paymentStatus === 'confirmed') { clearInterval(paymentPollInterval); showPaymentResult('success'); }
      if (updated.paymentStatus === 'failed') { clearInterval(paymentPollInterval); showPaymentResult('failed'); }
    }, 3000);
  }

  function showPaymentResult(result) {
    const area = document.getElementById('payment-action-area');
    if (!area) return;
    if (result === 'success') {
      area.innerHTML = `<div class="payment-message"><h3 style="color:#16a34a;margin-bottom:var(--space-sm);">Transaction Completed</h3><p style="font-weight:700;font-size:var(--font-size-lg);">${Utils.formatPrice(totals.total)}</p><p style="color:var(--text-muted);font-size:var(--font-size-sm);margin-bottom:var(--space-lg);">Table ${tableNum} • Payment Verified</p></div>`;
      setTimeout(() => { Toast.success('Payment successful!'); Router.navigate('/review'); }, 1500);
      return;
    }
    area.innerHTML = `<div class="payment-message"><h3 style="color:#dc2626;margin-bottom:var(--space-sm);">Transaction Failed</h3><button class="btn btn-primary btn-full" id="retry-payment-btn">Try Again</button></div>`;
    document.getElementById('retry-payment-btn').addEventListener('click', () => {
      Store.updateSession({ paymentMethod: null, paymentStatus: null, paid: false });
      renderPayment();
    });
  }

  function renderCashPayment(area) {
    area.innerHTML = `<div class="payment-message"><h3>Pay at Reception</h3><p style="margin:var(--space-md) 0;">Please pay ${Utils.formatPrice(totals.total)} at the counter.</p><div class="payment-waiting-status"><div class="payment-spinner"></div><span>Waiting for admin confirmation...</span></div></div>`;
    startPaymentPolling();
  }

  function renderUPIPayment(area) {
    const upiId = 'hemanthrajudayakumar@oksbi';
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('SS Restaurant')}&am=${totals.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('SS Restaurant Table ' + tableNum)}`;
    area.innerHTML = `<div class="payment-message"><p style="font-weight:700;font-size:1.5rem;margin-bottom:var(--space-xs);">${Utils.formatPrice(totals.total)}</p><a href="${upiLink}" class="btn btn-primary btn-full" style="text-decoration:none;">Pay with UPI App</a><p style="color:var(--text-muted);font-size:var(--font-size-xs);margin-top:var(--space-md);">UPI ID: <strong>${upiId}</strong></p><div class="payment-waiting-status" id="upi-status"><div class="payment-spinner"></div><span>Waiting for admin confirmation...</span></div></div>`;
    startPaymentPolling();
  }

  function renderOnlinePayment(area) {
    area.innerHTML = `<div class="payment-message"><p style="font-weight:700;font-size:1.5rem;margin-bottom:var(--space-xs);">${Utils.formatPrice(totals.total)}</p><p style="color:var(--text-muted);font-size:var(--font-size-xs);margin-bottom:var(--space-lg);">Secure Online Payment via Razorpay</p><button class="btn btn-primary btn-full" id="rzp-pay-btn">Pay Now with Razorpay</button></div>`;
    document.getElementById('rzp-pay-btn').addEventListener('click', () => payWithRazorpay(totals.total));
  }

  async function handlePaymentSuccess(paymentId, method) {
    Store.updateSession({ paymentMethod: method, paymentStatus: 'confirmed', paid: true, paymentId });
    if (DB_ENABLED) await DB.updateSession(session.id, { status: 'paid', paymentMethod: method });
    showPaymentResult('success');
  }

  function payWithRazorpay(amount) {
    if (!window.Razorpay) { Toast.error('Payment gateway not loaded. Please refresh.'); return; }
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'SS Restaurant',
      description: `Order for Table ${tableNum}`,
      image: 'assets/logo.png',
      handler(response) { handlePaymentSuccess(response.razorpay_payment_id, 'online'); },
      prefill: { name: customerInfo.name || '', contact: customerInfo.phone || '' },
      theme: { color: '#C76A1C' }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (response) => {
      const msg = response && response.error && response.error.description ? response.error.description : 'Please try again.';
      Toast.error('Payment Failed: ' + msg);
    });
    rzp.open();
  }

  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const method = opt.dataset.method;
      const area = document.getElementById('payment-action-area');
      Store.updateSession({ paymentMethod: method, paymentStatus: 'pending' });
      if (DB_ENABLED) DB.updateSession(session.id, { paymentMethod: method });
      if (method === 'cash') renderCashPayment(area);
      if (method === 'upi') renderUPIPayment(area);
      if (method === 'online') renderOnlinePayment(area);
    });
  });

  if (session.paymentMethod && session.paymentStatus === 'pending') {
    const savedOpt = document.querySelector(`[data-method="${session.paymentMethod}"]`);
    if (savedOpt) savedOpt.click();
  }
  if (session.paymentStatus === 'failed') showPaymentResult('failed');
}


/* ============================================
   SS Restaurant — Review Page
   ============================================ */

function renderReview() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  const tableNum = session ? Utils.getTableNumber(session.tableId) : '---';

  Store.updateSession({ currentStep: 'review' });

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
        <div class="review-page">
          <div style="text-align: center; margin-bottom: var(--space-2xl);">
            <div style="font-size: 48px; margin-bottom: var(--space-md);">🎉</div>
            <h2>Thank You!</h2>
            <p class="review-subtitle">We'd love to hear about your experience</p>
          </div>

          <div class="review-section">
            <label>Food Quality</label>
            <div class="star-rating" id="rating-food">
              ${[5,4,3,2,1].map(i => `
                <input type="radio" name="food" id="food-${i}" value="${i}">
                <label for="food-${i}">★</label>
              `).join('')}
            </div>
          </div>

          <div class="review-section">
            <label>Service</label>
            <div class="star-rating" id="rating-service">
              ${[5,4,3,2,1].map(i => `
                <input type="radio" name="service" id="service-${i}" value="${i}">
                <label for="service-${i}">★</label>
              `).join('')}
            </div>
          </div>

          <div class="review-section">
            <label>Your Feedback</label>
            <textarea id="review-feedback" class="form-input" placeholder="Tell us what you liked or how we can improve..." rows="4"></textarea>
          </div>

          <button class="btn btn-primary btn-full btn-lg" id="submit-review">
            Submit Review
          </button>
          
          <div style="display:flex;gap:var(--space-md);margin-top:var(--space-md);">
            <button class="btn btn-secondary" style="flex:1;" id="download-receipt">
              📥 Download Receipt
            </button>
            <button class="btn btn-ghost" style="flex:1;" id="skip-review">
              Skip
            </button>
          </div>
        </div>
      </main>
    </div>
  `;

  function submitAndEnd() {
    const foodRating = document.querySelector('input[name="food"]:checked');
    const serviceRating = document.querySelector('input[name="service"]:checked');
    const feedback = document.getElementById('review-feedback').value.trim();

    if (foodRating || serviceRating || feedback) {
      const review = {
        id: Utils.generateId('rev'),
        sessionId: session ? session.id : null,
        foodRating: foodRating ? parseInt(foodRating.value) : null,
        serviceRating: serviceRating ? parseInt(serviceRating.value) : null,
        feedback: feedback,
        createdAt: new Date().toISOString()
      };
      Store.update('reviews', reviews => [...reviews, review]);
      DB.saveReview(review);
    }

    // End session
    Store.endSession();
    Toast.success('Thank you for dining with us! See you again soon.');
    Router.navigate('/');
  }

  document.getElementById('submit-review').addEventListener('click', submitAndEnd);
  document.getElementById('skip-review').addEventListener('click', () => {
    Store.endSession();
    Toast.info('Thank you for visiting SS Restaurant!');
    Router.navigate('/');
  });

  document.getElementById('download-receipt').addEventListener('click', () => {
    const totals = Store.getFullSessionTotal();
    const tableNum = Utils.getTableNumber(session.tableId);
    let text = `SS Restaurant - Receipt\n`;
    text += `Table: ${tableNum}\n`;
    text += `Date: ${Utils.formatDateTime(new Date().toISOString())}\n`;
    text += `--------------------------------\n`;
    session.orders.forEach(orderId => {
      const order = Store.get('orders').find(o => o.id === orderId);
      if (order) {
        order.items.forEach(item => {
          text += `${item.name} x${item.quantity}   ${Utils.formatPrice(item.price * item.quantity)}\n`;
        });
      }
    });
    text += `--------------------------------\n`;
    text += `Subtotal:    ${Utils.formatPrice(totals.subtotal)}\n`;
    text += `GST (5%):    ${Utils.formatPrice(totals.gst)}\n`;
    text += `Grand Total: ${Utils.formatPrice(totals.total)}\n`;
    text += `\nThank you for dining with us!\n`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SS_Restaurant_Receipt_Table_${tableNum}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.success('Receipt downloaded!');
  });
}
