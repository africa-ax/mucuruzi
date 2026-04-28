// ============================================================
//  MUCURUZI — OrderFormView.js
//  Buyer places order to one seller.
//  Purchase code: shows both USSD and MyRRA website options.
// ============================================================

const OrderFormView = (() => {

  let _seller   = null;
  let _listings = [];

  const render = async (user, sellerId, root) => {
    root.innerHTML = `
      <div class="page-header" style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-ghost btn-sm" onclick="history.back()">← Back</button>
        <div>
          <h1 class="page-title">Place Order</h1>
          <p class="page-subtitle" id="order-seller-name">Loading...</p>
        </div>
      </div>
      <div id="order-form-content">
        <div class="loader-spinner" style="margin:40px auto;"></div>
      </div>
    `;

    await _load(user, sellerId);
  };

  const _load = async (user, sellerId) => {
    const [sellerRes, listingsRes] = await Promise.all([
      UserService.getProfile(sellerId),
      MarketplaceService.getListingsBySeller(sellerId),
    ]);

    if (!sellerRes.success) { Toast.error('Seller not found.'); return; }

    _seller   = sellerRes.data;
    _listings = listingsRes.data || [];

    document.getElementById('order-seller-name').textContent =
      `Ordering from ${_seller.businessName}`;

    _renderForm(user);
  };

  const _renderForm = (user) => {
    const el = document.getElementById('order-form-content');
    if (!el) return;

    if (_listings.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-text">This seller has no active listings right now.</p>
        </div>
      `;
      return;
    }

    const isBuyer = user.role === ROLES.BUYER;
    const hasTIN  = isBuyer && user.tinNumber;
    const myrraURL = `https://myrra.rra.gov.rw`;

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-lg);max-width:640px">

        <!-- Step 1: Get Purchase Code -->
        <div class="card" style="border-color:var(--color-accent)">
          <h3 style="font-family:var(--font-display);font-weight:700;color:var(--color-accent);margin-bottom:var(--space-sm)">
            Step 1 — Get Your Purchase Code
          </h3>
          <p class="text-muted text-sm" style="margin-bottom:var(--space-md)">
            You need a purchase code from RRA before placing your order.
            Choose whichever option is easier for you:
          </p>

          <div class="purchase-code-options">

            <!-- Option 1: USSD -->
            <div class="purchase-code-option">
              <p class="purchase-code-option-title">📱 Dial on Phone</p>
              <p class="purchase-code-ussd">*800*${_seller.tinNumber}#</p>
              <p class="text-xs text-muted" style="margin-top:6px">
                Dial this on your phone registered with RRA.
                Costs 15 RWF on MTN.
              </p>
            </div>

            <!-- Option 2: MyRRA Website -->
            <div class="purchase-code-option">
              <p class="purchase-code-option-title">🌐 Get Online</p>
              <a href="${myrraURL}" target="_blank" rel="noopener"
                class="btn btn-secondary btn-sm btn-block"
                style="margin-bottom:8px">
                Open MyRRA Website ↗
              </a>
              <div style="font-size:0.75rem;color:var(--color-text-muted);text-align:left;line-height:1.7">
                <p>Phone: <strong style="color:var(--color-text)">${user.phone || 'Your RRA phone'}</strong></p>
                ${hasTIN ? `<p>Your TIN: <strong style="color:var(--color-text)">${user.tinNumber}</strong></p>` : '<p>TIN: <em>leave blank if none</em></p>'}
                <p>Seller TIN: <strong style="color:var(--color-accent)">${_seller.tinNumber}</strong></p>
              </div>
            </div>

          </div>

          ${RRAService.MODE === 'sandbox' ? `
            <div style="background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.25);border-radius:var(--radius-md);padding:var(--space-sm) var(--space-md);margin-top:var(--space-md)">
              <p class="text-xs" style="color:var(--color-warning)">
                ⚠ <strong>Sandbox mode</strong> — type any 5 or 6 digit number e.g. <strong>123456</strong>
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Step 2: Enter purchase code -->
        <div class="card">
          <h3 style="font-family:var(--font-display);font-weight:700;margin-bottom:var(--space-md)">
            Step 2 — Enter Purchase Code
          </h3>
          <div class="form-group" style="margin:0">
            <label class="form-label">Purchase Code (5 or 6 digits)</label>
            <input id="order-purchase-code" type="text" inputmode="numeric"
              class="form-input"
              placeholder="e.g. 847391"
              maxlength="6"
              oninput="this.value=this.value.replace(/[^0-9]/g,'')"
              style="font-size:1.4rem;letter-spacing:0.3em;font-family:monospace;text-align:center;font-weight:700" />
          </div>
        </div>

        <!-- Step 3: Products -->
        <div class="card">
          <h3 style="font-family:var(--font-display);font-weight:700;margin-bottom:var(--space-md)">
            Step 3 — Select Products
          </h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-md)">
            ${_listings.map(l => `
              <div style="padding:var(--space-md);background:var(--color-surface-2);border-radius:var(--radius-md);border:1px solid var(--color-border)">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:8px">
                  <div>
                    <p style="font-weight:600">${l.productName}</p>
                    <p class="text-muted text-xs">${l.unit} · Grade ${l.taxGrade}</p>
                  </div>
                  <p style="color:var(--color-accent);font-weight:700;font-size:1rem">
                    ${Formatters.formatCurrency(l.publicPrice)} / ${l.unit}
                  </p>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  <label class="form-label" style="margin:0;white-space:nowrap">
                    Qty (${l.unit})
                  </label>
                  <input type="number" id="qty-${l.productId}"
                    class="form-input" style="width:130px;text-align:center"
                    min="0" step="1" value="0" placeholder="0"
                    oninput="OrderFormView._updateSummary()"
                    data-product-id="${l.productId}" />
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Order Summary -->
        <div class="card hidden" id="order-summary">
          <h3 style="font-family:var(--font-display);font-weight:700;margin-bottom:var(--space-md)">
            Order Summary
          </h3>
          <div id="summary-items"></div>
          <div class="divider"></div>
          <div id="summary-totals"></div>
          <button class="btn btn-primary btn-block btn-lg mt-md" id="place-order-btn"
            onclick="OrderFormView._submitOrder()">
            ✓ Place Order
          </button>
        </div>

      </div>
    `;
  };

  const _updateSummary = () => {
    const cartItems = _listings
      .map(l => ({
        listing:  l,
        quantity: parseFloat(document.getElementById(`qty-${l.productId}`)?.value) || 0,
      }))
      .filter(c => c.quantity > 0);

    const summaryEl = document.getElementById('order-summary');
    if (!summaryEl) return;

    if (cartItems.length === 0) { summaryEl.classList.add('hidden'); return; }
    summaryEl.classList.remove('hidden');

    const items  = cartItems.map(c => ({
      productId:   c.listing.productId,
      productName: c.listing.productName,
      rraItemCode: c.listing.rraItemCode,
      unit:        c.listing.unit,
      taxGrade:    c.listing.taxGrade,
      quantity:    c.quantity,
      unitPrice:   c.listing.publicPrice,
    }));

    const totals = OrderModel.calculateTotals(items);

    document.getElementById('summary-items').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
        ${totals.items.map(i => `
          <div style="display:flex;justify-content:space-between;font-size:0.875rem">
            <span>${i.productName} × ${i.quantity} ${i.unit}</span>
            <span>${Formatters.formatCurrency(i.lineTotal)}</span>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('summary-totals').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;font-size:0.9rem">
        <div style="display:flex;justify-content:space-between">
          <span class="text-muted">Subtotal</span>
          <span>${Formatters.formatCurrency(totals.subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span class="text-muted">VAT</span>
          <span>${Formatters.formatCurrency(totals.vatAmount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.05rem;margin-top:4px;padding-top:8px;border-top:1px solid var(--color-border)">
          <span>Total</span>
          <span style="color:var(--color-accent)">${Formatters.formatCurrency(totals.total)}</span>
        </div>
      </div>
    `;
  };

  const _submitOrder = async () => {
    const purchaseCode = document.getElementById('order-purchase-code')?.value.trim();

    if (!purchaseCode || !/^\d{5,6}$/.test(purchaseCode)) {
      Toast.error('Please enter a valid 5 or 6 digit purchase code.');
      document.getElementById('order-purchase-code')?.focus();
      return;
    }

    const cartItems = _listings
      .map(l => ({
        listing:  l,
        quantity: parseFloat(document.getElementById(`qty-${l.productId}`)?.value) || 0,
      }))
      .filter(c => c.quantity > 0);

    if (cartItems.length === 0) {
      Toast.error('Please enter a quantity for at least one product.');
      return;
    }

    Loader.show('Placing order...');

    const user  = window.currentUser;
    const items = cartItems.map(c => ({
      productId:   c.listing.productId,
      productName: c.listing.productName,
      rraItemCode: c.listing.rraItemCode,
      unit:        c.listing.unit,
      taxGrade:    c.listing.taxGrade,
      quantity:    c.quantity,
      unitPrice:   c.listing.publicPrice,
    }));

    const res = await OrderService.createOrder({
      sellerId:     _seller.uid,
      sellerTIN:    _seller.tinNumber,
      sellerName:   _seller.businessName,
      buyerId:      user.uid,
      buyerTIN:     user.tinNumber || '',
      buyerName:    user.businessName,
      items,
      purchaseCode,
    });

    Loader.hide();

    if (res.success) {
      Toast.success('Order placed successfully!');
      setTimeout(() => Router.navigate('#orders'), 800);
    } else {
      Toast.error(res.error);
    }
  };

  return { render, _updateSummary, _submitOrder };

})();
