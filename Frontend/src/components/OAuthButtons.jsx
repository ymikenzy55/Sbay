import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './OAuthButtons.css';

export default function OAuthButtons() {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleGoogleSuccess = async (tokenResponse) => {
    setError(null);
    try {
      const u = await googleLogin(tokenResponse.access_token);
      if (u.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (e) {
      setError(e.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed.');
  };

  const signInWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
  });

  const todo = (provider) => () => {
    // eslint-disable-next-line no-alert
    alert(`Sign in with ${provider} is coming soon. Please use your email for now.`);
  };

  return (
    <div className="oauth-block">
      <div className="oauth-divider">
        <span>or continue with</span>
      </div>
      {error && <p style={{ color: '#c0392b', fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>{error}</p>}
      <div className="oauth-buttons">
        <button
          type="button"
          className="oauth-btn oauth-google"
          onClick={() => signInWithGoogle()}
          aria-label="Sign in with Google"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          <span>Google</span>
        </button>
        <button
          type="button"
          className="oauth-btn oauth-apple"
          onClick={todo('Apple')}
          aria-label="Sign in with Apple"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          <span>Apple</span>
        </button>
      </div>
    </div>
  );
}
