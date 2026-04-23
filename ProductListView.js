// ============================================================
//  MUCURUZI — ProductListView.js
//  Manufacturer only. Shows all products they created.
// ============================================================

const ProductListView = (() => {

  let _allProducts = [];

  const render = async (user, root) => {
    root.innerHTML = `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="page-title">My Products</h1>
          <p class="page-subtitle">Products you have registered with RRA item codes</p>
        </div>
        <button class="btn btn-primary" onclick="Router.navigate('#product-form')">+ Add Product</button>
      </div>

      <div class="form-group">
        <input id="product-search" type="text" class="form-input" placeholder="Search products..." oninput="ProductListView._filter(this.value)" />
      </div>

      <div id="product-list"><div class="loader-spinner" style="margin:40px auto;"></div></div>
    `;

    await _load(user);
  };

  const _load = async (user) => {
    const res = await ProductService.getMyProducts(user.uid);
    _allProducts = res.data || [];
    _render(_allProducts);
  };

  const _filter = (query) => {
    const q = query.toLowerCase();
    const filtered = _allProducts.filter(p =>
      p.productName.toLowerCase().includes(q) ||
      p.rraItemCode.includes(q) ||
      p.category.toLowerCase().includes(q)
    );
    _render(filtered);
  };

  const _render = (products) => {
    const el = document.getElementById('product-list');
    if (!el) return;

    if (products.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⬡</div>
          <h3 class="empty-state-title">No products yet</h3>
          <p class="empty-state-text">Add your first product using official RRA item codes.</p>
          <button class="btn btn-primary" onclick="Router.navigate('#product-form')">+ Add Product</button>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="product-grid">
        ${products.map(p => `
          <div class="card product-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <span class="badge badge-muted">${p.rraItemCode}</span>
              <span class="badge badge-${_taxBadge(p.taxGrade)}">Grade ${p.taxGrade}</span>
            </div>
            <h3 style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:4px">${p.productName}</h3>
            <p class="text-muted text-sm">${p.category} · ${p.unit}</p>
            <div style="margin-top:12px;display:flex;gap:8px">
              <button class="btn btn-secondary btn-sm" onclick="ProductListView._listOnMarket('${p.productId}')">List on Market</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const _listOnMarket = (productId) => {
    const product = _allProducts.find(p => p.productId === productId);
    if (!product) return;

    Modal.show({
      title:       'List on Marketplace',
      body: `
        <p class="mb-md">Set a public selling price for <strong>${product.productName}</strong></p>
        <div class="form-group">
          <label class="form-label">Public Price (RWF)</label>
          <input id="listing-price" type="number" class="form-input" placeholder="e.g. 1500" min="0" />
        </div>
      `,
      confirmText: 'List Product',
      onConfirm:   async () => {
        const price = parseFloat(document.getElementById('listing-price')?.value);
        if (!price || price <= 0) { Toast.error('Enter a valid price.'); return; }

        Loader.show('Listing product...');
        const res = await MarketplaceService.createListing(
          window.currentUser.uid,
          window.currentUser,
          product,
          price
        );
        Loader.hide();

        if (res.success) Toast.success('Product listed on marketplace!');
        else Toast.error(res.error);
      },
    });
  };

  const _taxBadge = (g) => ({ A:'warning', B:'info', C:'success', D:'muted' }[g] || 'muted');

  return { render, _filter, _listOnMarket };

})();
