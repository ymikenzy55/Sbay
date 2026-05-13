import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, XCircle } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useCart } from '../store/CartContext';
import { useConfirm } from '../store/ConfirmContext';
import './pages.css';
import './Cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { items, updateQty, removeItem, clear, subtotal } = useCart();
  const fee = items.length ? 15 : 0;

  const onClear = async () => {
    const ok = await confirm({
      title: 'Empty your cart?',
      body: `This will remove all ${items.length} item(s) from your cart.`,
      confirmLabel: 'Empty Cart',
      danger: true,
    });
    if (ok) clear();
  };

  const onRemove = async (id, title) => {
    const ok = await confirm({
      title: 'Remove item?',
      body: `Remove "${title}" from your cart?`,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) removeItem(id);
  };

  const onCheckout = () => navigate('/checkout');

  return (
    <div className="page cart-page">
      <TopBar showBack title="Cart" showSearch={false} />

      <main className="page-main">
        {items.length === 0 ? (
          <div className="empty">
            <ShoppingBag size={64} color="#C9D4BD" />
            <h3>Your cart is empty</h3>
            <p>Add items from the marketplace to get started.</p>
            <button className="btn btn-primary" onClick={() => navigate('/home')}>Browse Deals</button>
          </div>
        ) : (
          <>
            <div className="cart-list">
              <AnimatePresence>
                {items.map((it) => (
                  <motion.article
                    key={it.id}
                    className="cart-row"
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <div className="cart-thumb" style={{ backgroundImage: `url(${it.image})` }} />
                    <div className="cart-info">
                      <h4>{it.title}</h4>
                      <span className="price">GH₵ {it.price.toLocaleString()}</span>
                    </div>
                    <div className="cart-qty">
                      <button onClick={() => updateQty(it.id, it.qty - 1)}><Minus size={14} /></button>
                      <span>{it.qty}</span>
                      <button onClick={() => updateQty(it.id, it.qty + 1)}><Plus size={14} /></button>
                    </div>
                    <button className="cart-remove" onClick={() => onRemove(it.id, it.title)} aria-label="Remove">
                      <Trash2 size={16} />
                    </button>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>

            <section className="cart-summary card">
              <div className="row"><span>Subtotal</span><strong>GH₵ {subtotal.toLocaleString()}</strong></div>
              <div className="row"><span>Service fee</span><strong>GH₵ {fee.toLocaleString()}</strong></div>
              <div className="divider" />
              <div className="row total"><span>Total</span><strong>GH₵ {(subtotal + fee).toLocaleString()}</strong></div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={onCheckout}>
                Proceed to Checkout
              </button>
              <button
                className="btn"
                style={{ width: '100%', marginTop: 8, color: 'var(--error)' }}
                onClick={onClear}
              >
                <XCircle size={16} /> Empty Cart
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
