'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/store/slices/cartSlice';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { DEFAULT_FOOD_IMAGE, isRemoteImageUrl, resolveFoodImageUrl } from '@/lib/image';

interface FoodCardProps {
  food: {
    _id: string;
    name: { uz: string; ru: string; en: string };
    price: number;
    image: string;
    description?: { uz: string; ru: string; en: string };
  };
}

export default function FoodCard({ food }: FoodCardProps) {
  const t = useTranslations('food');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);

  const name = food.name[locale as keyof typeof food.name] || food.name.en;
  const imageUrl = resolveFoodImageUrl(food.image);
  const unoptimized = isRemoteImageUrl(food.image || DEFAULT_FOOD_IMAGE);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({ _id: food._id, name: food.name, price: food.price, image: food.image || DEFAULT_FOOD_IMAGE }));
    setAdded(true);
    toast.success(t('added'));
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/${locale}/food/${food._id}`} className="block group">
        <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300">
          <div className="relative h-48 bg-input overflow-hidden">
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized={unoptimized}
              />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold text-primary">
                {food.price.toLocaleString()} {tCommon('sum')}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                className={`p-2 rounded-xl transition-colors ${
                  added
                    ? 'bg-accent text-white'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                <FiPlus size={18} />
              </motion.button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
