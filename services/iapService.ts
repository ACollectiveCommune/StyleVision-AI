import { Capacitor } from "@capacitor/core";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
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
 * - On iOS: Configures native App Store listeners and handles transaction verification (using cordova-plugin-purchase v13+).
 * - On Web: No-op (falls back to Stripe web integration).
 */
export const initializeBilling = (uid: string, onPremiumUpdate: (isPremium: boolean) => void) => {
  if (!isIOS()) {
    console.log("[IAP LOG] Running on Web. Bypassing native StoreKit initialization.");
    return;
  }

  const CdvPurchase = (window as any).CdvPurchase;
  const store = CdvPurchase?.store;
  if (!store) {
    console.error("[IAP LOG] CdvPurchase.store is not available on window. Make sure you are running on device/simulator.");
    return;
  }

  console.log("[IAP LOG] Initializing StoreKit Apple In-App Purchases (v13+ API)...");

  // 1. Register Monthly Subscription Product using v13+ registration signature
  store.register([{
    id: APPLE_PREMIUM_PRODUCT_ID,
    type: CdvPurchase.ProductType.PAID_SUBSCRIPTION,
    platform: CdvPurchase.Platform.APPLE_APPSTORE,
  }]);

  // 2. Set Up Event Listeners (approved -> verify -> verified -> finish)
  store.when()
    .approved(async (transaction: any) => {
      console.log(`[IAP LOG] Purchase approved for transaction: ${transaction.transactionId}. Triggering verification...`);
      // Start receipt verification
      transaction.verify();
    })
    .verified(async (receipt: any) => {
      console.log(`[IAP LOG] Purchase verified! Unlocking premium status for user ${uid}...`);
      
      // Update Firestore user document to unlock premium status
      if (db) {
        try {
          const userDocRef = doc(db, "users", uid);
          await setDoc(userDocRef, {
            isPremium: true,
            premiumSource: "apple_iap",
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

      // Finish transaction to prevent Apple from refunding/retrying
      receipt.finish();
    })
    .finished((transaction: any) => {
      console.log("[IAP LOG] StoreKit transaction finished successfully:", transaction.transactionId);
    });

  // Track global store error events
  store.error((error: any) => {
    console.error("[IAP LOG] StoreKit global error:", error);
  });

  // 3. Initialize connection to StoreKit
  try {
    store.initialize([CdvPurchase.Platform.APPLE_APPSTORE]);
    console.log("[IAP LOG] Store initialized successfully.");
  } catch (initErr) {
    console.error("[IAP LOG] Failed to initialize store:", initErr);
  }
};

/**
 * Initiates the premium subscription process.
 * - On iOS: Opens the native StoreKit payment sheet (using cordova-plugin-purchase v13+).
 * - On Web: Redirects to Stripe Checkout.
 */
export const purchasePremium = async (uid: string): Promise<string | null> => {
  if (isIOS()) {
    const CdvPurchase = (window as any).CdvPurchase;
    const store = CdvPurchase?.store;
    if (!store) {
      throw new Error("StoreKit plugin is not loaded on this platform.");
    }

    console.log(`[IAP LOG] Ordering product: ${APPLE_PREMIUM_PRODUCT_ID}`);
    
    // Fetch product information registered in store
    const product = store.get(APPLE_PREMIUM_PRODUCT_ID);
    if (!product) {
      throw new Error(`Product ${APPLE_PREMIUM_PRODUCT_ID} not found in StoreKit registries. Please check your App Store Connect configurations.`);
    }

    // Fetch the product offer to order (standard in v13+)
    const offer = product.getOffer();
    if (offer) {
      console.log("[IAP LOG] Found active offer. Initiating purchase order...");
      await store.order(offer);
    } else {
      console.log("[IAP LOG] No offer found. Attempting direct product purchase...");
      await store.order(product);
    }
    
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
