import { Capacitor } from "@capacitor/core";
import { db } from "./firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { createCheckoutSession, createPortalSession } from "./billingService";

// iOS Apple App Store Subscription Product ID
export const APPLE_PREMIUM_PRODUCT_ID = "com.stylevision.premium.monthly";

/**
 * Checks if the app is running inside a native iOS shell.
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === "ios";
};

/**
 * Initializes the purchase store system on app startup.
 * - On iOS: Configures native App Store listeners and handles transaction verification.
 * - On Web: No-op (falls back to Stripe web integration).
 */
export const initializeBilling = (uid: string, onPremiumUpdate: (isPremium: boolean) => void) => {
  if (!isIOS()) {
    console.log("[IAP LOG] Running on Web. Bypassing native StoreKit initialization.");
    return;
  }

  const store = (window as any).store;
  if (!store) {
    console.error("[IAP LOG] cordova-plugin-purchase is not available on window. Make sure you are running on device/simulator.");
    return;
  }

  console.log("[IAP LOG] Initializing StoreKit Apple In-App Purchases...");

  // Register Monthly Subscription Product
  store.register({
    id: APPLE_PREMIUM_PRODUCT_ID,
    type: store.PAID_SUBSCRIPTION,
  });

  // Track approved transactions (successfully purchased, needs validation/unlock)
  store.when(APPLE_PREMIUM_PRODUCT_ID)
    .approved(async (transaction: any) => {
      console.log(`[IAP LOG] Subscription approved! Unlocking premium status for user ${uid}...`);
      
      // Update Firestore user document to unlock premium status
      if (db) {
        try {
          const userDocRef = doc(db, "users", uid);
          await setDoc(userDocRef, {
            isPremium: true,
            premiumSource: "apple_iap",
            lastTransactionId: transaction.id,
            premiumUnlockedAt: new Date().toISOString()
          }, { merge: true });
          
          console.log("[IAP LOG] Firestore updated with premium status.");
          onPremiumUpdate(true);
        } catch (dbErr) {
          console.error("[IAP LOG] Failed to update Firestore with premium status:", dbErr);
        }
      } else {
        // Mock fallback if database is offline
        onPremiumUpdate(true);
      }

      // Finish transaction to prevent Apple from retrying/refunding the purchase
      transaction.finish();
    });

  // Track transaction error states
  store.when(APPLE_PREMIUM_PRODUCT_ID)
    .error((error: any) => {
      console.error("[IAP LOG] StoreKit transaction error:", error);
    });

  // Refresh StoreKit products and fetch pricing information
  store.refresh();
};

/**
 * Initiates the premium subscription process.
 * - On iOS: Opens the native StoreKit payment sheet.
 * - On Web: Redirects to Stripe Checkout.
 */
export const purchasePremium = async (uid: string): Promise<string | null> => {
  if (isIOS()) {
    const store = (window as any).store;
    if (!store) {
      throw new Error("StoreKit plugin is not loaded on this platform.");
    }

    console.log(`[IAP LOG] Ordering product: ${APPLE_PREMIUM_PRODUCT_ID}`);
    
    // Order the product. StoreKit will prompt Apple ID verification.
    store.order(APPLE_PREMIUM_PRODUCT_ID);
    
    // Return null since navigation/checkout handles asynchronously natively
    return null;
  } else {
    // Web fallback to Stripe Checkout
    return await createCheckoutSession(uid);
  }
};

/**
 * Launches the customer subscription management portal.
 * - On iOS: Redirects to Apple Subscriptions portal.
 * - On Web: Redirects to Stripe Customer Portal.
 */
export const manageBillingSubscription = async (uid: string): Promise<string | null> => {
  if (isIOS()) {
    // Standard link to manage subscriptions inside the App Store Settings
    const appleSubUrl = "https://apps.apple.com/account/subscriptions";
    window.open(appleSubUrl, "_system");
    return null;
  } else {
    // Web fallback to Stripe Billing Portal
    return await createPortalSession(uid);
  }
};
