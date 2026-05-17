import { createContext, useContext } from 'react';
import { useAuth } from '../store/AuthContext';
import { setToken } from '../api/client';

/**
 * Admin context now derives its state from the main AuthContext.
 * Admins sign in via the unified /login page; if their role is 'admin',
 * they're redirected to /admin. This context simply exposes the admin
 * user (if role === 'admin') and logout functionality.
 *
 * The JWT is shared — the backend grants admin routes only to tokens
 * whose user has role === 'admin'.
 */
const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const { user, booting, logout: authLogout } = useAuth();

  // Only treat as admin if the user has role === 'admin'
  const admin = user?.role === 'admin' ? user : null;

  const logout = () => {
    setToken(null);
    authLogout();
  };

  return (
    <AdminContext.Provider value={{ admin, booting, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within <AdminProvider>');
  return ctx;
};
