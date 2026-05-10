import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

/**
 * Wrap any sensitive route with <RequireAuth>. Guests are redirected to
 * /login with a `next` param so we can return them after sign-in.
 */
export default function RequireAuth({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (role === 'seller' && user.role !== 'seller') {
    return <Navigate to="/become-seller" replace />;
  }
  return children;
}
