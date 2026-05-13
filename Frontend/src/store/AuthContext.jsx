import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'sbay.user';

/**
 * Auth model:
 *  - guest: not signed in (default). Can browse anything.
 *  - buyer: signed-in, default role.
 *  - seller: signed-in & completed seller onboarding.
 *
 * Sensitive actions (chat, checkout, sell) call requireAuth() which redirects
 * to /login?next=<intended_path> when the user is a guest.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  // Mocked credential check — replace with axios call when backend is ready.
  const login = async ({ email, password }) => {
    if (!email || !password) throw new Error('Provide email and password.');
    const fake = {
      id: 'u1',
      name: email.split('@')[0],
      email,
      role: 'buyer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&q=80',
    };
    setUser(fake);
    return fake;
  };

  const signup = async (data) => {
    const u = {
      id: `u${Date.now()}`,
      role: 'buyer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&q=80',
      ...data,
    };
    setUser(u);
    return u;
  };

  const upgradeToSeller = (sellerInfo) =>
    setUser((u) => ({ ...(u || {}), ...sellerInfo, role: 'seller' }));

  const updateUser = (patch) =>
    setUser((u) => (u ? { ...u, ...patch } : u));

  // --- Verification (mocked) ---
  // Statuses: 'unverified' (default) | 'pending' | 'verified' | 'rejected'
  const submitVerification = async (payload) => {
    if (!payload?.fullName || !payload?.studentIdImage || !payload?.govIdImage) {
      throw new Error('Please complete every verification step.');
    }
    setUser((u) => (u ? {
      ...u,
      verification: {
        status: 'pending',
        submittedAt: Date.now(),
        ...payload,
      },
    } : u));
    // Auto-approve in mock after a short "review" — replace with real API.
    setTimeout(() => {
      setUser((u) => (u && u.verification?.status === 'pending'
        ? { ...u, verified: true, verification: { ...u.verification, status: 'verified', verifiedAt: Date.now() } }
        : u));
    }, 4000);
    return true;
  };

  // --- Subscription (mocked) ---
  // Plans: 'free' | 'plus' | 'pro'
  const subscribe = async (planId, paymentMethod = 'momo') => {
    if (!['free', 'plus', 'pro'].includes(planId)) throw new Error('Unknown plan.');
    setUser((u) => (u ? {
      ...u,
      subscription: {
        plan: planId,
        status: planId === 'free' ? 'free' : 'active',
        method: paymentMethod,
        renewsOn: planId === 'free' ? null : Date.now() + 30 * 24 * 60 * 60 * 1000,
        startedAt: Date.now(),
      },
    } : u));
    return true;
  };

  const cancelSubscription = async () => {
    setUser((u) => (u && u.subscription ? {
      ...u,
      subscription: { ...u.subscription, status: 'canceled', canceledAt: Date.now() },
    } : u));
    return true;
  };

  const logout = () => setUser(null);

  // --- Mocked password reset flow ---
  // In production these would hit your backend. For now we generate a 6-digit
  // code in-memory (and surface it in the UI for dev convenience).
  const requestPasswordReset = async (email) => {
    if (!email) throw new Error('Enter your email.');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const ticket = {
      email,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
    sessionStorage.setItem('sbay.reset', JSON.stringify(ticket));
    return { email, devCode: code };
  };

  const verifyResetCode = async (email, code) => {
    const raw = sessionStorage.getItem('sbay.reset');
    if (!raw) throw new Error('No reset request found. Start again.');
    const t = JSON.parse(raw);
    if (t.email !== email) throw new Error('Email does not match request.');
    if (Date.now() > t.expiresAt) throw new Error('Code expired. Request a new one.');
    if (String(code).trim() !== t.code) throw new Error('Incorrect code.');
    sessionStorage.setItem('sbay.reset', JSON.stringify({ ...t, verified: true }));
    return true;
  };

  const resetPassword = async (email, newPassword) => {
    const raw = sessionStorage.getItem('sbay.reset');
    if (!raw) throw new Error('No reset request found.');
    const t = JSON.parse(raw);
    if (!t.verified || t.email !== email) throw new Error('Verify your code first.');
    if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters.');
    sessionStorage.removeItem('sbay.reset');
    // Demo: no real password storage yet; just return success.
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user, login, signup, logout, upgradeToSeller, updateUser,
      requestPasswordReset, verifyResetCode, resetPassword,
      submitVerification, subscribe, cancelSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
