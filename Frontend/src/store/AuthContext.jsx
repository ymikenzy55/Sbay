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

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, upgradeToSeller }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
