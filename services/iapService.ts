import { Capacitor } from "@capacitor/core";
import { incrementUserCredits, createCheckoutSession, createPortalSession } from "./billingService";

// iOS Apple App Store Consumable Credit Product IDs
export const APPLE_STARTER_PRODUCT_ID = "com.stylevision.credits.starter"; // 25 credits
export const APPLE_PRO_PRODUCT_ID = "com.stylevision.credits.pro";         // 75 credits
export const APPLE_VALUE_PRODUCT_ID = "com.stylevision.credits.value";     // 150 credits

/**
 * Checks if the app is running inside a native iOS shell.
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === "ios";
};

/**
 * Initializes the purchase store system on app startup.
 * - On iOS: Configures native App Store listeners and handles transaction verification (using cordova-plugin-purchase v13+).
 * - On Web: No-op.
 */
export const initializeBilling = (uid: string, onCreditsUpdate: (credits: number) => void) => {
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

  console.log("[IAP LOG] Initializing StoreKit Apple In-App Purchases (Consumables)...");

  // 1. Register Consumable Products
  store.register([
    {
      id: APPLE_STARTER_PRODUCT_ID,
      type: CdvPurchase.ProductType.CONSUMABLE,
      platform: CdvPurchase.Platform.APPLE_APPSTORE,
    },
    {
      id: APPLE_PRO_PRODUCT_ID,
      type: CdvPurchase.ProductType.CONSUMABLE,
      platform: CdvPurchase.Platform.APPLE_APPSTORE,
    },
    {
      id: APPLE_VALUE_PRODUCT_ID,
      type: CdvPurchase.ProductType.CONSUMABLE,
      platform: CdvPurchase.Platform.APPLE_APPSTORE,
    }
  ]);

  // 2. Set Up Event Listeners (approved -> verify -> verified -> finish)
  store.when()
    .approved(async (transaction: any) => {
      console.log(`[IAP LOG] Purchase approved for transaction: ${transaction.transactionId}. Triggering verification...`);
      transaction.verify();
    })
    .verified(async (receipt: any) => {
      console.log(`[IAP LOG] Purchase verified! Fetching transaction details...`);
      
      // Calculate how many credits to grant based on the purchased product ID
      let creditsToGrant = 0;
      let transactionProductId = "";

      // Inspect transaction products
      if (receipt.transactions && receipt.transactions.length > 0) {
        transactionProductId = receipt.transactions[0].productId;
      } else if (receipt.productId) {
        transactionProductId = receipt.productId;
      }

      console.log(`[IAP LOG] Purchased Product ID: ${transactionProductId}`);

      if (transactionProductId === APPLE_STARTER_PRODUCT_ID) {
        creditsToGrant = 25;
      } else if (transactionProductId === APPLE_PRO_PRODUCT_ID) {
        creditsToGrant = 75;
      } else if (transactionProductId === APPLE_VALUE_PRODUCT_ID) {
        creditsToGrant = 150;
      } else {
        // Fallback guess: look at the global state or default to Pro
        console.warn("[IAP LOG] Unknown product ID in transaction. Defaulting to Pro Pack (75 credits).");
        creditsToGrant = 75;
      }

      console.log(`[IAP LOG] Granting ${creditsToGrant} credits to user ${uid}...`);
      
      try {
        const newCredits = await incrementUserCredits(uid, creditsToGrant);
        console.log(`[IAP LOG] Credits updated in Firestore. New balance: ${newCredits}`);
        onCreditsUpdate(newCredits);
      } catch (err) {
        console.error("[IAP LOG] Failed to increment credits in database:", err);
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
 * Initiates the premium consumable credit package purchase process.
 * - On iOS: Opens the native StoreKit payment sheet.
 * - On Web: Redirects to Stripe Checkout.
 */
export const purchasePremium = async (
  uid: string,
  packType: "starter" | "pro" | "value" = "pro"
): Promise<string | null> => {
  if (isIOS()) {
    const CdvPurchase = (window as any).CdvPurchase;
    const store = CdvPurchase?.store;
    if (!store) {
      throw new Error("StoreKit plugin is not loaded on this platform.");
    }

    let productId = APPLE_PRO_PRODUCT_ID;
    if (packType === "starter") productId = APPLE_STARTER_PRODUCT_ID;
    else if (packType === "value") productId = APPLE_VALUE_PRODUCT_ID;

    console.log(`[IAP LOG] Ordering credit product: ${productId} (${packType})`);
    
    // Fetch product information registered in store
    const product = store.get(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found in StoreKit registries. Please check your App Store Connect configurations.`);
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
    // Web fallback to Stripe Checkout for the specific package
    return await createCheckoutSession(uid, packType);
  }
};

/**
 * Launches the customer portal to view transactions/card details.
 * - On iOS: Redirects to Apple Subscriptions portal.
 * - On Web: Redirects to Stripe Customer Portal.
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
