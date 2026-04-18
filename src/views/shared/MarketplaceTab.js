// ============================================================
// MarketplaceTab.js — Mucuruzi Marketplace
// Shared by ALL roles including Manufacturer (Buy Raw Materials)
// Features:
//   - Browse all products OR browse by seller
//   - Seller name + TIN on every card
//   - Cart with per-seller purchase code fields
//   - Per-seller purchase code validation before checkout
// ============================================================

import { db }                   from "/src/config/firebase.js";
import { getStockByOwner }      from "/src/models/Stock.js";
import { getProductById }       from "/src/models/Product.js";
import { createOrdersFromCart } from "/src/models/Order.js";
import { formatRWF, parsePrice} from "/src/utils/VAT.js";
import { RRA_CATEGORIES }       from "/src/rra/RRA_sandbox.js";
import {
  collection, getDocs, query, where,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Session Cart ──────────────────────────────────────────────
// Key: sellerId_productId → { sellerId, seller, ...itemFields }
const _cart = new Map();

// ── State ─────────────────────────────────────────────────────
let _profile        = null;
let _allListings    = []; // { stock, product, seller }
let _filtered       = [];
let _allSellers     = []; // all active sellers
let _activeCategory = "All";
let _searchQuery    = "";
let _browseMode     = "products"; // "products" | "sellers"
let _selectedSeller = null;

// ── Render Marketplace Tab ────────────────────────────────────
export async function renderMarketplaceTab(container, profile) {
  _profile        = profile;
  _browseMode     = "products";
  _selectedSeller = null;
  _activeCategory = "All";
  _searchQuery    = "";

  container.innerHTML = `
    <div class="market-tab">

      <!-- View Toggle: All Products / By Seller -->
      <div class="market-view-toggle">
        <button class="market-toggle-btn market-toggle-btn--active" id="btn-view-products">
          All Products
        </button>
        <button class="market-toggle-btn" id="btn-view-sellers">
          By Seller
        </button>
      </div>

      <!-- Dynamic Content -->
      <div id="market-content"></div>

    </div>

    <!-- Floating Cart FAB -->
    <button class="cart-fab ${_cart.size > 0 ? "" : "hidden"}" id="cart-fab">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span class="cart-fab-count" id="cart-fab-count">${_cart.size}</span>
    </button>
  `;

  // Toggle events
  document.getElementById("btn-view-products").addEventListener("click", () => {
    _browseMode     = "products";
    _selectedSeller = null;
    _updateViewToggle();
    _renderProductsView();
  });

  document.getElementById("btn-view-sellers").addEventListener("click", () => {
    _browseMode = "sellers";
    _updateViewToggle();
    _renderSellersView();
  });

  // Cart FAB
  document.getElementById("cart-fab").addEventListener("click", _showCartDrawer);

  // Load listings and render
  await _loadAllData();
  _renderProductsView();
}

// ── Update View Toggle ────────────────────────────────────────
function _updateViewToggle() {
  document.getElementById("btn-view-products")
    ?.classList.toggle("market-toggle-btn--active", _browseMode === "products");
  document.getElementById("btn-view-sellers")
    ?.classList.toggle("market-toggle-btn--active", _browseMode === "sellers");
}

// ── Load All Data ─────────────────────────────────────────────
async function _loadAllData() {
  const content = document.getElementById("market-content");
  if (content) content.innerHTML = `
    <div class="market-loading">
      <div class="mini-spinner"></div>
      <span>Loading marketplace…</span>
    </div>
  `;

  try {
    const usersSnap = await getDocs(
      query(collection(db, "users"), where("status", "==", "active"))
    );

    _allSellers = usersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => (u.uid || u.id) !== _profile.uid && u.role !== "buyer");

    const listings = [];

    await Promise.all(_allSellers.map(async (seller) => {
      const sellerId   = seller.uid || seller.id;
      const stockItems = await getStockByOwner(sellerId, "inventory");

      await Promise.all(stockItems.map(async (stock) => {
        if (stock.quantity <= 0)                          return;
        if (!stock.sellingPrice || stock.sellingPrice <= 0) return;

        const product = await getProductById(stock.productId);
        if (!product) return;

        listings.push({ stock, product, seller });
      }));
    }));

    _allListings = listings;
    _filtered    = listings;

  } catch (err) {
    console.error("[Marketplace] loadAllData error:", err);
  }
}

