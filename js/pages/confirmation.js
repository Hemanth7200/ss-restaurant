/* ============================================
   SS Restaurant — Order Confirmation Page
   ============================================ */

function renderConfirmation() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }

  Store.updateSession({ currentStep: 'confirmation' });

  const tableNum = Utils.getTableNumber(session.tableId);
  const lastOrderId = session.orders[session.orders.length - 1];
  const lastOrder = Store.get('orders').find(o => o.id === lastOrderId);

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
        <div class="confirmation-page">
          <div class="confirmation-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h2>Order Placed!</h2>
          <p style="color: var(--text-secondary);">Your delicious food is being prepared</p>

          <div class="order-id">#${lastOrderId || '---'}</div>

          <p class="table-info">📍 Table ${tableNum}</p>

          ${lastOrder ? `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-lg); margin-bottom: var(--space-xl); width: 100%; max-width: 400px; text-align: left;">
              <h4 style="margin-bottom: var(--space-md); font-size: var(--font-size-sm); color: var(--text-muted);">Current Order Details</h4>
              ${lastOrder.items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: var(--font-size-sm);">
                  <span>${item.name} × ${item.quantity}</span>
                  <span style="font-weight: 600;">${Utils.formatPrice(item.price * item.quantity)}</span>
                </div>
              `).join('')}
              <div style="border-top: 1px dashed var(--border-color); margin-top: var(--space-sm); padding-top: var(--space-sm); display: flex; justify-content: space-between; font-weight: 700; font-size: var(--font-size-base);">
                <span>Total</span>
                <span>${Utils.formatPrice(lastOrder.total)}</span>
              </div>
            </div>
          ` : ''}

          <div class="confirmation-actions" style="max-width: 400px; width: 100%;">
            <button class="btn btn-primary btn-full" id="back-to-menu">
              ➕ Order More Items
            </button>
            <button class="btn btn-secondary btn-full" id="go-to-payment" style="margin-top: var(--space-md);">
              💰 View Bill & Pay
            </button>
          </div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('back-to-menu').addEventListener('click', () => Router.navigate('/menu'));
  document.getElementById('go-to-payment').addEventListener('click', () => Router.navigate('/payment'));
}


/* ============================================
   SS Restaurant — Payment Page
   ============================================ */

function renderPayment() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  if (!session) { Router.navigate('/'); return; }

  // If already paid, go to review
  if (session.paymentStatus === 'confirmed') {
    Router.navigate('/review');
    return;
  }

  Store.updateSession({ currentStep: 'payment' });

  const tableNum = Utils.getTableNumber(session.tableId);
  const totals = Store.getFullSessionTotal();

  // SVG icons
  const cashSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 6v0a2 2 0 0 0-2 2"/><path d="M18 6v0a2 2 0 0 1 2 2"/><path d="M6 18v0a2 2 0 0 1-2-2"/><path d="M18 18v0a2 2 0 0 0 2-2"/></svg>`;
  const upiSvg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/><path d="M9 8l3-2 3 2"/><path d="M9 12l3 2 3-2"/></svg>`;

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
              const order = Store.get('orders').find(o => o.id === orderId);
              if (!order) return '';
              return order.items.map(item => `
                <div class="bill-row">
                  <span>${item.name} × ${item.quantity}</span>
                  <span>${Utils.formatPrice(item.price * item.quantity)}</span>
                </div>
              `).join('');
            }).join('')}
            <div class="bill-row" style="margin-top: var(--space-sm); padding-top: var(--space-sm); border-top: 1px dashed var(--border-color);">
              <span>Subtotal</span>
              <span>${Utils.formatPrice(totals.subtotal)}</span>
            </div>
            <div class="bill-row">
              <span>GST (5%)</span>
              <span>${Utils.formatPrice(totals.gst)}</span>
            </div>
            <div class="bill-row total">
              <span>Total Amount</span>
              <span>${Utils.formatPrice(totals.total)}</span>
            </div>
          </div>

          <h3 style="margin-top: var(--space-2xl); margin-bottom: var(--space-md); font-size: var(--font-size-base);">Select Payment Method</h3>

          <div class="payment-options" style="max-width: 500px;">
            <div class="payment-option" id="pay-cash" data-method="cash">
              <div class="payment-option-icon">${cashSvg}</div>
              <div class="payment-option-text">
                <h4>Cash</h4>
                <p>Pay at the reception counter</p>
              </div>
            </div>
            <div class="payment-option" id="pay-upi" data-method="upi">
              <div class="payment-option-icon">${upiSvg}</div>
              <div class="payment-option-text">
                <h4>UPI</h4>
                <p>Pay via UPI (GPay, PhonePe, Paytm)</p>
              </div>
            </div>
          </div>

          <div id="payment-action-area" style="max-width: 500px; width: 100%;"></div>
        </div>
      </main>
    </div>
  `;

  document.getElementById('payment-back').addEventListener('click', () => Router.navigate('/confirmation'));

  // Payment polling — checks for admin confirm/reject every 3 seconds from the DB
  let paymentPollInterval = null;

  function startPaymentPolling() {
    if (paymentPollInterval) clearInterval(paymentPollInterval);
    paymentPollInterval = setInterval(async () => {
      const s = Store.getCurrentSession();
      if (!s) return;
      
      if (DB_ENABLED) {
        const dbSession = await DB.getSession(s.id);
        if (dbSession && dbSession.status === 'paid') {
          Store.updateSession({ paymentStatus: 'confirmed', paid: true });
        } else if (dbSession && dbSession.status === 'failed') {
           // Wait, DB schema only supports 'active', 'paid', 'closed' for session status.
           // For failed payments, the admin might just revert payment_method to null in DB.
           if (!dbSession.paymentMethod) {
             Store.updateSession({ paymentStatus: 'failed', paid: false });
           }
        }
      }

      const updatedS = Store.getCurrentSession();
      if (updatedS.paymentStatus === 'confirmed') {
        clearInterval(paymentPollInterval);
        showPaymentResult('success');
      } else if (updatedS.paymentStatus === 'failed') {
        clearInterval(paymentPollInterval);
        showPaymentResult('failed');
      }
    }, 3000);
  }

  function showPaymentResult(result) {
    const area = document.getElementById('payment-action-area');
    if (!area) return;

    if (result === 'success') {
      area.innerHTML = `
        <div class="payment-message">
          <div style="margin-bottom: var(--space-lg);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="16 8 10 16 7 13"/>
            </svg>
          </div>
          <h3 style="color: #16a34a; margin-bottom: var(--space-sm);">Transaction Completed</h3>
          <p style="font-weight: 700; font-size: var(--font-size-lg); margin-bottom: var(--space-xs);">
            ${Utils.formatPrice(totals.total)}
          </p>
          <p style="color: var(--text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-lg);">
            Table ${tableNum} • Payment Verified
          </p>
          <p style="color: var(--text-muted); font-size: var(--font-size-xs);">
            Redirecting to review page...
          </p>
        </div>
      `;
      setTimeout(() => {
        Toast.success('Payment successful! Thank you.');
        Router.navigate('/review');
      }, 3000);
    } else {
      area.innerHTML = `
        <div class="payment-message">
          <div style="margin-bottom: var(--space-lg);">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h3 style="color: #dc2626; margin-bottom: var(--space-sm);">Transaction Failed</h3>
          <p style="font-weight: 700; font-size: var(--font-size-lg); margin-bottom: var(--space-xs);">
            ${Utils.formatPrice(totals.total)}
          </p>
          <p style="color: var(--text-muted); font-size: var(--font-size-sm); margin-bottom: var(--space-lg);">
            Payment was not confirmed by the admin. Please try again or contact the counter.
          </p>
          <button class="btn btn-primary btn-full" id="retry-payment-btn">
            Try Again
          </button>
        </div>
      `;
      document.getElementById('retry-payment-btn').addEventListener('click', () => {
        Store.updateSession({ paymentMethod: null, paymentStatus: null, paid: false });
        renderPayment();
      });
    }
  }

  // Payment option selection
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');

      const method = opt.dataset.method;
      const area = document.getElementById('payment-action-area');

      // Save payment method to session
      Store.updateSession({ paymentMethod: method, paymentStatus: 'pending' });
      // Sync payment method to DB so admin can see it's pending
      if (DB_ENABLED) {
        DB.updateSession(session.id, { paymentMethod: method });
      }

      if (method === 'cash') {
        area.innerHTML = `
          <div class="payment-message">
            <div class="payment-waiting-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <h3>Pay at Reception</h3>
            <p style="color: var(--text-secondary); margin: var(--space-md) 0; line-height: 1.6;">
              Please proceed to the reception counter and pay
              <strong style="color: var(--text-primary); font-size: var(--font-size-lg);">${Utils.formatPrice(totals.total)}</strong>
            </p>
            <p style="color: var(--text-muted); font-size: var(--font-size-xs); margin-bottom: var(--space-lg);">
              Table ${tableNum} • Admin will verify payment
            </p>
            <div class="payment-waiting-status">
              <div class="payment-spinner"></div>
              <span>Waiting for admin to confirm payment...</span>
            </div>
          </div>
        `;
        startPaymentPolling();

      } else {
        // UPI
        const upiId = 'hemanthrajudayakumar@oksbi';
        const payeeName = 'SS Restaurant';
        const amount = totals.total.toFixed(2);
        const txnNote = 'SS Restaurant Table ' + tableNum;
        const upiLink = 'upi://pay?pa=' + encodeURIComponent(upiId) + '&pn=' + encodeURIComponent(payeeName) + '&am=' + amount + '&cu=INR&tn=' + encodeURIComponent(txnNote);

        area.innerHTML = `
          <div class="payment-message">
            <div class="upi-qr-area" id="upi-content-area">
              <div class="payment-waiting-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2"/>
                  <line x1="12" y1="18" x2="12" y2="18.01"/>
                  <path d="M9 8l3-2 3 2"/>
                  <path d="M9 12l3 2 3-2"/>
                </svg>
              </div>

              <p style="font-weight: 700; font-size: 1.5rem; margin-bottom: var(--space-xs);">
                ${Utils.formatPrice(totals.total)}
              </p>
              <p style="color: var(--text-muted); font-size: var(--font-size-xs); margin-bottom: var(--space-lg);">
                Table ${tableNum} • Admin will verify payment
              </p>

              <a href="${upiLink}" class="btn btn-primary btn-full" id="upi-pay-btn" style="margin-bottom: var(--space-md); text-decoration: none; font-size: var(--font-size-base); padding: var(--space-md) var(--space-xl);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
                Pay with UPI App
              </a>

              <p style="color: var(--text-muted); font-size: var(--font-size-xs); margin-bottom: var(--space-md);">
                UPI ID: <strong>${upiId}</strong>
              </p>

              <div class="payment-waiting-status" id="upi-status">
                <div class="payment-spinner"></div>
                <span>Waiting for admin to confirm payment...</span>
              </div>
            </div>
          </div>
        `;
        startPaymentPolling();
      }
    });
  });

  // If payment method was already selected (page reload), restore it
  if (session.paymentMethod && session.paymentStatus === 'pending') {
    const savedOpt = document.querySelector(`[data-method="${session.paymentMethod}"]`);
    if (savedOpt) savedOpt.click();
  }

  // If already failed, show fail state
  if (session.paymentStatus === 'failed') {
    showPaymentResult('failed');
  }
}


/* ============================================
   SS Restaurant — Review Page
   ============================================ */

function renderReview() {
  const app = document.getElementById('app');
  const session = Store.getCurrentSession();
  const tableNum = session ? Utils.getTableNumber(session.tableId) : '---';

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
