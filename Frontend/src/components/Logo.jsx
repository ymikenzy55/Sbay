import logoImage from '../assets/logo.jpg';
import './Logo.css';

/**
 * sBay brand logo. Variants: `mark` (icon tile) and `wordmark` (icon + text).
 */
export default function Logo({ variant = 'wordmark', size = 'md' }) {
  const height = size === 'lg' ? 72 : size === 'sm' ? 28 : 44;

  return (
    <div className={`sbay-logo size-${size} variant-${variant}`}>
      <img 
        src={logoImage} 
        alt="sBay Logo" 
        className="sbay-logo-image"
        style={{ height: `${height}px`, width: 'auto' }}
      />
    </div>
  );
}
