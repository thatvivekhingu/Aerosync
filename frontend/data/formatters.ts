/**
 * Deterministic number formatting helper to prevent React SSR/CSR Hydration mismatch errors.
 * Ensures identical comma formatting on both Node.js server and browser client.
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || isNaN(Number(num))) return "0";
  const parts = Number(num).toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function formatCurrency(num: number | string | null | undefined): string {
  return `₹${formatNumber(num)}`;
}
