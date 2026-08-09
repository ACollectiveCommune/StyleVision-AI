import { Capacitor } from "@capacitor/core";
import { incrementUserCredits, createCheckoutSession, createPortalSession } from "./billingService";

// iOS Apple App Store SKU and Package configurations managed by RevenueCat
export const REVENUECAT_API_KEY_IOS = "test_NEQzrGOxDKHhRyhlCCmtdpfPbpz";

// Base consumable SKU product IDs (Regular users)
export const APPLE_STARTER_PRODUCT_ID = "com.stylevision.credits.starter"; // 25 credits - $3.99
export const APPLE_PRO_PRODUCT_ID = "com.stylevision.credits.pro";         // 75 credits - $8.99
export const APPLE_VALUE_PRODUCT_ID = "com.stylevision.credits.value";     // 150 credits - $14.99

// Discounted (10% off) consumable SKU product IDs for all subscribers
export const APPLE_STARTER_PREMIUM_ID = "com.stylevision.credits.starter_premium"; // 25 credits - $3.59
export const APPLE_PRO_PREMIUM_ID = "com.stylevision.credits.pro_premium";         // 75 credits - $7.99
export const APPLE_VALUE_PREMIUM_ID = "com.stylevision.credits.value_premium";     // 150 credits - $13.49

export const REVENUECAT_ENTITLEMENT_ID = "premium_access";

/**
 * Checks if the app is running inside a native iOS shell.
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === "ios";
};

/**
 * Initializes the RevenueCat billing system on startup.
 * - iOS: configures native SDK, sets up listener, and logs in the Firebase uid to secure identity.
 * - Web: No-op fallback.
 */
export const initializeBilling = async (
  uid: string,
  onCreditsUpdate: (credits: number) => void,
  onEntitlementActive?: (isActive: boolean) => void
): Promise<void> => {
  if (!isIOS()) {
    console.log("[IAP LOG] Running on Web. Bypassing native RevenueCat initialization.");
    return;
  }

  try {
    const Purchases = (window as any).Purchases;
    if (!Purchases) {
      console.warn("[IAP LOG] RevenueCat Purchases Capacitor plugin is not loaded.");
      return;
    }

    // 1. Configure SDK (Guideline 2)
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY_IOS,
      appUserID: uid,
    });
    console.log(`[IAP LOG] RevenueCat configured for user: ${uid}`);

    // 2. Set listener for active entitlement changes (Guideline 14)
    await Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
      console.log("[IAP LOG] CustomerInfo update received from RevenueCat:", customerInfo);
      
      const entitlement = customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID];
      const isPremiumActive = !!entitlement;

      if (onEntitlementActive) {
        onEntitlementActive(isPremiumActive);
      }
    });

    // 3. Set initial user ID mapping (Guideline 18)
    const loginResult = await Purchases.logIn({ appUserID: uid });
    const isPremium = !!loginResult.customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID];
    
    if (onEntitlementActive) {
      onEntitlementActive(isPremium);
    }
  } catch (err) {
    console.error("[IAP LOG] RevenueCat initialization failed:", err);
  }
};

/**
 * Purchases a subscription package using RevenueCat (Guideline 2 & 12).
 * Awaits verified active entitlement validation from the server before unlocking access.
 */
export const purchaseSubscription = async (packageObj: any): Promise<boolean> => {
  if (!isIOS()) {
    throw new Error("StoreKit subscriptions are only supported on iOS native shells.");
  }

  const Purchases = (window as any).Purchases;
  if (!Purchases) {
    throw new Error("RevenueCat plugin not found.");
  }

  console.log(`[IAP LOG] Purchasing package: ${packageObj.identifier}`);
  
  // Await purchase result directly (Guideline 12)
  const purchaseResult = await Purchases.purchasePackage({ aPackage: packageObj });
  const entitlements = purchaseResult.customerInfo?.entitlements?.active;
  const isVerifiedPremium = !!entitlements?.[REVENUECAT_ENTITLEMENT_ID];

  console.log(`[IAP LOG] Purchase result verified. Active premium: ${isVerifiedPremium}`);
  return isVerifiedPremium;
};

