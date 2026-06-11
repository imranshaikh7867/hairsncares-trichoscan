// src/hooks/useTrichoCheckout.js
'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getMyAddresses,
  addMyAddress,
  placeTrichoScanOrder,
} from '@/app/hair-assessment/orderApi';

const errMsg = (e) =>
  e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Something went wrong';

export function useTrichoCheckout() {
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const runningRef = useRef(false);

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const res = await getMyAddresses();
      const list = res?.data ?? res ?? [];
      setAddresses(Array.isArray(list) ? list : []);
      return list;
    } catch (e) {
      toast.error(errMsg(e));
      return [];
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  const createAddress = useCallback(async (address) => {
    setSavingAddress(true);
    try {
      const res = await addMyAddress(address);
      const list = res?.data ?? res ?? [];
      setAddresses(Array.isArray(list) ? list : []);
      toast.success('Address added');
      return list;
    } catch (e) {
      toast.error(errMsg(e));
      return null;
    } finally {
      setSavingAddress(false);
    }
  }, []);

  // Returns { paymentRequired, redirectUrl } | { order } | null
  const placeOrder = useCallback(async (args) => {
    if (runningRef.current) return null;
    runningRef.current = true;
    setPlacing(true);
    try {
      const res = await placeTrichoScanOrder(args);
      return res?.data ?? res ?? null;
    } catch (e) {
      toast.error(errMsg(e));
      return null;
    } finally {
      runningRef.current = false;
      setPlacing(false);
    }
  }, []);

  return {
    addresses,
    loadingAddresses,
    savingAddress,
    placing,
    loadAddresses,
    createAddress,
    placeOrder,
  };
}