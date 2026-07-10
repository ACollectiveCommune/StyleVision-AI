import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  limit,
  doc,
  increment,
  getDoc,
  setDoc
} from "firebase/firestore";

// Stripe Price ID Constant - Change this to match your Stripe Dashboard Product Price ID
export const STRIPE_PREMIUM_PRICE_ID = "price_1StyleVisionPremiumMonth";

/**
 * Listens to active subscriptions for a given Firebase User ID.
 * The Stripe extension writes active subscriptions to `customers/{uid}/subscriptions`.
 */
export const subscribeToSubscription = (
  uid: string,
  onUpdate: (isPremium: boolean) => void
): (() => void) => {
  if (!db) {
    // If Firebase is not initialized, fallback to mock free account
    onUpdate(false);
    return () => {};
  }

  const subsCollectionRef = collection(db, "customers", uid, "subscriptions");
  
  // Query only active or trialing subscriptions
  const q = query(
    subsCollectionRef,
    where("status", "in", ["active", "trialing"]),
    limit(1)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const isPremium = !snapshot.empty;
      console.log(`[BILLING LOG] User subscription state changed. isPremium: ${isPremium}`);
      onUpdate(isPremium);
    },
    (error) => {
      console.error("[BILLING LOG] Error listening to subscriptions:", error);
      onUpdate(false);
    }
  );
};

/**
 * Creates a Stripe Checkout Session document in Firestore.
 * The Stripe Firebase Extension detects this, contacts Stripe,
 * and writes a redirect `url` back to the document.
 */
export const createCheckoutSession = async (uid: string): Promise<string> => {
  if (!db) {
    throw new Error("Firebase database not initialized");
  }

  const checkoutSessionsRef = collection(db, "customers", uid, "checkout_sessions");
  
  // Define redirect URLs (redirect back to the current site/app)
  const redirectUrl = window.location.origin;

  const sessionDocRef = await addDoc(checkoutSessionsRef, {
    price: STRIPE_PREMIUM_PRICE_ID,
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
 * Fetches or initializes the free generation count for anonymous/free users.
 * Document sits at `users/{uid}`.
 */
export const getGenerationCount = async (uid: string): Promise<number> => {
  if (!db) return 0;
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data().generationCount || 0;
    } else {
      // Initialize count
      await setDoc(userDocRef, { generationCount: 0 }, { merge: true });
      return 0;
    }
  } catch (err) {
    console.error("Error getting generation count:", err);
    return 0;
  }
};

/**
 * Increments the user's free generation count in Firestore.
 */
export const incrementGenerationCount = async (uid: string): Promise<number> => {
  if (!db) return 0;
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, { generationCount: increment(1) }, { merge: true });
    
    // Retrieve updated count
    const docSnap = await getDoc(userDocRef);
    return docSnap.data()?.generationCount || 0;
  } catch (err) {
    console.error("Error incrementing generation count:", err);
    return 0;
  }
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