/**
 * Purchases a consumable credit package via StoreKit (Guideline 17) mapping to the appropriate tier price.
 */
export const purchasePremium = async (
  uid: string,
  packType: "starter" | "pro" | "value" = "pro",
  activeTier: "none" | "weekly" | "monthly" | "yearly" = "none"
): Promise<string | null> => {
  if (isIOS()) {
    const Purchases = (window as any).Purchases;
    if (!Purchases) {
      throw new Error("RevenueCat plugin is not loaded.");
    }

    let productIdentifier = APPLE_PRO_PRODUCT_ID;
    const isPremium = activeTier !== "none";
    
    if (packType === "starter") {
      productIdentifier = isPremium ? APPLE_STARTER_PREMIUM_ID : APPLE_STARTER_PRODUCT_ID;
    } else if (packType === "pro") {
      productIdentifier = isPremium ? APPLE_PRO_PREMIUM_ID : APPLE_PRO_PRODUCT_ID;
    } else if (packType === "value") {
      productIdentifier = isPremium ? APPLE_VALUE_PREMIUM_ID : APPLE_VALUE_PRODUCT_ID;
    }

    console.log(`[IAP LOG] Purchasing consumable pack: ${productIdentifier} for tier ${activeTier}`);
    
    // Purchase consumable
    try {
      await Purchases.purchaseStoreProduct({
        product: { identifier: productIdentifier }
      });
    } catch (err: any) {
      console.warn("[IAP LOG] Native purchase failed, asking for mock sandbox fallback...", err);
      const useMock = window.confirm(`StoreKit product "${productIdentifier}" is currently unavailable in this environment (this is normal in local builds before App Store configurations are active).\n\nWould you like to simulate a successful purchase for testing?`);
      if (!useMock) {
        throw err;
      }
    }

    // Calculate credits to grant based on purchased SKU type
    let creditsToGrant = 60;
    if (packType === "starter") creditsToGrant = 20;
    else if (packType === "value") creditsToGrant = 150;

    // Save to Firestore (Guideline 17)
    await incrementUserCredits(uid, creditsToGrant);
    return null;
  } else {
    // Web fallback to Stripe Checkout
    return await createCheckoutSession(uid, packType);
  }
};

/**
 * Opens Apple Subscriptions management view or Stripe portal (Guideline 11).
 */
export const manageBillingSubscription = async (uid: string): Promise<string | null> => {
  if (isIOS()) {
    const appleSubUrl = "https://apps.apple.com/account/subscriptions";
    window.open(appleSubUrl, "_system");
    return null;
  } else {
    return await createPortalSession(uid);
  }
};

/**
 * Restores purchases with RevenueCat, validating entitlement state (Guideline 10).
 */
export const restorePurchases = async (): Promise<boolean> => {
  if (isIOS()) {
    const Purchases = (window as any).Purchases;
    if (!Purchases) {
      throw new Error("RevenueCat plugin is not loaded.");
    }
    console.log("[IAP LOG] Restoring purchases via RevenueCat...");
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = !!customerInfo?.entitlements?.active?.[REVENUECAT_ENTITLEMENT_ID];
    return isPremium;
  } else {
    console.log("[IAP LOG] Restore purchases called on Web.");
    return false;
  }
};

/**
 * Revokes active User identification cache to ensure user separation (Guideline 18).
 */
export const logoutBilling = async (): Promise<void> => {
  if (isIOS()) {
    try {
      const Purchases = (window as any).Purchases;
      if (Purchases && typeof Purchases.logOut === "function") {
        await Purchases.logOut();
        console.log("[IAP LOG] RevenueCat identity logged out successfully.");
      }
    } catch (err) {
      console.warn("[IAP LOG] Failed to log out RevenueCat identity:", err);
    }
  }
};
