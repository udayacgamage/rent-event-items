import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'occasiaCart';

const loadCart = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (item) => {
    setItems((previous) => {
      const existing = previous.find((entry) => entry.itemId === item.itemId);
      if (existing) {
        return previous.map((entry) =>
          entry.itemId === item.itemId
            ? { ...entry, quantity: entry.quantity + item.quantity }
            : entry
        );
      }
      return [...previous, item];
    });
  };

  const removeFromCart = (itemId) => {
    setItems((previous) => previous.filter((entry) => entry.itemId !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    setItems((previous) =>
      previous
        .map((entry) =>
          entry.itemId === itemId ? { ...entry, quantity: Math.max(quantity, 0) } : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = useMemo(() => items.reduce((sum, entry) => sum + entry.quantity, 0), [items]);

  const total = useMemo(
    () => items.reduce((sum, entry) => sum + entry.price * entry.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }),
    [items, total, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