// ══════════════════════════════════════════════════════════════
// VIEW 1 — ALL PRODUCTS
// ══════════════════════════════════════════════════════════════
function _renderProductsView() {
  const content = document.getElementById("market-content");
  if (!content) return;

  content.innerHTML = `
    <!-- Search -->
    <div class="market-search-bar">
      <div class="market-search-wrap">
        <span class="market-search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input type="text" id="market-search" class="market-search-input"
          placeholder="Search products…" autocomplete="off"
          value="${_searchQuery}" />
        <button class="market-search-clear ${_searchQuery ? "" : "hidden"}"
          id="market-search-clear">✕</button>
      </div>
    </div>

    <!-- Category Pills -->
    <div class="market-categories" id="market-categories">
      <button class="cat-pill ${_activeCategory === "All" ? "cat-pill--active" : ""}"
        data-cat="All">All</button>
      ${RRA_CATEGORIES.map(cat => `
        <button class="cat-pill ${_activeCategory === cat ? "cat-pill--active" : ""}"
          data-cat="${cat}">${cat}</button>
      `).join("")}
    </div>

    <!-- Listings -->
    <div id="market-listings"></div>
  `;

  // Search events
  const searchInput = document.getElementById("market-search");
  const clearBtn    = document.getElementById("market-search-clear");

  searchInput.addEventListener("input", (e) => {
    _searchQuery = e.target.value.trim();
    clearBtn.classList.toggle("hidden", !_searchQuery);
    _applyFilters();
    _renderListings();
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    _searchQuery      = "";
    clearBtn.classList.add("hidden");
    _applyFilters();
    _renderListings();
  });

  // Category events
  document.getElementById("market-categories").addEventListener("click", (e) => {
    const pill = e.target.closest(".cat-pill");
    if (!pill) return;
    _activeCategory = pill.dataset.cat;
    document.querySelectorAll(".cat-pill").forEach(p =>
      p.classList.toggle("cat-pill--active", p.dataset.cat === _activeCategory)
    );
    _applyFilters();
    _renderListings();
  });

  _applyFilters();
  _renderListings();
}

// ── Apply Filters ─────────────────────────────────────────────
function _applyFilters() {
  let results = _allListings;

  if (_activeCategory !== "All") {
    results = results.filter(l => l.product.category === _activeCategory);
  }

  if (_searchQuery.length >= 2) {
    const q = _searchQuery.toLowerCase();
    results = results.filter(l =>
      l.product.brandName.toLowerCase().includes(q)      ||
      l.product.description.toLowerCase().includes(q)    ||
      l.product.itemCode.includes(q)                     ||
      (l.seller.businessName || "").toLowerCase().includes(q)
    );
  }

  _filtered = results;
}

// ── Render Product Listings ───────────────────────────────────
function _renderListings() {
  const el = document.getElementById("market-listings");
  if (!el) return;

  if (_filtered.length === 0) {
    el.innerHTML = `
      <div class="market-empty">
        <div class="market-empty-icon">🛒</div>
        <h3>No products found</h3>
        <p>Try a different search or category.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="market-grid">
      ${_filtered.map(({ stock, product, seller }) => _productCardHTML(stock, product, seller)).join("")}
    </div>
  `;

  _bindProductCards();
}

// ── Product Card HTML ─────────────────────────────────────────
function _productCardHTML(stock, product, seller) {
  const sellerId = seller.uid || seller.id;
  const cartKey  = `${sellerId}_${stock.productId}`;
  const inCart   = _cart.has(cartKey);
  const cartItem = _cart.get(cartKey);
  const isLow    = stock.quantity <= 10;

  return `
    <div class="market-card">

      <div class="market-card-header">
        <div>
          <h3 class="market-card-name">${product.brandName}</h3>
          <p class="market-card-desc">${product.description}</p>
        </div>
        <span class="market-vat-badge market-vat-badge--${product.taxGrade}">
          Grade ${product.taxGrade} · ${product.vatRate}%
        </span>
      </div>

      <!-- Seller Info -->
      <div class="market-seller-row">
        <span class="market-seller-icon">🏢</span>
        <span class="market-seller-name">${seller.businessName || seller.name || "—"}</span>
        <span class="market-seller-tin">TIN: ${seller.tinNumber || "—"}</span>
      </div>

      <div class="market-card-meta">
        <span class="market-item-code">${product.itemCode}</span>
        <span class="market-category">${product.category}</span>
      </div>

      <div class="market-card-footer">
        <div class="market-price-wrap">
          <span class="market-price">${formatRWF(stock.sellingPrice)}</span>
          <span class="market-unit">per ${product.unit}</span>
        </div>
        <span class="market-avail ${isLow ? "market-avail--low" : ""}">
          ${isLow ? "⚠️ " : ""}${stock.quantity} ${product.unit} left
        </span>
      </div>

      ${inCart ? `
        <div class="market-in-cart">
          <span>✓ In cart (${cartItem.quantity} ${product.unit})</span>
          <button class="btn-remove-cart" data-key="${cartKey}">Remove</button>
        </div>
      ` : `
        <button class="btn-add-cart"
          data-sellerid="${sellerId}"
          data-productid="${stock.productId}"
          data-maxqty="${stock.quantity}"
          data-price="${stock.sellingPrice}"
          data-name="${product.brandName}"
          data-itemcode="${product.itemCode}"
          data-vatrate="${product.vatRate}"
          data-unit="${product.unit}"
          data-sellername="${seller.businessName || seller.name || ""}"
          data-sellertin="${seller.tinNumber || ""}">
          Add to Cart
        </button>
      `}

    </div>
  `;
}

// ── Bind Product Cards ────────────────────────────────────────
function _bindProductCards() {
  document.querySelectorAll(".btn-add-cart").forEach(btn => {
    btn.addEventListener("click", () => _showAddToCartModal(btn.dataset));
  });

  document.querySelectorAll(".btn-remove-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      _cart.delete(btn.dataset.key);
      _updateCartFab();
      _renderListings();
    });
  });
}

