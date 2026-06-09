import axiosInstance from '@/lib/axiosInstance';

export const getCart = async () => {
  const res = await axiosInstance.get('/user/cart');
  return res.data;
};

export const addItem = async (item) => {
  const res = await axiosInstance.post('/user/cart/items', item);
  return res.data;
};