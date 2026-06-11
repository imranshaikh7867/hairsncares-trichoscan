// src/app/hair-assessment/orderApi.js
import axiosInstance from '@/lib/axiosInstance';

/* ─── ADDRESSES (Firebase-gated user routes) ─── */
export const getMyAddresses = async () => {
  const res = await axiosInstance.get('/user/users/me/addresses');
  return res.data;
};

export const addMyAddress = async (address) => {
  const res = await axiosInstance.post('/user/users/me/addresses', address);
  return res.data;
};

/* ─── TRICHO SCAN ORDER ─── */
// items: [{ productId, productModel, variantId, qty, variantLabel, variantSku }]
export const placeTrichoScanOrder = async ({ items, addressId, deliveryAddress, paymentMethod, customerNote, sessionId }) => {
  const body = { items, paymentMethod, customerNote, sessionId };
  if (addressId) body.addressId = addressId;
  if (deliveryAddress) body.deliveryAddress = deliveryAddress;
  const res = await axiosInstance.post('/user/orders/tricho-scan', body);
  return res.data;
};

/* ─── ORDER LOOKUP (used to verify a tricho order exists → unlock) ─── */
export const getMyOrders = async (params = {}) => {
  const res = await axiosInstance.get('/user/orders/my', { params });
  return res.data;
};

/* ─── PAYMENT STATUS (polled by /payment/status page) ─── */
export const getPaymentStatus = async (merchantOrderId) => {
  const res = await axiosInstance.get(`/user/orders/payment/${merchantOrderId}/status`);
  return res.data;
};