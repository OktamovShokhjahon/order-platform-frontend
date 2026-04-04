'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface UserOrder {
  _id: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserOrders, setSelectedUserOrders] = useState<UserOrder[]>([]);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminAPI.getUsers()
      .then((res) => { setUsers(res.data); setLoading(false); })
      .catch(() => {
        toast.error(tCommon('error'));
        setLoading(false);
      });
  }, [tCommon]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateRole = async (id: string, role: string) => {
    try {
      await adminAPI.updateUserRole(id, role);
      toast.success('Role updated');
      fetchUsers();
    } catch {
      toast.error(tCommon('error'));
    }
  };

  const openUserDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await adminAPI.getUserDetails(id);
      setSelectedUser(res.data.user);
      setSelectedUserOrders(res.data.orders || []);
    } catch {
      toast.error(tCommon('error'));
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('users')}</h1>

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
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Phone</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-border/50 hover:bg-input/30 cursor-pointer"
                    onClick={() => openUserDetails(user._id)}
                  >
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-muted">{user.email}</td>
                    <td className="p-4 text-muted">{user.phone}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-muted text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user._id, e.target.value)}
                        className="px-2 py-1 bg-input border border-border rounded-lg text-xs"
                      >
                        <option value="user">user</option>
                        <option value="driver">driver</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedUser(null);
          setSelectedUserOrders([]);
        }}
        title={t('user_details')}
      >
        {detailsLoading || !selectedUser ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 rounded bg-input" />
            <div className="h-4 rounded bg-input" />
            <div className="h-24 rounded bg-input" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted">ID</p>
                <p className="font-mono text-xs break-all">{selectedUser._id}</p>
              </div>
              <div>
                <p className="text-muted">Role</p>
                <p className="font-medium">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-muted">{t('name')}</p>
                <p className="font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-muted">Email</p>
                <p className="font-medium">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-muted">{t('phone')}</p>
                <p className="font-medium">{selectedUser.phone}</p>
              </div>
              <div>
                <p className="text-muted">{t('joined')}</p>
                <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleString(locale)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('orders')}</h3>
              {selectedUserOrders.length === 0 ? (
                <p className="text-sm text-muted">{t('no_data')}</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-auto pr-1">
                  {selectedUserOrders.map((order) => (
                    <div key={order._id} className="border border-border rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">#{order._id.slice(-6)}</span>
                        <span className="text-muted">{new Date(order.createdAt).toLocaleString(locale)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span>{order.status}</span>
                        <span className="font-medium">{order.totalPrice.toLocaleString()} {tCommon('sum')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
