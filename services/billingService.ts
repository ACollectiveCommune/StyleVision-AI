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
  if (!db) {
    // If Firebase is not initialized, fallback to 0 credits
    onUpdate(0);
    return () => {};
  }

  const userDocRef = doc(db, "users", uid);

  return onSnapshot(
    userDocRef,
    async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const credits = typeof data.credits === "number" ? data.credits : 5;
        onUpdate(credits);
      } else {
        // Document does not exist yet. Initialize user with 5 free credits
        try {
          await setDoc(userDocRef, { credits: 5 }, { merge: true });
          onUpdate(5);
        } catch (err) {
          console.error("[BILLING LOG] Error creating initial user credits document:", err);
          onUpdate(5);
        }
      }
    },
    (error) => {
      console.error("[BILLING LOG] Error listening to user credits:", error);
      onUpdate(0);
    }
  );
};

/**
 * Increments the user's credits balance in Firestore.
 */
export const incrementUserCredits = async (uid: string, amount: number): Promise<number> => {
  if (!db) return 5;
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, { credits: increment(amount) }, { merge: true });
    
    // Retrieve updated credit balance
    const docSnap = await getDoc(userDocRef);
    return docSnap.data()?.credits ?? 5;
  } catch (err) {
    console.error("[BILLING LOG] Error incrementing user credits balance:", err);
    return 5;
  }
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
