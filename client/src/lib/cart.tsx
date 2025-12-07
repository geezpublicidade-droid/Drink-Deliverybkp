import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Product, CartItem } from '@shared/schema';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  comboDiscount: number;
  hasCombo: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const COMBO_DISCOUNT_PERCENT = 0.15;

function detectCombo(items: CartItem[]): { hasCombo: boolean; discount: number } {
  const destilados = items.filter(item => item.product.productType === 'destilado');
  const gelos = items.filter(item => item.product.productType === 'gelo');
  const energeticos = items.filter(item => item.product.productType === 'energetico');

  const hasDestilado = destilados.length > 0 && destilados.some(d => d.quantity >= 1);
  const hasGelo = gelos.length > 0 && gelos.some(g => g.quantity >= 1);
  const hasEnergetico = energeticos.length > 0 && energeticos.some(e => e.quantity >= 1);

  if (hasDestilado && hasGelo && hasEnergetico) {
    const destilado = destilados[0];
    const gelo = gelos[0];
    const energetico = energeticos[0];

    const comboTotal = 
      Number(destilado.product.salePrice) +
      Number(gelo.product.salePrice) +
      Number(energetico.product.salePrice);

    return {
      hasCombo: true,
      discount: comboTotal * COMBO_DISCOUNT_PERCENT
    };
  }

  return { hasCombo: false, discount: 0 };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibe-drinks-cart');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('vibe-drinks-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product.id, product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.salePrice) * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const { hasCombo, discount: comboDiscount } = detectCombo(items);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        comboDiscount,
        hasCombo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
