'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart, clearCart } from '@/store/slices/cartSlice';
import { foodsAPI } from '@/lib/api';
import { FoodDetailSkeleton } from '@/components/Skeleton';
import FoodCard from '@/components/FoodCard';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { DEFAULT_FOOD_IMAGE, isRemoteImageUrl, resolveFoodImageUrl } from '@/lib/image';

interface Food {
  _id: string;
  name: { uz: string; ru: string; en: string };
  description: { uz: string; ru: string; en: string };
  price: number;
  image: string;
  images?: string[];
  ingredients: string[];
  categoryId: { _id: string; name: { uz: string; ru: string; en: string } };
}

export default function FoodDetailPage() {
  const t = useTranslations('food');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const id = params?.id as string;
  const dispatch = useDispatch();
  const router = useRouter();

  const [food, setFood] = useState<Food | null>(null);
  const [related, setRelated] = useState<Food[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [orderingNow, setOrderingNow] = useState(false);

  useEffect(() => {
    if (!id) return;
    foodsAPI.getById(id).then((res) => {
      setFood(res.data);
      setCurrentImage(0);
      if (res.data.categoryId?._id) {
        foodsAPI.getAll({ category: res.data.categoryId._id, limit: '4' }).then((relRes) => {
          setRelated(relRes.data.foods.filter((f: Food) => f._id !== id));
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <FoodDetailSkeleton />;
  if (!food) return <div className="text-center py-20 text-muted">Food not found</div>;

  const name = food.name[locale as keyof typeof food.name] || food.name.en;
  const description = food.description[locale as keyof typeof food.description] || food.description.en;
  const foodImages = Array.isArray(food.images) && food.images.length > 0
    ? food.images.filter(Boolean)
    : food.image
      ? [food.image]
      : [DEFAULT_FOOD_IMAGE];
  const activeImage = resolveFoodImageUrl(foodImages[currentImage]);
  const hasMultipleImages = foodImages.length > 1;
  const activeImageUnoptimized = isRemoteImageUrl(foodImages[currentImage]);

  const handleAddToCart = () => {
    dispatch(addToCart({ _id: food._id, name: food.name, price: food.price, image: foodImages[0] || food.image || DEFAULT_FOOD_IMAGE, quantity }));
    toast.success(t('added'));
  };

  const handleOrderNow = () => {
    setOrderingNow(true);
    dispatch(clearCart());
    dispatch(addToCart({ _id: food._id, name: food.name, price: food.price, image: foodImages[0] || food.image || DEFAULT_FOOD_IMAGE, quantity }));
    router.push(`/${locale}/checkout`);
  };

  const showPreviousImage = () => {
    setCurrentImage((prev) => (prev === 0 ? foodImages.length - 1 : prev - 1));
  };

  const showNextImage = () => {
    setCurrentImage((prev) => (prev === foodImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/${locale}/categories`} className="text-primary text-sm mb-6 inline-block hover:underline">
        &larr; {tCommon('back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="relative h-72 sm:h-96 bg-input rounded-2xl overflow-hidden">
            <Image src={activeImage} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" unoptimized={activeImageUnoptimized} />
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  aria-label="Previous image"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                  aria-label="Next image"
                >
                  <FiChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {hasMultipleImages && (
            <>
              <div className="flex items-center justify-center gap-2">
                {foodImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setCurrentImage(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      currentImage === index ? 'w-8 bg-primary' : 'w-2.5 bg-border hover:bg-muted'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-4 gap-3">
                {foodImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setCurrentImage(index)}
                    className={`relative h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      currentImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={resolveFoodImageUrl(image)}
                      alt={`${name} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized={isRemoteImageUrl(image)}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <h1 className="text-3xl font-bold text-foreground mb-3">{name}</h1>
          <p className="text-muted mb-6 leading-relaxed">{description}</p>

          {food.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('ingredients')}</h3>
              <div className="flex flex-wrap gap-2">
                {food.ingredients.map((ing, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-3xl font-bold text-primary mb-6">
            {food.price.toLocaleString()} {tCommon('sum')}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-input rounded-xl px-4 py-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 hover:text-primary">
                <FiMinus size={18} />
              </button>
              <span className="font-semibold w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-1 hover:text-primary">
                <FiPlus size={18} />
              </button>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
              >
                <FiShoppingCart size={18} />
                {t('add_to_cart')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleOrderNow}
                disabled={orderingNow}
                className="flex items-center justify-center bg-foreground text-background py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-70"
              >
                {orderingNow ? tCommon('loading') : t('order_now')}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related Foods */}
      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('related')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((f) => (
              <FoodCard key={f._id} food={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
