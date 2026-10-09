/**
 * Shared table-tier metadata (Silver / Gold / Platinum).
 * Used by the table booking page and the plans page so the
 * dining experience language stays consistent across the app.
 */

export type TableTier = "Silver" | "Gold" | "Platinum";

export interface TierInfo {
  tier: TableTier;
  tagline: string;
  /** one-time Razorpay reservation deposit charged before booking */
  depositINR: number;
  experience: string;
  services: string[];
  accent: string;
  accentSoft: string;
  accentText: string;
  icon: string;
}

export const TABLE_TIERS: Record<TableTier, TierInfo> = {
  Silver: {
    tier: "Silver",
    tagline: "Comfortable everyday dining",
    depositINR: 49,
    experience:
      "A relaxed sit-down experience at the heart of the restaurant — perfect for quick lunches and casual dinners.",
    services: [
      "Up to 2 guests",
      "Standard floor seating",
      "QR contactless menu",
      "Complimentary water",
      "Email bill receipt",
    ],
    accent: "#0ea5e9",
    accentSoft: "bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/50",
    accentText: "text-sky-700 dark:text-sky-300",
    icon: "🪑",
  },
  Gold: {
    tier: "Gold",
    tagline: "The favourite for regular diners",
    depositINR: 99,
    experience:
      "A premium dining experience with priority seating — crafted for families and friends gathering for a full meal.",
    services: [
      "Up to 4 guests",
      "Priority floor seating",
      "QR contactless menu",
      "Complimentary welcome drink",
      "Priority service queue",
      "Email + SMS bill receipt",
    ],
    accent: "#8b5cf6",
    accentSoft: "bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-900/50",
    accentText: "text-violet-700 dark:text-violet-300",
    icon: "🍽️",
  },
  Platinum: {
    tier: "Platinum",
    tagline: "Luxury dining, reserved for you",
    depositINR: 199,
    experience:
      "Our most exclusive experience — window-side premium tables with a dedicated concierge and chef's special touches.",
    services: [
      "Up to 8 guests",
      "Premium window-side table",
      "Chef's special tasting menu",
      "Complimentary desserts & drinks",
      "Dedicated concierge service",
      "Priority kitchen routing",
      "Premium printed receipt",
    ],
    accent: "#d97706",
    accentSoft: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50",
    accentText: "text-amber-700 dark:text-amber-300",
    icon: "👑",
  },
};

export const TIER_ORDER: TableTier[] = ["Silver", "Gold", "Platinum"];

/** Derive the tier of a dining table from its stored tier or seat capacity. */
export function getTableTier(table: { capacity?: number; tier?: string }): TableTier {
  const stored = String(table.tier || "").trim();
  if (stored === "Silver" || stored === "Gold" || stored === "Platinum") {
    return stored;
  }
  const capacity = Number(table.capacity || 0);
  if (capacity > 0 && capacity <= 2) return "Silver";
  if (capacity > 2 && capacity <= 4) return "Gold";
  if (capacity > 4) return "Platinum";
  return "Gold";
}

/** Check if a table's tier is covered/included under the user's active membership plan. */
export function isTableCoveredByPlan(tableTier: TableTier, planIdOrName?: string | null): boolean {
  if (!planIdOrName) return false;
  const plan = planIdOrName.trim().toLowerCase();
  if (plan === "platinum") return true;
  if (plan === "gold") return tableTier === "Gold" || tableTier === "Silver";
  if (plan === "silver") return tableTier === "Silver";
  return false;
}

/** Pretty-print plan name. */
export function formatPlanName(planIdOrName?: string | null): string {
  if (!planIdOrName) return "";
  const plan = planIdOrName.trim().toLowerCase();
  if (plan === "silver") return "Silver";
  if (plan === "gold") return "Gold";
  if (plan === "platinum") return "Platinum";
  return planIdOrName.charAt(0).toUpperCase() + planIdOrName.slice(1);
}

