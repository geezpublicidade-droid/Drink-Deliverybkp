import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Clock, MapPin, Truck, CheckCircle, XCircle, ChefHat, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import type { Order, OrderItem } from '@shared/schema';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type OrderStatus, type PaymentMethod } from '@shared/schema';

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const STATUS_CONFIG: Record<OrderStatus, { icon: typeof Package; color: string }> = {
  pending: { icon: AlertCircle, color: 'bg-yellow/20 text-yellow border-yellow/30' },
  accepted: { icon: CheckCircle, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  preparing: { icon: ChefHat, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  ready: { icon: Package, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  dispatched: { icon: Truck, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  delivered: { icon: CheckCircle, color: 'bg-green-600/20 text-green-500 border-green-600/30' },
  cancelled: { icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function Orders() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/orders', 'user', user?.id],
    enabled: !!user?.id,
  });

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price));
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (!isAuthenticated) {
    setLocation('/login?redirect=/pedidos');
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-primary"
          onClick={() => setLocation('/')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar ao cardapio
        </Button>

        <h1 className="font-serif text-3xl text-primary mb-8">Meus Pedidos</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="bg-card border-primary/20">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum pedido ainda</h2>
              <p className="text-muted-foreground mb-6">
                Voce ainda nao fez nenhum pedido. Que tal explorar nosso cardapio?
              </p>
              <Button
                className="bg-primary text-primary-foreground"
                onClick={() => setLocation('/')}
                data-testid="button-explore"
              >
                Ver Cardapio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = order.status as OrderStatus;
              const config = STATUS_CONFIG[status];
              const StatusIcon = config.icon;

              return (
                <Card key={order.id} className="bg-card border-primary/20" data-testid={`order-card-${order.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${config.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-foreground text-lg">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className={config.color} data-testid={`status-badge-${order.id}`}>
                      {ORDER_STATUS_LABELS[status]}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="text-foreground">
                            {formatPrice(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-primary/10 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{formatPrice(order.subtotal)}</span>
                      </div>
                      {Number(order.discount) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-400">Desconto Combo</span>
                          <span className="text-green-400">-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Entrega
                        </span>
                        <span className="text-foreground">{formatPrice(order.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-primary/10">
                      <span className="text-muted-foreground">
                        Pagamento: {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
