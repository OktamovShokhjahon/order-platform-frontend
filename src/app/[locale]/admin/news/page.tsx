'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { newsAPI } from '@/lib/api';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import Image from 'next/image';
import { isRemoteImageUrl, resolveAssetUrl } from '@/lib/image';

interface NewsItem {
  _id: string;
  title: { uz: string; ru: string; en: string };
  summary: { uz: string; ru: string; en: string };
  content: { uz: string; ru: string; en: string };
  category: string;
  images: string[];
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface NewsForm {
  titleUz: string;
  titleRu: string;
  titleEn: string;
  summaryUz: string;
  summaryRu: string;
  summaryEn: string;
  contentUz: string;
  contentRu: string;
  contentEn: string;
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
}

const emptyForm: NewsForm = {
  titleUz: '',
  titleRu: '',
  titleEn: '',
  summaryUz: '',
  summaryRu: '',
  summaryEn: '',
  contentUz: '',
  contentRu: '',
  contentEn: '',
  category: '',
  isPublished: true,
  isFeatured: false,
};

export default function AdminNewsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<NewsForm>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, string> = { page: String(page), limit: '20' };
      if (search.trim()) query.search = search.trim();
      if (category.trim()) query.category = category.trim();
      if (publishedFilter) query.published = publishedFilter;
      if (featuredFilter) query.featured = featuredFilter;
      if (fromDate) query.from = fromDate;
      if (toDate) query.to = toDate;

      const res = await newsAPI.getAdminList(query);
      setItems(res.data.news || []);
      setPages(res.data.pages || 1);
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, category, publishedFilter, featuredFilter, fromDate, toDate, tCommon]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNews();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNews]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFiles([]);
    setModalOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({
      titleUz: item.title.uz,
      titleRu: item.title.ru,
      titleEn: item.title.en,
      summaryUz: item.summary?.uz || '',
      summaryRu: item.summary?.ru || '',
      summaryEn: item.summary?.en || '',
      contentUz: item.content?.uz || '',
      contentRu: item.content?.ru || '',
      contentEn: item.content?.en || '',
      category: item.category || '',
      isPublished: item.isPublished,
      isFeatured: item.isFeatured,
    });
    setImageFiles([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', JSON.stringify({ uz: form.titleUz, ru: form.titleRu, en: form.titleEn }));
      fd.append('summary', JSON.stringify({ uz: form.summaryUz, ru: form.summaryRu, en: form.summaryEn }));
      fd.append('content', JSON.stringify({ uz: form.contentUz, ru: form.contentRu, en: form.contentEn }));
      fd.append('category', form.category);
      fd.append('isPublished', String(form.isPublished));
      fd.append('isFeatured', String(form.isFeatured));
      imageFiles.forEach((file) => fd.append('images', file));

      if (editing) {
        await newsAPI.update(editing._id, fd);
        toast.success(t('save'));
      } else {
        await newsAPI.create(fd);
        toast.success(t('save'));
      }
      setModalOpen(false);
      await fetchNews();
    } catch {
      toast.error(tCommon('error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await newsAPI.delete(id);
      toast.success(t('delete'));
      await fetchNews();
    } catch {
      toast.error(tCommon('error'));
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('news')}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
          <FiPlus size={16} /> {t('add_news')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('search_news_placeholder')}
          className="lg:col-span-2 px-3 py-2 bg-input border border-border rounded-lg text-sm"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          placeholder={t('news_category')}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
        />
        <select
          value={publishedFilter}
          onChange={(e) => { setPublishedFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
        >
          <option value="">{t('all_statuses')}</option>
          <option value="true">{t('published')}</option>
          <option value="false">{t('unpublished')}</option>
        </select>
        <select
          value={featuredFilter}
          onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-input border border-border rounded-lg text-sm"
        >
          <option value="">{t('all_featured_options')}</option>
          <option value="true">{t('featured')}</option>
          <option value="false">{t('not_featured')}</option>
        </select>
        <div className="flex gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted text-center py-12">{t('no_data')}</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted bg-input/50">
                    <th className="p-4 font-medium">Image</th>
                    <th className="p-4 font-medium">{t('name')}</th>
                    <th className="p-4 font-medium">{t('news_category')}</th>
                    <th className="p-4 font-medium">{t('published')}</th>
                    <th className="p-4 font-medium">{t('featured')}</th>
                    <th className="p-4 font-medium">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const image = item.images?.[0];
                    const title = item.title[locale as keyof typeof item.title] || item.title.en;
                    const imageUrl = resolveAssetUrl(image);
                    return (
                      <tr key={item._id} className="border-b border-border/50 hover:bg-input/30">
                        <td className="p-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-input">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={title} width={40} height={40} className="object-cover w-full h-full" unoptimized={isRemoteImageUrl(image)} />
                            ) : (
                              <span className="flex h-full items-center justify-center text-xs text-muted">N/A</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium max-w-[300px] truncate">{title}</td>
                        <td className="p-4 text-muted">{item.category || '-'}</td>
                        <td className="p-4">{item.isPublished ? t('published') : t('unpublished')}</td>
                        <td className="p-4">{item.isFeatured ? t('featured') : t('not_featured')}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-input text-blue-500"><FiEdit size={16} /></button>
                            <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg hover:bg-input text-red-500"><FiTrash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
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
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('edit_news') : t('add_news')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input placeholder="Title (UZ)" value={form.titleUz} onChange={(e) => setForm({ ...form, titleUz: e.target.value })} required className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <input placeholder="Title (RU)" value={form.titleRu} onChange={(e) => setForm({ ...form, titleRu: e.target.value })} required className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <input placeholder="Title (EN)" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} required className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input placeholder="Summary (UZ)" value={form.summaryUz} onChange={(e) => setForm({ ...form, summaryUz: e.target.value })} className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <input placeholder="Summary (RU)" value={form.summaryRu} onChange={(e) => setForm({ ...form, summaryRu: e.target.value })} className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <input placeholder="Summary (EN)" value={form.summaryEn} onChange={(e) => setForm({ ...form, summaryEn: e.target.value })} className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <textarea placeholder="Content (UZ)" value={form.contentUz} onChange={(e) => setForm({ ...form, contentUz: e.target.value })} rows={4} className="px-3 py-2 bg-input border border-border rounded-lg text-sm resize-none" />
            <textarea placeholder="Content (RU)" value={form.contentRu} onChange={(e) => setForm({ ...form, contentRu: e.target.value })} rows={4} className="px-3 py-2 bg-input border border-border rounded-lg text-sm resize-none" />
            <textarea placeholder="Content (EN)" value={form.contentEn} onChange={(e) => setForm({ ...form, contentEn: e.target.value })} rows={4} className="px-3 py-2 bg-input border border-border rounded-lg text-sm resize-none" />
          </div>
          <input
            placeholder={t('news_category')}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-primary" />
              {t('published')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-primary" />
              {t('featured')}
            </label>
          </div>
          <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files || []))} className="w-full text-sm" />
          <p className="text-xs text-muted">{editing ? t('replace_images_hint') : t('upload_images_hint')}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-border rounded-xl text-sm font-medium hover:bg-input">{t('cancel')}</button>
            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark">{t('save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
