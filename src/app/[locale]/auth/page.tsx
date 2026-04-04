'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const PHONE_REGEX = /^998 \(\d{2}\) \d{3}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function AuthPage() {
  const t = useTranslations('auth');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  const nextPath = searchParams.get('next');
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [form, setForm] = useState({ name: '', login: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsLogin(mode !== 'register');
  }, [mode]);

  useEffect(() => {
    if (user) router.push(nextPath || `/${locale}`);
  }, [user, locale, nextPath, router]);

  useEffect(() => {
    dispatch(clearError());
    setErrors({});
  }, [isLogin, dispatch]);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const validateRegister = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = t('name_required');
    if (!form.email.trim()) nextErrors.email = t('email_required');
    else if (!EMAIL_REGEX.test(form.email.trim())) nextErrors.email = t('email_invalid');
    if (!form.phone.trim()) nextErrors.phone = t('phone_required');
    else if (!PHONE_REGEX.test(form.phone)) nextErrors.phone = t('phone_invalid');
    if (!form.password.trim()) nextErrors.password = t('password_required');
    else if (form.password.trim().length < 6) nextErrors.password = t('password_min');

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      dispatch(login({ login: form.login, password: form.password }));
    } else {
      if (!validateRegister()) return;
      dispatch(register({ name: form.name, email: form.email, phone: form.phone, password: form.password }));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
          {isLogin ? t('login_title') : t('register_title')}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('phone')}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm('phone', formatPhoneNumber(e.target.value))}
                  required
                  placeholder={t('phone_placeholder')}
                  className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted mt-1">{t('phone_hint')}</p>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </>
          )}

          {isLogin ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('username')}</label>
              <input
                type="text"
                value={form.login}
                onChange={(e) => updateForm('login', e.target.value)}
                required
                placeholder="admin"
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">{t('email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                required
                className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t('password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '...' : isLogin ? t('login') : t('register')}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          {isLogin ? t('no_account') : t('has_account')}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-medium hover:underline"
          >
            {isLogin ? t('register_link') : t('login_link')}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
