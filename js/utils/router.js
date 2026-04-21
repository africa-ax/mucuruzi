// ============================================================
//  MUCURUZI — router.js (stub — full version coming later)
// ============================================================
const Router = {
  _current: null,

  go: (page, params = {}) => {
    Router._current = { page, params };
    console.log('[Router] navigate →', page, params);
    // Full router implemented in Phase 5
  },

  current: () => Router._current,
};
  
