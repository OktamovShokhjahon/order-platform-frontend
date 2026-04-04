'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { newsAPI } from '@/lib/api';
import { isRemoteImageUrl, resolveAssetUrl } from '@/lib/image';
import Image from 'next/image';

interface NewsCard {
  _id: string;
  title: { uz: string; ru: string; en: string };
  summary: { uz: string; ru: string; en: string };
  category: string;
  images: string[];
  isFeatured: boolean;
  createdAt: string;
}

export default function NewsPage() {
  const t = useTranslations('news');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [items, setItems] = useState<NewsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [featured, setFeatured] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    let active = true;
    const fetchNews = async () => {
      setLoading(true);
      try {
        const query: Record<string, string> = { limit: '9', page: String(page) };
        if (search.trim()) query.search = search.trim();
        if (category.trim()) query.category = category.trim();
        if (featured) query.featured = featured;
        if (fromDate) query.from = fromDate;
        if (toDate) query.to = toDate;

        const res = await newsAPI.getPublic(query);
        if (!active) return;
        setItems(res.data.news || []);
        setPages(res.data.pages || 1);
      } catch {
        if (!active) return;
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchNews();
    return () => {
      active = false;
    };
  }, [page, search, category, featured, fromDate, toDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">{t('title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('search_placeholder')}
          className="lg:col-span-2 px-3 py-2 bg-input border border-border rounded-lg text-sm"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          placeholder={t('category')}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
        />
        <select
          value={featured}
          onChange={(e) => { setFeatured(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
        >
          <option value="">{t('all_news')}</option>
          <option value="true">{t('featured')}</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
        />
      </div>

      {loading ? (
        <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 bg-card border border-border rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted text-center py-16">{t('empty')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((article) => {
              const title = article.title[locale as keyof typeof article.title] || article.title.en;
              const summary = article.summary?.[locale as keyof typeof article.summary] || article.summary?.en || '';
              const image = article.images?.[0];
              const imageUrl = resolveAssetUrl(image);
              return (
                <Link key={article._id} href={`/${locale}/news/${article._id}`} className="group block">
                  <article className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                    <div className="relative h-48 bg-input">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          unoptimized={isRemoteImageUrl(image)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">N/A</div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{article.category || t('uncategorized')}</span>
                        <span>{new Date(article.createdAt).toLocaleDateString(locale)}</span>
                      </div>
                      <h2 className="font-semibold text-foreground line-clamp-2">{title}</h2>
                      <p className="text-sm text-muted line-clamp-3">{summary}</p>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-input disabled:opacity-50"
            >
              {t('previous')}
            </button>
            <span className="text-sm text-muted">{t('page_label', { page, pages })}</span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
              disabled={page >= pages}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-input disabled:opacity-50"
            >
              {t('next')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
