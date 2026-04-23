// ============================================================
//  MUCURUZI — OrderListView.js
//  All roles. Two tabs: received orders (seller) + placed orders (buyer).
// ============================================================

const OrderListView = (() => {

  let _receivedOrders = [];
  let _placedOrders   = [];
  let _activeTab      = 'received';

  const render = async (user, root) => {
    const isSeller = ROLE_CAN_SELL.includes(user.role);

    root.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">${user.role === ROLES.BUYER ? 'My Orders' : 'Orders'}</h1>
        <p class="page-subtitle">Track all your buying and selling activity</p>
      </div>

      ${isSeller ? `
        <div class="tab-bar">
          <button class="tab-btn active" id="tab-received" onclick="OrderListView._switchTab('received')">
            Received Orders
          </button>
          <button class="tab-btn" id="tab-placed" onclick="OrderListView._switchTab('placed')">
            Placed Orders
          </button>
        </div>
      ` : ''}

      <div id="orders-container">
        <div class="loader-spinner" style="margin:40px auto;"></div>
      </div>
    `;

    _activeTab = isSeller ? 'received' : 'placed';
    await _load(user);
  };

  const _load = async (user) => {
    const isSeller = ROLE_CAN_SELL.includes(user.role);

    const promises = [OrderService.getMyOrders(user.uid, 'buyer')];
    if (isSeller) promises.push(OrderService.getMyOrders(user.uid, 'seller'));

    const [placedRes, receivedRes] = await Promise.all(promises);
    _placedOrders   = placedRes.data   || [];
    _receivedOrders = receivedRes?.data || [];

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
    const orders = tab === 'received' ? _receivedOrders : _placedOrders;
    const el     = document.getElementById('orders-container');
    if (!el) return;

    if (orders.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">◫</div>
          <h3 class="empty-state-title">No orders yet</h3>
          <p class="empty-state-text">${tab === 'received' ? 'Orders from buyers will appear here.' : 'Your placed orders will appear here.'}</p>
          ${tab === 'placed' ? `<button class="btn btn-primary" onclick="Router.navigate('#marketplace')">Browse Marketplace</button>` : ''}
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="order-list">
        ${orders.map(o => `
          <div class="card order-card" onclick="Router.navigate('#order/${o.orderId}')" style="cursor:pointer;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
              <div>
                <p class="text-xs text-muted">${o.orderId}</p>
                <h3 style="font-weight:600;margin:4px 0">${tab === 'received' ? o.buyerName : o.sellerName}</h3>
                <p class="text-sm text-muted">${o.items.length} item${o.items.length > 1 ? 's' : ''} · ${Formatters.formatDateTime(o.createdAt)}</p>
              </div>
              <div style="text-align:right">
                <p style="font-family:var(--font-display);font-size:1.1rem;font-weight:700">${Formatters.formatCurrency(o.total)}</p>
                <span class="badge badge-${_statusBadge(o.status)}">${Formatters.formatStatus(o.status)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const _statusBadge = (s) => ({ pending:'warning', confirmed:'success', rejected:'danger' }[s] || 'muted');

  return { render, _switchTab };

})();
