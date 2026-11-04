import { Settings } from '../modules/settings/model.js';

export const BASE_CURRENCY = 'AED';
export const SUPPORTED_CURRENCIES = ['AED', 'OMR'];
export const DEFAULT_OMR_PER_AED = 0.1046;

const DECIMALS = { AED: 2, OMR: 3 };
const CACHE_TTL_MS = 30 * 1000;
let cache = { rate: DEFAULT_OMR_PER_AED, at: 0 };

export function normalizeCurrency(value) {
  return String(value || '').trim().toUpperCase() === 'OMR' ? 'OMR' : 'AED';
}

export function normalizeRate(value, fallback = DEFAULT_OMR_PER_AED) {
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : fallback;
}

export function setOmrRateCache(value) {
  cache = { rate: normalizeRate(value), at: Date.now() };
}

export async function getOmrPerAed() {
  if (Date.now() - cache.at < CACHE_TTL_MS) return cache.rate;
  try {
    const row = await Settings.findOne({ key: 'platform' }).select('omrPerAed').lean();
    cache = { rate: normalizeRate(row && row.omrPerAed), at: Date.now() };
  } catch {
    cache = { rate: cache.rate, at: Date.now() };
  }
  return cache.rate;
}

export function convertFromAed(amount, currency, rate) {
  const value = Number(amount) || 0;
  if (normalizeCurrency(currency) === 'OMR') return value * normalizeRate(rate);
  return value;
}

export function formatAmount(amount, currency, rate) {
  const code = normalizeCurrency(currency);
  const converted = convertFromAed(amount, code, rate);
  const decimals = DECIMALS[code] || 2;
  const abs = Math.abs(converted).toLocaleString('en-AE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
  return `${converted < 0 ? '-' : ''}${code} ${abs}`;
}

export async function formatUserMoney(amount, user) {
  const rate = await getOmrPerAed();
  return formatAmount(amount, user && user.currency, rate);
}
