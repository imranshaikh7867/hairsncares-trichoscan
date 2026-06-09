// src/lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Creates (once) an invisible reCAPTCHA verifier bound to a DOM node.
 * Firebase phone auth REQUIRES a reCAPTCHA. Invisible = no user friction.
 */
export function getRecaptchaVerifier(containerId = 'recaptcha-container') {
  if (typeof window === 'undefined') return null;
  if (window._recaptchaVerifier) return window._recaptchaVerifier;

  window._recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      // token expired — clear so the next attempt builds a fresh one
      if (window._recaptchaVerifier) {
        window._recaptchaVerifier.clear();
        window._recaptchaVerifier = null;
      }
    },
  });
  return window._recaptchaVerifier;
}

export async function sendPhoneOtp(e164Phone) {
  // Always destroy any previous verifier so initial-send AND resend get a clean one.
  if (typeof window !== 'undefined' && window._recaptchaVerifier) {
    try { window._recaptchaVerifier.clear(); } catch (_) {}
    window._recaptchaVerifier = null;
  }
  const verifier = getRecaptchaVerifier();
  await verifier.render();
  return signInWithPhoneNumber(auth, e164Phone, verifier);
}