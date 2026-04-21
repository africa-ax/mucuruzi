// ============================================================
//  MUCURUZI — Toast.js
//  Global notification toasts: success, error, info, warning
//
//  Usage:
//    Toast.show('Saved successfully', 'success')
//    Toast.show('Something went wrong', 'error')
//    Toast.show('Please note this', 'info')
//    Toast.show('Check this field', 'warning')
// ============================================================

const Toast = (() => {

  const _container = () => document.getElementById('toast-container');

  const _icons = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
    warning: '⚠',
  };

  const show = (message, type = 'info', duration = 3500) => {
    const container = _container();
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${_icons[type] || _icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('toast-show'));

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  return { show };

})();
