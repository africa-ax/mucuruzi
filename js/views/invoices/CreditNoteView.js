// ============================================================
//  MUCURUZI — CreditNoteView.js
//  Displays an approved return credit note document.
//  Accessible by both buyer and seller.
// ============================================================

const CreditNoteView = (() => {

  const render = async (user, creditNoteId, root) => {
    root.innerHTML = `
      <div class="page-header" style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-ghost btn-sm" onclick="Router.navigate('#invoices')">← Back</button>
        <h1 class="page-title">Credit Note</h1>
      </div>
      <div id="cn-content">
        <div class="loader-spinner" style="margin:40px auto;"></div>
      </div>
    `;

    const res = await InvoiceService.getCreditNote(creditNoteId);
    if (!res.success) { Toast.error(res.error); return; }

    _render(res.data);
  };

  const _render = (cn) => {
    const el = document.getElementById('cn-content');
    if (!el) return;

    el.innerHTML = `
      <div style="max-width:640px">

        <!-- Header -->
        <div class="card mb-md" style="border-color:var(--color-warning);background:rgba(245,166,35,0.05)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <div style="width:32px;height:32px;background:var(--color-warning);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#000;font-size:0.9rem">CN</div>
                <span style="font-family:var(--font-display);font-weight:700">Credit Note</span>
              </div>
              <span class="badge badge-warning">Return Approved</span>
            </div>
            <div style="text-align:right">
              <p class="text-xs text-muted">Credit Note ID</p>
              <p style="font-family:var(--font-display);font-weight:700;color:var(--color-warning)">${cn.creditNoteId}</p>
              <p class="text-xs text-muted mt-sm">${Formatters.formatDateTime(cn.createdAt)}</p>
            </div>
          </div>
        </div>

        <!-- Reference -->
        <div class="card mb-md">
          <p class="stat-label">Original Invoice</p>
          <a href="#invoice/${cn.invoiceId}" style="color:var(--color-accent);font-weight:600">${cn.invoiceId}</a>
          <p class="text-xs text-muted mt-sm">Receipt: ${cn.originalReceiptNumber} · SDC: ${cn.originalSdcId}</p>
        </div>

        <!-- Parties -->
        <div class="card mb-md">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div>
              <p class="stat-label">Seller</p>
              <p style="font-weight:600">${cn.sellerName}</p>
              <p class="text-muted text-xs">TIN: ${cn.sellerTIN}</p>
            </div>
            <div>
              <p class="stat-label">Buyer</p>
              <p style="font-weight:600">${cn.buyerName}</p>
              <p class="text-muted text-xs">TIN: ${cn.buyerTIN}</p>
            </div>
          </div>
        </div>

        <!-- Returned Items -->
        <div class="card mb-md">
          <h3 class="card-title mb-md">Returned Items</h3>
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Refund VAT</th>
                  <th>Refund Total</th>
                </tr>
              </thead>
              <tbody>
                ${cn.returnedItems.map(i => `
                  <tr>
                    <td>
                      <p style="font-weight:500">${i.productName}</p>
                      <p class="text-xs text-muted">${i.unit}</p>
                    </td>
                    <td>${i.quantity}</td>
                    <td>${Formatters.formatCurrency(i.unitPrice)}</td>
                    <td>${Formatters.formatCurrency(i.refundVAT)}</td>
                    <td style="font-weight:600;color:var(--color-warning)">${Formatters.formatCurrency(i.refundTotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top:16px;text-align:right">
            <p style="font-size:1.3rem;font-weight:700;color:var(--color-warning)">
              Total Refund: ${Formatters.formatCurrency(cn.totalRefund)}
            </p>
          </div>
        </div>

        <!-- Footer Note -->
        <div class="card" style="text-align:center;padding:var(--space-lg)">
          <p class="text-muted text-sm">
            This credit note confirms that the above items have been returned
            and stock has been reversed accordingly.
          </p>
          <p class="text-xs text-muted mt-sm">Approved by seller on ${Formatters.formatDateTime(cn.createdAt)}</p>
        </div>

      </div>
    `;
  };

  return { render };

})();
