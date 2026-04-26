// ============================================================
//  MUCURUZI — InventoryView.js
//  Distributor and Retailer. Shows inventory stock.
//
//  Each stock card has two actions:
//  1. Edit selling price
//  2. List on Marketplace → sets public price → creates listing
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
          placeholder="Search inventory..."
          oninput="InventoryView._filter(this.value)" />
        <button class="btn btn-primary" onclick="Router.navigate('#marketplace')">
          + Buy More Stock
        </button>
      </div>

      <div id="inventory-list">
        <div class="loader-spinner" style="margin:40px auto;"></div>
      </div>
    `;

    await _load(user);
  };

  const _load = async (user) => {
    const res  = await StockService.getMyStock(user.uid, STOCK_TYPES.INVENTORY);
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
          <p class="empty-state-text">
            Buy stock from the marketplace to get started.
          </p>
          <button class="btn btn-primary" onclick="Router.navigate('#marketplace')">
            Browse Marketplace
          </button>
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

              <!-- Stock source badge -->
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="badge ${s.source === 'produced' ? 'badge-manufacturer' : 'badge-info'}">
                  ${s.source === 'produced' ? '🏭 Produced' : '📦 Purchased'}
                </span>
                ${lowStock ? `<span class="low-stock-badge">⚠ Low</span>` : ''}
              </div>

              <!-- Product name -->
              <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:4px">
                ${s.productName}
              </h3>
              <p class="text-muted text-sm">${s.unit}</p>

              <!-- Stats -->
              <div style="margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div>
                  <p class="stat-label">Quantity</p>
                  <p style="font-size:1.4rem;font-weight:700;color:${lowStock ? 'var(--color-warning)' : 'var(--color-text)'}">
                    ${s.quantity}
                  </p>
                </div>
                <div>
                  <p class="stat-label">${s.source === 'produced' ? 'Production Cost' : 'Buying Price'}</p>
                  <p style="font-weight:600">
                    ${s.buyingPrice === 0 ? '—' : Formatters.formatCurrency(s.buyingPrice)}
                  </p>
                </div>
              </div>

              <!-- Selling price row -->
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <div>
                  <p class="stat-label">Selling Price</p>
                  <p style="font-weight:600;color:var(--color-accent)">
                    ${Formatters.formatCurrency(s.sellingPrice)}
                  </p>
                </div>
                <button class="btn btn-ghost btn-sm"
                  onclick="InventoryView._editPrice('${s.stockId}', '${s.productName}', ${s.sellingPrice})">
                  ✏ Edit
                </button>
              </div>

              <!-- Action buttons -->
              <div style="display:flex;flex-direction:column;gap:6px">
                <button class="btn btn-primary btn-sm btn-block"
                  onclick="InventoryView._openListModal('${s.stockId}')">
                  ⊞ List on Marketplace
                </button>
              </div>

              <p class="text-xs text-muted mt-sm">
                Updated ${Formatters.timeAgo(s.updatedAt)}
              </p>
            </div>
          `;
        }).join('')}
      </div>
    `;
  };

  // ── List on Marketplace ───────────────────────────────────────
  const _openListModal = (stockId) => {
    const stockItem = _allStock.find(s => s.stockId === stockId);
    if (!stockItem) return;

    // Suggest a price — selling price already set or default markup
    const suggestedPrice = stockItem.sellingPrice || 0;

    Modal.show({
      title: 'List on Marketplace',
      body: `
        <!-- Product info -->
        <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-md)">
          <p style="font-weight:700">${stockItem.productName}</p>
          <p class="text-muted text-xs">
            Available stock: <strong>${stockItem.quantity} ${stockItem.unit}</strong>
          </p>
          ${stockItem.buyingPrice > 0 ? `
            <p class="text-muted text-xs">
              Buying price: ${Formatters.formatCurrency(stockItem.buyingPrice)} / ${stockItem.unit}
            </p>
          ` : ''}
        </div>

        <!-- Public price -->
        <div class="form-group">
          <label class="form-label">
            Public Selling Price (RWF per ${stockItem.unit})
          </label>
          <input id="listing-price" type="number" class="form-input"
            value="${suggestedPrice}"
            placeholder="e.g. 1500"
            min="0" step="1" />
          <p class="form-hint">
            This is the price buyers will see on the marketplace.
          </p>
        </div>

        <!-- Info -->
        <div style="background:var(--color-accent-glow);border:1px solid var(--color-accent);border-radius:var(--radius-md);padding:var(--space-sm) var(--space-md)">
          <p class="text-xs" style="color:var(--color-accent)">
            ✓ Your product will appear on the marketplace<br/>
            ✓ Buyers can find and order from you directly<br/>
            ✓ Your stock levels are already tracked
          </p>
        </div>
      `,
      confirmText: 'List on Marketplace',
      onConfirm:   () => _submitListing(stockItem),
    });
  };

  const _submitListing = async (stockItem) => {
    const price = parseFloat(document.getElementById('listing-price')?.value);

    if (!price || price <= 0) {
      Toast.error('Please enter a valid selling price.');
      return;
    }

    Loader.show('Listing product...');

    const user = window.currentUser;

    // Fetch product details for the listing
    const productRes = await ProductService.getProductById(stockItem.productId);

    // Build product object — use stock data as fallback if product doc missing
    const product = productRes.success ? productRes.data : {
      productId:   stockItem.productId,
      productName: stockItem.productName,
      rraItemCode: '00000000',
      category:    'General',
      unit:        stockItem.unit,
      taxGrade:    'B',
    };

    // Create or update listing
    const listingRes = await MarketplaceService.createListing(
      user.uid,
      user,
      product,
      price
    );

    if (!listingRes.success) {
      Loader.hide();

      // If listing already exists just update the price
      if (listingRes.error && listingRes.error.includes('exists')) {
        const listingId = `${user.uid}_${stockItem.productId}`;
        await MarketplaceService.updateListingPrice(listingId, price, user.uid);
        Loader.hide();
        Toast.success(`${stockItem.productName} price updated on marketplace!`);
        return;
      }

      Toast.error('Listing failed: ' + listingRes.error);
      return;
    }

    // Also update selling price on stock document to match
    await db.collection(Collections.STOCK).doc(stockItem.stockId).update({
      sellingPrice: Price.round(price),
      updatedAt:    serverTimestamp(),
    });

    Loader.hide();
    Toast.success(`${stockItem.productName} is now listed on the marketplace!`);

    // Reload inventory
    await _load(user);
  };

  // ── Edit Selling Price ────────────────────────────────────────
  const _editPrice = (stockId, productName, currentPrice) => {
    Modal.show({
      title: 'Edit Selling Price',
      body: `
        <p class="mb-md">
          Update selling price for <strong>${productName}</strong>
        </p>
        <div class="form-group">
          <label class="form-label">New Selling Price (RWF)</label>
          <input id="new-price" type="number" class="form-input"
            value="${currentPrice}" min="0" />
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
        await _load(window.currentUser);
      },
    });
  };

  return { render, _filter, _openListModal, _editPrice };

})();
