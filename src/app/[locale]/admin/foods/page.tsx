'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { foodsAPI, categoriesAPI } from '@/lib/api';
import Modal from '@/components/Modal';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { isRemoteImageUrl, resolveFoodImageUrl } from '@/lib/image';

interface Food {
  _id: string;
  name: { uz: string; ru: string; en: string };
  description: { uz: string; ru: string; en: string };
  price: number;
  image: string;
  images?: string[];
  categoryId: { _id: string; name: { uz: string; ru: string; en: string } } | string;
  ingredients: string[];
  isPopular: boolean;
}

interface Category {
  _id: string;
  name: { uz: string; ru: string; en: string };
}

const isValidFood = (value: unknown): value is Food => {
  if (!value || typeof value !== 'object') return false;
  const food = value as Partial<Food>;
  return typeof food._id === 'string' && Boolean(food.name) && typeof food.price === 'number';
};

const isValidCategory = (value: unknown): value is Category => {
  if (!value || typeof value !== 'object') return false;
  const category = value as Partial<Category>;
  return typeof category._id === 'string' && Boolean(category.name);
};

const getFoodImages = (food: Pick<Food, 'image' | 'images'>) => {
  if (Array.isArray(food.images) && food.images.length > 0) {
    return food.images.filter(Boolean);
  }

  return food.image ? [food.image] : [];
};

