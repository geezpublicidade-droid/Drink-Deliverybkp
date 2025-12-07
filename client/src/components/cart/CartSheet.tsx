import { ShoppingCart, Trash2, Plus, Minus, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const { items, subtotal, comboDiscount, hasCombo, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const totalAfterDiscount = subtotal - comboDiscount;

  const handleCheckout = () => {
    onOpenChange(false);
    if (isAuthenticated) {
      setLocation('/checkout');
    } else {
      setLocation('/login?redirect=/checkout');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-black border-l border-primary/30 flex flex-col w-full sm:max-w-lg" data-testid="sheet-cart">
        <SheetHeader className="border-b border-primary/20 pb-4">
          <SheetTitle className="flex items-center gap-2 text-primary font-serif text-2xl">
            <ShoppingCart className="h-6 w-6" />
            Carrinho
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Seu carrinho esta vazio</h3>
            <p className="text-muted-foreground mb-6">Adicione produtos para continuar</p>
            <Button 
              variant="outline" 
              className="border-primary text-primary"
              onClick={() => onOpenChange(false)}
            >
              Continuar comprando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 py-4">
              <div className="space-y-4 pr-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 p-3 bg-secondary/50 rounded-lg border border-primary/10"
                    data-testid={`cart-item-${item.productId}`}
                  >
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary text-xl font-bold">
                          {item.product.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-yellow font-semibold mt-1">
                        {formatPrice(Number(item.product.salePrice))}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-primary/50 text-primary"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          data-testid={`button-cart-decrease-${item.productId}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-white font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-primary/50 text-primary"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          data-testid={`button-cart-increase-${item.productId}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.productId)}
                        data-testid={`button-cart-remove-${item.productId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <span className="text-white font-semibold text-sm">
                        {formatPrice(Number(item.product.salePrice) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-primary/20 pt-4 space-y-3">
              {hasCombo && (
                <div className="flex items-center justify-between p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-medium">Combo Vibe - 15% OFF</span>
                  </div>
                  <span className="text-green-400 font-bold">
                    -{formatPrice(comboDiscount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-white">
                <span>Subtotal</span>
                <span className={hasCombo ? 'line-through text-muted-foreground' : 'font-semibold'}>
                  {formatPrice(subtotal)}
                </span>
              </div>

              {hasCombo && (
                <div className="flex justify-between text-white">
                  <span>Total com desconto</span>
                  <span className="font-bold text-primary text-lg">
                    {formatPrice(totalAfterDiscount)}
                  </span>
                </div>
              )}

              <Separator className="bg-primary/20" />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={clearCart}
                  data-testid="button-clear-cart"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground font-semibold"
                  onClick={handleCheckout}
                  data-testid="button-checkout"
                >
                  Finalizar Pedido
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
