'use client';

import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { categoriesAPI, foodsAPI } from '@/lib/api';
import FoodCard from '@/components/FoodCard';
import CategoryCard from '@/components/CategoryCard';
import { FoodCardSkeleton, CategoryCardSkeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';

interface Category {
  _id: string;
  name: { uz: string; ru: string; en: string };
  image: string;
}

interface Food {
  _id: string;
  name: { uz: string; ru: string; en: string };
  description: { uz: string; ru: string; en: string };
  price: number;
  image: string;
}

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const selectedCategoryId = searchParams.get('id');

  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodsLoading, setFoodsLoading] = useState(false);

  useEffect(() => {
    categoriesAPI.getAll().then((res) => {
      setCategories(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFoodsLoading(true);
    const fetchParams: Record<string, string> = { limit: '50' };
    if (selectedCategoryId) fetchParams.category = selectedCategoryId;

    foodsAPI.getAll(fetchParams).then((res) => {
      setFoods(res.data.foods);
      setFoodsLoading(false);
    }).catch(() => setFoodsLoading(false));
  }, [selectedCategoryId]);

  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);
  const categoryName = selectedCategory
    ? selectedCategory.name[locale as keyof typeof selectedCategory.name] || selectedCategory.name.en
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-foreground mb-8"
      >
        {t('title')}
      </motion.h1>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
          {categories.map((cat) => (
            <CategoryCard key={cat._id} category={cat} />
          ))}
        </div>
      )}

      {/* Foods Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {categoryName ? `${t('foods_in')} ${categoryName}` : t('all')}
        </h2>

        {foodsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <FoodCardSkeleton key={i} />
            ))}
          </div>
        ) : foods.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {foods.map((food) => (
              <FoodCard key={food._id} food={food} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted">
            <p className="text-lg">No foods found</p>
          </div>
        )}
      </div>
    </div>
  );
}
