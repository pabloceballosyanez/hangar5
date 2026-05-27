// Price formatting utilities
// All prices stored in DB are NET (without IVA).
// Customer-facing displays show IVA-included (Mexico standard).

const IVA_RATE = 0.16;

/** Convert cents (net) to pesos with IVA, formatted as $X.XX */
export function formatPriceIVA(cents: number): string {
  const pesos = (cents * (1 + IVA_RATE)) / 100;
  return `$${pesos.toFixed(2)}`;
}

/** Format cents (net) as pesos with IVA for locale display */
export function formatPriceIVALocale(cents: number): string {
  return (cents * (1 + IVA_RATE) / 100).toLocaleString("es-MX");
}

/** Convert cents to pesos with IVA (numeric, no formatting) */
export function toPesosIVA(cents: number): number {
  return (cents * (1 + IVA_RATE)) / 100;
}

/** Format cents as pesos (NET, no IVA) — for internal/admin use */
export function formatPriceNet(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
