// ============================================================
//  MUCURUZI — OrderDetailView.js
//  Seller: reviews order, purchase code already on order from buyer.
//  Buyer: tracks status, views invoice when confirmed.
// ============================================================

const OrderDetailView = (() => {

  const render = async (user, orderId, root) => {
    root.innerHTML = `
      <div class="page-header" style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-ghost btn-sm" onclick="Router.navigate('#orders')">← Back</button>
        <h1 class="page-title">Order Details</h1>
      </div>
      <div id="order-detail-content">
        <div class="loader-spinner" style="margin:40px auto;"></div>
      </div>
    `;

    await _load(user, orderId);
  };

  const _load = async (user, orderId) => {
    const res = await OrderService.getOrderById(orderId);
    if (!res.success) { Toast.error(res.error); return; }
    _render(user, res.data);
  };

  const _render = (user, order) => {
    const el       = document.getElementById('order-detail-content');
    if (!el) return;

    const isSeller = order.sellerId === user.uid;

    el.innerHTML = `
      <div style="max-width:640px;display:flex;flex-direction:column;gap:var(--space-md)">

        <!-- Status Banner -->
        <div class="card" style="border-color:${_statusColor(order.status)}">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div>
              <p class="text-xs text-muted">${safe(order.orderId)}</p>
              <p style="font-weight:600;margin-top:4px">
                ${Formatters.formatDateTime(order.createdAt)}
              </p>
            </div>
            <span class="badge badge-${_statusBadge(order.status)}"
              style="font-size:0.82rem;padding:6px 16px">
              ${Formatters.formatStatus(order.status)}
            </span>
          </div>
        </div>

        <!-- Parties -->
        <div class="card">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div>
              <p class="stat-label">Seller</p>
              <p style="font-weight:600">${safe(order.sellerName)}</p>
              <p class="text-muted text-xs">TIN: ${safe(order.sellerTIN)}</p>
            </div>
            <div>
              <p class="stat-label">Buyer</p>
              <p style="font-weight:600">${safe(order.buyerName)}</p>
              ${order.buyerTIN ? `<p class="text-muted text-xs">TIN: ${safe(order.buyerTIN)}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card">
          <h3 class="card-title mb-md">Items Ordered</h3>
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>VAT</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(i => `
                  <tr>
                    <td>
                      <p style="font-weight:500">${safe(i.productName)}</p>
                      <p class="text-xs text-muted">${i.rraItemCode} · ${i.unit}</p>
                    </td>
                    <td>${i.quantity}</td>
                    <td>${Formatters.formatCurrency(i.unitPrice)}</td>
                    <td>${Formatters.formatCurrency(i.vatAmount)}</td>
                    <td style="font-weight:600">${Formatters.formatCurrency(i.lineTotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top:16px;text-align:right">
            <p class="text-muted text-sm">Subtotal: ${Formatters.formatCurrency(order.subtotal)}</p>
            <p class="text-muted text-sm">VAT: ${Formatters.formatCurrency(order.vatAmount)}</p>
            <p style="font-size:1.2rem;font-weight:700;color:var(--color-accent);margin-top:4px">
              Total: ${Formatters.formatCurrency(order.total)}
            </p>
          </div>
        </div>

        <!-- Purchase Code (shown to seller) -->
        ${isSeller && order.status === ORDER_STATUS.PENDING ? `
          <div class="card" style="border-color:var(--color-accent)">
            <h3 class="card-title mb-md">Confirm Order</h3>

            ${order.purchaseCode ? `
              <!-- Purchase code already submitted by buyer -->
              <div style="background:var(--color-accent-glow);border:1px solid var(--color-accent);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-md)">
                <p class="text-xs text-muted" style="margin-bottom:4px">PURCHASE CODE FROM BUYER</p>
                <p style="font-family:monospace;font-size:1.6rem;font-weight:800;color:var(--color-accent);letter-spacing:0.3em">
                  ${order.purchaseCode}
                </p>
              </div>
              <p class="text-muted text-sm mb-md">
                The buyer already provided this purchase code. Click confirm to process the order.
              </p>
            ` : `
              <!-- No purchase code yet — show instructions -->
              <div class="purchase-code-box mb-md">
                <p class="text-sm text-muted mb-md">
                  Ask the buyer to get a purchase code using one of these methods:
                </p>
                <div class="purchase-code-options">
                  <div class="purchase-code-option">
                    <p class="purchase-code-option-title">📱 Dial on Phone</p>
                    <p class="purchase-code-ussd">*800*${safe(order.sellerTIN)}#</p>
                  </div>
                  <div class="purchase-code-option">
                    <p class="purchase-code-option-title">🌐 Get Online</p>
                    <a href="https://myrra.rra.gov.rw" target="_blank"
                      class="btn btn-secondary btn-sm btn-block">
                      MyRRA Website ↗
                    </a>
                    <p class="text-xs text-muted mt-sm">
                      Seller TIN: <strong style="color:var(--color-accent)">${safe(order.sellerTIN)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            `}

            <div style="display:flex;gap:12px">
              <button id="confirm-btn" class="btn btn-primary" style="flex:1"
                onclick="OrderDetailView._confirm('${safe(order.orderId)}')">
                ✓ Confirm Order
              </button>
              <button class="btn btn-danger"
                onclick="OrderDetailView._reject('${safe(order.orderId)}')">
                Reject
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Buyer actions -->
        ${!isSeller && order.status === ORDER_STATUS.CONFIRMED && order.invoiceId ? `
          <button class="btn btn-primary btn-block btn-lg"
            onclick="Router.navigate('#invoice/${order.invoiceId}')">
            View Invoice →
          </button>
        ` : ''}

        ${order.status === ORDER_STATUS.REJECTED ? `
          <div class="card" style="border-color:var(--color-danger)">
            <p style="color:var(--color-danger);font-weight:600">Order Rejected</p>
            ${order.rejectReason
              ? `<p class="text-muted text-sm mt-sm">Reason: ${safe(order.rejectReason)}</p>`
              : ''}
          </div>
        ` : ''}

      </div>
    `;
  };

  const _confirm = async (orderId) => {
    // Get order to retrieve purchase code
    const orderRes = await OrderService.getOrderById(orderId);
    if (!orderRes.success) { Toast.error('Order not found.'); return; }

    const code = orderRes.data.purchaseCode;
    if (!code || !/^\d{5,6}$/.test(code)) {
      Toast.error('No valid purchase code on this order. Ask the buyer to provide one.');
      return;
    }

    const buyerRes = await UserService.getProfile(orderRes.data.buyerId)
      .catch(() => ({ success: false }));

    const buyerProfile = buyerRes.success ? buyerRes.data : {
      uid:          orderRes.data.buyerId,
      role:         ROLES.BUYER,
      tinNumber:    '',
      businessName: orderRes.data.buyerName,
    };

    Loader.show('Verifying purchase code and generating invoice...');

    const res = await OrderService.confirmOrder(
      orderId,
      code,
      window.currentUser,
      buyerProfile
    );

    Loader.hide();

    if (res.success) {
      Toast.success('Order confirmed! Invoice generated.');
      setTimeout(() => Router.navigate(`#invoice/${res.invoiceId}`), 800);
    } else {
      Toast.error(res.error);
    }
  };

  const _reject = (orderId) => {
    Modal.show({
      title:        'Reject Order',
      confirmText:  'Reject Order',
      confirmClass: 'btn-danger',
      body: `
        <p class="mb-md">Are you sure you want to reject this order?</p>
        <div class="form-group">
          <label class="form-label">Reason (optional)</label>
          <input id="reject-reason" type="text" class="form-input"
            placeholder="e.g. Out of stock" />
        </div>
      `,
      onConfirm: async () => {
        const reason = document.getElementById('reject-reason')?.value || '';
        Loader.show('Rejecting order...');
        const res = await OrderService.rejectOrder(orderId, window.currentUser.uid, reason);
        Loader.hide();
        if (res.success) {
          Toast.success('Order rejected.');
          Router.navigate('#orders');
        } else {
          Toast.error(res.error);
        }
      },
    });
  };

  const _statusColor  = (s) => ({ pending:'var(--color-warning)', confirmed:'var(--color-accent)', rejected:'var(--color-danger)' }[s] || 'var(--color-border)');
  const _statusBadge  = (s) => ({ pending:'warning', confirmed:'success', rejected:'danger' }[s] || 'muted');

  return { render, _confirm, _reject };

})();