// ══════════════════════════════════════════════════════════════
// VIEW 2 — BY SELLER
// ══════════════════════════════════════════════════════════════
function _renderSellersView() {
  const content = document.getElementById("market-content");
  if (!content) return;

  content.innerHTML = `
    <!-- Seller Search -->
    <div class="market-search-bar">
      <div class="market-search-wrap">
        <span class="market-search-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input type="text" id="seller-search-input" class="market-search-input"
          placeholder="Search business name or TIN…" autocomplete="off" />
        <button class="market-search-clear hidden" id="seller-search-clear">✕</button>
      </div>
    </div>

    <!-- Sellers List or Selected Seller Stock -->
    <div id="sellers-content"></div>
  `;

  const searchInput = document.getElementById("seller-search-input");
  const clearBtn    = document.getElementById("seller-search-clear");
  let   debounce    = null;

  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    clearBtn.classList.toggle("hidden", !val);
    clearTimeout(debounce);
    debounce = setTimeout(() => _renderSellersList(val), 200);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.classList.add("hidden");
    _selectedSeller = null;
    _renderSellersList("");
  });

  _renderSellersList("");
}

// ── Render Sellers List ───────────────────────────────────────
function _renderSellersList(searchQuery) {
  const content = document.getElementById("sellers-content");
  if (!content) return;

  const q = searchQuery.toLowerCase();
  const sellers = _allSellers.filter(s =>
    !searchQuery ||
    (s.businessName || s.name || "").toLowerCase().includes(q) ||
    (s.tinNumber || "").includes(q)
  );

  if (sellers.length === 0) {
    content.innerHTML = `
      <div class="market-empty">
        <div class="market-empty-icon">🏢</div>
        <h3>No sellers found</h3>
        <p>Try a different name or TIN.</p>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="sellers-list">
      ${sellers.map(seller => {
        const sellerId      = seller.uid || seller.id;
        const productCount  = _allListings.filter(l => (l.seller.uid || l.seller.id) === sellerId).length;

        return `
          <div class="seller-card">
            <div class="seller-card-avatar">
              ${(seller.businessName || seller.name || "?").charAt(0).toUpperCase()}
            </div>
            <div class="seller-card-info">
              <div class="seller-card-name">
                ${seller.businessName || seller.name || "—"}
              </div>
              <div class="seller-card-meta">
                <span class="seller-role-tag seller-role-tag--${seller.role}">
                  ${_capitalize(seller.role)}
                </span>
                <span class="seller-tin">TIN: ${seller.tinNumber || "—"}</span>
              </div>
              <div class="seller-product-count">
                ${productCount} product${productCount !== 1 ? "s" : ""} available
              </div>
            </div>
            <button class="btn-view-stock" data-sellerid="${sellerId}">
              View Stock
            </button>
          </div>
        `;
      }).join("")}
    </div>
  `;

  content.querySelectorAll(".btn-view-stock").forEach(btn => {
    btn.addEventListener("click", () => {
      const sellerId = btn.dataset.sellerid;
      const seller   = _allSellers.find(s => (s.uid || s.id) === sellerId);
      if (seller) _renderSellerStock(seller);
    });
  });
}

// ── Render Seller Stock ───────────────────────────────────────
function _renderSellerStock(seller) {
  _selectedSeller = seller;
  const content   = document.getElementById("sellers-content");
  if (!content) return;

  const sellerId = seller.uid || seller.id;
  const listings = _allListings.filter(l => (l.seller.uid || l.seller.id) === sellerId);

  content.innerHTML = `
    <!-- Back button -->
    <button class="btn-back-sellers" id="btn-back-sellers">
      ← Back to Sellers
    </button>

    <!-- Seller Header -->
    <div class="seller-stock-header">
      <div class="seller-stock-avatar">
        ${(seller.businessName || seller.name || "?").charAt(0).toUpperCase()}
      </div>
      <div>
        <h3 class="seller-stock-name">${seller.businessName || seller.name}</h3>
        <div class="seller-stock-meta">
          <span class="seller-role-tag seller-role-tag--${seller.role}">
            ${_capitalize(seller.role)}
          </span>
          <span class="seller-tin">TIN: ${seller.tinNumber || "—"}</span>
        </div>
      </div>
    </div>

    <!-- Seller Products -->
    ${listings.length === 0 ? `
      <div class="market-empty">
        <div class="market-empty-icon">📦</div>
        <h3>No stock available</h3>
        <p>This seller has no products listed yet.</p>
      </div>
    ` : `
      <div class="market-grid">
        ${listings.map(({ stock, product, seller }) =>
          _productCardHTML(stock, product, seller)
        ).join("")}
      </div>
    `}
  `;

  document.getElementById("btn-back-sellers").addEventListener("click", () => {
    _selectedSeller = null;
    _renderSellersView();
  });

  _bindProductCards();
}

// ══════════════════════════════════════════════════════════════
// CART
// ══════════════════════════════════════════════════════════════

// ── Add to Cart Modal ─────────────────────────────────────────
function _showAddToCartModal(data) {
  const existing = document.getElementById("cart-modal");
  if (existing) existing.remove();

  const maxQty = parseInt(data.maxqty || 1);
  const price  = parseFloat(data.price);

  const modal = document.createElement("div");
  modal.id    = "cart-modal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3>${data.name}</h3>
        <button class="modal-close" id="close-cart-modal">✕</button>
      </div>

      <div class="modal-seller-info">
        <span>🏢 ${data.sellername}</span>
        <span class="modal-seller-tin">TIN: ${data.sellertin}</span>
      </div>

      <p class="modal-sub">${formatRWF(price)} per ${data.unit}</p>
      <p class="modal-avail">Available: <strong>${maxQty} ${data.unit}</strong></p>

      <div class="modal-form-group">
        <label>Quantity</label>
        <div class="modal-qty-wrap">
          <button class="qty-btn" id="qty-minus">−</button>
          <input type="number" id="cart-qty" class="qty-input"
            value="1" min="1" max="${maxQty}" />
          <button class="qty-btn" id="qty-plus">+</button>
        </div>
        <p class="qty-max-hint">Max: ${maxQty} ${data.unit}</p>
      </div>

      <div class="modal-total-row">
        <span>Total</span>
        <span id="modal-total">${formatRWF(price)}</span>
      </div>

      <div id="cart-modal-error" class="alert alert--error hidden"></div>

      <div class="modal-actions">
        <button class="btn-outline-sm" id="cancel-cart-modal">Cancel</button>
        <button class="btn-primary-sm" id="confirm-add-cart">Add to Cart</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const qtyInput = document.getElementById("cart-qty");
  const totalEl  = document.getElementById("modal-total");

  const updateTotal = () => {
    const qty = parseInt(qtyInput.value) || 1;
    totalEl.textContent = formatRWF(parsePrice(price * qty));
  };

  document.getElementById("qty-minus").addEventListener("click", () => {
    const v = parseInt(qtyInput.value) || 1;
    if (v > 1) { qtyInput.value = v - 1; updateTotal(); }
  });

  document.getElementById("qty-plus").addEventListener("click", () => {
    const v = parseInt(qtyInput.value) || 1;
    if (v < maxQty) { qtyInput.value = v + 1; updateTotal(); }
  });

  qtyInput.addEventListener("input", updateTotal);

  document.getElementById("close-cart-modal").addEventListener("click",  () => modal.remove());
  document.getElementById("cancel-cart-modal").addEventListener("click", () => modal.remove());

  document.getElementById("confirm-add-cart").addEventListener("click", () => {
    const qty     = parseInt(qtyInput.value) || 0;
    const errorEl = document.getElementById("cart-modal-error");

    if (qty <= 0 || qty > maxQty) {
      errorEl.textContent = qty <= 0
        ? "Please enter a valid quantity."
        : `Maximum available is ${maxQty} ${data.unit}.`;
      errorEl.classList.remove("hidden");
      return;
    }

    // Find full seller object
    const seller = _allSellers.find(s => (s.uid || s.id) === data.sellerid) || {
      uid: data.sellerid, businessName: data.sellername, tinNumber: data.sellertin,
    };

    const cartKey = `${data.sellerid}_${data.productid}`;
    _cart.set(cartKey, {
      sellerId:    data.sellerid,
      seller,
      productId:   data.productid,
      productName: data.name,
      itemCode:    data.itemcode,
      quantity:    qty,
      unitPrice:   price,
      vatRate:     parseFloat(data.vatrate) || 0,
      unit:        data.unit,
    });

    modal.remove();
    _updateCartFab();

    // Refresh current view
    if (_browseMode === "products") _renderListings();
    else if (_selectedSeller)       _renderSellerStock(_selectedSeller);
    else                            _renderSellersList("");
  });
}

// ── Show Cart Drawer ──────────────────────────────────────────
function _showCartDrawer() {
  const existing = document.getElementById("cart-drawer");
  if (existing) existing.remove();
  if (_cart.size === 0) return;

  // Group cart items by seller
  const sellerGroups = new Map();
  _cart.forEach((item, key) => {
    if (!sellerGroups.has(item.sellerId)) {
      sellerGroups.set(item.sellerId, { seller: item.seller, items: [] });
    }
    sellerGroups.get(item.sellerId).items.push({ ...item, key });
  });

  // Build cart HTML
  let cartGroupsHTML = "";
  let grandTotal     = 0;

  sellerGroups.forEach(({ seller, items }, sellerId) => {
    const groupTotal = items.reduce((sum, i) => sum + parsePrice(i.unitPrice * i.quantity), 0);
    grandTotal      += groupTotal;

    cartGroupsHTML += `
      <div class="cart-seller-group">
        <div class="cart-seller-header">
          <div class="cart-seller-info">
            <span class="cart-seller-name">
              🏢 ${seller.businessName || seller.name || "—"}
            </span>
            <span class="cart-seller-tin">TIN: ${seller.tinNumber || "—"}</span>
          </div>
          <span class="cart-seller-subtotal">${formatRWF(groupTotal)}</span>
        </div>

        <div class="cart-seller-hint">
          Dial <strong>*800#</strong> → enter TIN <strong>${seller.tinNumber || "—"}</strong> → get code
        </div>

        <!-- Items -->
        ${items.map(item => `
          <div class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-name">${item.productName}</span>
              <span class="cart-item-qty">${item.quantity} ${item.unit} × ${formatRWF(item.unitPrice)}</span>
            </div>
            <div class="cart-item-right">
              <span class="cart-item-total">${formatRWF(parsePrice(item.unitPrice * item.quantity))}</span>
              <button class="cart-remove-btn" data-key="${item.key}">✕</button>
            </div>
          </div>
        `).join("")}

        <!-- Purchase Code for this seller -->
        <div class="cart-code-wrap">
          <label class="cart-code-label">
            Purchase Code for ${seller.businessName || seller.name}
          </label>
          <input
            type="text"
            class="purchase-code-input"
            id="pcode-${sellerId}"
            placeholder="5–6 digit code"
            maxlength="6"
            inputmode="numeric"
          />
        </div>
      </div>
    `;
  });

  const drawer = document.createElement("div");
  drawer.id    = "cart-drawer";
  drawer.className = "cart-drawer-overlay";
  drawer.innerHTML = `
    <div class="cart-drawer">
      <div class="cart-drawer-header">
        <h3>My Cart (${_cart.size} item${_cart.size !== 1 ? "s" : ""})</h3>
        <button class="modal-close" id="close-cart-drawer">✕</button>
      </div>

      <div class="cart-groups">
        ${cartGroupsHTML}
      </div>

      <div class="cart-grand-total">
        <span>Grand Total</span>
        <span>${formatRWF(grandTotal)}</span>
      </div>

      <div id="cart-checkout-error" class="alert alert--error hidden"></div>

      <div class="cart-actions">
        <button class="btn-outline-sm" id="btn-continue-shopping">
          Continue Shopping
        </button>
        <button class="btn-primary-sm" id="btn-place-orders">
          <span id="place-orders-text">Place Orders</span>
          <span id="place-orders-spinner" class="btn-spinner hidden"></span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(drawer);

  document.getElementById("close-cart-drawer").addEventListener("click",     () => drawer.remove());
  document.getElementById("btn-continue-shopping").addEventListener("click", () => drawer.remove());

  // Remove items
  drawer.querySelectorAll(".cart-remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      _cart.delete(btn.dataset.key);
      _updateCartFab();
      drawer.remove();
      if (_browseMode === "products") _renderListings();
      else if (_selectedSeller)       _renderSellerStock(_selectedSeller);
      if (_cart.size > 0) setTimeout(_showCartDrawer, 100);
    });
  });

  // Place orders
  document.getElementById("btn-place-orders").addEventListener("click", async () => {
    await _handleCheckout(drawer, sellerGroups);
  });
}

// ── Handle Checkout ───────────────────────────────────────────
async function _handleCheckout(drawer, sellerGroups) {
  const errorEl   = document.getElementById("cart-checkout-error");
  const btn       = document.getElementById("btn-place-orders");
  const btnText   = document.getElementById("place-orders-text");
  const btnSpinner= document.getElementById("place-orders-spinner");

  if (errorEl) errorEl.classList.add("hidden");

  // Collect purchase codes
  const cartGroups = [];
  let   hasError   = false;

  sellerGroups.forEach(({ seller, items }, sellerId) => {
    const input        = document.getElementById(`pcode-${sellerId}`);
    const purchaseCode = input?.value.trim() || "";

    if (!purchaseCode || !/^\d{5,6}$/.test(purchaseCode)) {
      if (input) {
        input.style.borderColor = "var(--error)";
        input.placeholder       = "Required — 5 or 6 digits";
      }
      hasError = true;
    } else {
      if (input) input.style.borderColor = "";
      cartGroups.push({ sellerId, seller, items, purchaseCode });
    }
  });

  if (hasError) {
    if (errorEl) {
      errorEl.textContent = "Please enter purchase codes for all sellers.";
      errorEl.classList.remove("hidden");
    }
    return;
  }

  if (btn)      btn.disabled       = true;
  if (btnText)  btnText.textContent = "Placing orders…";
  if (btnSpinner) btnSpinner.classList.remove("hidden");

  const result = await createOrdersFromCart({ buyer: _profile, cartGroups });

  if (btn)      btn.disabled       = false;
  if (btnText)  btnText.textContent = "Place Orders";
  if (btnSpinner) btnSpinner.classList.add("hidden");

  if (result.success) {
    _cart.clear();
    _updateCartFab();
    drawer.remove();

    if (_browseMode === "products") _renderListings();
    else if (_selectedSeller)       _renderSellerStock(_selectedSeller);

    _showToast(`${result.orderIds.length} order${result.orderIds.length !== 1 ? "s" : ""} placed successfully!`, "success");
  } else {
    // Show specific validation errors
    const errorMsgs = result.errors?.map(e =>
      `${e.sellerName}: ${e.error}`
    ).join(" • ") || "Failed to place orders.";

    if (errorEl) {
      errorEl.textContent = errorMsgs;
      errorEl.classList.remove("hidden");
    }
  }
}

// ── Update Cart FAB ───────────────────────────────────────────
function _updateCartFab() {
  const fab      = document.getElementById("cart-fab");
  const fabCount = document.getElementById("cart-fab-count");
  if (!fab) return;
  if (_cart.size > 0) {
    fab.classList.remove("hidden");
    if (fabCount) fabCount.textContent = _cart.size;
  } else {
    fab.classList.add("hidden");
  }
}

// ── Toast ─────────────────────────────────────────────────────
function _showToast(msg, type = "success") {
  const existing = document.querySelector(".market-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = `market-toast market-toast--${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Helpers ───────────────────────────────────────────────────
function _capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
