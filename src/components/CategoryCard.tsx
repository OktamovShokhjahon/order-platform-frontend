'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface CategoryCardProps {
  category: {
    _id: string;
    name: { uz: string; ru: string; en: string };
    image: string;
  };
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const name = category.name[locale as keyof typeof category.name] || category.name.en;
  const imageUrl = category.image ? `${API_URL}${category.image}` : '';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/${locale}/categories?id=${category._id}`}
        className="block group"
      >
        <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg hover:border-primary/30 transition-all duration-300 text-center p-6">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-3xl">🍴</span>
            )}
          </div>
          <h3 className="font-semibold text-foreground text-sm">{name}</h3>
        </div>
      </Link>
    </motion.div>
  );
}
