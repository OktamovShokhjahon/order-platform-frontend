'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { driverAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface DriverOrder {
  _id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function DriverPage() {
  const t = useTranslations('driver');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (user && user.role !== 'driver' && user.role !== 'admin') {
      router.push(`/${locale}`);
    }
  }, [locale, router, user]);

  const fetchOrders = useCallback(async (options?: { silent?: boolean; notifyOnNew?: boolean }) => {
    const { silent = false, notifyOnNew = false } = options || {};
    if (!silent) setLoading(true);
    try {
      const res = await driverAPI.getDeliveringOrders({ limit: '50' });
      const nextOrders: DriverOrder[] = res.data.orders || [];
      setOrders(nextOrders);
      const nextIds = new Set(nextOrders.map((order) => order._id));
      if (notifyOnNew && hasLoadedOnceRef.current) {
        const newOrdersCount = nextOrders.filter((order) => !knownOrderIdsRef.current.has(order._id)).length;
        if (newOrdersCount > 0) {
          toast.success(
            newOrdersCount === 1
              ? t('new_order_notification_single')
              : t('new_order_notification_many', { count: newOrdersCount })
          );
        }
      }
      knownOrderIdsRef.current = nextIds;
      hasLoadedOnceRef.current = true;
    } catch {
      toast.error(tCommon('error'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    if (!user) return;
    void fetchOrders({ notifyOnNew: false });
  }, [fetchOrders, user]);

  useEffect(() => {
    if (!user) return;
    const intervalId = window.setInterval(() => {
      void fetchOrders({ silent: true, notifyOnNew: true });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [fetchOrders, user]);

  const updateStatus = async (id: string, status: 'delivered' | 'cancelled') => {
    setUpdatingId(id);
    try {
      await driverAPI.updateOrderStatus(id, status);
      toast.success(t('status_updated'));
      await fetchOrders({ notifyOnNew: false });
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setUpdatingId('');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted">{t('login_required')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">{t('title')}</h1>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-card border border-border rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted text-center py-12">{t('empty')}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <p className="font-mono text-xs text-muted">#{order._id}</p>
                  <p><span className="text-muted">{t('customer')}:</span> {order.customerName}</p>
                  <p><span className="text-muted">{t('phone')}:</span> {order.customerPhone}</p>
                  <p><span className="text-muted">{t('address')}:</span> {order.deliveryAddress}</p>
                  <p><span className="text-muted">{t('total')}:</span> {order.totalPrice.toLocaleString()} {tCommon('sum')}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateStatus(order._id, 'cancelled')}
                    disabled={updatingId === order._id}
                    className="px-4 py-2 rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(order._id, 'delivered')}
                    disabled={updatingId === order._id}
                    className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    {t('delivered')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
