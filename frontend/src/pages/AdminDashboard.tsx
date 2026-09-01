import { useEffect, useState } from 'react';
import { ClipboardList, Package, Store, Ticket, Users } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LocaleContext';

interface CRMOverview {
  users: number;
  customers: number;
  sellers: number;
  products: number;
  orders: number;
  tickets_open: number;
  leads: number;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [overview, setOverview] = useState<CRMOverview | null>(null);

  useEffect(() => {
    apiRequest<CRMOverview>('/crm/overview/', { token })
      .then(setOverview)
      .catch(() => setOverview(null));
  }, [token]);

  const cards = [
    { label: t('dashboard.users', { defaultValue: 'Users' }), value: overview?.users || 0, icon: Users },
    { label: t('dashboard.sellers', { defaultValue: 'Sellers' }), value: overview?.sellers || 0, icon: Store },
    { label: t('dashboard.products', { defaultValue: 'Products' }), value: overview?.products || 0, icon: Package },
    { label: t('dashboard.orders', { defaultValue: 'Orders' }), value: overview?.orders || 0, icon: ClipboardList },
    { label: t('dashboard.openTickets', { defaultValue: 'Open tickets' }), value: overview?.tickets_open || 0, icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-secondary">{t('dashboard.platformAdmin', { defaultValue: 'Platform Admin' })}</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight">{t('dashboard.moderationOverview', { defaultValue: 'Moderation and CRM overview' })}</h1>
        <p className="mt-2 text-secondary">{t('dashboard.manageUsers', { defaultValue: 'Manage users, sellers, products, disputes, CRM records, and platform health.' })}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
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
    </div>
  );
}