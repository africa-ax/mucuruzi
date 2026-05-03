// ============================================================
//  MUCURUZI — InvoiceListView.js
//  Compact list rows — 10+ invoices visible without scrolling.
// ============================================================

const InvoiceListView = (() => {

  let _salesInvoices    = [];
  let _purchaseInvoices = [];
  let _activeTab        = 'purchases';

  const render = async (user, root) => {
    const isSeller = ROLE_CAN_SELL.includes(user.role);
    _activeTab     = isSeller ? 'sales' : 'purchases';

    root.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">
          ${user.role === ROLES.BUYER ? 'My Receipts' : 'Invoices'}
        </h1>
        <p class="page-subtitle">EBM-compliant invoices</p>
      </div>

      ${isSeller ? `
        <div class="tab-bar">
          <button class="tab-btn active" id="tab-sales"
            onclick="InvoiceListView._switchTab('sales')">
            Sales
          </button>
          <button class="tab-btn" id="tab-purchases"
            onclick="InvoiceListView._switchTab('purchases')">
            Purchases
          </button>
        </div>
      ` : ''}

      <div id="invoices-container">
        <div class="loader-spinner" style="margin:40px auto;"></div>
      </div>
    `;

    await _load(user);
  };

  const _load = async (user) => {
    const isSeller = ROLE_CAN_SELL.includes(user.role);
    const promises = [InvoiceService.getMyInvoices(user.uid, 'buyer')];
    if (isSeller) promises.push(InvoiceService.getMyInvoices(user.uid, 'seller'));

    const [purchaseRes, salesRes] = await Promise.all(promises);
    _purchaseInvoices = purchaseRes.data  || [];
    _salesInvoices    = salesRes?.data    || [];

    _renderTab(_activeTab);
  };

  const _switchTab = (tab) => {
    _activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`tab-${tab}`);
    if (btn) btn.classList.add('active');
    _renderTab(tab);
  };

  const _renderTab = (tab) => {
    const invoices = tab === 'sales' ? _salesInvoices : _purchaseInvoices;
    const el       = document.getElementById('invoices-container');
    if (!el) return;

    if (invoices.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">◻</div>
          <h3 class="empty-state-title">No invoices yet</h3>
          <p class="empty-state-text">
            Invoices are generated automatically when orders are confirmed.
          </p>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="list-container">
        ${invoices.map(inv => `
          <div class="list-row"
            onclick="Router.navigate('#invoice/${inv.invoiceId}')">

            <!-- Left: EBM badge + receipt number -->
            <div style="flex-shrink:0">
              <span class="badge badge-success" style="font-size:0.6rem">EBM</span>
            </div>

            <!-- Middle: name + date -->
            <div class="list-row-main">
              <p class="list-row-title">
                ${safe(tab === 'sales' ? inv.buyerName : inv.sellerName)}
              </p>
              <p class="list-row-sub">
                ${safe(inv.receiptNumber)}
                · ${Formatters.timeAgo(inv.createdAt)}
              </p>
            </div>

            <!-- Right: amount + return status -->
            <div class="list-row-meta">
              <span class="list-row-amount">
                ${Formatters.formatCurrency(inv.total)}
              </span>
              ${inv.returnStatus ? `
                <span class="badge badge-warning" style="font-size:0.6rem">
                  ${Formatters.formatReturnStatus(inv.returnStatus)}
                </span>
              ` : ''}
            </div>

          </div>
        `).join('')}
      </div>
      <p class="text-xs text-muted mt-sm" style="padding:0 4px">
        ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}
      </p>
    `;
  };

  return { render, _switchTab };

})();
