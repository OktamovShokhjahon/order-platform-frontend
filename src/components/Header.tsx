'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartCount } from '@/store/slices/cartSlice';
import { logout } from '@/store/slices/authSlice';
import { RootState, AppDispatch } from '@/store';
import LocaleThemeControls from '@/components/LocaleThemeControls';
import { FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Header() {
  const t = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';
  const cartCount = useSelector(selectCartCount);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = pathname?.includes('/admin');

  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Food</span>
            <span className="text-2xl font-bold text-foreground">Order</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href={`/${locale}`} className="text-sm font-medium hover:text-primary transition-colors">
              {t('home')}
            </Link>
            <Link href={`/${locale}/categories`} className="text-sm font-medium hover:text-primary transition-colors">
              {t('categories')}
            </Link>
            <Link href={`/${locale}/news`} className="text-sm font-medium hover:text-primary transition-colors">
              {t('news')}
            </Link>
            <Link href={`/${locale}/orders`} className="text-sm font-medium hover:text-primary transition-colors">
              {t('orders')}
            </Link>
            {user?.role === 'driver' && (
              <Link href={`/${locale}/driver`} className="text-sm font-medium hover:text-primary transition-colors">
                {t('driver')}
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href={`/${locale}/admin/dashboard`} className="text-sm font-medium hover:text-primary transition-colors">
                {t('admin')}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LocaleThemeControls />
            </div>

            <Link href={`/${locale}/cart`} className="relative p-2 rounded-lg hover:bg-input transition-colors">
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href={`/${locale}/auth`} className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
                  <FiUser size={16} />
                  <span className="max-w-[80px] truncate">{user.name}</span>
                </Link>
                <button
                  onClick={() => dispatch(logout())}
                  className="p-2 rounded-lg hover:bg-input transition-colors text-muted hover:text-red-500"
                  aria-label="Logout"
                >
                  <FiLogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
              <Link
                href={`/${locale}/auth`}
                  className="inline-flex items-center gap-1 text-sm font-medium border border-border px-4 py-2 rounded-lg hover:bg-input transition-colors"
              >
                {t('login')}
              </Link>
                <Link
                  href={`/${locale}/auth?mode=register`}
                  className="inline-flex items-center gap-1 text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-input transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-3">
              <Link href={`/${locale}`} className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {t('home')}
              </Link>
              <Link href={`/${locale}/categories`} className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {t('categories')}
              </Link>
              <Link href={`/${locale}/news`} className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {t('news')}
              </Link>
              <Link href={`/${locale}/orders`} className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                {t('orders')}
              </Link>
              {user?.role === 'driver' && (
                <Link href={`/${locale}/driver`} className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                  {t('driver')}
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link href={`/${locale}/admin/dashboard`} className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>
                  {t('admin')}
                </Link>
              )}
              <div className="pt-2">
                <LocaleThemeControls onLocaleChange={() => setMobileOpen(false)} />
              </div>
              {user ? (
                <button
                  onClick={() => { dispatch(logout()); setMobileOpen(false); }}
                  className="block w-full text-left text-sm font-medium text-red-500"
                >
                  {t('logout')}
                </button>
              ) : (
                <div className="space-y-2">
                <Link
                  href={`/${locale}/auth`}
                  className="block text-sm font-medium text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  {t('login')}
                </Link>
                  <Link
                    href={`/${locale}/auth?mode=register`}
                    className="block text-sm font-medium text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
