// ============================================================
// RRA_sandbox.js — Mucuruzi RRA Sandbox Simulation
// Simulates Rwanda Revenue Authority EBM API
// Switch to production: change BASE_URL and replace fetch calls
// All methods return identical shape to production API
// ============================================================

// ─── PRODUCTION SWITCH ────────────────────────────────────────
// When RRA certifies you, set this to your real endpoint:
// const BASE_URL = "https://api.rra.gov.rw/ebm/v1";
const SANDBOX_MODE = true;

// ─── RRA ITEM CODE DATABASE ───────────────────────────────────
// Source: UNSPSC codes as used by RRA Rwanda EBM system
// taxGrade: A = 18% VAT, B = 0% VAT (exempt), C = 0% (zero-rated), D = non-taxable
export const RRA_ITEMS = [

  // ── FOOD & BEVERAGES ──────────────────────────────────────
  {
    itemCode:    "50181703",
    description: "Rice (25kg bag)",
    category:    "Food & Beverages",
    unit:        "BAG",
    taxGrade:    "B",
    vatRate:     0,
  },
  {
    itemCode:    "50181501",
    description: "Wheat Flour (50kg)",
    category:    "Food & Beverages",
    unit:        "BAG",
    taxGrade:    "B",
    vatRate:     0,
  },
  {
    itemCode:    "50171500",
    description: "Cooking Oil (20L)",
    category:    "Food & Beverages",
    unit:        "JER",
    taxGrade:    "B",
    vatRate:     0,
  },
  {
    itemCode:    "50161902",
    description: "Sugar (50kg)",
    category:    "Food & Beverages",
    unit:        "BAG",
    taxGrade:    "B",
    vatRate:     0,
  },
  {
    itemCode:    "50192300",
    description: "Maize (50kg)",
    category:    "Food & Beverages",
    unit:        "BAG",
    taxGrade:    "B",
    vatRate:     0,
  },
  {
    itemCode:    "50201700",
    description: "Mineral Water (1.5L)",
    category:    "Food & Beverages",
    unit:        "BTL",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "50202300",
    description: "Soft Drink (500ml)",
    category:    "Food & Beverages",
    unit:        "BTL",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "50201500",
    description: "Beer (500ml)",
    category:    "Food & Beverages",
    unit:        "BTL",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "50181800",
    description: "Salt (1kg)",
    category:    "Food & Beverages",
    unit:        "KG",
    taxGrade:    "B",
    vatRate:     0,
  },
  {
    itemCode:    "50151500",
    description: "Milk (1L)",
    category:    "Food & Beverages",
    unit:        "LTR",
    taxGrade:    "B",
    vatRate:     0,
  },

  // ── CONSTRUCTION MATERIALS ────────────────────────────────
  {
    itemCode:    "30111505",
    description: "Portland Cement (50kg)",
    category:    "Construction",
    unit:        "BAG",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "30102306",
    description: "Steel Reinforcement Bars (12m)",
    category:    "Construction",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "30101700",
    description: "Iron Sheets (Gauge 28)",
    category:    "Construction",
    unit:        "SHT",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "30111900",
    description: "Sand (1 Tonne)",
    category:    "Construction",
    unit:        "TON",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "30111600",
    description: "Gravel / Crushed Stone (1 Tonne)",
    category:    "Construction",
    unit:        "TON",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "30161700",
    description: "PVC Pipes (6m)",
    category:    "Construction",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "30161500",
    description: "Paint (20L)",
    category:    "Construction",
    unit:        "TIN",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "30102700",
    description: "Nails (1kg)",
    category:    "Construction",
    unit:        "KG",
    taxGrade:    "A",
    vatRate:     18,
  },

  // ── ELECTRONICS ───────────────────────────────────────────
  {
    itemCode:    "43191501",
    description: "Smartphone",
    category:    "Electronics",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "43211507",
    description: "Laptop Computer",
    category:    "Electronics",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "39121011",
    description: "LED TV (32 inch)",
    category:    "Electronics",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "26111700",
    description: "Solar Panel (250W)",
    category:    "Electronics",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "39121400",
    description: "Mobile Phone Charger",
    category:    "Electronics",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "43201400",
    description: "WiFi Router",
    category:    "Electronics",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },

  // ── TEXTILES & CLOTHING ───────────────────────────────────
  {
    itemCode:    "53102500",
    description: "Men's Shirt",
    category:    "Textiles & Clothing",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "53102600",
    description: "Women's Dress",
    category:    "Textiles & Clothing",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "53101700",
    description: "Fabric / Cloth (1 metre)",
    category:    "Textiles & Clothing",
    unit:        "MTR",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "53111600",
    description: "School Uniform",
    category:    "Textiles & Clothing",
    unit:        "SET",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "53111500",
    description: "Bed Sheets (Set)",
    category:    "Textiles & Clothing",
    unit:        "SET",
    taxGrade:    "A",
    vatRate:     18,
  },

  // ── AGRICULTURE ───────────────────────────────────────────
  {
    itemCode:    "10171600",
    description: "Fertilizer NPK (50kg)",
    category:    "Agriculture",
    unit:        "BAG",
    taxGrade:    "C",
    vatRate:     0,
  },
  {
    itemCode:    "10171500",
    description: "Pesticide (1L)",
    category:    "Agriculture",
    unit:        "LTR",
    taxGrade:    "C",
    vatRate:     0,
  },
  {
    itemCode:    "10151700",
    description: "Maize Seeds (2kg)",
    category:    "Agriculture",
    unit:        "KG",
    taxGrade:    "C",
    vatRate:     0,
  },
  {
    itemCode:    "10151500",
    description: "Bean Seeds (5kg)",
    category:    "Agriculture",
    unit:        "KG",
    taxGrade:    "C",
    vatRate:     0,
  },

  // ── HEALTHCARE ────────────────────────────────────────────
  {
    itemCode:    "51101500",
    description: "Paracetamol Tablets (100s)",
    category:    "Healthcare",
    unit:        "PKT",
    taxGrade:    "D",
    vatRate:     0,
  },
  {
    itemCode:    "42181800",
    description: "Surgical Gloves (100s)",
    category:    "Healthcare",
    unit:        "BOX",
    taxGrade:    "D",
    vatRate:     0,
  },
  {
    itemCode:    "42141600",
    description: "Face Masks (50s)",
    category:    "Healthcare",
    unit:        "BOX",
    taxGrade:    "D",
    vatRate:     0,
  },

  // ── FUEL & ENERGY ─────────────────────────────────────────
  {
    itemCode:    "15101500",
    description: "Petrol (1L)",
    category:    "Fuel & Energy",
    unit:        "LTR",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "15101502",
    description: "Diesel (1L)",
    category:    "Fuel & Energy",
    unit:        "LTR",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "15111500",
    description: "Cooking Gas LPG (6kg)",
    category:    "Fuel & Energy",
    unit:        "CYL",
    taxGrade:    "A",
    vatRate:     18,
  },

  // ── STATIONERY & OFFICE ───────────────────────────────────
  {
    itemCode:    "44111500",
    description: "A4 Printing Paper (500 sheets)",
    category:    "Stationery & Office",
    unit:        "RIM",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "44121600",
    description: "Ballpoint Pens (Box 50s)",
    category:    "Stationery & Office",
    unit:        "BOX",
    taxGrade:    "A",
    vatRate:     18,
  },
  {
    itemCode:    "44101600",
    description: "Stapler",
    category:    "Stationery & Office",
    unit:        "PCS",
    taxGrade:    "A",
    vatRate:     18,
  },
];

