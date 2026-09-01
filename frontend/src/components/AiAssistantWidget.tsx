import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Send, X, ShoppingCart, Check } from 'lucide-react';

import { useCart } from '../context/CartContext';
import { useTranslation } from '../i18n/LocaleContext';
import { askOpenRouter, cartAiOverview } from '../lib/ai';
import { Link } from 'react-router-dom';
import { API, productImage, price, formatPrice } from '../lib/products';
import type { ProductType } from '../lib/products';
import type { CartItem } from '../context/CartContext';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
}

// Replaced starter prompts array with t() calls inside the component

const MOBILE_DOCK_KEY = 'shopflow-ai-mobile-dock';
const MESSAGES_STORAGE_KEY = 'shopflow-ai-messages';
const LAUNCHER_SIZE = 48;
const MOBILE_GAP = 16;
const MOBILE_BOTTOM_OFFSET = 88;

export function aiChatReply(message: string, items: CartItem[]) {
  const input = message.toLowerCase();
  const cart = cartAiOverview(items);

  if (input.includes('cart') || input.includes('checkout') || input.includes('delivery') || input.includes('summarize') || input.includes('summary')) {
    const summary = cart.map((item) => item.body).join(' ');
    const productTags = items.map(i => `[PRODUCT:${i.product.slug}]`).join('\n');
    return items.length > 0 ? `${summary}\n\n${productTags}` : summary;
  }
  return "";
}

const ORDINAL_MAP: Record<string, number> = {
  first: 0, '1st': 0, '1': 0,
  second: 1, '2nd': 1, '2': 1,
  third: 2, '3rd': 2, '3': 2,
  fourth: 3, '4th': 3, '4': 3,
  fifth: 4, '5th': 4, '5': 4,
};

function resolveOrdinalPick(text: string, count: number): number | null {
  if (!/(add|put|include|order|buy|cart)/i.test(text)) return null;
  const lower = text.toLowerCase();
  if (/\blast\b/.test(lower) && count > 0) return count - 1;
  for (const [word, index] of Object.entries(ORDINAL_MAP)) {
    if (new RegExp(`\\b${word}\\b`).test(lower) && index < count) return index;
  }
  return null;
}

const ADD_STOP_WORDS = new Set([
  'add', 'put', 'include', 'throw', 'my', 'cart', 'bag', 'to', 'the', 'a', 'an',
  'buy', 'bought', 'purchase', 'order', 'please', 'for', 'and', 'of', 'in', 'me',
  'want', 'need', 'get', 'i', 'it', 'one', 'that', 'this', 'product', 'item',
]);

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !ADD_STOP_WORDS.has(w));
}

function findProductInCatalog(query: string, catalog: ProductType[]): ProductType | undefined {
  const q = query.toLowerCase();

  const exact = catalog.find((p) => p.name && q.includes(p.name.toLowerCase()));
  if (exact) return exact;

  const tokens = tokenize(q);
  if (tokens.length === 0) return undefined;

  let best: ProductType | undefined;
  let bestScore = 0;
  for (const product of catalog) {
    if (!product.name) continue;
    const name = product.name.toLowerCase();
    const nameWords = new Set(name.split(/[^a-z0-9]+/).filter((w) => w.length > 1));
    const description = (product.description || '').toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (nameWords.has(token)) score += 3;
      else if (name.startsWith(token) || name.includes(` ${token}`)) score += 2;
      else if (name.includes(token)) score += 1;
      else if (description.includes(token)) score += 0.5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }
  return bestScore >= 3 ? best : undefined;
}

