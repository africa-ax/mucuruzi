// ============================================================
//  MUCURUZI — WalkInSaleView.js
//  Retailer only. Walk-in customer POS.
//  Purchase code: shows USSD and MyRRA options.
// ============================================================

const WalkInSaleView = (() => {

  let _stock = [];

  const render = async (user, root) => {
    root.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Walk-in Sale</h1>
        <p class="page-subtitle">Sell to a customer right now</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-lg);max-width:640px">

        <!-- Customer Info -->
        <div class="card">
          <h3 class="card-title mb-md">Customer Info</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group" style="margin:0">
              <label class="form-label">Customer Name</label>
              <input id="customer-name" type="text" class="form-input"
                placeholder="e.g. Jean Paul" autocomplete="off" />
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label">Phone Number</label>
              <input id="customer-phone" type="tel" class="form-input"
                placeholder="e.g. 0788123456" />
            </div>
          </div>
        </div>

        <!-- Purchase Code -->
        <div class="card" style="border-color:var(--color-accent)">
          <h3 style="font-family:var(--font-display);font-weight:700;color:var(--color-accent);margin-bottom:var(--space-sm)">
            Purchase Code
          </h3>
          <p class="text-muted text-sm" style="margin-bottom:var(--space-md)">
            Ask the customer to get a purchase code using one of these options:
          </p>

          <div class="purchase-code-options">
            <div class="purchase-code-option">
              <p class="purchase-code-option-title">📱 Dial on Phone</p>
              <p class="purchase-code-ussd">*800*${user.tinNumber}#</p>
              <p class="text-xs text-muted" style="margin-top:6px">
                Customer dials on their phone. Costs 15 RWF on MTN.
              </p>
            </div>
            <div class="purchase-code-option">
              <p class="purchase-code-option-title">🌐 Get Online</p>
              <a href="https://myrra.rra.gov.rw" target="_blank"
                class="btn btn-secondary btn-sm btn-block" style="margin-bottom:8px">
                Open MyRRA ↗
              </a>
              <p class="text-xs text-muted">
                Seller TIN to enter: <strong style="color:var(--color-accent)">${user.tinNumber}</strong>
              </p>
            </div>
          </div>

          <div class="form-group" style="margin-top:var(--space-md);margin-bottom:0">
            <label class="form-label">Enter Purchase Code</label>
            <input id="walkin-purchase-code" type="text" inputmode="numeric"
              class="form-input"
              placeholder="e.g. 847391"
              maxlength="6"
              oninput="this.value=this.value.replace(/[^0-9]/g,'')"
              style="font-size:1.4rem;letter-spacing:0.3em;font-family:monospace;text-align:center;font-weight:700" />
          </div>

          ${RRAService.MODE === 'sandbox' ? `
            <p class="text-xs mt-sm" style="color:var(--color-warning)">
              ⚠ Sandbox — type any 5 or 6 digit number e.g. <strong>123456</strong>
            </p>
          ` : ''}
        </div>

        <!-- Products -->
        <div class="card">
          <h3 class="card-title mb-md">Products</h3>
          <input id="walkin-search" type="text" class="form-input"
            placeholder="Search your inventory..."
            oninput="WalkInSaleView._search(this.value)"
            style="margin-bottom:var(--space-md)" />
          <div id="walkin-products">
            <div class="loader-spinner" style="margin:24px auto;"></div>
          </div>
        </div>

        <!-- Cart Summary -->
        <div class="card hidden" id="walkin-cart">
          <h3 class="card-title mb-md">Cart Summary</h3>
          <div id="cart-items"></div>
          <div class="divider"></div>
          <div id="cart-totals"></div>
          <button id="walkin-confirm-btn" class="btn btn-primary btn-block btn-lg mt-md"
            onclick="WalkInSaleView._confirmSale()">
            ✓ Confirm Sale & Generate Receipt
          </button>
        </div>

      </div>
    `;

    await _loadStock(user);
  };

  const _loadStock = async (user) => {
    const res = await StockService.getMyStock(user.uid, STOCK_TYPES.INVENTORY);
    _stock = (res.data || []).filter(s => s.quantity > 0);
    _renderProducts(_stock);
  };

  const _search = (query) => {
    const q = query.toLowerCase();
    _renderProducts(q ? _stock.filter(s => s.productName.toLowerCase().includes(q)) : _stock);
  };

  const _renderProducts = (items) => {
    const el = document.getElementById('walkin-products');
    if (!el) return;

    if (items.length === 0) {
      el.innerHTML = `<p class="text-muted text-sm">No products found.</p>`;
      return;
    }

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${items.map(s => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--color-border)">
            <div style="flex:1">
              <p style="font-weight:600">${s.productName}</p>
              <p class="text-muted text-xs">
                Available: ${s.quantity} ${s.unit} ·
                ${Formatters.formatCurrency(s.sellingPrice)} / ${s.unit}
              </p>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="text-xs text-muted">${s.unit}</span>
              <input type="number" id="wqty-${s.productId}"
                class="form-input" style="width:110px;text-align:center"
                min="0" max="${s.quantity}" step="1" value="0" placeholder="0"
                oninput="WalkInSaleView._updateCartSummary()"
                data-max="${s.quantity}" />
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const _updateCartSummary = () => {
    const cartItems = _stock
      .map(s => ({
        stockItem: s,
        quantity:  parseFloat(document.getElementById(`wqty-${s.productId}`)?.value) || 0,
      }))
      .filter(c => c.quantity > 0);

    const cartEl = document.getElementById('walkin-cart');
    if (!cartEl) return;

    // Validate max
    for (const c of cartItems) {
      if (c.quantity > c.stockItem.quantity) {
        const input = document.getElementById(`wqty-${c.stockItem.productId}`);
        if (input) input.value = c.stockItem.quantity;
        Toast.warning(`Max for ${c.stockItem.productName}: ${c.stockItem.quantity} ${c.stockItem.unit}`);
        return;
      }
    }

    if (cartItems.length === 0) { cartEl.classList.add('hidden'); return; }
    cartEl.classList.remove('hidden');

    const items  = cartItems.map(c => ({
      productId:   c.stockItem.productId,
      productName: c.stockItem.productName,
      unit:        c.stockItem.unit,
      taxGrade:    'B',
      quantity:    c.quantity,
      unitPrice:   c.stockItem.sellingPrice,
      rraItemCode: '00000000',
    }));

    const totals = OrderModel.calculateTotals(items);

    document.getElementById('cart-items').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
        ${totals.items.map(i => `
          <div style="display:flex;justify-content:space-between;font-size:0.875rem">
            <span>${i.productName} × ${i.quantity} ${i.unit}</span>
            <span>${Formatters.formatCurrency(i.lineTotal)}</span>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('cart-totals').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;font-size:0.9rem">
        <div style="display:flex;justify-content:space-between">
          <span class="text-muted">Subtotal</span>
          <span>${Formatters.formatCurrency(totals.subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span class="text-muted">VAT (18%)</span>
          <span>${Formatters.formatCurrency(totals.vatAmount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.1rem;margin-top:4px;padding-top:8px;border-top:1px solid var(--color-border)">
          <span>Total</span>
          <span style="color:var(--color-accent)">${Formatters.formatCurrency(totals.total)}</span>
        </div>
      </div>
    `;
  };

  const _confirmSale = async () => {
    const customerName  = document.getElementById('customer-name')?.value.trim();
    const customerPhone = document.getElementById('customer-phone')?.value.trim();
    const purchaseCode  = document.getElementById('walkin-purchase-code')?.value.trim();

    if (!customerName)  { Toast.error('Please enter customer name.'); return; }
    if (!customerPhone) { Toast.error('Please enter customer phone number.'); return; }
    if (!purchaseCode || !/^\d{5,6}$/.test(purchaseCode)) {
      Toast.error('Please enter a valid 5 or 6 digit purchase code.');
      document.getElementById('walkin-purchase-code')?.focus();
      return;
    }

    const cartItems = _stock
      .map(s => ({
        stockItem: s,
        quantity:  parseFloat(document.getElementById(`wqty-${s.productId}`)?.value) || 0,
      }))
      .filter(c => c.quantity > 0);

    if (cartItems.length === 0) {
      Toast.error('Please enter a quantity for at least one product.');
      return;
    }

    Loader.show('Processing sale...');

    const user  = window.currentUser;
    const items = cartItems.map(c => ({
      productId:   c.stockItem.productId,
      productName: c.stockItem.productName,
      rraItemCode: '00000000',
      unit:        c.stockItem.unit,
      taxGrade:    'B',
      quantity:    c.quantity,
      unitPrice:   c.stockItem.sellingPrice,
    }));

    const walkInBuyer = {
      uid:          `walkin_${Date.now()}`,
      businessName: customerName,
      phone:        customerPhone,
      role:         ROLES.BUYER,
      tinNumber:    '',
    };

    const orderRes = await OrderService.createOrder({
      sellerId:    user.uid,
      sellerTIN:   user.tinNumber,
      sellerName:  user.businessName,
      buyerId:     walkInBuyer.uid,
      buyerTIN:    '',
      buyerName:   `${customerName} (Walk-in)`,
      items,
      purchaseCode,
    });

    if (!orderRes.success) {
      Loader.hide();
      Toast.error(orderRes.error);
      return;
    }

    const confirmRes = await OrderService.confirmOrder(
      orderRes.data.orderId,
      purchaseCode,
      user,
      walkInBuyer
    );

    Loader.hide();

    if (confirmRes.success) {
      Toast.success('Sale complete! Receipt generated.');
      setTimeout(() => Router.navigate(`#invoice/${confirmRes.invoiceId}`), 600);
    } else {
      Toast.error(confirmRes.error);
    }
  };

  return { render, _search, _updateCartSummary, _confirmSale };

})();
