import { Store } from 'lucide-react';
import './Logo.css';

/**
 * sBay brand logo. Variants: `mark` (icon tile) and `wordmark` (icon + text).
 */
export default function Logo({ variant = 'wordmark', size = 'md' }) {
  const dim = size === 'lg' ? 72 : size === 'sm' ? 28 : 44;
  const iconSize = size === 'lg' ? 36 : size === 'sm' ? 16 : 22;

  return (
    <div className={`sbay-logo size-${size} variant-${variant}`}>
      <div
        className="sbay-logo-mark"
        style={{ width: dim, height: dim, borderRadius: dim * 0.28 }}
      >
        <Store size={iconSize} strokeWidth={2.4} color="#fff" />
      </div>
      {variant === 'wordmark' && <span className="sbay-logo-word">sBay</span>}
    </div>
  );
}
