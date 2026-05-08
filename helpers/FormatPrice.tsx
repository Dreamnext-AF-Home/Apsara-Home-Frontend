const formatPrice = (n: number): string => {
  // Guard against NaN / Infinity that can crash rendering.
  const safeNumber = Number.isFinite(n) ? n : 0;

  return `\u20B1${safeNumber.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default formatPrice;

