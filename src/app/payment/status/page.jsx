'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPaymentStatus } from '@/app/hair-assessment/orderApi';
import './page.css';

const POLL_INTERVAL = 3000;
const MAX_POLLS = 20; // ~60s of polling before showing "still processing"

function PaymentStatusInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, firebaseUser } = useAuth();

  const ref = searchParams.get('ref');         // merchantOrderId
  const tref = searchParams.get('tref');       // tricho sessionId (optional)

  const [phase, setPhase] = React.useState('checking'); // checking | success | failed | timeout | error
  const [order, setOrder] = React.useState(null);
  const [redirecting, setRedirecting] = React.useState(false);

  const pollsRef = React.useRef(0);
  const timerRef = React.useRef(null);
  const doneRef = React.useRef(false);

  // Auth may take a beat to rehydrate after returning from PhonePe.
  const authReady = isAuthenticated && !!firebaseUser;

  React.useEffect(() => {
    if (!ref) { setPhase('error'); return; }
    if (!authReady) return;          // wait for Firebase to resolve
    if (doneRef.current) return;

    let cancelled = false;

    const finish = (next, ord = null) => {
      doneRef.current = true;
      if (cancelled) return;
      setOrder(ord);
      setPhase(next);
      if (next === 'success') {
        setRedirecting(true);
        // TrichoScan kit → back to report (unlocks full plan) + show confirmation popup.
        const orderNo = ord?.orderNumber ? `&order=${encodeURIComponent(ord.orderNumber)}` : '';
        const dest = tref
          ? `/report?sessionId=${encodeURIComponent(tref)}${orderNo}`
          : '/dashboard/orders';
        setTimeout(() => router.replace(dest), 2200);
      }
    };

    const poll = async () => {
      if (cancelled || doneRef.current) return;
      pollsRef.current += 1;
      try {
        const res = await getPaymentStatus(ref);
        const data = res?.data ?? res ?? {};
        if (data.paymentStatus === 'paid') return finish('success', data.order);
        if (data.paymentStatus === 'failed') return finish('failed');
        // pending → keep polling
        if (pollsRef.current >= MAX_POLLS) { doneRef.current = true; if (!cancelled) setPhase('timeout'); return; }
        timerRef.current = setTimeout(poll, POLL_INTERVAL);
      } catch (e) {
        if (pollsRef.current >= MAX_POLLS) { doneRef.current = true; if (!cancelled) setPhase('error'); return; }
        timerRef.current = setTimeout(poll, POLL_INTERVAL);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ref, tref, authReady, router]);

  const retryManual = () => {
    doneRef.current = false;
    pollsRef.current = 0;
    setPhase('checking');
  };

  return (
    <div className="pay-status-wrap">
      <div className="pay-status-card">
        {(phase === 'checking' || !authReady) && (
          <>
            <div className="pay-spinner" />
            <h2>Confirming your payment…</h2>
            <p>Please don’t close or refresh this page. This usually takes a few seconds.</p>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="pay-icon success">✓</div>
            <h2>Payment Successful</h2>
            {order?.orderNumber && <p className="pay-order-no">Order {order.orderNumber}</p>}
            <p>
              {redirecting
                ? (tref ? 'Taking you back to your report…' : 'Taking you to your orders…')
                : 'Your order has been placed.'}
            </p>
            {!redirecting && (
              <button className="pay-btn primary" onClick={() => router.replace(tref ? `/report?sessionId=${encodeURIComponent(tref)}` : '/dashboard/orders')}>
                Continue
              </button>
            )}
          </>
        )}

        {phase === 'failed' && (
          <>
            <div className="pay-icon failed">✕</div>
            <h2>Payment Failed</h2>
            <p>Your payment didn’t go through and you haven’t been charged. You can try again.</p>
            <div className="pay-actions">
              {tref && (
                <button className="pay-btn primary" onClick={() => router.replace(`/report?sessionId=${encodeURIComponent(tref)}`)}>
                  Back to Report
                </button>
              )}
              <button className="pay-btn ghost" onClick={() => router.replace('/')}>Go Home</button>
            </div>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <div className="pay-icon pending">⏳</div>
            <h2>Still Processing</h2>
            <p>Your payment is taking longer than usual. If money was deducted, your order will appear shortly.</p>
            <div className="pay-actions">
              <button className="pay-btn primary" onClick={retryManual}>Check Again</button>
              <button className="pay-btn ghost" onClick={() => router.replace('/dashboard/orders')}>View Orders</button>
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="pay-icon failed">!</div>
            <h2>Something Went Wrong</h2>
            <p>{!ref ? 'Missing payment reference.' : 'We couldn’t confirm your payment status right now.'}</p>
            <div className="pay-actions">
              {ref && <button className="pay-btn primary" onClick={retryManual}>Retry</button>}
              <button className="pay-btn ghost" onClick={() => router.replace('/dashboard/orders')}>View Orders</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="pay-status-wrap"><div className="pay-status-card"><div className="pay-spinner" /><h2>Loading…</h2></div></div>}>
      <PaymentStatusInner />
    </Suspense>
  );
}