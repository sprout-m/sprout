const HBAR_USD_RATE = Number(import.meta.env.VITE_HBAR_USD_RATE || 0.0956);

export function formatUsdEstimateFromHbar(amount) {
  const value = Number(amount || 0) * HBAR_USD_RATE;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatHbarFromAmount(amount) {
  const hbar = Number(amount || 0);
  return `${hbar.toLocaleString()} HBAR`;
}

export function convertUsdToHbar(amount) {
  const usd = Number(amount || 0);
  if (!HBAR_USD_RATE) return 0;
  return usd / HBAR_USD_RATE;
}

export function formatUsdAmount(amount) {
  const usd = Number(amount || 0);
  return `$${usd.toLocaleString(undefined, {
    minimumFractionDigits: usd < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
