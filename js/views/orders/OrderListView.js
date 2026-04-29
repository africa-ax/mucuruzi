// ============================================================
//  MUCURUZI — OrderListView.js
//  Compact list rows — 10+ orders visible without scrolling.
// ============================================================

const OrderListView = (() => {

  let _receivedOrders = [];
  let _placedOrders   = [];
  let _activeTab      = 'received';

  const render = async (user, root) => {
    const isSeller = ROLE_CAN_SELL.includes(user.role);
    _activeTab     = isSeller ? 'received' : 'placed';

    root.innerHTML = `
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="page-title">${user.role === ROLES.BUYER ? 'My Orders' : 'Orders'}</h1>
          <p class="page-subtitle">Track all your buying and selling activity</p>
        </div>
      </div>

      ${isSeller ? `
        <div class="tab-bar">
          <button class="tab-btn active" id="tab-received"
            onclick="OrderListView._switchTab('received')">
            Received
          </button>
          <button class="tab-btn" id="tab-placed"
            onclick="OrderListView._switchTab('placed')">
            Placed
          </button>
        </div>
      ` : ''}

      <div id="orders-container">
        <div class="loader-spinner" style="margin:40px auto;"></div>
      </div>
    `;

    await _load(user);
  };

  const _load = async (user) => {
    const isSeller  = ROLE_CAN_SELL.includes(user.role);
    const promises  = [OrderService.getMyOrders(user.uid, 'buyer')];
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
          <p class="empty-state-text">
            ${tab === 'received'
              ? 'Orders from buyers will appear here.'
              : 'Your placed orders will appear here.'}
          </p>
          ${tab === 'placed' ? `
            <button class="btn btn-primary"
              onclick="Router.navigate('#marketplace')">
              Browse Marketplace
            </button>
          ` : ''}
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div class="list-container">
        ${orders.map(o => `
          <div class="list-row"
            onclick="Router.navigate('#order/${o.orderId}')">
            <div class="list-row-main">
              <p class="list-row-title">
                ${tab === 'received' ? o.buyerName : o.sellerName}
              </p>
              <p class="list-row-sub">
                ${o.items.length} item${o.items.length > 1 ? 's' : ''}
                · ${Formatters.timeAgo(o.createdAt)}
              </p>
            </div>
            <div class="list-row-meta">
              <span class="list-row-amount">
                ${Formatters.formatCurrency(o.total)}
              </span>
              <span class="badge badge-${_statusBadge(o.status)}">
                ${Formatters.formatStatus(o.status)}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
      <p class="text-xs text-muted mt-sm" style="padding:0 4px">
        ${orders.length} order${orders.length !== 1 ? 's' : ''}
      </p>
    `;
  };

  const _statusBadge = (s) => ({
    pending:'warning', confirmed:'success', rejected:'danger'
  }[s] || 'muted');

  return { render, _switchTab };

})();
