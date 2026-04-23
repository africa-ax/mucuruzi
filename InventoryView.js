// ============================================================
//  MUCURUZI — InventoryView.js
//  Distributor and Retailer. Shows inventory stock.
// ============================================================

const InventoryView = (() => {

  let _allStock = [];

  const render = async (user, root) => {
    root.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Inventory</h1>
        <p class="page-subtitle">Your current stock levels</p>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:var(--space-md);flex-wrap:wrap">
        <input id="inv-search" type="text" class="form-input" style="flex:1;min-width:200px"
          placeholder="Search inventory..." oninput="InventoryView._filter(this.value)" />
        <button class="btn btn-primary" onclick="Router.navigate('#marketplace')">+ Buy Stock</button>
      </div>

      <div id="inventory-list"><div class="loader-spinner" style="margin:40px auto;"></div></div>
    `;

    await _load(user);
  };

  const _load = async (user) => {
    const res = await StockService.getMyStock(user.uid, STOCK_TYPES.INVENTORY);
    _allStock  = res.data || [];
    _render(_allStock);
  };

  const _filter = (query) => {
    const q = query.toLowerCase();
    _render(_allStock.filter(s => s.productName.toLowerCase().includes(q)));
  };

  const _render = (stock) => {
    const el = document.getElementById('inventory-list');
    if (!el) return;

    if (stock.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⬡</div>
          <h3 class="empty-state-title">No inventory yet</h3>
          <p class="empty-state-text">Buy stock from the marketplace to get started.</p>
          <button class="btn btn-primary" onclick="Router.navigate('#marketplace')">Browse Marketplace</button>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="product-grid">
        ${stock.map(s => {
          const lowStock = s.quantity <= 5;
          return `
            <div class="card product-card ${lowStock ? 'low-stock-card' : ''}">
              ${lowStock ? `<div class="low-stock-badge">⚠ Low Stock</div>` : ''}
              <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:4px">${s.productName}</h3>
              <p class="text-muted text-sm">${s.unit}</p>
              <div style="margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div>
                  <p class="stat-label">Quantity</p>
                  <p style="font-size:1.4rem;font-weight:700;color:${lowStock?'var(--color-warning)':'var(--color-text)'}">${s.quantity}</p>
                </div>
                <div>
                  <p class="stat-label">Buying Price</p>
                  <p style="font-weight:600">${Formatters.formatCurrency(s.buyingPrice)}</p>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <p class="stat-label">Selling Price</p>
                  <p style="font-weight:600;color:var(--color-accent)">${Formatters.formatCurrency(s.sellingPrice)}</p>
                </div>
                <button class="btn btn-secondary btn-sm"
                  onclick="InventoryView._editPrice('${s.stockId}','${s.productName}',${s.sellingPrice})">
                  Edit Price
                </button>
              </div>
              <p class="text-xs text-muted mt-sm">Updated ${Formatters.timeAgo(s.updatedAt)}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  const _editPrice = (stockId, productName, currentPrice) => {
    Modal.show({
      title: 'Edit Selling Price',
      body: `
        <p class="mb-md">Update selling price for <strong>${productName}</strong></p>
        <div class="form-group">
          <label class="form-label">New Selling Price (RWF)</label>
          <input id="new-price" type="number" class="form-input" value="${currentPrice}" min="0" />
        </div>
      `,
      confirmText: 'Update Price',
      onConfirm: async () => {
        const newPrice = parseFloat(document.getElementById('new-price')?.value);
        if (!newPrice || newPrice < 0) { Toast.error('Enter a valid price.'); return; }

        Loader.show('Updating price...');
        await db.collection(Collections.STOCK).doc(stockId).update({
          sellingPrice: Price.round(newPrice),
          updatedAt:    serverTimestamp(),
        });
        Loader.hide();
        Toast.success('Selling price updated.');
        InventoryView.render(window.currentUser, document.getElementById('app-root'));
      },
    });
  };

  return { render, _filter, _editPrice };

})();
