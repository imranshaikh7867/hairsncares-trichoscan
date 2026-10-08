// src/lib/axiosInstance.js
import axios from 'axios';
import { auth } from '@/lib/firebase';

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

const axiosInstance = axios.create({
  baseURL,
  // The API sleeps when idle and can take the better part of a minute to answer
  // the first request. At 30s the unlock call timed out on a cold start and the
  // user was told their OTP was wrong.
  timeout: 90000,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    // Attach a fresh Firebase ID token IF the user is signed in.
    // Anonymous questionnaire/upload calls simply send no token (public routes).
    try {
      if (typeof window !== 'undefined' && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      // token fetch failed — proceed without it (public routes still work)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const toApiErrorMessage = (error) => {
  // A request the browser refused to send — blocked by CORS, offline, or the
  // API unreachable — arrives with no response at all and the bare text
  // "Network Error", which tells the user nothing about what to do.
  if (!error?.response && (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error')) {
    return 'Could not reach the server. Please check your connection and try again.';
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The server is taking longer than usual to respond. Please try again.';
  }
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong while calling API';
  return String(message);
};

export default axiosInstance;