// ─── BUILD LOOKUP MAP ─────────────────────────────────────────
const RRA_ITEM_MAP = {};
RRA_ITEMS.forEach(item => {
  RRA_ITEM_MAP[item.itemCode] = item;
});

// ─── UNIQUE CATEGORIES LIST ───────────────────────────────────
export const RRA_CATEGORIES = [...new Set(RRA_ITEMS.map(i => i.category))];

// ─── RRA API OBJECT ───────────────────────────────────────────
export const rraAPI = {

  // ── A. INITIALIZE DEVICE ─────────────────────────────────
  /**
   * Simulate device registration with RRA.
   * @param {string} tin            - 9-digit business TIN
   * @param {string} deviceId       - SDC device hardware ID
   * @param {string} activationCode - Activation code from RRA
   * @returns {Object} { success, sdcId, message }
   */
  initializeDevice(tin, deviceId, activationCode) {
    if (!tin || tin.length !== 9 || !/^\d{9}$/.test(tin)) {
      return {
        success: false,
        sdcId:   null,
        message: "Invalid TIN. Must be exactly 9 digits.",
      };
    }

    if (!activationCode || activationCode.length < 6) {
      return {
        success: false,
        sdcId:   null,
        message: "Invalid activation code.",
      };
    }

    const sdcId = `SDC-${tin.slice(0, 3)}-${_randomNumeric(6)}`;

    return {
      success:      true,
      sdcId,
      taxOffice:    "Kigali Headquarters",
      registeredAt: new Date().toISOString(),
      message:      "Device initialized successfully.",
    };
  },

  // ── B. VERIFY PURCHASE CODE ──────────────────────────────
  /**
   * Validate buyer's purchase code (simulates *800# USSD flow).
   * @param {string} buyerTIN     - Buyer's 9-digit TIN
   * @param {string} sellerTIN    - Seller's 9-digit TIN
   * @param {string} purchaseCode - 5–6 digit numeric code
   * @returns {Object} { success, verified, message }
   */
  verifyPurchaseCode(buyerTIN, sellerTIN, purchaseCode) {
    if (!purchaseCode || !/^\d{5,6}$/.test(String(purchaseCode).trim())) {
      return {
        success:  false,
        verified: false,
        message:  "Purchase code must be 5–6 numeric digits.",
      };
    }

    if (!sellerTIN || !/^\d{9}$/.test(sellerTIN)) {
      return {
        success:  false,
        verified: false,
        message:  "Invalid seller TIN.",
      };
    }

    return {
      success:      true,
      verified:     true,
      buyerTIN:     buyerTIN || "000000000",
      sellerTIN,
      purchaseCode: String(purchaseCode).trim(),
      verifiedAt:   new Date().toISOString(),
      message:      "Purchase code verified successfully.",
    };
  },

  // ── C. SEARCH ITEMS ──────────────────────────────────────
  /**
   * Search RRA item codes by keyword, code, or category.
   * @param {string} query
   * @returns {Array}
   */
  searchItems(query) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    return RRA_ITEMS.filter(item =>
      item.itemCode.includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    ).slice(0, 10);
  },

  /**
   * Get single item by exact code.
   * @param {string} itemCode
   * @returns {Object|null}
   */
  getItem(itemCode) {
    return RRA_ITEM_MAP[itemCode] || null;
  },

  /**
   * Get all items in a category.
   * @param {string} category
   * @returns {Array}
   */
  getItemsByCategory(category) {
    return RRA_ITEMS.filter(i => i.category === category);
  },

  // ── D. SUBMIT INVOICE ────────────────────────────────────
  /**
   * Submit invoice to RRA and receive digital seal.
   * Returns EXACT same shape in production — just swap BASE_URL.
   *
   * @param {Object} payload
   * @param {string} payload.invoiceNumber
   * @param {string} payload.sellerTIN      - 9 digits (required)
   * @param {string} payload.buyerTIN
   * @param {string} payload.sdcId          - SDC device ID (required)
   * @param {Array}  payload.items          - [{ itemCode, qty, unitPrice, vatRate }]
   * @param {number} payload.subtotal
   * @param {number} payload.vatTotal
   * @param {number} payload.grandTotal
   *
   * @returns {Object} {
   *   success, signature, internalData,
   *   receiptNumber, sdcDateTime, sdcId, qrCode
   * }
   */
  submitInvoice(payload) {
    const {
      invoiceNumber,
      sellerTIN,
      buyerTIN,
      sdcId,
      items = [],
      subtotal,
      vatTotal,
      grandTotal,
    } = payload;

    // ── Validate sellerTIN ─────────────────────────────────
    if (!sellerTIN || !/^\d{9}$/.test(String(sellerTIN))) {
      return {
        success:       false,
        signature:     null,
        internalData:  null,
        receiptNumber: null,
        sdcDateTime:   null,
        sdcId:         null,
        qrCode:        null,
        message:       "Invalid seller TIN. Must be exactly 9 digits.",
      };
    }

    // ── Validate sdcId ────────────────────────────────────
    if (!sdcId) {
      return {
        success:       false,
        signature:     null,
        internalData:  null,
        receiptNumber: null,
        sdcDateTime:   null,
        sdcId:         null,
        qrCode:        null,
        message:       "SDC Device ID is required.",
      };
    }

    // ── Validate all item codes exist in RRA database ──────
    for (const item of items) {
      if (!RRA_ITEM_MAP[item.itemCode]) {
        return {
          success:       false,
          signature:     null,
          internalData:  null,
          receiptNumber: null,
          sdcDateTime:   null,
          sdcId:         null,
          qrCode:        null,
          message:       `Item code ${item.itemCode} not found in RRA database.`,
        };
      }
    }

    // ── Generate Security Fields ───────────────────────────
    const now = new Date();
    const dateStr = _formatDateCompact(now); // YYYYMMDD

    // Clean sdcId for embedding: strip non-alphanumeric, take first 6 chars
    const sdcShort = sdcId.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();

    // internalData: 26 chars = YYYYMMDD(8) + TIN(9) + sdcShort(6) + Random(3)
    const randomStr  = _randomAlphaNum(3);
    const internalData = `${dateStr}${sellerTIN}${sdcShort}${randomStr}`;

    // Digital signature: Base64 of invoiceNumber|sellerTIN|sdcId|timestamp
    const sigSource = `${invoiceNumber}|${sellerTIN}|${sdcId}|${now.getTime()}`;
    const signature = _toBase64(sigSource);

    // Receipt number includes SDC tag
    const sdcTag = sdcId.replace(/[^A-Z0-9]/gi, "").slice(0, 4).toUpperCase();
    const receiptNumber = `RCP-${sdcTag}-${dateStr}-${_randomNumeric(6)}`;

    // SDC DateTime: YYYY-MM-DD HH:MM:SS
    const sdcDateTime = now.toISOString().replace("T", " ").slice(0, 19);

    // QR Code — points to RRA verification portal
    const qrPayload = [
      `inv=${invoiceNumber}`,
      `tin=${sellerTIN}`,
      `sdc=${sdcId}`,
      `rcpt=${receiptNumber}`,
      `sig=${signature.slice(0, 12)}`,
    ].join("&");
    const qrCode = `https://verify.rra.gov.rw/ebm?${qrPayload}`;

    return {
      success:       true,
      signature,
      internalData,
      receiptNumber,
      sdcDateTime,
      sdcId,
      qrCode,
      message:       "Invoice submitted successfully.",
      // Sandbox metadata — stripped in production
      _sandbox:      SANDBOX_MODE,
      _submittedAt:  now.toISOString(),
    };
  },

};

// ─── PRIVATE HELPERS ──────────────────────────────────────────

function _formatDateCompact(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function _randomNumeric(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

function _randomAlphaNum(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function _toBase64(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
    }
