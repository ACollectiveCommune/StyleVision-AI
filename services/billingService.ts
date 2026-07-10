import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc,
  increment,
  getDoc,
  setDoc
} from "firebase/firestore";

// Stripe Price IDs for Consumable Credit Packages
export const STRIPE_STARTER_PRICE_ID = "price_1StyleVisionCreditsStarter"; // 25 credits
export const STRIPE_PRO_PRICE_ID = "price_1StyleVisionCreditsPro";         // 75 credits
export const STRIPE_VALUE_PRICE_ID = "price_1StyleVisionCreditsValue";     // 150 credits

/**
 * Listens to active credit balance for a given Firebase User ID.
 * Returns a realtime listener unsubscribe function.
 */
export const subscribeToCredits = (
  uid: string,
  onUpdate: (credits: number) => void
): (() => void) => {
  // Retrieve from localStorage cache first to avoid async flash
  const cachedCreditsStr = localStorage.getItem(`credits_${uid}`);
  const cachedCredits = cachedCreditsStr ? parseInt(cachedCreditsStr, 10) : 5;
  onUpdate(cachedCredits);

  if (!db) {
    return () => {};
  }

  const userDocRef = doc(db, "users", uid);

  return onSnapshot(
    userDocRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const credits = typeof data.credits === "number" ? data.credits : 5;
        localStorage.setItem(`credits_${uid}`, credits.toString());
        onUpdate(credits);
      } else {
        // Document does not exist yet. Initialize user with 5 free credits
        try {
          await setDoc(userDocRef, { credits: 5 }, { merge: true });
          localStorage.setItem(`credits_${uid}`, "5");
          onUpdate(5);
        } catch (err) {
          console.warn("[BILLING LOG] Error creating initial user credits document, using local fallback:", err);
          onUpdate(5);
        }
      }
    },
    (error) => {
      console.warn("[BILLING LOG] Firestore credits listener blocked, using cached balance:", error);
      onUpdate(cachedCredits);
    }
  );
};

/**
 * Increments the user's credits balance in Firestore.
 */
export const incrementUserCredits = async (
  uid: string, 
  amount: number, 
  currentBalance?: number
): Promise<number> => {
  // 1. Update local storage cache immediately
  const cachedCreditsStr = localStorage.getItem(`credits_${uid}`);
  
  let currentCredits = 0;
  if (cachedCreditsStr !== null) {
    currentCredits = parseInt(cachedCreditsStr, 10);
  } else if (currentBalance !== undefined) {
    currentCredits = currentBalance;
  } else {
    currentCredits = 0; // Default to 0 instead of 5 for increment requests if no cache or state is present
  }

  const nextCredits = Math.max(0, currentCredits + amount);
  localStorage.setItem(`credits_${uid}`, nextCredits.toString());

  if (!db) return nextCredits;

  // Run database update in the background without blocking the UI flow
  const userDocRef = doc(db, "users", uid);
  setDoc(userDocRef, { credits: increment(amount) }, { merge: true })
    .catch((err) => {
      console.warn("[BILLING LOG] Firestore credits write blocked (likely security rules):", err);
    });

  return nextCredits;
};

/**
 * Decrements the user's credits balance by 1.
 */
export const consumeCredit = async (uid: string): Promise<number> => {
  return await incrementUserCredits(uid, -1);
};

/**
 * Creates a Stripe Checkout Session document in Firestore for consumable credit packages.
 * The Stripe Firebase Extension detects this, contacts Stripe,
 * and writes a redirect `url` back to the document.
 */
export const createCheckoutSession = async (
  uid: string,
  packType: "starter" | "pro" | "value" = "pro"
): Promise<string> => {
  if (!db) {
    throw new Error("Firebase database not initialized");
  }

  const checkoutSessionsRef = collection(db, "customers", uid, "checkout_sessions");
  
  // Define redirect URLs (redirect back to the current site/app)
  const redirectUrl = window.location.origin;

  let priceId = STRIPE_PRO_PRICE_ID;
  if (packType === "starter") priceId = STRIPE_STARTER_PRICE_ID;
  else if (packType === "value") priceId = STRIPE_VALUE_PRICE_ID;

  const sessionDocRef = await addDoc(checkoutSessionsRef, {
    price: priceId,
    success_url: `${redirectUrl}/?checkout=success`,
    cancel_url: `${redirectUrl}/?checkout=cancelled`,
  });

  // Listen to document changes until the Stripe Extension writes the checkout URL
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      const data = docSnap.data();
      if (data) {
        if (data.url) {
          unsubscribe();
          resolve(data.url);
        } else if (data.error) {
          unsubscribe();
          reject(new Error(data.error.message || "Failed to create checkout session"));
        }
      }
    }, (err) => {
      unsubscribe();
      reject(err);
    });

    // Timeout after 15 seconds if Stripe extension doesn't write back
    setTimeout(() => {
      unsubscribe();
      reject(new Error("Stripe checkout session creation timed out"));
    }, 15000);
  });
};

/**
 * Creates a Stripe Customer Portal Session in Firestore.
 * The Stripe extension detects this and writes a redirect `url` back.
 */
export const createPortalSession = async (uid: string): Promise<string> => {
  if (!db) {
    throw new Error("Firebase database not initialized");
  }

  const portalSessionsRef = collection(db, "customers", uid, "portal_sessions");
  const returnUrl = window.location.origin;

  const sessionDocRef = await addDoc(portalSessionsRef, {
    returnUrl: returnUrl,
  });

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      const data = docSnap.data();
      if (data) {
        if (data.url) {
          unsubscribe();
          resolve(data.url);
        } else if (data.error) {
          unsubscribe();
          reject(new Error(data.error.message || "Failed to create portal session"));
        }
      }
    }, (err) => {
      unsubscribe();
      reject(err);
    });

    setTimeout(() => {
      unsubscribe();
      reject(new Error("Stripe portal session creation timed out"));
    }, 15000);
  });
};
