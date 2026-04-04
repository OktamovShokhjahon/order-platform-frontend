'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiHome } from 'react-icons/fi';

export default function OrderSuccessPage() {
  const t = useTranslations('order_success');
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const orderId = searchParams.get('id');

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 mb-6"
        >
          <FiCheckCircle size={40} className="text-accent" />
        </motion.div>

        <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
        <p className="text-muted mb-8">{t('subtitle')}</p>

        <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left space-y-4">
          {orderId && (
            <div className="flex justify-between">
              <span className="text-muted">{t('order_id')}</span>
              <span className="font-mono font-semibold text-foreground text-sm">{orderId}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted">{t('estimated')}</span>
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <FiClock size={16} className="text-primary" />
              {t('minutes')}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            <FiHome size={18} />
            {t('home')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
