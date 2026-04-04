'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { newsAPI } from '@/lib/api';
import { isRemoteImageUrl, resolveAssetUrl } from '@/lib/image';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface NewsDetail {
  _id: string;
  title: { uz: string; ru: string; en: string };
  summary: { uz: string; ru: string; en: string };
  content: { uz: string; ru: string; en: string };
  category: string;
  images: string[];
  createdAt: string;
}

export default function NewsDetailPage() {
  const t = useTranslations('news');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const id = params?.id as string;

  const [article, setArticle] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    newsAPI.getPublicById(id)
      .then((res) => {
        setArticle(res.data);
        setCurrentImage(0);
        setLoading(false);
      })
      .catch(() => {
        setArticle(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-10 bg-input rounded mb-4" />
        <div className="h-72 bg-input rounded-2xl mb-4" />
        <div className="h-4 bg-input rounded mb-2" />
        <div className="h-4 bg-input rounded mb-2" />
        <div className="h-4 bg-input rounded w-2/3" />
      </div>
    );
  }

  if (!article) {
    return <div className="text-center py-20 text-muted">{t('not_found')}</div>;
  }

  const title = article.title[locale as keyof typeof article.title] || article.title.en;
  const summary = article.summary?.[locale as keyof typeof article.summary] || article.summary?.en || '';
  const content = article.content?.[locale as keyof typeof article.content] || article.content?.en || '';
  const images = article.images?.length ? article.images : [];
  const activeImage = images[currentImage] || '';

  const showPrev = () => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const showNext = () => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/${locale}/news`} className="inline-block mb-4 text-primary hover:underline">
        &larr; {t('back_to_news')}
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
      <div className="flex items-center gap-3 text-sm text-muted mb-6">
        <span>{article.category || t('uncategorized')}</span>
        <span>•</span>
        <span>{new Date(article.createdAt).toLocaleDateString(locale)}</span>
      </div>

      {images.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-input">
            <Image
              src={resolveAssetUrl(activeImage)}
              alt={title}
              fill
              className="object-cover"
              sizes="100vw"
              unoptimized={isRemoteImageUrl(activeImage)}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/60"
                >
                  <FiChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {images.map((img, index) => (
                <button
                  key={`${img}-${index}`}
                  type="button"
                  onClick={() => setCurrentImage(index)}
                  className={`relative h-16 rounded-lg overflow-hidden border-2 ${
                    index === currentImage ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={resolveAssetUrl(img)}
                    alt={`${title} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={isRemoteImageUrl(img)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {summary && <p className="text-lg text-muted mb-4">{summary}</p>}
      {content && <p className="text-foreground leading-relaxed whitespace-pre-line">{content}</p>}
    </div>
  );
}
