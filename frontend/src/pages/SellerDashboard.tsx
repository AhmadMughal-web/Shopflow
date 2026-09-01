import { useEffect, useState } from 'react';
import { Package, ShoppingBag, TrendingUp, Warehouse } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/products';
import { useTranslation } from '../i18n/LocaleContext';
import AiInsightPanel from '../components/AiInsightPanel';
import { sellerAiOverview } from '../lib/ai';

interface SellerSummary {
  store: { name: string } | null;
  products: number;
  active_products: number;
  orders: number;
  units_sold: number;
  revenue: string;
  top_products: Array<{ id: number; name: string; stock: number; order_count: number }>;
}

export default function SellerDashboard() {
  const { token, isDemo, requestDeleteAccount } = useAuth();
  const { t } = useTranslation();
  const [summary, setSummary] = useState<SellerSummary | null>(null);

  useEffect(() => {
    if (isDemo) {
      setSummary({
        store: { name: 'Lahori Zaiqa Kitchen' },
        products: 24,
        active_products: 19,
        orders: 148,
        units_sold: 317,
        revenue: '182500',
        top_products: [
          { id: 1, name: 'Chicken Karahi Meal Set', stock: 42, order_count: 86 },
          { id: 2, name: 'Beef Nihari Family Pack', stock: 27, order_count: 54 },
          { id: 3, name: 'Kashmiri Chai (1kg)', stock: 15, order_count: 31 },
        ],
      });
      return;
    }
    apiRequest<SellerSummary>('/sellers/profiles/dashboard/', { token })
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [token, isDemo]);

  const cards = [
    { label: t('dashboard.products', { defaultValue: 'Products' }), value: summary?.products || 0, icon: Package },
    { label: t('dashboard.activeProducts', { defaultValue: 'Active products' }), value: summary?.active_products || 0, icon: Warehouse },
    { label: t('dashboard.orders', { defaultValue: 'Orders' }), value: summary?.orders || 0, icon: ShoppingBag },
    { label: t('dashboard.revenue', { defaultValue: 'Revenue' }), value: formatPrice(summary?.revenue || 0), icon: TrendingUp },
  ];

  const topProducts = summary?.top_products || [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-accent-secondary/30 bg-accent-secondary/5 p-4 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-secondary">{t('dashboard.sellerCrm', { defaultValue: 'Seller CRM' })}</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight">{summary?.store?.name || t('dashboard.storeDashboard', { defaultValue: 'Store dashboard' })}</h1>
        <p className="mt-2 text-secondary">{t('dashboard.sellerDescription', { defaultValue: 'Manage catalog, inventory, orders, customer records, and sales performance.' })}</p>
        {isDemo && (
          <p className="mt-3 rounded-xl bg-accent-secondary/10 px-3 py-2 text-xs font-semibold text-accent-secondary">
            {t('dashboard.demoNotice', { defaultValue: 'Demo mode: sample data shown, nothing is saved. Everything resets on refresh.' })}
          </p>
        )}
      </section>

      <AiInsightPanel title="AI CRM overview" insights={sellerAiOverview(summary)} />

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-secondary/15 text-accent-secondary">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-4 text-sm text-secondary">{card.label}</p>
              <p className="mt-1 text-2xl font-black">{card.value}</p>
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <h2 className="text-lg font-bold">{t('dashboard.topProducts', { defaultValue: 'Top products' })}</h2>

        {/* Mobile: card list */}
        <div className="mt-4 space-y-2 md:hidden">
          {topProducts.length === 0 ? (
            <p className="py-4 text-center text-sm text-secondary">{t('dashboard.noOrders', { defaultValue: 'No data yet.' })}</p>
          ) : (
            topProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-xl bg-background p-3">
                <p className="font-semibold text-primary">{product.name}</p>
                <div className="flex gap-4 text-xs text-secondary">
                  <span>{t('dashboard.stock', { defaultValue: 'Stock' })}: <span className="font-bold text-primary">{product.stock}</span></span>
                  <span>{t('dashboard.orders', { defaultValue: 'Orders' })}: <span className="font-bold text-primary">{product.order_count}</span></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-secondary">
              <tr>
                <th className="py-2">{t('dashboard.product', { defaultValue: 'Product' })}</th>
                <th className="py-2">{t('dashboard.stock', { defaultValue: 'Stock' })}</th>
                <th className="py-2">{t('dashboard.orders', { defaultValue: 'Orders' })}</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="py-3 font-semibold">{product.name}</td>
                  <td className="py-3">{product.stock}</td>
                  <td className="py-3">{product.order_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!isDemo && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:p-6 mt-8">
          <h2 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h2>
          <p className="text-sm text-secondary mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
                requestDeleteAccount().catch((err: any) => alert("Failed to request account deletion: " + err.message));
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full transition-colors text-sm"
          >
            Delete Account
          </button>
        </div>
      )}
    </div>
  );
}