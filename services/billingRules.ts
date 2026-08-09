export interface CreditBalanceState {
  subscriptionCredits: number;         // Active subscription allowance (refreshes at the start of each cycle)
  subscriptionCreditsRollover: number; // Rolled over from last cycle (valid for 1 additional cycle only)
  promotionalCredits: number;          // Promo credits
  purchasedCredits: number;            // Consumable purchased packs (never expires)
  totalCredits: number;                // Cached total sum
}

export interface TierRules {
  allowance: number;
  maxRollover: number;
  maxBalance: number;
}

export const TIER_RULES: Record<string, TierRules> = {
  none: { allowance: 0, maxRollover: 0, maxBalance: 0 },
  weekly: { allowance: 25, maxRollover: 25, maxBalance: 50 },       // Weekly Pass
  monthly: { allowance: 100, maxRollover: 100, maxBalance: 200 },   // Monthly Pass
  yearly: { allowance: 70, maxRollover: 70, maxBalance: 140 }       // Yearly Pass (Grants 70 credits/mo distributed monthly)
};

/**
 * Deducts 1 credit from the user's balances following the strict business priorities:
 * 1. Subscription Rollover (expires first)
 * 2. Active Subscription Credits
 * 3. Promotional Credits
 * 4. Purchased Consumable Credits (never expires, used last)
 */
export const deductCredit = (balances: CreditBalanceState): CreditBalanceState => {
  const updated = { ...balances };

  if (updated.subscriptionCreditsRollover > 0) {
    updated.subscriptionCreditsRollover -= 1;
  } else if (updated.subscriptionCredits > 0) {
    updated.subscriptionCredits -= 1;
  } else if (updated.promotionalCredits > 0) {
    updated.promotionalCredits -= 1;
  } else if (updated.purchasedCredits > 0) {
    updated.purchasedCredits -= 1;
  } else {
    throw new Error("Insufficient credits available to perform style generation.");
  }

  updated.totalCredits = 
    updated.subscriptionCredits + 
    updated.subscriptionCreditsRollover + 
    updated.promotionalCredits + 
    updated.purchasedCredits;

  return updated;
};

/**
 * Handles subscription cycle refresh. 
 * - Unused regular subscription credits roll over (up to maxRollover for the tier).
 * - Previous rollover credits expire.
 * - New allowance is granted, capped at the tier's maximum balance.
 * - Top-ups (purchasedCredits) and Promo credits remain untouched and are carried forward.
 */
export const refreshMonthlyCredits = (
  balances: CreditBalanceState,
  tier: 'weekly' | 'monthly' | 'yearly' | 'none'
): CreditBalanceState => {
  const rules = TIER_RULES[tier] || TIER_RULES.none;
  const updated = { ...balances };

  // Unused standard subscription credits roll over (capped at maxRollover)
  const rolloverAmount = Math.min(updated.subscriptionCredits, rules.maxRollover);
  
  // Previous rollover credits disappear (only roll over for one additional cycle)
  updated.subscriptionCreditsRollover = rolloverAmount;
  
  // Grant new base allowance
  updated.subscriptionCredits = rules.allowance;

  // Enforce maximum subscription-credit cap (rollover + allowance <= maxBalance)
  const totalSubCredits = updated.subscriptionCredits + updated.subscriptionCreditsRollover;
  if (totalSubCredits > rules.maxBalance) {
    // Trim from regular allowance first to keep rollover count accurate
    updated.subscriptionCredits = Math.max(0, rules.maxBalance - updated.subscriptionCreditsRollover);
  }

  // Update total
  updated.totalCredits = 
    updated.subscriptionCredits + 
    updated.subscriptionCreditsRollover + 
    updated.promotionalCredits + 
    updated.purchasedCredits;

  return updated;
};

/**
 * Calculates additional proration credits to grant during an upgrade event in the same billing cycle.
 * Formula: Grant the difference between the new tier allowance and the old tier allowance.
 */
export const calculateUpgradeProration = (
  oldTier: 'weekly' | 'monthly' | 'yearly' | 'none',
  newTier: 'weekly' | 'monthly' | 'yearly' | 'none'
): number => {
  const oldRules = TIER_RULES[oldTier] || TIER_RULES.none;
  const newRules = TIER_RULES[newTier] || TIER_RULES.none;

  // Only grant positive difference
  return Math.max(0, newRules.allowance - oldRules.allowance);
};

/**
 * Generates an idempotent key for subscription renewal/grant events to prevent double charging.
 */
export const generateIdempotencyKey = (
  userId: string,
  productId: string,
  billingPeriodStart: string
): string => {
  return `${userId}_${productId}_${billingPeriodStart}`;
};
