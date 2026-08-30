import { useTranslation } from '../i18n/LocaleContext';
import { Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const accountLink = user ? '/dashboard' : '/login';
  const accountLabel = user ? t('footer.account', { defaultValue: 'Dashboard' }) : t('footer.login', { defaultValue: 'Login' });
  const secondaryAccountLink = user ? '/dashboard/orders' : '/register';
  const secondaryAccountLabel = user ? t('footer.orders', { defaultValue: 'Orders' }) : t('footer.register', { defaultValue: 'Register' });

  return (
    <footer className="mt-12 px-2 pb-24 sm:px-4 sm:pb-12">
      <div className="mx-auto max-w-7xl rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-sm md:h-12 md:w-12">
                <img
                  src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                  alt="ShopFlow Logo"
                  className="h-[132%] w-[132%] object-cover object-center"
                />
              </span>
              <span className="text-xl font-black tracking-tight">ShopFlow</span>
            </Link>
            <p className="text-sm leading-6 text-secondary">{t('footer.description', { defaultValue: 'Products, deals, delivery, checkout.' })}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{t('footer.shopTitle', { defaultValue: 'Shop' })}</h3>
            <div className="flex flex-wrap gap-2">
              <Link to="/products" className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-accent hover:text-primary transition-colors">{t('footer.allProducts', { defaultValue: 'All products' })}</Link>
              <Link to="/products?category=mobiles" className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-accent hover:text-primary transition-colors">{t('footer.mobiles', { defaultValue: 'Mobiles' })}</Link>
              <Link to="/products?category=fashion" className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-accent hover:text-primary transition-colors">{t('footer.fashion', { defaultValue: 'Fashion' })}</Link>
              <Link to="/products?category=groceries" className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-accent hover:text-primary transition-colors">{t('footer.groceries', { defaultValue: 'Groceries' })}</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{t('footer.ordersTitle', { defaultValue: 'Orders' })}</h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li><Link to="/cart" className="hover:text-primary">{t('footer.cart', { defaultValue: 'Cart' })}</Link></li>
              <li><Link to={accountLink} className="hover:text-primary">{accountLabel}</Link></li>
              <li><Link to={secondaryAccountLink} className="hover:text-primary">{secondaryAccountLabel}</Link></li>
            </ul>
          </div>

          <div className="rounded-2xl bg-background p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{t('footer.contactTitle', { defaultValue: 'Contact' })}</h3>
            <ul className="space-y-3 text-sm text-secondary">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent-secondary" /> {t('footer.location', { defaultValue: 'Lahore, Pakistan' })}</li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent-secondary" />
                <a href="mailto:naralithstudio@gmail.com" className="hover:text-primary break-all">
                  naralithstudio@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <span>&copy; {new Date().getFullYear()} ShopFlow.</span>
          <Link to="/privacy" className="hover:text-primary">{t('footer.privacyPolicy', { defaultValue: 'Privacy Policy' })}</Link>
        </div>
      </div>
    </footer>
  );
}