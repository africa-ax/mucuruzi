// ============================================================
//  MUCURUZI — Order.js model (stub — full version coming later)
// ============================================================
const OrderModel = {
  create: (data) => ({
    orderId:      data.orderId   || '',
    sellerId:     data.sellerId  || '',
    buyerId:      data.buyerId   || '',
    items:        data.items     || [],
    subtotal:     Price.round(data.subtotal || 0),
    vat:          Price.round(data.vat      || 0),
    total:        Price.round(data.total    || 0),
    status:       data.status    || ORDER_STATUS.PENDING,
    purchaseCode: data.purchaseCode || '',
    createdAt:    data.createdAt || null,
  }),
};
      
