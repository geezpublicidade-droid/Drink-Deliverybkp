import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, Phone, Banknote, CreditCard, QrCode, Package, LogOut, RefreshCw, Navigation, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Order, OrderItem, Address, Motoboy } from '@shared/schema';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@shared/schema';

interface OrderWithDetails extends Order {
  items: OrderItem[];
  userName?: string;
  userWhatsapp?: string;
  address?: Address;
}

const PAYMENT_ICONS: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  pix: QrCode,
  card_pos: CreditCard,
  card_credit: CreditCard,
  card_debit: CreditCard,
};

export default function Motoboy() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, role, logout } = useAuth();

  const { data: orders = [], isLoading, refetch } = useQuery<OrderWithDetails[]>({
    queryKey: ['/api/orders', 'motoboy', user?.id],
    refetchInterval: 10000,
    enabled: !!user?.id,
  });

  const { data: motoboys = [] } = useQuery<Motoboy[]>({
    queryKey: ['/api/motoboys'],
  });

  const currentMotoboy = motoboys.find(m => m.whatsapp === user?.whatsapp);

  const assignMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest('PATCH', `/api/orders/${orderId}/assign`, { 
        motoboyId: currentMotoboy?.id 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: 'Entrega aceita com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao aceitar entrega', variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: 'Entrega confirmada!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    },
  });

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price));
  };

  const handleLogout = () => {
    logout();
    setLocation('/admin-login');
  };

  const openMaps = (address: Address) => {
    const query = encodeURIComponent(
      `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/55${phone}`, '_blank');
  };

  if (role !== 'motoboy' && role !== 'admin') {
    setLocation('/admin-login');
    return null;
  }

  const dispatchedOrders = orders.filter(o => o.status === 'dispatched' && o.orderType === 'delivery');
  const readyOrders = orders.filter(o => o.status === 'ready' && o.orderType === 'delivery');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black border-b border-primary/20 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Navigation className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-2xl text-primary">Entregas</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="border-primary/50 text-primary"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : dispatchedOrders.length === 0 && readyOrders.length === 0 ? (
          <Card className="bg-card border-primary/20">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Sem entregas no momento</h2>
              <p className="text-muted-foreground">
                Aguarde novos pedidos serem atribuidos a voce
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {readyOrders.length > 0 && (
              <div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">
                  Prontos para Retirada ({readyOrders.length})
                </Badge>
                <div className="space-y-4">
                  {readyOrders.map((order) => {
                    const PaymentIcon = PAYMENT_ICONS[order.paymentMethod as PaymentMethod] || Banknote;
                    
                    return (
                      <Card key={order.id} className="bg-card border-green-500/30" data-testid={`order-${order.id}`}>
                        <CardHeader className="bg-primary/10 rounded-t-lg pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-primary text-xl">
                                #{order.id.slice(-6).toUpperCase()}
                              </CardTitle>
                              <p className="text-foreground font-medium mt-1">
                                {order.userName || 'Cliente'}
                              </p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Pronto
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4 pt-4">
                          {order.address && (
                            <div 
                              className="bg-secondary/50 rounded-lg p-4 cursor-pointer hover-elevate"
                              onClick={() => openMaps(order.address!)}
                            >
                              <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-foreground font-medium">
                                    {order.address.street}, {order.address.number}
                                  </p>
                                  <p className="text-muted-foreground text-sm">
                                    {order.address.neighborhood}, {order.address.city}
                                  </p>
                                  {order.address.complement && (
                                    <p className="text-muted-foreground text-sm">
                                      {order.address.complement}
                                    </p>
                                  )}
                                  {order.address.notes && (
                                    <p className="text-yellow text-sm mt-1">
                                      Obs: {order.address.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {order.userWhatsapp && (
                            <Button
                              variant="outline"
                              className="w-full border-green-500/50 text-green-400"
                              onClick={() => openWhatsApp(order.userWhatsapp!)}
                              data-testid={`button-whatsapp-${order.id}`}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Ligar para Cliente
                            </Button>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/50 rounded-lg p-4">
                              <p className="text-muted-foreground text-sm mb-1">Pagamento</p>
                              <div className="flex items-center gap-2">
                                <PaymentIcon className="h-5 w-5 text-primary" />
                                <span className="text-foreground font-medium">
                                  {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
                                </span>
                              </div>
                              {order.paymentMethod === 'cash' && order.changeFor && (
                                <p className="text-yellow text-sm mt-1">
                                  Troco para: {formatPrice(order.changeFor)}
                                </p>
                              )}
                            </div>
                            <div className="bg-secondary/50 rounded-lg p-4">
                              <p className="text-muted-foreground text-sm mb-1">Taxa Entrega</p>
                              <p className="text-primary font-bold text-xl">
                                {formatPrice(order.deliveryFee)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-secondary/50 rounded-lg p-4">
                            <p className="text-muted-foreground text-sm mb-2">Itens do Pedido</p>
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-foreground">
                                  {item.quantity}x {item.productName}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
                            <span className="text-foreground font-medium">Total a Cobrar</span>
                            <span className="text-primary font-bold text-2xl">
                              {formatPrice(order.total)}
                            </span>
                          </div>

                          <Button
                            className="w-full bg-green-600 text-white py-6 text-lg font-semibold"
                            onClick={() => assignMutation.mutate(order.id)}
                            disabled={assignMutation.isPending || !currentMotoboy}
                            data-testid={`button-accept-delivery-${order.id}`}
                          >
                            <Truck className="h-5 w-5 mr-2" />
                            Aceitar Entrega
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {dispatchedOrders.length > 0 && (
              <div>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
                  Em Rota ({dispatchedOrders.length})
                </Badge>
                <div className="space-y-4">
                  {dispatchedOrders.map((order) => {
                    const PaymentIcon = PAYMENT_ICONS[order.paymentMethod as PaymentMethod] || Banknote;
                    
                    return (
                      <Card key={order.id} className="bg-card border-purple-500/30" data-testid={`order-${order.id}`}>
                        <CardHeader className="bg-primary/10 rounded-t-lg pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-primary text-xl">
                                #{order.id.slice(-6).toUpperCase()}
                              </CardTitle>
                              <p className="text-foreground font-medium mt-1">
                                {order.userName || 'Cliente'}
                              </p>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              Em Rota
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4 pt-4">
                          {order.address && (
                            <div 
                              className="bg-secondary/50 rounded-lg p-4 cursor-pointer hover-elevate"
                              onClick={() => openMaps(order.address!)}
                            >
                              <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-foreground font-medium">
                                    {order.address.street}, {order.address.number}
                                  </p>
                                  <p className="text-muted-foreground text-sm">
                                    {order.address.neighborhood}, {order.address.city}
                                  </p>
                                  {order.address.complement && (
                                    <p className="text-muted-foreground text-sm">
                                      {order.address.complement}
                                    </p>
                                  )}
                                  {order.address.notes && (
                                    <p className="text-yellow text-sm mt-1">
                                      Obs: {order.address.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {order.userWhatsapp && (
                            <Button
                              variant="outline"
                              className="w-full border-green-500/50 text-green-400"
                              onClick={() => openWhatsApp(order.userWhatsapp!)}
                              data-testid={`button-whatsapp-${order.id}`}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Ligar para Cliente
                            </Button>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/50 rounded-lg p-4">
                              <p className="text-muted-foreground text-sm mb-1">Pagamento</p>
                              <div className="flex items-center gap-2">
                                <PaymentIcon className="h-5 w-5 text-primary" />
                                <span className="text-foreground font-medium">
                                  {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
                                </span>
                              </div>
                              {order.paymentMethod === 'cash' && order.changeFor && (
                                <p className="text-yellow text-sm mt-1">
                                  Troco para: {formatPrice(order.changeFor)}
                                </p>
                              )}
                            </div>
                            <div className="bg-secondary/50 rounded-lg p-4">
                              <p className="text-muted-foreground text-sm mb-1">Taxa Entrega</p>
                              <p className="text-primary font-bold text-xl">
                                {formatPrice(order.deliveryFee)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
                            <span className="text-foreground font-medium">Total a Cobrar</span>
                            <span className="text-primary font-bold text-2xl">
                              {formatPrice(order.total)}
                            </span>
                          </div>

                          <Button
                            className="w-full bg-primary text-primary-foreground py-6 text-lg font-semibold"
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-delivered-${order.id}`}
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Marcar como Entregue
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
