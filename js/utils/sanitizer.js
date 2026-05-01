// ============================================================
//  MUCURUZI — sanitizer.js
//  Prevents XSS (Cross-Site Scripting) attacks.
//
//  ALWAYS use safe() when inserting user-provided data into HTML.
//  Never use raw user data directly in innerHTML.
//
//  Usage:
//    el.innerHTML = `<h3>${safe(product.productName)}</h3>`
// ============================================================

/**
 * Escapes HTML special characters in a string.
 * Prevents script injection attacks.
 *
 * @param {any} value - any value (converted to string)
 * @returns {string} safe HTML string
 */
const safe = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize a URL — only allow http/https protocols.
 * Prevents javascript: URL attacks.
 *
 * @param {string} url
 * @returns {string} safe URL or empty string
 */
const safeUrl = (url) => {
  if (!url) return '';
  const str = String(url).trim();
  if (/^https?:\/\//i.test(str)) return str;
  return '';
};

/**
 * Sanitize a number — returns 0 if not a valid number.
 * @param {any} value
 * @returns {number}
 */
const safeNumber = (value) => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};
