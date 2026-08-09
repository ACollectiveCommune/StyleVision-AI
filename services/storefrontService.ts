import { Capacitor } from "@capacitor/core";

/**
 * Checks if the application is running in a native iOS platform environment.
 */
const isIOSPlatform = (): boolean => {
  return Capacitor.getPlatform() === "ios";
};

/**
 * Authoritatively retrieves the Apple App Store Storefront country code.
 * Uses native plugins where available, falling back to a default indicator if unknown.
 */
export const getStorefrontCountryCode = async (): Promise<string | null> => {
  if (!isIOSPlatform()) {
    return null; // Stripe is used globally on Web, no App Store storefront
  }

  try {
    const Purchases = (window as any).Purchases;
    if (Purchases && typeof Purchases.getStorefrontCountryCode === "function") {
      const country = await Purchases.getStorefrontCountryCode();
      return country ? country.toUpperCase() : null;
    }
  } catch (err) {
    console.warn("[STOREFRONT] Failed to query authoritative country code from RevenueCat:", err);
  }

  return null; // Unknown storefront
};

/**
 * Decides whether to display external purchase options based on the Apple App Store Storefront rules.
 */
export const shouldShowExternalPurchaseLink = (countryCode: string | null): boolean => {
  if (!countryCode) {
    return false; // Default to hiding links if storefront eligibility is unknown (Guideline 6)
  }

  const code = countryCode.toUpperCase();

  // App Store storefront rules:
  // - US storefront permits external links under Guideline 3.1.1 (External Purchase Link Entitlement US)
  // - Other storefronts are blocked unless explicitly permitted by local regulations/entitlements
  if (code === "USA" || code === "US") {
    return true; 
  }

  return false; // Default blocked
};

/**
 * Returns the Apple-compliant disclosure text required for the storefront.
 */
export const getExternalLinkDisclosure = (countryCode: string | null): string => {
  if (!countryCode) return "";

  const code = countryCode.toUpperCase();
  if (code === "USA" || code === "US") {
    return "This app offers external purchase options on our website. Purchases made outside the App Store will not be managed by Apple. Please see our Terms of Use.";
  }

  return "";
};