export default function AdminFoodsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);
  const [form, setForm] = useState({
    nameUz: '', nameRu: '', nameEn: '',
    descUz: '', descRu: '', descEn: '',
    price: '', categoryId: '', ingredients: '', isPopular: false,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const selectedImagePreviews = useMemo(
    () => imageFiles.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [imageFiles]
  );

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedImagePreviews]);

  const fetchFoods = () => {
    foodsAPI.getAll({ limit: '100' })
      .then((res) => {
        const payload = res?.data && typeof res.data === 'object' ? res.data : null;
        const foodsList = Array.isArray(payload?.foods) ? payload.foods.filter(isValidFood) : null;
        if (!foodsList) {
          toast.error('Something bad happened');
          return;
        }
        setFoods(foodsList);
      })
      .catch(() => {
        toast.error('Something bad happened');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFoods();
    categoriesAPI.getAll()
      .then((res) => {
        const categoryList = Array.isArray(res?.data) ? res.data.filter(isValidCategory) : null;
        if (!categoryList) {
          toast.error('Something bad happened');
          return;
        }
        setCategories(categoryList);
      })
      .catch(() => {
        toast.error('Something bad happened');
      });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nameUz: '', nameRu: '', nameEn: '', descUz: '', descRu: '', descEn: '', price: '', categoryId: '', ingredients: '', isPopular: false });
    setImageFiles([]);
    setModalOpen(true);
  };

  const openEdit = (food: Food) => {
    setEditing(food);
    const catId = typeof food.categoryId === 'string' ? food.categoryId : food.categoryId._id;
    setForm({
      nameUz: food.name.uz, nameRu: food.name.ru, nameEn: food.name.en,
      descUz: food.description.uz, descRu: food.description.ru, descEn: food.description.en,
      price: String(food.price), categoryId: catId,
      ingredients: food.ingredients.join(', '), isPopular: food.isPopular,
    });
    setImageFiles([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', JSON.stringify({ uz: form.nameUz, ru: form.nameRu, en: form.nameEn }));
    fd.append('description', JSON.stringify({ uz: form.descUz, ru: form.descRu, en: form.descEn }));
    fd.append('price', form.price);
    fd.append('categoryId', form.categoryId);
    fd.append('ingredients', JSON.stringify(form.ingredients.split(',').map((s) => s.trim()).filter(Boolean)));
    fd.append('isPopular', String(form.isPopular));
    imageFiles.forEach((file) => fd.append('images', file));

    try {
      if (editing) {
        await foodsAPI.update(editing._id, fd);
        toast.success('Food updated');
      } else {
        await foodsAPI.create(fd);
        toast.success('Food created');
      }
      setModalOpen(false);
      fetchFoods();
    } catch {
      toast.error(tCommon('error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete'))) return;
    try {
      await foodsAPI.delete(id);
      toast.success('Food deleted');
      fetchFoods();
    } catch {
      toast.error(tCommon('error'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('foods')}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
          <FiPlus size={16} /> {t('add_food')}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card border border-border rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted bg-input/50">
                  <th className="p-4 font-medium">Image</th>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Popular</th>
                  <th className="p-4 font-medium">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => {
                  const name = food.name[locale as keyof typeof food.name] || food.name.en;
                  const firstImage = getFoodImages(food)[0];
                  const firstImageUnoptimized = isRemoteImageUrl(firstImage);
                  const catName = typeof food.categoryId === 'object'
                    ? (food.categoryId.name[locale as keyof typeof food.categoryId.name] || food.categoryId.name.en)
                    : '-';
                  return (
                    <tr key={food._id} className="border-b border-border/50 hover:bg-input/30">
                      <td className="p-4">
                        <div className="w-10 h-10 rounded-lg bg-input overflow-hidden">
                          <Image src={resolveFoodImageUrl(firstImage)} alt={name} width={40} height={40} className="object-cover w-full h-full" unoptimized={firstImageUnoptimized} />
                        </div>
                      </td>
                      <td className="p-4 font-medium">{name}</td>
                      <td className="p-4">{food.price.toLocaleString()} {tCommon('sum')}</td>
                      <td className="p-4 text-muted">{catName}</td>
                      <td className="p-4">{food.isPopular ? '⭐' : '-'}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(food)} className="p-1.5 rounded-lg hover:bg-input text-blue-500"><FiEdit size={16} /></button>
                          <button onClick={() => handleDelete(food._id)} className="p-1.5 rounded-lg hover:bg-input text-red-500"><FiTrash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('edit_food') : t('add_food')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Name (UZ)" value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} required className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <input placeholder="Name (RU)" value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} required className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <input placeholder="Name (EN)" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Desc (UZ)" value={form.descUz} onChange={(e) => setForm({ ...form, descUz: e.target.value })} className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <input placeholder="Desc (RU)" value={form.descRu} onChange={(e) => setForm({ ...form, descRu: e.target.value })} className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <input placeholder="Desc (EN)" value={form.descEn} onChange={(e) => setForm({ ...form, descEn: e.target.value })} className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="px-3 py-2 bg-input border border-border rounded-lg text-sm" />
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="px-3 py-2 bg-input border border-border rounded-lg text-sm">
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name[locale as keyof typeof cat.name] || cat.name.en}</option>
              ))}
            </select>
          </div>
          <input placeholder="Ingredients (comma separated)" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} className="accent-primary" />
            Popular
          </label>
          {editing && getFoodImages(editing).length > 0 && imageFiles.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted">Current images</p>
              <div className="flex flex-wrap gap-2">
                {getFoodImages(editing).map((image, index) => (
                  <div key={`${image}-${index}`} className="relative w-16 h-16 rounded-lg overflow-hidden bg-input border border-border">
                    <Image src={resolveFoodImageUrl(image)} alt={`Food image ${index + 1}`} fill className="object-cover" sizes="64px" unoptimized={isRemoteImageUrl(image)} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedImagePreviews.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted">Selected images</p>
              <div className="flex flex-wrap gap-2">
                {selectedImagePreviews.map((preview) => (
                  <div key={preview.url} className="relative w-16 h-16 rounded-lg overflow-hidden bg-input border border-border">
                    <Image src={preview.url} alt={preview.name} fill className="object-cover" sizes="64px" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            className="w-full text-sm"
          />
          <p className="text-xs text-muted">
            {editing ? 'Select new images to replace the current gallery.' : 'You can upload multiple images.'}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 border border-border rounded-xl text-sm font-medium hover:bg-input">{t('cancel')}</button>
            <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark">{t('save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
