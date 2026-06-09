'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as cartApi from '@/lib/api/cart.api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [adding, setAdding] = useState(false);
  // tracks whether THIS session added the recommended kit → unlocks nutrition
  const [kitAdded, setKitAdded] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const res = await cartApi.getCart();
      setCart(res?.data ?? res ?? null);
    } catch (_) {}
  }, []);

  // items: array of { productId, productModel, variantId, qty, unitPrice, mrp, variantLabel, variantSku }
  const addItems = useCallback(async (items) => {
    setAdding(true);
    try {
      let last = null;
      for (const it of items) {
        last = await cartApi.addItem(it);
      }
      const updated = last?.data ?? last ?? null;
      if (updated) setCart(updated);
      if (items.length > 0) setKitAdded(true);   // unlock gate
      return updated;
    } finally {
      setAdding(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const value = {
    cart,
    adding,
    kitAdded,          // <- nutrition gate reads this
    addItems,
    refreshCart,
    itemCount: cart?.items?.length || 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}