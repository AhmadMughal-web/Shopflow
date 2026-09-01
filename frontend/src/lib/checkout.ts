import { getCurrentLocale } from '../i18n/localeStore';

export interface DeliveryMethodType {
  id: 'standard' | 'overnight';
  label: string;
  description: string;
  eta: string;
  fee: number;
}

export interface LahoreSuggestion {
  label: string;
  area: string;
  city: string;
  aliases?: string[];
}

// Nepali locale is disabled (English-only app for now), but the Record type
// is kept as-is so localeStore's Locale type doesn't need touching yet.
// 'np' simply mirrors 'en' and is unreachable from the UI.
const deliveryMethodsByLocale: Record<'en' | 'np', DeliveryMethodType[]> = {
  en: [
    {
      id: 'standard',
      label: 'Standard delivery',
      description: 'Best for non-urgent orders inside Lahore.',
      eta: '1-2 days',
      fee: 150,
    },
    {
      id: 'overnight',
      label: 'Overnight delivery',
      description: 'Faster delivery for Lahore addresses.',
      eta: 'Next day',
      fee: 350,
    },
  ],
  np: [
    {
      id: 'standard',
      label: 'Standard delivery',
      description: 'Best for non-urgent orders inside Lahore.',
      eta: '1-2 days',
      fee: 150,
    },
    {
      id: 'overnight',
      label: 'Overnight delivery',
      description: 'Faster delivery for Lahore addresses.',
      eta: 'Next day',
      fee: 350,
    },
  ],
};

export function getDeliveryMethods(locale = getCurrentLocale()) {
  return deliveryMethodsByLocale[locale] || deliveryMethodsByLocale.en;
}

export const promoCodes = {
  aura10: 10,
  balensarkar12: 12,
} as const;

const lahoreSuggestions: LahoreSuggestion[] = [
  { label: 'Mall Road', area: 'Mall Road', city: 'Lahore' },
  { label: 'Anarkali', area: 'Anarkali', city: 'Lahore' },
  { label: 'Ichhra', area: 'Ichhra', city: 'Lahore' },
  { label: 'Mozang', area: 'Mozang', city: 'Lahore', aliases: ['Mozang Chungi'] },
  { label: 'Data Darbar', area: 'Data Darbar', city: 'Lahore' },
  { label: 'Qartaba Chowk', area: 'Qartaba Chowk', city: 'Lahore' },
  { label: 'Garden Town', area: 'Garden Town', city: 'Lahore' },
  { label: 'Shadman', area: 'Shadman', city: 'Lahore' },
  { label: 'Muslim Town', area: 'Muslim Town', city: 'Lahore' },
  { label: 'Nisbat Road', area: 'Nisbat Road', city: 'Lahore' },
  { label: 'Lower Mall', area: 'Lower Mall', city: 'Lahore' },
  { label: 'Empress Road', area: 'Empress Road', city: 'Lahore' },
  { label: 'Gulberg', area: 'Gulberg', city: 'Lahore', aliases: ['Gulberg III', 'Gulberg 3'] },
  { label: 'Liberty Market', area: 'Liberty Market', city: 'Lahore', aliases: ['Liberty'] },
  { label: 'Model Town', area: 'Model Town', city: 'Lahore' },
  { label: 'Faisal Town', area: 'Faisal Town', city: 'Lahore' },
  { label: 'Township', area: 'Township', city: 'Lahore' },
  { label: 'Samanabad', area: 'Samanabad', city: 'Lahore' },
  { label: 'Green Town', area: 'Green Town', city: 'Lahore' },
  { label: 'Wapda Town', area: 'Wapda Town', city: 'Lahore', aliases: ['Wapda Town Phase 1'] },
  { label: 'Iqbal Town', area: 'Iqbal Town', city: 'Lahore' },
  { label: 'Allama Iqbal Town', area: 'Allama Iqbal Town', city: 'Lahore' },
  { label: 'Cavalry Ground', area: 'Cavalry Ground', city: 'Lahore' },
  { label: 'Gulshan-e-Ravi', area: 'Gulshan-e-Ravi', city: 'Lahore' },
  { label: 'Ferozepur Road', area: 'Ferozepur Road', city: 'Lahore' },
  { label: 'Chauburji', area: 'Chauburji', city: 'Lahore' },
  { label: 'Johar Town', area: 'Johar Town', city: 'Lahore' },
  { label: 'DHA Phase 1', area: 'DHA Phase 1', city: 'Lahore', aliases: ['DHA 1'] },
  { label: 'DHA Phase 2', area: 'DHA Phase 2', city: 'Lahore', aliases: ['DHA 2'] },
  { label: 'DHA Phase 3', area: 'DHA Phase 3', city: 'Lahore', aliases: ['DHA 3'] },
  { label: 'Askari', area: 'Askari', city: 'Lahore', aliases: ['Askari 10', 'Askari 11'] },
  { label: 'Nishtar Colony', area: 'Nishtar Colony', city: 'Lahore' },
  { label: 'Kot Lakhpat', area: 'Kot Lakhpat', city: 'Lahore' },
  { label: 'Thokar Niaz Baig', area: 'Thokar Niaz Baig', city: 'Lahore', aliases: ['Thokar'] },
  { label: 'Walton', area: 'Walton', city: 'Lahore' },
  { label: 'Harbanspura', area: 'Harbanspura', city: 'Lahore' },
  { label: 'DHA Phase 5', area: 'DHA Phase 5', city: 'Lahore', aliases: ['DHA 5'] },
  { label: 'DHA Phase 6', area: 'DHA Phase 6', city: 'Lahore', aliases: ['DHA 6'] },
  { label: 'DHA Phase 7', area: 'DHA Phase 7', city: 'Lahore', aliases: ['DHA 7'] },
  { label: 'DHA Phase 8', area: 'DHA Phase 8', city: 'Lahore', aliases: ['DHA 8'] },
  { label: 'Bahria Town', area: 'Bahria Town', city: 'Lahore' },
  { label: 'Valencia Town', area: 'Valencia Town', city: 'Lahore', aliases: ['Valencia'] },
  { label: 'Sabzazar', area: 'Sabzazar', city: 'Lahore' },
  { label: 'Raiwind Road', area: 'Raiwind Road', city: 'Lahore' },
  { label: 'Barki Road', area: 'Barki Road', city: 'Lahore' },
  { label: 'Shahdara', area: 'Shahdara', city: 'Lahore' },
  { label: 'Baghbanpura', area: 'Baghbanpura', city: 'Lahore' },
  { label: 'Manga Mandi', area: 'Manga Mandi', city: 'Lahore' },
  { label: 'Ferozewala', area: 'Ferozewala', city: 'Lahore' },
];

