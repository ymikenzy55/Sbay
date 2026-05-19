import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'sbay.cart';

function loadCart() {
  try { return JSON.parse(sessionStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try { sessionStorage.setItem(CART_KEY, JSON.stringify(items)); }
    catch { /* quota exceeded — ignore */ }
  }, [items]);

  const clamp = (item, qty) => {
    const n = Math.max(1, Math.floor(Number(qty) || 1));
    if (item.stock && Number.isFinite(item.stock)) return Math.min(n, item.stock);
    return n;
  };

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: clamp(i, i.qty + qty) } : i
        );
      }
      return [...prev, { ...product, qty: clamp(product, qty) }];
    });
  };

  const updateQty = (id, qty) =>
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, Math.floor(Number(qty) || 0)) } : i))
        .map((i) => (i.stock ? { ...i, qty: Math.min(i.qty, i.stock) } : i))
        .filter((i) => i.qty > 0)
    );

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const clear = () => {
    setItems([]);
    try { sessionStorage.removeItem(CART_KEY); } catch { /* ignore */ }
  };

  const count    = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
};
