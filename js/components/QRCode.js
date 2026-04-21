// ============================================================
//  MUCURUZI — QRCode.js (stub — full version coming later)
// ============================================================
const QRCode = {
  render: (url, containerId) => {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<p class="text-xs text-muted">${url}</p>`;
  },
};
      
