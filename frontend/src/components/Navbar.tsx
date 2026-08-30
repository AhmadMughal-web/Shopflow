import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { API_BASE } from '../lib/api';
import { useTranslation } from '../i18n/LocaleContext';

function SearchBar({ mobile = false, onSearch }: { mobile?: boolean; onSearch?: () => void }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (search.trim().length > 1) {
        fetch(`${API_BASE}/products/suggestions/?q=${encodeURIComponent(search.trim())}`)
          .then((res) => res.json())
          .then((data: { suggestions: string[] }) => {
            setSuggestions(data.suggestions || []);
            setFocusedIndex(-1);
            setIsOpen(true);
          })
          .catch(() => { setSuggestions([]); setFocusedIndex(-1); });
      } else {
        setSuggestions([]);
        setFocusedIndex(-1);
        setIsOpen(false);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
        if (mobile) setMobileExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobile]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        if (mobile) setMobileExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobile]);

  function submitSearch(event: FormEvent<HTMLFormElement> | string) {
    if (typeof event !== 'string') event.preventDefault();
    const query = typeof event === 'string' ? event : search;
    if (!query.trim()) return;

    navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
    setFocusedIndex(-1);
    if (mobile) setMobileExpanded(false);
    if (onSearch) onSearch();
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      setSearch(suggestions[focusedIndex]);
      submitSearch(suggestions[focusedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const renderSuggestions = () => {
    if (!isOpen || suggestions.length === 0) return null;
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <ul className="max-h-[70vh] overflow-y-auto py-1">
          {suggestions.map((suggestion, index) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => {
                  setSearch(suggestion);
                  submitSearch(suggestion);
                }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors text-sm font-medium text-primary ${index === focusedIndex ? 'bg-accent/15' : 'hover:bg-accent/10'
                  }`}
              >
                <Search className="h-4 w-4 text-secondary shrink-0" />
                <span className="truncate capitalize">{suggestion}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (mobile) {
    return (
      <div ref={containerRef} className="flex w-full justify-end md:hidden">
        {!mobileExpanded ? (
          <button
            type="button"
            onClick={() => setMobileExpanded(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-secondary hover:text-primary btn-press-effect"
            aria-label={t('nav.searchProducts', { defaultValue: 'Search products' })}
          >
            <Search className="h-4.5 w-4.5" />
          </button>
        ) : (
          <div className="relative w-full">
            <form onSubmit={submitSearch}>
              <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 focus-within:border-accent">
                <Search className="h-4 w-4 shrink-0 text-secondary" />
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setIsOpen(true);
                  }}
                  onKeyDown={handleInputKeyDown}
                  className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none"
                  placeholder={t('nav.searchProducts', { defaultValue: 'Search products' })}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSuggestions([]);
                    setIsOpen(false);
                    setFocusedIndex(-1);
                    setMobileExpanded(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:text-primary btn-press-effect"
                  aria-label={t('nav.closeMenu', { defaultValue: 'Close search' })}
                >
                  <X className="h-4 w-4 icon-hover-effect" />
                </button>
              </div>
            </form>
            {renderSuggestions()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative hidden min-w-0 flex-1 max-w-xl md:block">
      <form onSubmit={submitSearch}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            ref={inputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleInputKeyDown}
            className="h-10 w-full rounded-full border border-border bg-background pl-11 pr-12 text-sm outline-none transition-colors focus:border-accent"
            placeholder={t('nav.searchProducts', { defaultValue: 'Search products' })}
          />
          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
            <kbd className="hidden rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-secondary sm:block">
              /
            </kbd>
          </div>
        </div>
      </form>
      {renderSuggestions()}
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalCount } = useCart();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="sticky top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-3">
      <nav className="mx-auto max-w-7xl rounded-2xl border border-border bg-surface/90 shadow-sm backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-3 sm:h-16 sm:gap-4 sm:px-5">
          <Link
            to="/"
            className="flex shrink-0 items-center h-full py-2"
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.location.reload();
              }
            }}
          >
            <img
              src={theme === 'dark' ? '/logo_navbar-dark.png' : '/logo_navbar-light.png'}
              alt="ShopFlow Logo"
              className="h-full w-auto object-contain"
            />
          </Link>

          {/* Desktop search bar (hidden on mobile) */}
          <SearchBar />

          {/* Desktop nav: grouped action pill */}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Link to="/products" className="rounded-full px-3.5 py-2 text-sm font-semibold text-secondary hover:bg-muted hover:text-primary transition-colors">
              {t('nav.products', { defaultValue: 'Products' })}
            </Link>
            <Link to="/ai" className="inline-flex items-center gap-1.5 rounded-full bg-accent-secondary/10 px-3.5 py-2 text-sm font-semibold text-accent-secondary hover:bg-accent-secondary/15 transition-colors">
              <Sparkles className="h-3.5 w-3.5" />
              {t('nav.ai', { defaultValue: 'AI' })}
            </Link>

            <div className="mx-1 h-6 w-px bg-border" />

            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
              <ThemeToggle />
              <Link to={user ? '/dashboard' : '/register'} className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-surface hover:text-primary transition-colors">
                <User className="h-4 w-4" />
              </Link>
              <Link to="/cart" className="relative flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-surface hover:text-primary transition-colors">
                <ShoppingBag className="h-4 w-4" />
                {totalCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-primary">
                    {totalCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile: inline search bar + hamburger only */}
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 md:hidden">
            <div className="min-w-0 flex-1">
              <SearchBar mobile />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-secondary hover:text-primary btn-press-effect"
              aria-label={menuOpen ? t('nav.closeMenu', { defaultValue: 'Close menu' }) : t('nav.openMenu', { defaultValue: 'Open menu' })}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile hamburger drawer (Off-canvas) */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={closeMenu}
          />

          <div className="absolute inset-y-0 right-0 w-3/4 max-w-sm border-l border-border bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="text-lg font-black tracking-tight text-primary">Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-10 w-10 items-center justify-center rounded-full text-secondary hover:bg-muted hover:text-primary transition-colors"
                aria-label={t('nav.closeMenu', { defaultValue: 'Close menu' })}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                <Link onClick={closeMenu} to="/" className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold text-primary hover:bg-muted transition-colors">
                  {t('nav.home', { defaultValue: 'Home' })}
                </Link>
                <Link onClick={closeMenu} to="/products" className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold text-primary hover:bg-muted transition-colors">
                  {t('nav.products', { defaultValue: 'Products' })}
                </Link>
                <Link onClick={closeMenu} to="/ai" className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold text-primary hover:bg-muted transition-colors">
                  <Sparkles className="h-5 w-5 text-accent-secondary" />
                  {t('nav.ai', { defaultValue: 'AI Assistant' })}
                </Link>
                <Link onClick={closeMenu} to="/cart" className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold text-primary hover:bg-muted transition-colors">
                  <span className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5" />
                    {t('nav.cart', { defaultValue: 'Cart' })}
                  </span>
                  {totalCount > 0 && (
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-extrabold text-primary">
                      {totalCount}
                    </span>
                  )}
                </Link>
              </div>

              <div className="my-4 h-px bg-border" />

              <div className="space-y-1">
                <Link onClick={closeMenu} to={user ? '/dashboard' : '/login'} className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold text-primary hover:bg-muted transition-colors">
                  <User className="h-5 w-5" />
                  {user ? t('nav.dashboard', { defaultValue: 'Dashboard' }) : t('nav.login', { defaultValue: 'Login' })}
                </Link>
                {!user && (
                  <Link onClick={closeMenu} to="/register" className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold text-primary hover:bg-muted transition-colors">
                    {t('nav.register', { defaultValue: 'Register' })}
                  </Link>
                )}
              </div>
            </div>

            <div className="border-t border-border bg-muted/30 p-4">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-secondary">
                {t('nav.settings', { defaultValue: 'Preferences' })}
              </span>
              <div className="flex items-center gap-3">
                <ThemeToggle />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}