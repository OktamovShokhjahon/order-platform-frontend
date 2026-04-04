'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectCartTotal, clearCart } from '@/store/slices/cartSlice';
import { RootState } from '@/store';
import { ordersAPI, paymentsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { saveGuestOrder } from '@/lib/guestOrders';

const PHONE_REGEX = /^998 \(\d{2}\) \d{3}-\d{2}-\d{2}$/;
const LOCKED_PAYMENT_METHOD = 'card';

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const formatPhoneNumber = (value: string) => {
  const rawDigits = digitsOnly(value);
  if (!rawDigits) return '';

  const normalizedDigits = rawDigits.startsWith('998') ? rawDigits : `998${rawDigits}`;
  const digits = normalizedDigits.slice(3, 12);
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 7);
  const part4 = digits.slice(7, 9);

  let formatted = '998';
  if (part1) formatted += ` (${part1}`;
  if (part1.length === 2) formatted += ')';
  if (part2) formatted += ` ${part2}`;
  if (part3) formatted += `-${part3}`;
  if (part4) formatted += `-${part4}`;

  return formatted;
};

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const dispatch = useDispatch();

  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const user = useSelector((state: RootState) => state.auth.user);

  const [form, setForm] = useState({
    customerName: user?.name || '',
    customerPhone: '',
    deliveryAddress: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isRedirectingToSuccess, setIsRedirectingToSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash_on_delivery'>('cash_on_delivery');

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.customerName.trim()) errs.customerName = t('name_required');
    if (!form.customerPhone.trim()) errs.customerPhone = t('phone_required');
    else if (!PHONE_REGEX.test(form.customerPhone)) errs.customerPhone = t('phone_invalid');
    if (!form.deliveryAddress.trim()) errs.deliveryAddress = t('address_required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    if (items.length === 0 && !isRedirectingToSuccess) {
      router.push(`/${locale}/cart`);
    }
  }, [items.length, isRedirectingToSuccess, locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          foodId: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalPrice: total,
        ...form,
      };

      const orderRes = await ordersAPI.create(orderData);
      if (paymentMethod === 'card') {
        await paymentsAPI.process({ orderId: orderRes.data._id, method: 'card' });
      }

      const successPath = `/${locale}/order-success?id=${orderRes.data._id}`;

      if (!user) {
        saveGuestOrder({
          _id: orderRes.data._id,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          deliveryAddress: form.deliveryAddress,
          totalPrice: total,
          status: orderRes.data.status || 'pending',
          paymentStatus: paymentMethod === 'card' ? 'paid' : orderRes.data.paymentStatus || 'pending',
          createdAt: orderRes.data.createdAt || new Date().toISOString(),
          items: items.map((item) => ({
            foodId: item._id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
          })),
        });
      }

      setIsRedirectingToSuccess(true);
      dispatch(clearCart());
      router.push(successPath);
    } catch (error) {
      console.error('Order failed:', error);
      toast.error(tCommon('error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground mb-8"
      >
        {t('title')}
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="lg:col-span-3 space-y-5"
        >
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('contact_details')}</h2>
                <p className="text-sm text-muted mt-1">{t('contact_hint')}</p>
              </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('name')}</label>
            <input
              type="text"
              value={form.customerName}
                  onChange={(e) => updateForm('customerName', e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {errors.customerName && <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('phone')}</label>
            <input
              type="tel"
              value={form.customerPhone}
                  onChange={(e) => updateForm('customerPhone', formatPhoneNumber(e.target.value))}
                  placeholder={t('phone_placeholder')}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
                <p className="text-xs text-muted mt-1">{t('phone_hint')}</p>
            {errors.customerPhone && <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('address')}</label>
            <textarea
              value={form.deliveryAddress}
                  onChange={(e) => updateForm('deliveryAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            {errors.deliveryAddress && <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">{t('payment_method')}</h2>
              <div className="space-y-3">
                <button
                  type="button"
                  disabled
                  className="w-full text-left border border-border rounded-xl p-4 opacity-60 cursor-not-allowed bg-input"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">{t('pay_with_card')}</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-border text-muted">
                      {t('locked')}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">{t('card_payment_locked')}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash_on_delivery')}
                  className={`w-full text-left border rounded-xl p-4 transition-colors ${
                    paymentMethod === 'cash_on_delivery'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="font-medium text-foreground">{t('pay_on_delivery')}</span>
                  <p className="text-xs text-muted mt-1">{t('pay_on_delivery_hint')}</p>
                </button>
              </div>
            </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? t('processing') : t('place_order')}
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
            <h3 className="font-semibold text-foreground mb-4">{t('order_summary')}</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => {
                const name = item.name[locale as keyof typeof item.name] || item.name.en;
                return (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-muted truncate mr-2">
                      {name} x{item.quantity}
                    </span>
                    <span className="font-medium text-foreground">
                      {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold text-foreground">{t('order_summary')}</span>
              <span className="font-bold text-primary text-lg">
                {total.toLocaleString()} {tCommon('sum')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
      {submitting && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl px-6 py-5 w-full max-w-sm text-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">{t('processing')}</p>
          </div>
        </div>
      )}
    </>
  );
}
