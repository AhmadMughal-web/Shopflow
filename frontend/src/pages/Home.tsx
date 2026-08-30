import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, Truck, ShieldCheck, RefreshCw, Flame, Star, Tag, Sparkles, ChevronLeft, ChevronRight, Store, Clock, TrendingUp, Zap } from 'lucide-react';

import ProductCard from '../components/ProductCard';
import AiInsightPanel from '../components/AiInsightPanel';
import { API, formatPrice, price, productImage } from '../lib/products';
import { marketAiOverview } from '../lib/ai';
import { getCategoryIcon } from '../lib/categoryIcons';

import type { CategoryType, ProductType } from '../lib/products';
import { useTranslation } from '../i18n/LocaleContext';
import Seo from '../components/Seo';

const quickLinks = ['mobiles', 'fashion', 'groceries', 'gaming', 'appliances', 'books'];

// Horizontal scrollable product row
function ProductRow({ products }: { products: ProductType[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    if (rowRef.current) rowRef.current.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
  };
  return (
    <div className="relative group">
      <button
        onClick={() => scroll('left')}
        className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:border-accent"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="shrink-0 w-[220px] sm:w-[240px]">
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>
      <button
        onClick={() => scroll('right')}
        className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:border-accent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// Section header component
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  linkTo,
  linkLabel,
  badge,
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  linkTo?: string;
  linkLabel?: string;
  badge?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent-secondary">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">{title}</h2>
            {badge && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-secondary">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-secondary mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {linkTo && (
        <Link to={linkTo} className="flex items-center gap-1 text-sm font-semibold text-accent-secondary hover:underline shrink-0">
          {linkLabel || 'View all'} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// Deal card for discounted products
function DealCard({ product }: { product: ProductType }) {
  const original = parseFloat(product.price as unknown as string);
  const discounted = parseFloat((product.discount_price || product.price) as unknown as string);
  const pct = original > 0 ? Math.round(((original - discounted) / original) * 100) : 0;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex gap-3 rounded-2xl border border-border bg-surface p-3 transition-all hover:border-accent hover:shadow-md"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={productImage(product)}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold text-primary leading-snug">{product.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-black text-accent-secondary">{formatPrice(price(product))}</span>
          {product.discount_price && (
            <span className="text-xs text-secondary line-through">{formatPrice(original)}</span>
          )}
        </div>
        {pct > 0 && (
          <span className="mt-1 inline-block rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent-secondary">
            -{pct}% OFF
          </span>
        )}
      </div>
    </Link>
  );
}

function LazySection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShow(true); observer.disconnect(); } },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={className}>
      {show ? children : <div className="h-32 animate-pulse rounded-2xl bg-muted/30" />}
    </section>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [newestProducts, setNewestProducts] = useState<ProductType[]>([]);
  const [dealsProducts, setDealsProducts] = useState<ProductType[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductType[]>([]);
  const [techProducts, setTechProducts] = useState<ProductType[]>([]);
  const [fashionProducts, setFashionProducts] = useState<ProductType[]>([]);
  const [groceryProducts, setGroceryProducts] = useState<ProductType[]>([]);
  const [booksProducts, setBooksProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [heroReady, setHeroReady] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const trustBadges = [
    { Icon: Truck, title: t('home.badgeFastDelivery', { defaultValue: 'Fast local delivery' }), copy: t('home.badgeFastCopy', { defaultValue: 'From nearby seller stores' }) },
    { Icon: BadgePercent, title: t('home.badgeDailyDeals', { defaultValue: 'Shop-owned products' }), copy: t('home.badgeDailyCopy', { defaultValue: 'Every item belongs to a store' }) },
    { Icon: ShieldCheck, title: t('home.badgeChecked', { defaultValue: 'Seller CRM included' }), copy: t('home.badgeCheckedCopy', { defaultValue: 'Stores manage catalog and orders' }) },
  ];

  useEffect(() => {
    // Single consolidated fetch for the homepage
    fetch(`${API}/homepage/`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.random || []);
        setNewestProducts(data.newest || []);

        // Deals approximation (products from random that have a discount)
        const discounted = (data.random || []).filter((p: ProductType) =>
          p.discount_price && parseFloat(p.discount_price as unknown as string) < parseFloat(p.price as unknown as string)
        );
        setDealsProducts(discounted.slice(0, 12));

        setTechProducts(data.laptops || []);
        setFashionProducts(data.fashion || []);
        setGroceryProducts(data.groceries || []);
        setBooksProducts(data.books || []);
        setCategories((data.categories || []).sort((a: CategoryType, b: CategoryType) => a.name.localeCompare(b.name)));

        // Immediate featured
        const immediateFeatured = (data.random || []).filter((product: ProductType) => product.is_featured).slice(0, 8);
        if (data.featured && data.featured.length > 0) {
          setFeaturedProducts(data.featured);
        } else if (immediateFeatured.length > 0) {
          setFeaturedProducts(immediateFeatured);
        }

        setTimeout(() => setHeroReady(true), 100);
      })
      .catch(() => {
        setHeroReady(true);
      });
  }, []);

  // Rotate hero product
  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setHeroReady(false);
      setTimeout(() => {
        setHeroIndex((prev) => (prev + 1) % products.length);
        setHeroReady(true);
      }, 300);
    }, 30000);
    return () => clearInterval(interval);
  }, [products.length]);

  const heroProduct = products[heroIndex];
  const otherProducts = products.filter((_, idx) => idx !== heroIndex);
  const flashDeals = otherProducts.slice(0, 4);
  const dailyPicks = otherProducts.slice(4, 12);
  const trendingProducts = otherProducts.slice(12, 20);
  const recommendedProducts = otherProducts.slice(20, 29);

  return (
    <div className="min-h-screen">
      <Seo
        title="ShopFlow"
        description="Shop products from local seller stores with marketplace checkout, seller CRM, and delivery support."
      />

      {/* ── Hero: floating bento block ── */}
      <section className="px-2 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="anim-fade-in rounded-3xl border border-border bg-surface p-5 text-primary shadow-sm sm:p-7">
              {/* Story-style category circles */}
              <div className="mb-5 flex gap-4 overflow-x-auto pb-1 sm:mb-6">
                {quickLinks.map((slug) => {
                  const Icon = getCategoryIcon(slug);
                  return (
                    <Link
                      key={slug}
                      to={`/products?category=${slug}`}
                      className="flex shrink-0 flex-col items-center gap-1.5 group"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent/25 to-accent-secondary/15 text-primary transition-transform group-hover:scale-105 group-active:scale-95">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="text-[11px] font-semibold text-secondary group-hover:text-primary">
                        {t(`categories.${slug}.name`, { defaultValue: slug })}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-secondary">
                <Flame className="h-4 w-4" />
                {t('home.flashPicks', { defaultValue: 'Flash picks' })}
              </p>
              <h1 className="max-w-2xl text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                {t('home.heroTitle', { defaultValue: 'Deals first. Products everywhere.' })}
              </h1>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-semibold text-primary transition-opacity hover:opacity-90"
                >
                  {t('home.shopNow', { defaultValue: 'Shop now' })} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/products?random=true"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-semibold text-primary transition-colors hover:border-accent hover:bg-background"
                >
                  {t('home.randomFeed', { defaultValue: 'Random feed' })} <RefreshCw className="h-4 w-4" />
                </Link>
              </div>

              {/* Trust badges — integrated bento row inside hero card */}
              <div className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {trustBadges.map(({ Icon, title, copy }) => (
                  <div key={title} className="flex items-center gap-3 rounded-2xl bg-background p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-secondary">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-primary">{title}</p>
                      <p className="truncate text-[11px] text-secondary">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
              {heroProduct && heroReady ? (
                <div className="anim-fade-in-up">
                  <Link to={`/product/${heroProduct.slug}`} className="group block">
                    <div className="aspect-[5/4] overflow-hidden rounded-2xl bg-muted">
                      <img
                        src={productImage(heroProduct)}
                        alt={heroProduct.name}
                        fetchPriority="high"
                        loading="eager"
                        decoding="sync"
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="pt-4">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-accent-secondary">{heroProduct.tag || t(`categories.${heroProduct.category.slug}.name`, { defaultValue: heroProduct.category.name })}</span>
                        <span className="text-secondary">{heroProduct.stock} {t('home.leftInStock', { defaultValue: 'left' })}</span>
                      </div>
                      <h2 className="line-clamp-1 text-xl font-bold sm:text-2xl">{heroProduct.name}</h2>
                      {heroProduct.store?.name && (
                        <p className="mt-1 text-sm font-medium text-secondary">
                          {t('products.soldBy', { defaultValue: 'Sold by' })} {heroProduct.store.name}
                        </p>
                      )}
                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="text-2xl font-black text-primary">{formatPrice(price(heroProduct))}</span>
                        {heroProduct.discount_price && (
                          <span className="text-sm text-secondary line-through">{formatPrice(heroProduct.price)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="aspect-[5/4] rounded-2xl bg-muted/60" />
                  <div className="pt-4 space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 rounded bg-muted/60" />
                      <div className="h-4 w-16 rounded bg-muted/60" />
                    </div>
                    <div className="h-7 w-3/4 rounded bg-muted/60" />
                    <div className="h-4 w-1/2 rounded bg-muted/60" />
                    <div className="h-8 w-1/3 rounded bg-muted/60" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Insight ── */}
      {products.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <AiInsightPanel title="AI shopping overview" insights={marketAiOverview(products)} />
        </section>
      )}

      {/* ── Flash Deals (4 cards) ── */}
      {flashDeals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeader
            icon={Zap}
            title={t('home.flashDeals', { defaultValue: 'Flash deals' })}
            subtitle="Limited-time prices from local stores"
            linkTo="/products"
            linkLabel="More deals"
            badge="HOT"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {flashDeals.map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      )}

      {/* ── Deals & Discounts compact list ── */}
      {dealsProducts.length > 0 && (
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionHeader
              icon={Tag}
              title="Deals & Discounts"
              subtitle="Products with the biggest savings right now"
              linkTo="/products?sort=price_low"
              linkLabel="All deals"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dealsProducts.slice(0, 9).map((product) => (
                <DealCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Shop by Category ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader
          title={t('home.shopByCategory', { defaultValue: 'Shop by category' })}
          subtitle={t('home.categorySubtitle', { defaultValue: 'Browse products listed by local stores.' })}
          linkTo="/products"
          linkLabel={t('home.viewAll', { defaultValue: 'View all' })}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category, idx) => {
            const Icon = getCategoryIcon(category.slug);
            const iconBg = idx % 2 === 0 ? 'bg-accent/15 text-accent-secondary' : 'bg-accent-secondary/15 text-accent-secondary';
            return (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent hover:bg-muted"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">{t(`categories.${category.slug}.name`, { defaultValue: category.name })}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-secondary">{t(`categories.${category.slug}.description`, { defaultValue: category.description || '' })}</p>
                  </div>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── New Arrivals (horizontal scroll) ── */}
      {newestProducts.length > 0 && (
        <LazySection className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionHeader
              icon={Clock}
              title="New Arrivals"
              subtitle="The latest products added to the marketplace"
              linkTo="/products?sort=newest"
              linkLabel="See all new"
              badge="NEW"
            />
            <ProductRow products={newestProducts} />
          </div>
        </LazySection>
      )}

      {/* ── Featured Picks ── */}
      {featuredProducts.length > 0 && (
        <LazySection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeader
            icon={Star}
            title="Featured Products"
            subtitle="Handpicked by stores for you"
            linkTo="/products?featured=true"
            linkLabel="All featured"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </LazySection>
      )}

      {/* ── Daily Picks (random) ── */}
      {dailyPicks.length > 0 && (
        <LazySection className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionHeader
              icon={Sparkles}
              title={t('home.justForToday', { defaultValue: 'Just for today' })}
              subtitle="Freshly randomised for you every visit"
              badge="DAILY"
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {dailyPicks.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ── Tech / Laptops Row ── */}
      {techProducts.length > 0 && (
        <LazySection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeader
            icon={getCategoryIcon('laptops')}
            title="Tech & Laptops"
            subtitle="Top computing gear from local sellers"
            linkTo="/products?category=laptops"
            linkLabel="Shop tech"
          />
          <ProductRow products={techProducts} />
        </LazySection>
      )}

      {/* ── Trending Now ── */}
      {trendingProducts.length > 0 && (
        <LazySection className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionHeader
              icon={TrendingUp}
              title={t('home.trendingNow', { defaultValue: 'Trending Now' })}
              subtitle="What everyone is buying this week"
              linkTo="/products?sort=popular"
              linkLabel={t('home.viewAll', { defaultValue: 'View all' })}
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ── Fashion Row ── */}
      {fashionProducts.length > 0 && (
        <LazySection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeader
            icon={getCategoryIcon('fashion')}
            title="Fashion & Style"
            subtitle="Clothes, accessories & more from local sellers"
            linkTo="/products?category=fashion"
            linkLabel="Shop fashion"
          />
          <ProductRow products={fashionProducts} />
        </LazySection>
      )}

      {/* ── Grocery Row ── */}
      {groceryProducts.length > 0 && (
        <LazySection className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionHeader
              icon={getCategoryIcon('groceries')}
              title="Groceries & Fresh Produce"
              subtitle="Daily essentials from local sellers"
              linkTo="/products?category=groceries"
              linkLabel="Shop groceries"
            />
            <ProductRow products={groceryProducts} />
          </div>
        </LazySection>
      )}

      {/* ── Books Row ── */}
      {booksProducts.length > 0 && (
        <LazySection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeader
            icon={getCategoryIcon('books')}
            title="Books & Stationery"
            subtitle="Study guides, novels, and school supplies"
            linkTo="/products?category=books"
            linkLabel="Browse books"
          />
          <ProductRow products={booksProducts} />
        </LazySection>
      )}

      {/* ── Recommended for You ── */}
      {recommendedProducts.length > 0 && (
        <LazySection className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <SectionHeader
              icon={Sparkles}
              title={t('home.recommendedForYou', { defaultValue: 'Recommended for you' })}
              subtitle="AI-curated picks based on your browsing"
              badge="AI"
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-3">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </LazySection>
      )}

      {/* ── Store Directory Banner ── */}
      <LazySection className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-accent/10 via-surface to-accent-secondary/10 p-8 text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-accent-secondary" />
          <h2 className="text-2xl font-black tracking-tight">Browse by Store</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-secondary">
            Explore dedicated stores — from groceries and tech to fashion and sports gear.
          </p>
          <Link
            to="/products"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-primary transition-opacity hover:opacity-90"
          >
            Explore all stores <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </LazySection>


    </div>
  );
}