const legacyLahoreSuggestions: LahoreSuggestion[] = [
  { label: 'Gulberg', area: 'Gulberg', city: 'Lahore' },
  { label: 'Model Town', area: 'Model Town', city: 'Lahore' },
  { label: 'Johar Town', area: 'Johar Town', city: 'Lahore' },
  { label: 'DHA Phase 1', area: 'DHA Phase 1', city: 'Lahore' },
  { label: 'Township', area: 'Township', city: 'Lahore' },
  { label: 'Faisal Town', area: 'Faisal Town', city: 'Lahore' },
  { label: 'Garden Town', area: 'Garden Town', city: 'Lahore' },
  { label: 'Mall Road', area: 'Mall Road', city: 'Lahore' },
  { label: 'Anarkali', area: 'Anarkali', city: 'Lahore' },
  { label: 'Iqbal Town', area: 'Iqbal Town', city: 'Lahore' },
  { label: 'Samanabad', area: 'Samanabad', city: 'Lahore' },
  { label: 'Wapda Town', area: 'Wapda Town', city: 'Lahore' },
  { label: 'Bahria Town', area: 'Bahria Town', city: 'Lahore' },
  { label: 'Shadman', area: 'Shadman', city: 'Lahore' },
  { label: 'Cavalry Ground', area: 'Cavalry Ground', city: 'Lahore' },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getKathmanduSuggestions(query: string) {
  const normalizedQuery = normalize(query.trim());
  if (!normalizedQuery) return [];

  return [...lahoreSuggestions, ...legacyLahoreSuggestions]
    .filter((item) => {
      const haystack = `${item.label} ${item.area} ${item.city} ${(item.aliases || []).join(' ')}`;
      const normalizedHaystack = normalize(haystack);
      return normalizedHaystack.includes(normalizedQuery) || normalizedQuery.includes(normalizedHaystack);
    })
    .filter((item, index, items) => items.findIndex((other) => other.label === item.label && other.city === item.city) === index)
    .slice(0, 10);
}

export function resolvePromoCode(code: string) {
  const normalized = code.trim().toLowerCase();
  const discountPercent = promoCodes[normalized as keyof typeof promoCodes] || 0;

  return {
    code: normalized,
    discountPercent,
    valid: discountPercent > 0,
  };
}