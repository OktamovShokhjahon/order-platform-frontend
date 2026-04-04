'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectCartTotal, removeFromCart, updateQuantity } from '@/store/slices/cartSlice';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { isRemoteImageUrl, resolveFoodImageUrl } from '@/lib/image';

export default function CartPage() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <FiShoppingBag size={64} className="mx-auto text-muted mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('empty')}</h1>
          <p className="text-muted mb-6">{t('empty_desc')}</p>
          <Link
            href={`/${locale}/categories`}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            {t('browse')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground mb-8"
      >
        {t('title')}
      </motion.h1>

      <div className="space-y-4 mb-8">
        <AnimatePresence>
          {items.map((item) => {
            const name = item.name[locale as keyof typeof item.name] || item.name.en;
            const imageUrl = resolveFoodImageUrl(item.image);
            const unoptimized = isRemoteImageUrl(item.image);
            return (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="flex items-center gap-4 bg-card border border-border rounded-xl p-4"
              >
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-input flex-shrink-0">
                  <Image src={imageUrl} alt={name} fill className="object-cover" sizes="80px" unoptimized={unoptimized} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{name}</h3>
                  <p className="text-primary font-bold">
                    {item.price.toLocaleString()} {tCommon('sum')}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-input rounded-lg px-2 py-1">
                  <button
                    onClick={() => dispatch(updateQuantity({ _id: item._id, quantity: item.quantity - 1 }))}
                    className="p-1 hover:text-primary"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="font-semibold w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => dispatch(updateQuantity({ _id: item._id, quantity: item.quantity + 1 }))}
                    className="p-1 hover:text-primary"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <p className="font-bold text-foreground">
                    {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => dispatch(removeFromCart(item._id))}
                  className="p-2 text-muted hover:text-red-500 transition-colors"
                >
                  <FiTrash2 size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-semibold text-foreground">{t('total')}</span>
          <span className="text-2xl font-bold text-primary">
            {total.toLocaleString()} {tCommon('sum')}
          </span>
        </div>
        <Link
          href={`/${locale}/checkout`}
          className="block w-full bg-primary text-white text-center py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          {t('checkout')}
        </Link>
      </motion.div>
    </div>
  );
}
