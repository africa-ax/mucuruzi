// ============================================================
//  MUCURUZI — InventoryView.js
//  All seller roles (Manufacturer, Distributor, Retailer).
//  Shows inventory stock with:
//  - List on Marketplace button
//  - Remove from Marketplace button
//  - Edit selling price
// ============================================================

const InventoryView = (() => {

  let _allStock    = [];
  let _listings    = {};  // productId → listing document

  const render = async (user, root) => {
    root.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Inventory</h1>
        <p class="page-subtitle">Your produced and purchased goods</p>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:var(--space-md);flex-wrap:wrap">
        <input id="inv-search" type="text" class="form-input"
          style="flex:1;min-width:200px"
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
    // Fetch inventory stock
    const stockRes = await StockService.getMyStock(user.uid, STOCK_TYPES.INVENTORY);
    _allStock = stockRes.data || [];

    // Fetch existing listings to know which products are already listed
    const listingsRes = await MarketplaceService.getListingsBySeller(user.uid);
    _listings = {};
    (listingsRes.data || []).forEach(l => {
      _listings[l.productId] = l;
    });

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
          <div class="empty-state-icon">📦</div>
          <h3 class="empty-state-title">No inventory yet</h3>
          <p class="empty-state-text">
            List your products on the marketplace or buy stock to get started.
          </p>
          <button class="btn btn-primary mt-md"
            onclick="Router.navigate('#marketplace')">
            Browse Marketplace
          </button>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="product-grid">
        ${stock.map(s => {
          const lowStock  = s.quantity <= 5;
          const isListed  = !!_listings[s.productId];
          const listing   = _listings[s.productId];

          return `
            <div class="card product-card ${lowStock ? 'low-stock-card' : ''}">

              <!-- Top row: source badge + low stock -->
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span class="badge ${s.source === 'produced' ? 'badge-manufacturer' : 'badge-info'}">
                  ${s.source === 'produced' ? '🏭 Produced' : '📦 Purchased'}
                </span>
                ${lowStock ? `<span class="low-stock-badge">⚠ Low</span>` : ''}
              </div>

              <!-- Product name -->
              <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:2px">
                ${s.productName}
              </h3>
              <p class="text-muted text-xs">${s.unit}</p>

              <!-- Stats grid -->
              <div style="margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div>
                  <p class="stat-label">Quantity</p>
                  <p style="font-size:1.4rem;font-weight:700;color:${lowStock ? 'var(--color-warning)' : 'var(--color-text)'}">
                    ${s.quantity} <span class="text-xs text-muted">${s.unit}</span>
                  </p>
                </div>
                <div>
                  <p class="stat-label">Cost Price</p>
                  <p style="font-weight:600">
                    ${s.buyingPrice === 0 ? '—' : Formatters.formatCurrency(s.buyingPrice)}
                  </p>
                </div>
              </div>

              <!-- Selling price -->
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border);margin-bottom:12px">
                <div>
                  <p class="stat-label">Selling Price</p>
                  <p style="font-weight:700;color:var(--color-accent)">
                    ${Formatters.formatCurrency(s.sellingPrice)}
                  </p>
                </div>
                <button class="btn btn-ghost btn-sm"
                  onclick="InventoryView._editPrice('${s.stockId}', '${s.productName.replace(/'/g, "\\'")}', ${s.sellingPrice})">
                  ✏ Edit
                </button>
              </div>

              <!-- Marketplace status + actions -->
              ${isListed ? `
                <div style="margin-bottom:8px">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                    <span class="badge badge-success">✓ Listed</span>
                    <span class="text-xs text-muted">
                      ${Formatters.formatCurrency(listing.publicPrice)} / ${s.unit}
                    </span>
                  </div>
                  <button class="btn btn-danger btn-sm btn-block"
                    onclick="InventoryView._removeListing('${listing.listingId}', '${s.productName.replace(/'/g, "\\'")}')">
                    ✕ Remove from Marketplace
                  </button>
                </div>
              ` : `
                <button class="btn btn-primary btn-sm btn-block"
                  onclick="InventoryView._openListModal('${s.stockId}')">
                  ⊞ List on Marketplace
                </button>
              `}

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

    Modal.show({
      title: 'List on Marketplace',
      body: `
        <div style="background:var(--color-surface-2);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-md)">
          <p style="font-weight:700">${stockItem.productName}</p>
          <p class="text-muted text-xs">
            Available: <strong>${stockItem.quantity} ${stockItem.unit}</strong>
          </p>
        </div>
        <div class="form-group">
          <label class="form-label">
            Public Selling Price (RWF per ${stockItem.unit})
          </label>
          <input id="listing-price" type="number" class="form-input"
            value="${stockItem.sellingPrice || ''}"
            placeholder="e.g. 1500" min="0" step="1" />
          <p class="form-hint">Price buyers will see on the marketplace.</p>
        </div>
        <div style="background:var(--color-accent-glow);border:1px solid var(--color-accent);border-radius:var(--radius-md);padding:var(--space-sm) var(--space-md)">
          <p class="text-xs" style="color:var(--color-accent)">
            ✓ Product will appear on marketplace<br/>
            ✓ Buyers can find and order from you<br/>
            ✓ You can remove it anytime
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

    // Get product details
    const productRes = await ProductService.getProductById(stockItem.productId);
    const product = productRes.success ? productRes.data : {
      productId:   stockItem.productId,
      productName: stockItem.productName,
      rraItemCode: '00000000',
      category:    'General',
      unit:        stockItem.unit,
      taxGrade:    'B',
    };

    const listingRes = await MarketplaceService.createListing(
      user.uid, user, product, price
    );

    if (!listingRes.success) {
      // Try updating price if listing already exists
      const listingId = `${user.uid}_${stockItem.productId}`;
      await MarketplaceService.updateListingPrice(listingId, price, user.uid);
    }

    // Update selling price on stock too
    await db.collection(Collections.STOCK).doc(stockItem.stockId).update({
      sellingPrice: Price.round(price),
      updatedAt:    serverTimestamp(),
    });

    Loader.hide();
    Toast.success(`${stockItem.productName} is now listed on the marketplace!`);
    await _load(user);
  };

  // ── Remove from Marketplace ───────────────────────────────────
  const _removeListing = (listingId, productName) => {
    Modal.danger(
      'Remove Listing',
      `Remove "${productName}" from the marketplace? Buyers will no longer see it. Your stock is not affected.`,
      async () => {
        Loader.show('Removing listing...');
        await MarketplaceService.toggleListing(listingId, false, window.currentUser.uid);
        // Actually delete it cleanly
        await db.collection(Collections.LISTINGS).doc(listingId).delete();
        Loader.hide();
        Toast.success(`${productName} removed from marketplace.`);
        await _load(window.currentUser);
      },
      'Remove'
    );
  };

  // ── Edit Selling Price ────────────────────────────────────────
  const _editPrice = (stockId, productName, currentPrice) => {
    Modal.show({
      title: 'Edit Selling Price',
      body: `
        <p class="mb-md">Update selling price for <strong>${productName}</strong></p>
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

        Loader.show('Updating...');
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

  return { render, _filter, _openListModal, _removeListing, _editPrice };

})();
