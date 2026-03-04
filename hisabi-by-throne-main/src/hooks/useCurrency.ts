/**
 * useCurrency.ts
 * ──────────────
 * Returns the store currency from settings.
 * Falls back to "د.ج" until settings load.
 *
 * Usage:
 *   const { currency, fmt } = useCurrency();
 *   fmt(1500)  →  "1,500 د.ج"
 */
import { useQuery } from "@tanstack/react-query";
import { settingsDB } from "@/lib/appDB";

export function useCurrency() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsDB.get(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const currency = settings?.currency ?? "د.ج";

  /** Format a number with the store currency */
  const fmt = (amount: number) =>
    `${amount.toLocaleString("ar-DZ")} ${currency}`;

  /** Format without toLocaleString (for inputs) */
  const fmtRaw = (amount: number) => `${amount} ${currency}`;

  return { currency, fmt, fmtRaw };
}
