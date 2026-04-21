// ============================================================
//  MUCURUZI — Loader.js (stub — full version coming later)
// ============================================================
const Loader = {
  show: () => {
    const el = document.getElementById('app-loader');
    if (el) el.classList.remove('fade-out');
  },
  hide: () => {
    const el = document.getElementById('app-loader');
    if (el) el.classList.add('fade-out');
  },
};
    
