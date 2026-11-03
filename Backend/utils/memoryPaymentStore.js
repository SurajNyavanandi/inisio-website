export let memoryPayments = [];

export const getMemoryPayments = () => memoryPayments;

export const findMemoryPaymentByOrderId = (orderId) => {
  if (!orderId) return null;
  return memoryPayments.find((p) => p.orderId === orderId) || null;
};

export const findMemoryPaymentById = (id) => {
  if (!id) return null;
  return (
    memoryPayments.find(
      (p) => String(p._id) === String(id) || p.orderId === id || p.paymentId === id
    ) || null
  );
};

export const getMemoryPaymentsByUser = (email) => {
  if (!email) return [];
  const clean = email.toLowerCase().trim();
  return memoryPayments.filter((p) => p.userEmail && p.userEmail.toLowerCase().trim() === clean);
};

export const addMemoryPayment = (payment) => {
  memoryPayments.unshift(payment);
  return payment;
};

export const updateMemoryPayment = (orderId, updates) => {
  const idx = memoryPayments.findIndex(
    (p) => p.orderId === orderId || (updates.paymentId && p.paymentId === updates.paymentId)
  );
  if (idx !== -1) {
    memoryPayments[idx] = { ...memoryPayments[idx], ...updates, updatedAt: new Date() };
    return memoryPayments[idx];
  }
  return null;
};

export default {
  memoryPayments,
  getMemoryPayments,
  findMemoryPaymentByOrderId,
  findMemoryPaymentById,
  getMemoryPaymentsByUser,
  addMemoryPayment,
  updateMemoryPayment,
};
