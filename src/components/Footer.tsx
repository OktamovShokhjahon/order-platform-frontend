'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';

  if (pathname?.includes('/admin')) return null;

  return (
    <footer className="bg-secondary text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-bold text-primary">Food</span>
              <span className="text-2xl font-bold text-white">Order</span>
            </div>
            <p className="text-sm text-gray-400">{t('description')}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('quick_links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}`} className="text-sm hover:text-primary transition-colors">
                  {tNav('home')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/categories`} className="text-sm hover:text-primary transition-colors">
                  {tNav('categories')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/cart`} className="text-sm hover:text-primary transition-colors">
                  {tNav('cart')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">{t('contact')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <FiPhone size={14} className="text-primary" />
                +998 90 123 45 67
              </li>
              <li className="flex items-center gap-2 text-sm">
                <FiMail size={14} className="text-primary" />
                info@foodorder.uz
              </li>
              <li className="flex items-center gap-2 text-sm">
                <FiMapPin size={14} className="text-primary" />
                Tashkent, Uzbekistan
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} FoodOrder. {t('rights')}
        </div>
      </div>
    </footer>
  );
}
