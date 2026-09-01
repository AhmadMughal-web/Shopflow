import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Store } from 'lucide-react';
import { formatPrice, price, productImage } from '../lib/products';
import type { ProductType } from '../lib/products';
import { useTranslation } from '../i18n/LocaleContext';


interface ProductCardProps {
  product: ProductType;
  compact?: boolean;
}

function ProductCardComponent({ product, compact = false }: ProductCardProps) {
  const { t } = useTranslation();
  const image = productImage(product);
  const hasDiscount = Boolean(product.discount_price);
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100)
    : 0;

  return (
    <Link to={`/product/${product.slug}`} className="group block h-full">
      <article className="h-full overflow-hidden rounded-2xl border border-border bg-surface card-lift-effect hover:border-accent">
        <div className="relative aspect-[5/4] overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-secondary">{t('products.noImage', { defaultValue: 'No image' })}</div>
          )}
          {product.tag && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-accent px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary shadow-sm">
              {product.tag}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-sale px-2 py-1 text-[10px] font-bold text-background shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {/* Rating chip overlaid on image bottom-left */}
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {Number(product.rating).toFixed(1)}
          </span>
        </div>

        <div className={`${compact ? 'p-3' : 'p-3 sm:p-4'} flex min-h-[110px] flex-col sm:min-h-[140px]`}>
          <span className="mb-1.5 inline-block w-fit rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
            {t(`categories.${product.category.slug}.name`, { defaultValue: product.category.name })}
          </span>

          <h3 className="line-clamp-2 min-h-[40px] text-[13px] font-semibold leading-5 text-primary sm:text-sm group-hover:text-accent-secondary transition-colors duration-200">
            {product.name}
          </h3>
          {product.store?.name && (
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-secondary">
              <Store className="h-3.5 w-3.5 shrink-0 text-accent-secondary" aria-hidden="true" />
              <span className="truncate">{product.store.name}</span>
            </p>
          )}
        </div>

        {/* Distinct highlighted price/cart footer strip */}
        <div className="flex items-end justify-between gap-2 bg-muted/60 px-3 py-2.5 sm:px-4">
          <div className="min-w-0">
            {hasDiscount && (
              <p className="text-xs text-secondary line-through">{formatPrice(product.price)}</p>
            )}
            <p className="text-sm font-black text-primary sm:text-base">{formatPrice(price(product))}</p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-background transition-all duration-300 group-hover:bg-accent group-hover:text-primary group-hover:shadow-lg group-hover:-translate-y-1 sm:h-9 sm:w-9 btn-press-effect">
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 icon-hover-effect" />
          </span>
        </div>
      </article>
    </Link>
  );
}

const ProductCard = memo(ProductCardComponent);
export default ProductCard;