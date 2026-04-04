export const GUEST_ORDERS_KEY = 'guest_orders';

export interface LocalizedText {
  uz: string;
  ru: string;
  en: string;
}

export interface GuestOrderItem {
  foodId: string;
  name: LocalizedText;
  quantity: number;
  price: number;
  image?: string;
}

export interface GuestOrder {
  _id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: GuestOrderItem[];
}

export const getGuestOrders = (): GuestOrder[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveGuestOrder = (order: GuestOrder) => {
  if (typeof window === 'undefined') return;
  const existing = getGuestOrders().filter((item) => item._id !== order._id);
  const next = [order, ...existing].slice(0, 100);
  localStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(next));
};
