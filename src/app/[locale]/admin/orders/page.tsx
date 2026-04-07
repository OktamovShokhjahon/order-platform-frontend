'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ordersAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: { foodId: { _id: string; name: { uz: string; ru: string; en: string } }; quantity: number; price: number }[];
}

const STATUS_OPTIONS = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'];

const BAD_RESPONSE_MESSAGE = 'Something bad happened';

const isValidOrder = (value: unknown): value is Order => {
  if (!value || typeof value !== 'object') return false;
  const order = value as Partial<Order>;
  return (
    typeof order._id === 'string' &&
    typeof order.customerName === 'string' &&
    typeof order.customerPhone === 'string' &&
    typeof order.totalPrice === 'number' &&
    typeof order.status === 'string' &&
    typeof order.paymentStatus === 'string' &&
    typeof order.createdAt === 'string'
  );
};

export default function AdminOrdersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    notificationAudioRef.current = new Audio('/notification_sound.mp3');
    notificationAudioRef.current.preload = 'auto';
    return () => {
      notificationAudioRef.current = null;
    };
  }, []);

  const unlockAudio = useCallback(async () => {
    const audio = notificationAudioRef.current;
    if (!audio) return false;
    try {
      audio.muted = true;
      audio.currentTime = 0;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      setAudioUnlocked(true);
      return true;
    } catch {
      audio.muted = false;
      setAudioUnlocked(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const onFirstInteraction = () => {
      void unlockAudio();
    };
    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, [unlockAudio]);

  const enableNotificationsAndSound = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
    const audioReady = await unlockAudio();
    if (!audioReady) {
      toast.error('Click anywhere on page to enable sound');
    }
  }, [unlockAudio]);

  const fetchOrders = useCallback(async (options?: { silent?: boolean; notifyOnNew?: boolean }) => {
    const { silent = false, notifyOnNew = false } = options || {};
    if (!silent) setLoading(true);
    const params: Record<string, string> = { limit: '50', page: String(page) };
    if (filter) params.status = filter;
    if (search.trim()) params.search = search.trim();
    try {
      const res = await ordersAPI.getAll(params);
      const payload = res?.data && typeof res.data === 'object' ? res.data : null;
      const rawOrders: unknown[] | null = Array.isArray(payload?.orders) ? payload.orders : null;
      const nextOrders: Order[] | null = rawOrders ? rawOrders.filter(isValidOrder) : null;
      const nextPages = typeof payload?.pages === 'number' ? payload.pages : null;
      const nextTotal = typeof payload?.total === 'number' ? payload.total : null;
      if (!nextOrders || nextPages === null || nextTotal === null) {
        toast.error(BAD_RESPONSE_MESSAGE);
        return;
      }
      setOrders(nextOrders);
      setPages(nextPages);
      setTotal(nextTotal);
      const nextIds = new Set(nextOrders.map((order: Order) => order._id));
      if (notifyOnNew && hasLoadedOnceRef.current) {
        const newOrdersCount = nextOrders.filter((order: Order) => !knownOrderIdsRef.current.has(order._id)).length;
        if (newOrdersCount > 0) {
          if (notificationPermission === 'granted') {
            new Notification('New order', {
              body: newOrdersCount === 1 ? 'A new order has been received.' : `${newOrdersCount} new orders have been received.`,
            });
          }
          toast.success(
            newOrdersCount === 1
              ? t('new_order_notification_single')
              : t('new_order_notification_many', { count: newOrdersCount })
          );
          if (notificationAudioRef.current) {
            notificationAudioRef.current.currentTime = 0;
            void notificationAudioRef.current.play().catch(() => {
              // Ignore autoplay/user-gesture restrictions.
            });
          }
        }
      }
      knownOrderIdsRef.current = nextIds;
      hasLoadedOnceRef.current = true;
    } catch {
      toast.error(BAD_RESPONSE_MESSAGE);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter, page, search, t, tCommon, notificationPermission]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchOrders({ silent: true, notifyOnNew: true });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [fetchOrders]);

  useEffect(() => {
    void fetchOrders({ notifyOnNew: false });
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await ordersAPI.updateStatus(id, status);
      toast.success('Status updated');
      await fetchOrders({ notifyOnNew: false });
    } catch {
      toast.error(tCommon('error'));
    }
  };

  const openOrderDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await ordersAPI.getById(id);
      if (!isValidOrder(res?.data)) {
        toast.error(BAD_RESPONSE_MESSAGE);
        setDetailsOpen(false);
        return;
      }
      setSelectedOrder(res.data);
    } catch {
      toast.error(BAD_RESPONSE_MESSAGE);
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('orders')}</h1>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setLoading(true);
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('search_orders_placeholder')}
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm min-w-0 sm:w-72"
          />
          <select
            value={filter}
            onChange={(e) => {
              setLoading(true);
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
          >
            <option value="">{t('all_statuses')}</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {(notificationPermission !== 'granted' || !audioUnlocked) && (
        <div className="mb-4 rounded-xl border border-border bg-card p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted">
            Enable browser notifications and sound for new orders.
          </p>
          <button
            type="button"
            onClick={() => void enableNotificationsAndSound()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark"
          >
            Enable notifications
          </button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted text-center py-12">{t('no_data')}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-muted">
              {t('showing_orders', { count: orders.length, total })}
            </p>
            <p className="text-sm text-muted">
              {t('page_label', { page, pages })}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted bg-input/50">
                    <th className="p-4 font-medium">ID</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Phone</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Payment</th>
                    <th className="p-4 font-medium">{t('order_status')}</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-border/50 hover:bg-input/30 cursor-pointer"
                      onClick={() => openOrderDetails(order._id)}
                    >
                      <td className="p-4 font-mono text-xs">{order._id.slice(-6)}</td>
                      <td className="p-4 font-medium">{order.customerName}</td>
                      <td className="p-4 text-muted">{order.customerPhone}</td>
                      <td className="p-4 font-medium">{order.totalPrice.toLocaleString()} {tCommon('sum')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                          order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          order.status === 'preparing' ? 'bg-blue-500/10 text-blue-500' :
                          order.status === 'delivering' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-muted text-xs">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order._id, e.target.value)}
                          className="px-2 py-1 bg-input border border-border rounded-lg text-xs"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((prev) => Math.max(1, prev - 1));
              }}
              disabled={page === 1}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-input disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('previous')}
            </button>
            <span className="text-sm text-muted">{t('page_label', { page, pages })}</span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPage((prev) => Math.min(pages, prev + 1));
              }}
              disabled={page >= pages}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-input disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('next')}
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedOrder(null);
        }}
        title={t('order_details')}
      >
        {detailsLoading || !selectedOrder ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 rounded bg-input" />
            <div className="h-4 rounded bg-input" />
            <div className="h-24 rounded bg-input" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted">ID</p>
                <p className="font-mono text-xs break-all">{selectedOrder._id}</p>
              </div>
              <div>
                <p className="text-muted">{t('order_status')}</p>
                <p className="font-medium">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-muted">{t('payment_status')}</p>
                <p className="font-medium">{selectedOrder.paymentStatus}</p>
              </div>
              <div>
                <p className="text-muted">{t('total_revenue')}</p>
                <p className="font-medium">{selectedOrder.totalPrice.toLocaleString()} {tCommon('sum')}</p>
              </div>
              <div>
                <p className="text-muted">{t('name')}</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
              </div>
              <div>
                <p className="text-muted">{t('phone')}</p>
                <p className="font-medium">{selectedOrder.customerPhone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted">{t('address')}</p>
                <p className="font-medium">{selectedOrder.deliveryAddress}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('foods')}</h3>
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {selectedOrder.items.map((item, index) => {
                  const foodName = item.foodId?.name?.[locale as keyof typeof item.foodId.name] || item.foodId?.name?.en || '-';
                  return (
                    <div key={`${item.foodId?._id || index}-${index}`} className="flex items-center justify-between border border-border rounded-lg px-3 py-2 text-sm">
                      <span className="truncate mr-2">{foodName}</span>
                      <span className="text-muted">
                        {item.quantity} x {item.price.toLocaleString()} {tCommon('sum')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
