'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ordersAPI } from '@/lib/api';
import { getGuestOrders, GuestOrder } from '@/lib/guestOrders';

interface ApiOrderItem {
  foodId: {
    _id: string;
    name: { uz: string; ru: string; en: string };
  };
  quantity: number;
  price: number;
}

interface ApiOrder {
  _id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: ApiOrderItem[];
}

type OrderView = ApiOrder | GuestOrder;

export default function OrdersPage() {
  const tNav = useTranslations('nav');
  const tOrders = useTranslations('orders_page');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const user = useSelector((state: RootState) => state.auth.user);

  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      setLoading(true);
      if (user) {
        try {
          const res = await ordersAPI.getAll({ limit: '50' });
          if (active) setOrders(res.data.orders || []);
        } catch {
          if (active) setOrders([]);
        } finally {
          if (active) setLoading(false);
        }
        return;
      }

      const guestOrders = getGuestOrders();
      if (active) {
        setOrders(guestOrders);
        setLoading(false);
      }
    };

    void loadOrders();
    return () => {
      active = false;
    };
  }, [user]);

  const getItemName = (item: ApiOrderItem | GuestOrder['items'][number]) => {
    if ('name' in item) {
      return item.name[locale as keyof typeof item.name] || item.name.en;
    }
    const foodName = item.foodId?.name;
    return foodName?.[locale as keyof typeof foodName] || foodName?.en || '-';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{tNav('orders')}</h1>
        {!user && (
          <p className="text-sm text-muted mt-1">{tOrders('guest_note')}</p>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-card border border-border rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-lg">{tOrders('empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="font-mono text-xs text-muted">#{order._id}</div>
                <div className="text-xs text-muted">{new Date(order.createdAt).toLocaleString(locale)}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                <div>
                  <p className="text-muted">{tOrders('status')}</p>
                  <p className="font-medium">{order.status}</p>
                </div>
                <div>
                  <p className="text-muted">{tOrders('payment')}</p>
                  <p className="font-medium">{order.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-muted">{tOrders('total')}</p>
                  <p className="font-semibold text-primary">
                    {order.totalPrice.toLocaleString()} {tCommon('sum')}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {(order.items || []).map((item, index) => (
                  <div key={`${index}-${getItemName(item)}`} className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm">
                    <span>{getItemName(item)}</span>
                    <span className="text-muted">
                      {item.quantity} x {item.price.toLocaleString()} {tCommon('sum')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
