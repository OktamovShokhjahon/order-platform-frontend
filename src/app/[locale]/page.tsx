'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { categoriesAPI, foodsAPI } from '@/lib/api';
import FoodCard from '@/components/FoodCard';
import CategoryCard from '@/components/CategoryCard';
import SearchBar from '@/components/SearchBar';
import { FoodCardSkeleton, CategoryCardSkeleton } from '@/components/Skeleton';
import { FiArrowRight } from 'react-icons/fi';

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

export default function HomePage() {
  const t = useTranslations('home');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularFoods, setPopularFoods] = useState<Food[]>([]);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, foodRes] = await Promise.all([
          categoriesAPI.getAll(),
          foodsAPI.getAll({ popular: 'true', limit: '8' }),
        ]);
        setCategories(catRes.data);
        setPopularFoods(foodRes.data.foods);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await foodsAPI.getAll({ search: query, limit: '12' });
      setSearchResults(res.data.foods);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {t('hero_title')}
            </h1>
            <p className="text-lg text-muted mb-8">{t('hero_subtitle')}</p>
            <SearchBar onSearch={handleSearch} className="max-w-xl mx-auto mb-6" />
            <Link
              href={`/${locale}/categories`}
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              {t('hero_cta')} <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Search Results */}
      {searching && searchResults.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Search Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {searchResults.map((food) => (
              <FoodCard key={food._id} food={food} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {!searching && (
        <>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">{t('top_categories')}</h2>
              <Link
                href={`/${locale}/categories`}
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                {t('view_all')} <FiArrowRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CategoryCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((cat, index) => (
                  <motion.div
                    key={cat._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CategoryCard category={cat} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Popular Meals */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">{t('popular_meals')}</h2>
              <Link
                href={`/${locale}/categories`}
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                {t('view_all')} <FiArrowRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <FoodCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {popularFoods.map((food) => (
                  <FoodCard key={food._id} food={food} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
