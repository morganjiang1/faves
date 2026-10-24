// Spot rewards (plan.md): people earn when their spots and days help others, from verified
// use rather than likes. For the hackathon the wallet runs on clearly labeled test data.
import type { Wallet, WalletEntry } from "@/state/store";

export const RATES = {
  save: 0.01, // someone saves your spot
  didDay: 0.25, // someone does your day (check-ins at the stops) and gives it a thumbs up
  trending: 2.0, // a spot you posted first becomes a trending hidden gem
  bookingShare: 0.1, // share of the booking commission from your post
  cashOutMin: 5,
} as const;

const DAY = 86_400_000;

export function seedWallet(name: string, now = Date.now()): Wallet {
  const e = (i: number, kind: WalletEntry["kind"], amount: number, text: string, daysAgo: number): WalletEntry => ({
    id: `test-${i}`, kind, amount, text, at: new Date(now - daysAgo * DAY - i * 3_600_000).toISOString(),
  });
  const entries: WalletEntry[] = [
    e(1, "did-day", RATES.didDay * 6, `6 people did your "Sunset and tacos" day`, 0),
    e(2, "save", RATES.save * 41, "41 people saved your spots this week", 1),
    e(3, "booking", 0.85, "A table booked from your post (your share of the commission)", 2),
    e(4, "did-day", RATES.didDay * 9, `9 people did your "Rainy day crawl" day`, 4),
    e(5, "trending", RATES.trending, "A spot you posted first is a trending hidden gem", 6),
    e(6, "save", RATES.save * 63, "63 people saved your spots", 9),
    e(7, "did-day", RATES.didDay * 4, `4 people did your "Sunset and tacos" day`, 13),
    e(8, "booking", 0.6, "Tickets bought from your day (your share of the commission)", 18),
  ];
  void name;
  return { entries, payouts: [] };
}

export function balance(w: Wallet): number {
  const earned = w.entries.reduce((s, x) => s + (x.kind === "payout" ? 0 : x.amount), 0);
  const paid = w.payouts.reduce((s, p) => s + p.amount, 0);
  return Math.round((earned - paid) * 100) / 100;
}

export function monthTotal(w: Wallet, now = Date.now()): number {
  return Math.round(w.entries.filter((x) => x.kind !== "payout" && now - new Date(x.at).getTime() < 30 * DAY).reduce((s, x) => s + x.amount, 0) * 100) / 100;
}

export const money = (n: number) => `$${n.toFixed(2)}`;
