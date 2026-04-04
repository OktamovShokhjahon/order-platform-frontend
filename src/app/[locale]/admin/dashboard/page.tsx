'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { adminAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  FiBarChart2,
  FiCalendar,
  FiDownload,
  FiDollarSign,
  FiPackage,
  FiShoppingCart,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import * as XLSX from 'xlsx';

type Period = 'daily' | 'weekly' | 'monthly' | 'range';

interface StatisticsPayload {
  period: Period;
  bucket: string;
  dateRange: { start: string; end: string };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalItemsSold: number;
    totalUsers: number;
    totalFoods: number;
    totalCategories: number;
  };
  chartSeries: { label: string; revenue: number; orders: number }[];
  foodSales: {
    foodId: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
  topFood: { name: string; quantitySold: number; revenue: number } | null;
  lowestFood: { name: string; quantitySold: number; revenue: number } | null;
  recentOrders: {
    _id: string;
    customerName: string;
    totalPrice: number;
    status: string;
    createdAt: string;
  }[];
}

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [period, setPeriod] = useState<Period>('daily');
  const [rangeFrom, setRangeFrom] = useState(() => {
    const t = new Date();
    t.setDate(t.getDate() - 6);
    return formatYMD(t);
  });
  const [rangeTo, setRangeTo] = useState(() => formatYMD(new Date()));
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [data, setData] = useState<StatisticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const q: Record<string, string> = {
      period,
      locale,
    };
    if (period === 'range') {
      q.from = rangeFrom;
      q.to = rangeTo;
    }
    try {
      const res = await adminAPI.getStatistics(q);
      setData(res.data);
    } catch (err) {
      setData(null);
      let msg = 'Request failed';
      if (axios.isAxiosError(err)) {
        const d = err.response?.data;
        if (d && typeof d === 'object' && 'error' in d && typeof (d as { error: string }).error === 'string') {
          msg = (d as { error: string }).error;
        } else if (err.response?.status === 401) {
          msg = 'Unauthorized';
        } else if (err.message) {
          msg = err.message;
        }
      }
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, [period, rangeFrom, rangeTo, locale]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const chartMax = useMemo(() => {
    if (!data?.chartSeries.length) return 1;
    const vals = data.chartSeries.map((s) =>
      chartMetric === 'revenue' ? s.revenue : s.orders
    );
    return Math.max(...vals, 1);
  }, [data, chartMetric]);

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const summaryAoA = [
      [t('stats_export_summary')],
      [t('stats_period_label'), period],
      [t('stats_from'), new Date(data.dateRange.start).toLocaleString()],
      [t('stats_to'), new Date(data.dateRange.end).toLocaleString()],
      [],
      [t('total_orders'), data.summary.totalOrders],
      [t('total_revenue'), data.summary.totalRevenue],
      [t('stats_total_items_sold'), data.summary.totalItemsSold],
      [t('total_users'), data.summary.totalUsers],
      [t('stats_foods_count'), data.summary.totalFoods],
      [t('stats_categories_count'), data.summary.totalCategories],
    ];
    if (data.topFood) {
      summaryAoA.push(
        [],
        [t('stats_top_food'), data.topFood.name, data.topFood.quantitySold, data.topFood.revenue]
      );
    }
    if (data.lowestFood) {
      summaryAoA.push([t('stats_lowest_food'), data.lowestFood.name, data.lowestFood.quantitySold, data.lowestFood.revenue]);
    }

    const ws0 = XLSX.utils.aoa_to_sheet(summaryAoA);
    XLSX.utils.book_append_sheet(wb, ws0, 'Summary');

    const foodsSheet = data.foodSales.map((r) => ({
      [t('stats_food_name')]: r.name,
      [t('stats_quantity')]: r.quantitySold,
      [t('stats_revenue')]: r.revenue,
    }));
    const ws1 = XLSX.utils.json_to_sheet(foodsSheet.length ? foodsSheet : [{ [t('stats_food_name')]: '—' }]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Foods');

    const chartSheet = data.chartSeries.map((r) => ({
      [t('stats_period_column')]: r.label,
      [t('stats_revenue')]: r.revenue,
      [t('total_orders')]: r.orders,
    }));
    const ws2 = XLSX.utils.json_to_sheet(chartSheet.length ? chartSheet : [{ [t('stats_period_column')]: '—' }]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Chart');

    const safe = `${period}_${formatYMD(new Date())}`;
    XLSX.writeFile(wb, `admin-statistics_${safe}.xlsx`);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-card border border-border rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <p className="text-foreground font-medium">{tCommon('error')}</p>
        {fetchError && (
          <p className="text-sm text-muted wrap-break-word max-w-lg mx-auto">{fetchError}</p>
        )}
        <button
          type="button"
          onClick={() => fetchStats()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {tCommon('retry')}
        </button>
      </div>
    );
  }

  const stats = [
    {
      label: t('total_revenue'),
      value: `${data.summary.totalRevenue.toLocaleString()} ${tCommon('sum')}`,
      icon: FiDollarSign,
      color: 'text-green-500 bg-green-500/10',
    },
    {
      label: t('total_orders'),
      value: String(data.summary.totalOrders),
      icon: FiShoppingCart,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: t('stats_total_items_sold'),
      value: String(data.summary.totalItemsSold),
      icon: FiPackage,
      color: 'text-orange-500 bg-orange-500/10',
    },
    {
      label: t('total_users'),
      value: String(data.summary.totalUsers),
      icon: FiUsers,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard')}</h1>
        <button
          type="button"
          onClick={exportExcel}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          <FiDownload size={18} />
          {t('stats_export_excel')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted flex items-center gap-1">
            <FiCalendar size={16} />
            {t('stats_time_range')}
          </span>
          {(['daily', 'weekly', 'monthly', 'range'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {p === 'daily' && t('stats_period_daily')}
              {p === 'weekly' && t('stats_period_weekly')}
              {p === 'monthly' && t('stats_period_monthly')}
              {p === 'range' && t('stats_period_custom')}
            </button>
          ))}
        </div>

        {period === 'range' && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted">
              {t('stats_from')}
              <input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              {t('stats_to')}
              <input
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() => fetchStats()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {t('stats_apply')}
            </button>
          </div>
        )}

        <p className="text-xs text-muted">
          {t('stats_paid_only_hint')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-sm text-muted">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <FiTrendingUp className="text-green-500" />
            <h3 className="font-semibold text-foreground">{t('stats_top_food')}</h3>
          </div>
          {data.topFood ? (
            <p className="text-foreground">
              <span className="font-medium">{data.topFood.name}</span>
              <span className="text-muted text-sm ml-2">
                — {data.topFood.quantitySold} {t('stats_units')} / {data.topFood.revenue.toLocaleString()}{' '}
                {tCommon('sum')}
              </span>
            </p>
          ) : (
            <p className="text-muted text-sm">{t('stats_no_sales')}</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <FiTrendingDown className="text-amber-500" />
            <h3 className="font-semibold text-foreground">{t('stats_lowest_food')}</h3>
          </div>
          {data.lowestFood ? (
            <p className="text-foreground">
              <span className="font-medium">{data.lowestFood.name}</span>
              <span className="text-muted text-sm ml-2">
                — {data.lowestFood.quantitySold} {t('stats_units')} / {data.lowestFood.revenue.toLocaleString()}{' '}
                {tCommon('sum')}
              </span>
            </p>
          ) : (
            <p className="text-muted text-sm">{t('stats_no_sales')}</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <FiBarChart2 size={18} />
            {t('stats_sales_over_time')}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">{t('stats_chart_metric')}</span>
            <select
              value={chartMetric}
              onChange={(e) => setChartMetric(e.target.value as 'revenue' | 'orders')}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            >
              <option value="revenue">{t('stats_revenue')}</option>
              <option value="orders">{t('stats_orders_count')}</option>
            </select>
          </div>
        </div>
        {data.chartSeries.length > 0 ? (
          <div className="w-full overflow-x-auto pb-1">
            <div
              className="flex items-stretch gap-2 sm:gap-3"
              style={{
                minWidth:
                  data.chartSeries.length > 10 ? `${Math.max(data.chartSeries.length * 2.75, 100)}%` : undefined,
              }}
            >
              {data.chartSeries.map((row) => {
                const raw = chartMetric === 'revenue' ? row.revenue : row.orders;
                const n = Number(raw);
                const barPct =
                  chartMax > 0 && n > 0 ? Math.max((n / chartMax) * 100, 6) : 0;
                return (
                  <div
                    key={row.label}
                    className="flex min-w-11 flex-1 flex-col items-center gap-1.5"
                  >
                    <span className="text-[10px] sm:text-xs text-muted tabular-nums shrink-0 leading-tight text-center">
                      {chartMetric === 'revenue' ? n.toLocaleString() : n}
                    </span>
                    <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-t-sm bg-muted/30 dark:bg-muted/20">
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md bg-primary transition-all"
                        style={{
                          height: `${barPct}%`,
                          minHeight: n > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                    <span
                      className="max-w-full truncate text-center text-[10px] sm:text-xs text-muted leading-tight"
                      title={row.label}
                    >
                      {row.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-muted text-sm">{t('no_data')}</p>
        )}
      </div>

      {/* Food sales table */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">{t('stats_food_sales')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">{t('stats_food_name')}</th>
                <th className="pb-3 font-medium">{t('stats_quantity')}</th>
                <th className="pb-3 font-medium">{t('stats_revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {data.foodSales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-muted text-center">
                    {t('stats_no_sales')}
                  </td>
                </tr>
              ) : (
                data.foodSales.map((row, i) => (
                  <tr key={String(row.foodId)} className="border-b border-border/50">
                    <td className="py-2 text-muted">{i + 1}</td>
                    <td className="py-2 font-medium text-foreground">{row.name}</td>
                    <td className="py-2 tabular-nums">{row.quantitySold}</td>
                    <td className="py-2 tabular-nums">
                      {row.revenue.toLocaleString()} {tCommon('sum')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">{t('recent_orders')}</h3>
        <p className="text-xs text-muted mb-3">{t('stats_recent_in_range')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">{t('name')}</th>
                <th className="pb-3 font-medium">{t('total_revenue')}</th>
                <th className="pb-3 font-medium">{t('order_status')}</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted text-sm">
                    {t('no_data')}
                  </td>
                </tr>
              ) : (
                data.recentOrders.map((order) => (
                <tr key={order._id} className="border-b border-border/50">
                  <td className="py-3 font-mono text-xs">{order._id.slice(-6)}</td>
                  <td className="py-3">{order.customerName}</td>
                  <td className="py-3 font-medium">{order.totalPrice.toLocaleString()}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered'
                          ? 'bg-green-500/10 text-green-500'
                          : order.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : order.status === 'preparing'
                              ? 'bg-blue-500/10 text-blue-500'
                              : order.status === 'delivering'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
