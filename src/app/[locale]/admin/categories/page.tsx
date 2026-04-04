'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { categoriesAPI } from '@/lib/api';
import Modal from '@/components/Modal';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Category {
  _id: string;
  name: { uz: string; ru: string; en: string };
  image: string;
}

export default function AdminCategoriesPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ nameUz: '', nameRu: '', nameEn: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchCategories = () => {
    categoriesAPI.getAll().then((res) => { setCategories(res.data); setLoading(false); });
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nameUz: '', nameRu: '', nameEn: '' });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ nameUz: cat.name.uz, nameRu: cat.name.ru, nameEn: cat.name.en });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', JSON.stringify({ uz: form.nameUz, ru: form.nameRu, en: form.nameEn }));
    if (imageFile) fd.append('image', imageFile);

    try {
      if (editing) {
        await categoriesAPI.update(editing._id, fd);
        toast.success('Category updated');
      } else {
        await categoriesAPI.create(fd);
        toast.success('Category created');
      }
      setModalOpen(false);
      fetchCategories();
    } catch {
      toast.error(tCommon('error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch {
      toast.error(tCommon('error'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('categories')}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
          <FiPlus size={16} /> {t('add_category')}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted bg-input/50">
                  <th className="p-4 font-medium">Image</th>
                  <th className="p-4 font-medium">Name (UZ)</th>
                  <th className="p-4 font-medium">Name (RU)</th>
                  <th className="p-4 font-medium">Name (EN)</th>
                  <th className="p-4 font-medium">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id} className="border-b border-border/50 hover:bg-input/30">
                    <td className="p-4">
                      <div className="w-10 h-10 rounded-lg bg-input overflow-hidden">
                        {cat.image ? (
                          <Image src={`${API_URL}${cat.image}`} alt={cat.name.en} width={40} height={40} className="object-cover w-full h-full" />
                        ) : <span className="flex items-center justify-center h-full">🍴</span>}
                      </div>
                    </td>
                    <td className="p-4">{cat.name.uz}</td>
                    <td className="p-4">{cat.name.ru}</td>
                    <td className="p-4">{cat.name.en}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-input text-blue-500"><FiEdit size={16} /></button>
                        <button onClick={() => handleDelete(cat._id)} className="p-1.5 rounded-lg hover:bg-input text-red-500"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('edit_category') : t('add_category')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Name (UZ)" value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} required className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
          <input placeholder="Name (RU)" value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} required className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
          <input placeholder="Name (EN)" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm" />
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-border rounded-xl text-sm font-medium hover:bg-input">{t('cancel')}</button>
            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark">{t('save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
