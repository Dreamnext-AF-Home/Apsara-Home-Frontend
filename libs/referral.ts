export const REFERRAL_STORAGE_KEY = 'afhome-referral-code';

export const normalizeReferralCode = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const fromQuery = (url.searchParams.get('ref') ?? url.searchParams.get('referred_by') ?? '').trim();
    if (fromQuery) return fromQuery;

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1].trim();
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

export const getStoredReferralCode = () => {
  if (typeof window === 'undefined') return '';
  return normalizeReferralCode(window.localStorage.getItem(REFERRAL_STORAGE_KEY) ?? '');
};

export const setStoredReferralCode = (code: string) => {
  if (typeof window === 'undefined') return;
  const normalized = normalizeReferralCode(code);

  if (!normalized) {
    window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
};

export const clearStoredReferralCode = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
};
