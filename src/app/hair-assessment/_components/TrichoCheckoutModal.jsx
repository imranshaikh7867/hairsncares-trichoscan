'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FaTimes, FaPlus, FaLock, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { useTrichoCheckout } from '@/hooks/useTrichoCheckout';
import './TrichoCheckoutModal.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const FREE_DELIVERY = 500;
const DELIVERY = 60;

export default function TrichoCheckoutModal({ open, onClose, items = [], sessionId = '', onOrderBooked }) {
  const { isAuthenticated } = useAuth();
  const {
    addresses, loadingAddresses, savingAddress, placing,
    loadAddresses, createAddress, placeOrder,
  } = useTrichoCheckout();

  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    fullName: '', phone: '', line1: '', line2: '',
    city: '', state: 'Maharashtra', pincode: '', kind: 'home',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open && isAuthenticated) loadAddresses();
  }, [open, isAuthenticated, loadAddresses]);

  useEffect(() => {
    if (!selectedAddrId && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddrId(def._id);
    }
  }, [addresses, selectedAddrId]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.qty) || 1), 0),
    [items]
  );
  const deliveryCharge = subtotal >= FREE_DELIVERY ? 0 : DELIVERY;
  const total = subtotal + deliveryCharge;

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleAddAddress = async () => {
    if (!form.fullName || !form.phone || !form.line1 || !form.city || !form.pincode) {
      setFormError('Please fill in all required fields.'); return;
    }
    if (!/^\d{10}$/.test(form.phone)) { setFormError('Enter a valid 10-digit phone number.'); return; }
    if (!/^\d{6}$/.test(form.pincode)) { setFormError('Enter a valid 6-digit pincode.'); return; }

    const list = await createAddress({ ...form, isDefault: addresses.length === 0 });
    if (list) {
      setShowAddForm(false);
      setFormError('');
      setForm({ fullName: '', phone: '', line1: '', line2: '', city: '', state: 'Maharashtra', pincode: '', kind: 'home' });
    }
  };

  const handlePlace = async () => {
    if (!isAuthenticated) { toast.error('Please unlock your report first.'); return; }
    if (!selectedAddrId) { toast.error('Please select a delivery address.'); return; }
    if (!items.length) { toast.error('No products available to order.'); return; }

    const orderItems = items.map((i) => ({
      productId: i.productId,
      productModel: i.productModel || 'GeneralProduct',
      variantId: i.variantId,
      qty: Number(i.qty) || 1,
      variantLabel: i.variantLabel || '',
      variantSku: i.variantSku || '',
    }));

    const result = await placeOrder({
      items: orderItems,
      addressId: selectedAddrId,
      paymentMethod: 'phonepe',
      sessionId,
    });
    if (!result) return;

    if (result.paymentRequired && result.redirectUrl) {
      toast.info('Redirecting to secure payment…');
      window.location.href = result.redirectUrl;
      return;
    }
    if (result.order) {
      toast.success(`Order ${result.order.orderNumber} placed!`);
      onOrderBooked?.(result.order);
      onClose?.();
    }
  };

  if (!open) return null;

  return (
    <div className="tco-overlay" role="dialog" aria-modal="true">
      <div className="tco-modal">
        <header className="tco-header">
          <div className="tco-header-left">
            <span className="tco-header-icon"><FaLock /></span>
            <div>
              <h3>Complete Your Order</h3>
              <span>{items.length} product{items.length !== 1 ? 's' : ''} · {inr(total)}</span>
            </div>
          </div>
          <button className="tco-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
        </header>

        <div className="tco-body">
          {/* Products */}
          <section className="tco-section">
            <p className="tco-label">Recommended Kit</p>
            <div className="tco-product-list">
              {items.map((it, idx) => (
                <article className="tco-product-row" key={it.variantId || idx}>
                  <div
                    className="tco-product-thumb"
                    style={{ backgroundImage: it.image ? `url(${it.image})` : undefined }}
                  />
                  <div className="tco-product-copy">
                    <h4>{it.title}</h4>
                    {it.variantLabel && <span className="tco-variant">{it.variantLabel}</span>}
                    <p className="tco-product-price">{inr(it.unitPrice)} × {it.qty || 1}</p>
                  </div>
                  <strong className="tco-product-total">{inr((it.unitPrice || 0) * (it.qty || 1))}</strong>
                </article>
              ))}
            </div>
          </section>

          {/* Addresses */}
          <section className="tco-section">
            <p className="tco-label">Delivery Address</p>

            {loadingAddresses && <p className="tco-muted">Loading addresses…</p>}

            <div className="tco-addr-list">
              {addresses.map((addr) => (
                <button
                  key={addr._id}
                  type="button"
                  className={`tco-addr-card${selectedAddrId === addr._id ? ' selected' : ''}`}
                  onClick={() => setSelectedAddrId(addr._id)}
                >
                  <span className="tco-addr-radio" />
                  <span className="tco-addr-body">
                    <span className="tco-addr-name">
                      {addr.fullName}
                      <span className="tco-addr-tag">{addr.kind}</span>
                    </span>
                    <span className="tco-addr-line">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                      {addr.city}, {addr.state} — {addr.pincode}
                    </span>
                    <span className="tco-addr-phone">📞 {addr.phone}</span>
                  </span>
                </button>
              ))}

              {!showAddForm && (
                <button type="button" className="tco-addr-add" onClick={() => { setShowAddForm(true); setFormError(''); }}>
                  <FaPlus /> Add New Address
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="tco-form">
                <div className="tco-field">
                  <label>Full Name *</label>
                  <input value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} />
                </div>
                <div className="tco-field">
                  <label>Phone *</label>
                  <input
                    inputMode="numeric" maxLength={10} placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
                <div className="tco-field">
                  <label>Address Line 1 *</label>
                  <input value={form.line1} onChange={(e) => setField('line1', e.target.value)} />
                </div>
                <div className="tco-field">
                  <label>Address Line 2</label>
                  <input value={form.line2} onChange={(e) => setField('line2', e.target.value)} />
                </div>
                <div className="tco-field-row">
                  <div className="tco-field">
                    <label>City *</label>
                    <input value={form.city} onChange={(e) => setField('city', e.target.value)} />
                  </div>
                  <div className="tco-field">
                    <label>Pincode *</label>
                    <input maxLength={6} value={form.pincode}
                      onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  </div>
                </div>
                <div className="tco-field">
                  <label>State</label>
                  <input value={form.state} onChange={(e) => setField('state', e.target.value)} />
                </div>
                <div className="tco-field">
                  <label>Type</label>
                  <div className="tco-toggle">
                    {['home', 'office', 'other'].map((t) => (
                      <button key={t} type="button"
                        className={`tco-toggle-opt${form.kind === t ? ' active' : ''}`}
                        onClick={() => setField('kind', t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && <div className="tco-form-error">{formError}</div>}

                <div className="tco-form-actions">
                  <button type="button" className="tco-btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                  <button type="button" className="tco-btn-primary" onClick={handleAddAddress} disabled={savingAddress}>
                    {savingAddress ? 'Saving…' : 'Save Address'}
                  </button>
                </div>
              </div>
            )}
          </section>

          

          {/* Totals */}
          <section className="tco-totals">
            <div className="tco-total-row">
              <span>Subtotal</span><span>{inr(subtotal)}</span>
            </div>
            <div className="tco-total-row">
              <span>Delivery</span>
              <span className={deliveryCharge === 0 ? 'tco-free' : ''}>
                {deliveryCharge === 0 ? 'FREE' : inr(deliveryCharge)}
              </span>
            </div>
            <div className="tco-total-row tco-grand">
              <span>Total</span><span>{inr(total)}</span>
            </div>
          </section>
        </div>

        <footer className="tco-footer">
          <button type="button" className="tco-place-btn" onClick={handlePlace} disabled={placing || !selectedAddrId}>
            {placing ? 'Redirecting to Payment…' : `Pay ${inr(total)} & Place Order`}
          </button>
          <p className="tco-secure">🔒 Secure checkout · Free returns within 7 days</p>
        </footer>
      </div>
    </div>
  );
}