export default function AiAssistantWidget() {
  const { items, addToCart } = useCart();
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<ProductType[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const prevItemsRef = useRef(items.length);
  const pendingAddRef = useRef<string | null>(null);
  const [launcherPosition, setLauncherPosition] = useState({ x: 0, y: 0 });
  const dragState = useRef({
    dragging: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    moved: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = window.localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        role: 'assistant',
        text: t('ai.widget.greeting', { defaultValue: 'Ask me about products, delivery, seller stores, checkout, or your cart.' }),
      },
    ];
  });

  useEffect(() => {
    window.localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, [messages, open]);

  useEffect(() => {
    if (loading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [loading]);

  const cartHint = useMemo(() => cartAiOverview(items)[0]?.body, [items]);

  useEffect(() => {
    if (items.length > prevItemsRef.current) {
      setShowBadge(true);
      const timer = setTimeout(() => setShowBadge(false), 3000);
      prevItemsRef.current = items.length;
      return () => clearTimeout(timer);
    }
    prevItemsRef.current = items.length;
  }, [items]);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 639px)');

    function syncMobileState() {
      setIsMobile(mobileQuery.matches);
    }

    syncMobileState();
    mobileQuery.addEventListener('change', syncMobileState);

    fetch(`${API}/items/`)
      .then(res => res.json())
      .then(data => {
        const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
        setCatalog(items);
      })
      .catch(() => setCatalog([]));

    return () => mobileQuery.removeEventListener('change', syncMobileState);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const stored = window.localStorage.getItem(MOBILE_DOCK_KEY);
    if (stored) {
      try {
        const next = JSON.parse(stored) as { x: number; y: number };
        if (typeof next.x === 'number' && typeof next.y === 'number') {
          setLauncherPosition(clampLauncher(next.x, next.y));
          return;
        }
      } catch {
        // Ignore malformed storage.
      }
    }

    setLauncherPosition(getDefaultMobileDock());
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return;

    function handleResize() {
      setLauncherPosition((current) => clampLauncher(current.x, current.y));
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', text: trimmed },
    ];
    setMessages(newMessages);
    setMessage('');

    const founderIntent = /(who|about|tell).*(founder|creator|made you)|founder of|who (made|created|built|started) (this|shopflow|you)|who founded|who are you/i.test(trimmed);
    if (founderIntent) {
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          text: t('ai.widget.founderReply', { defaultValue: 'ShopFlow is built by the **team at Naralith Studio**, a development studio based in Lahore, Pakistan. Want a business or website built for you? Reach out at https://naralithstudio.com.' }) + '\n\n[IMAGE:founder]',
        },
      ]);
      return;
    }

    const confirmIntent = /^(yes|yeah|yep|yup|sure|ok|okay|k|alright|fine|go ahead|do it|add it|confirm|confirmed|correct|right|yes please|ok add|okay add)/i.test(trimmed);
    const denyIntent = /^(no|nope|nah|cancel|never ?mind|not now|stop|dont|don't|quit|skip)/i.test(trimmed);
    if (confirmIntent && pendingAddRef.current) {
      const product = allProducts.get(pendingAddRef.current);
      pendingAddRef.current = null;
      if (product) {
        addToCart(product, 1);
        setMessages(current => [
          ...current,
          {
            role: 'assistant',
            text: `${t('ai.widget.addedReply', { defaultValue: 'Done!' })} **${product.name}** ${t('ai.widget.addedToCart', { defaultValue: 'is in your cart.' })}\n\n[PRODUCT:${product.slug}]`,
          },
        ]);
        return;
      }
    }
    if (denyIntent && pendingAddRef.current) {
      pendingAddRef.current = null;
      setMessages(current => [
        ...current,
        { role: 'assistant', text: t('ai.widget.deniedReply', { defaultValue: 'No problem — nothing added.' }) },
      ]);
      return;
    }
    if (!confirmIntent && !denyIntent) {
      pendingAddRef.current = null;
    }

    const lastAssistant = messages[messages.length - 1];
    if (lastAssistant?.role === 'assistant') {
      const tagSlugs = [...lastAssistant.text.matchAll(/\[PRODUCT:([a-zA-Z0-9_-]+)\]/g)].map((match) => match[1]);
      if (tagSlugs.length > 0) {
        const pick = resolveOrdinalPick(trimmed, tagSlugs.length);
        if (pick !== null) {
          const product = allProducts.get(tagSlugs[pick]);
          if (product) {
            setMessages(current => [
              ...current,
              {
                role: 'assistant',
                text: `${t('ai.widget.confirmAdd', { defaultValue: 'Sure! Shall I add' })} **${product.name}** ${t('ai.widget.confirmAddToCart', { defaultValue: 'to your cart?' })}\n\n[ADD_TO_CART:${product.slug}]`,
              },
            ]);
            return;
          }
        }
      }
    }

    const addIntent = /(add|put|include|throw).*(cart|bag)|(cart|bag).*(add|put|include)|buy|purchase|order/i.test(trimmed);
    if (addIntent && catalog.length > 0) {
      const found = findProductInCatalog(trimmed, catalog);
      if (found) {
        setMessages(current => [
          ...current,
          {
            role: 'assistant',
            text: `${t('ai.widget.confirmAdd', { defaultValue: 'Sure! Shall I add' })} **${found.name}** ${t('ai.widget.confirmAddToCart', { defaultValue: 'to your cart?' })}\n\n[ADD_TO_CART:${found.slug}]`,
          },
        ]);
        return;
      }
    }

    const fastReply = aiChatReply(trimmed, items);
    if (fastReply) {
      setMessages(current => [
        ...current,
        { role: 'assistant', text: fastReply },
      ]);
      return;
    }

    setLoading(true);

    try {
      const replyText = await askOpenRouter(newMessages, items, locale, catalog);
      setMessages(current => [
        ...current,
        { role: 'assistant', text: replyText },
      ]);
    } catch (e) {
      console.error("AI Error:", e);
      setMessages(current => [
        ...current,
        { role: 'assistant', text: t('ai.widget.error', { defaultValue: 'Sorry, something went wrong. Please try again.' }) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(message);
  }

  function resetConversation() {
    setMessages([
      {
        role: 'assistant',
        text: t('ai.widget.greeting', { defaultValue: 'Ask me about products, delivery, seller stores, checkout, or your cart.' }),
      },
    ]);
    setMessage('');
  }

  function clampLauncher(x: number, y: number) {
    const maxX = Math.max(window.innerWidth - LAUNCHER_SIZE - MOBILE_GAP, MOBILE_GAP);
    const maxY = Math.max(window.innerHeight - LAUNCHER_SIZE - MOBILE_GAP, MOBILE_GAP);
    return {
      x: Math.min(Math.max(x, MOBILE_GAP), maxX),
      y: Math.min(Math.max(y, MOBILE_GAP), maxY),
    };
  }

  function getDefaultMobileDock() {
    return clampLauncher(window.innerWidth - LAUNCHER_SIZE - MOBILE_GAP, window.innerHeight - LAUNCHER_SIZE - MOBILE_BOTTOM_OFFSET);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isMobile || event.pointerType !== 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragState.current = {
      dragging: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isMobile || !dragState.current.dragging || dragState.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    const next = clampLauncher(event.clientX - dragState.current.offsetX, event.clientY - dragState.current.offsetY);
    dragState.current.moved = dragState.current.moved || Math.abs(next.x - launcherPosition.x) > 2 || Math.abs(next.y - launcherPosition.y) > 2;
    setLauncherPosition(next);
  }

  function endDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isMobile || dragState.current.pointerId !== event.pointerId) return;
    dragState.current.dragging = false;
    dragState.current.pointerId = -1;
    window.localStorage.setItem(MOBILE_DOCK_KEY, JSON.stringify(launcherPosition));
  }

  function handleLauncherClick() {
    if (isMobile && dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    setOpen((current) => !current);
  }

  const allProducts = useMemo(() => {
    const map = new Map<string, ProductType>();
    for (const ci of items) {
      const p = ci.product;
      if (p.slug) map.set(p.slug, p);
    }
    for (const p of catalog) {
      if (p.slug) map.set(p.slug, p);
    }
    return map;
  }, [catalog, items]);

  const starterPrompts = [
    t('ai.widget.promptFounder', { defaultValue: 'Who made you?' }),
    t('ai.widget.promptSummarize', { defaultValue: 'Summarize my cart' }),
    t('ai.widget.promptDeals', { defaultValue: 'Find best deals' }),
    t('ai.widget.promptDelivery', { defaultValue: 'Explain delivery' }),
    t('ai.widget.promptSellers', { defaultValue: 'How sellers work' })
  ];

  const renderMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\[PRODUCT:[a-zA-Z0-9_-]+\]|\[ADD_TO_CART:[a-zA-Z0-9_-]+\]|\[IMAGE:[a-z]+\])/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('[IMAGE:') && part.endsWith(']')) {
        const key = part.slice(7, -1);
        if (key === 'founder') {
          return (
            <div key={index} className="my-2 overflow-hidden rounded-2xl border border-border mx-auto max-w-[160px] bg-background p-3">
              <img
                src="/founder/naralith-logo.png"
                alt="Naralith Studio"
                className="w-full object-contain"
              />
            </div>
          );
        }
        return null;
      }
      if (part.startsWith('[ADD_TO_CART:') && part.endsWith(']')) {
        const slug = part.slice(14, -1);
        const product = allProducts.get(slug);
        if (!product) return null;

        const cartItem = items.find(ci => ci.product.slug === slug);

        return (
          <div
            key={index}
            className="my-2 flex items-center gap-3 rounded-2xl border border-border bg-background p-2"
          >
            <img
              src={productImage(product)}
              alt={product.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{product.name}</p>
              <p className="text-xs font-bold text-accent-secondary">{formatPrice(price(product))}</p>
            </div>
            <button
              type="button"
              onClick={() => addToCart(product, 1)}
              className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${cartItem
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-accent text-primary hover:opacity-90'
                }`}
              aria-label={`${t('ai.widget.addToCart', { defaultValue: 'Add to cart' })} ${product.name}`}
            >
              {cartItem ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {t('ai.widget.addedToCart', { defaultValue: 'Added' })}
                  {cartItem.quantity > 1 ? ` × ${cartItem.quantity}` : ''}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {t('ai.widget.addToCart', { defaultValue: 'Add to cart' })}
                </>
              )}
            </button>
          </div>
        );
      }
      if (part.startsWith('[PRODUCT:') && part.endsWith(']')) {
        const slug = part.slice(9, -1);
        const product = allProducts.get(slug);
        if (!product) return null;

        const cartItem = items.find(ci => ci.product.slug === slug);

        return (
          <Link
            key={index}
            to={`/product/${product.slug}`}
            className="my-2 flex items-center gap-3 rounded-2xl border border-border bg-background p-2 transition-colors hover:border-accent-secondary hover:bg-surface"
          >
            <img
              src={productImage(product)}
              alt={product.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-primary">{product.name}</p>
              <p className="text-xs font-bold text-accent-secondary">
                {formatPrice(price(product))}
                {cartItem ? ` × ${cartItem.quantity}` : ''}
              </p>
            </div>
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLauncherClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        style={
          isMobile
            ? {
              left: launcherPosition.x,
              top: launcherPosition.y,
              right: 'auto',
              bottom: 'auto',
            }
            : undefined
        }
        className={`group fixed z-[60] flex h-14 w-14 items-center justify-center transition-all active:scale-95 ${isMobile ? 'touch-none' : 'hover:scale-110 bottom-24 right-4 sm:bottom-6 sm:right-6'
          }`}
        aria-label="Open AI assistant"
      >
        <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-primary/40 bg-primary shadow-lg shadow-black/20">
          <img
            src="/kinu-mascot-transparent.png"
            alt="ShopFlow AI"
            className="h-full w-full object-cover scale-[1.35] translate-y-1 transition-transform duration-500 ease-out group-hover:scale-[1.25] group-hover:translate-y-1.5"
          />
        </div>

        {showBadge && (
          <div className="absolute -top-0.5 -right-0.5 z-30 h-4 w-4 rounded-full border-2 border-background bg-accent-secondary shadow-sm" />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close AI assistant"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-0"
            onClick={() => setOpen(false)}
          />

          <div className="anim-slide-up fixed inset-x-0 bottom-16 z-50 flex max-h-[calc(100svh-8rem)] flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl shadow-black/35 sm:inset-auto sm:bottom-24 sm:right-6 sm:left-auto sm:block sm:w-[420px] sm:rounded-3xl sm:max-h-none"
          >
            <div className="flex justify-center pt-2 sm:hidden">
              <span className="h-1.5 w-12 rounded-full bg-border" />
            </div>

            <div className="flex items-start justify-between gap-3 border-b border-border bg-background px-4 py-3 sm:px-4 sm:py-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <img src="/kinu-mascot-transparent.png" alt="ShopFlow AI" className="h-8 w-8 object-contain drop-shadow-sm" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-primary">{t('ai.widget.title', { defaultValue: 'Kinu AI' })}</p>
                  <p className="text-xs text-secondary">{t('ai.widget.subtitle', { defaultValue: 'Local commerce assistant' })}</p>
                  <p className="mt-1 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {t('ai.widget.ready', { defaultValue: 'Ready' })}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={resetConversation}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-secondary hover:bg-surface hover:text-primary"
                >
                  {t('ai.widget.newChat', { defaultValue: 'New chat' })}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-secondary hover:bg-surface hover:text-primary"
                  aria-label="Close AI assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col sm:h-[560px] sm:min-h-0 sm:max-h-[min(72vh,44rem)]">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {cartHint && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm leading-6 text-primary">
                    {cartHint}
                  </div>
                )}
                {messages.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 whitespace-pre-wrap break-words ${item.role === 'assistant'
                        ? 'mr-auto border border-border bg-background text-primary selection:bg-primary/20'
                        : 'ml-auto bg-primary text-background selection:bg-background/30 selection:text-background'
                      }`}
                  >
                    {renderMessage(item.text)}
                  </div>
                ))}
                {loading && (
                  <div className="mr-auto rounded-2xl border border-border bg-background px-4 py-3 text-primary">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-border bg-background/95 px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] backdrop-blur-sm sm:bg-background/70 sm:pb-3">
                <div className="scrollbar-hide mb-2.5 flex gap-2 overflow-x-auto pb-1">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-secondary hover:border-primary hover:text-primary"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <form onSubmit={submit} className="flex items-center gap-2">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t('ai.widget.placeholder', { defaultValue: 'Ask ShopFlow AI' })}
                    className="h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm text-primary outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-background transition-transform hover:scale-105 active:scale-95"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}