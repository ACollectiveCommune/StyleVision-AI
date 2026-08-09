import { db } from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  runTransaction
} from "firebase/firestore";
import { 
  User360Wallet, 
  CreditTransaction, 
  ThreeSixtyPreview, 
  ThreeSixtyGenerationJob, 
  ThreeSixtyFeatureConfig 
} from "../types";

// 1. Remote Feature Flags Configuration
export const threeSixtyFeatureConfig: ThreeSixtyFeatureConfig = {
  enabled: true,
  subscriberOnly: true,
  welcomeCredits: 0,
  weeklyAllowance: 1,
  monthlyAllowance: 4,
  yearlyMonthlyAllowance: 4,
  expectedFrameCount: 5,
  maxAutomaticRetries: 3,
  allowTopUpPurchases: true,
  usePrototypeFrames: false, // Controlled by flag for sandbox prototyping
};

// 2. Subscription Allowances
export const threeSixtyAllowanceConfig = {
  weekly: 30,
  monthly: 150,
  yearlyMonthlyGrant: 2000
};

// Local storage fallback keys for sandbox/demo when Firebase is not connected or offline
const LOCAL_WALLET_KEY = "stylevision_360_wallet";
const LOCAL_LEDGER_KEY = "stylevision_360_ledger";
const LOCAL_PREVIEWS_KEY = "stylevision_360_previews";
const LOCAL_JOBS_KEY = "stylevision_360_jobs";

/**
 * Returns the default initial wallet object (authoritative balance is zero).
 */
const createDefaultWallet = (userId: string): User360Wallet => ({
  userId,
  subscriptionCredits: 0,
  purchasedCredits: 0,
  subscriptionPlan: null,
  subscriptionStatus: "expired",
  currentPeriodStart: null,
  currentPeriodEnd: null,
  updatedAt: new Date().toISOString(),
});

/**
 * Fetches the user's 360 wallet from Firestore (or LocalStorage fallback).
 */
export const getUser360Wallet = async (userId: string): Promise<User360Wallet> => {
  if (db && userId && userId !== "guest_user_local") {
    try {
      const walletRef = doc(db, "users360", userId);
      const docSnap = await getDoc(walletRef);
      if (docSnap.exists()) {
        return docSnap.data() as User360Wallet;
      }
      const initialWallet = createDefaultWallet(userId);
      await setDoc(walletRef, initialWallet);
      return initialWallet;
    } catch (e) {
      console.error("Firestore wallet fetch failed, using fallback:", e);
    }
  }
  
  // Local Fallback
  const raw = localStorage.getItem(`${LOCAL_WALLET_KEY}_${userId}`);
  if (raw) return JSON.parse(raw);
  const initial = createDefaultWallet(userId);
  localStorage.setItem(`${LOCAL_WALLET_KEY}_${userId}`, JSON.stringify(initial));
  return initial;
};

/**
 * Saves a wallet to Firestore or LocalStorage.
 */
const saveWallet = async (wallet: User360Wallet): Promise<void> => {
  wallet.updatedAt = new Date().toISOString();
  if (db && wallet.userId && wallet.userId !== "guest_user_local") {
    try {
      const walletRef = doc(db, "users360", wallet.userId);
      await setDoc(walletRef, wallet);
      return;
    } catch (e) {
      console.error("Firestore wallet save failed:", e);
    }
  }
  localStorage.setItem(`${LOCAL_WALLET_KEY}_${wallet.userId}`, JSON.stringify(wallet));
};

/**
 * Logs a transaction to the Ledger in Firestore or LocalStorage.
 */
export const logTransaction = async (transaction: Omit<CreditTransaction, "id" | "createdAt">): Promise<CreditTransaction> => {
  const newTx: CreditTransaction = {
    ...transaction,
    id: "tx_" + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  };

  if (db && transaction.userId && transaction.userId !== "guest_user_local") {
    try {
      const ledgerRef = collection(db, "users360", transaction.userId, "transactions");
      await addDoc(ledgerRef, newTx);
      return newTx;
    } catch (e) {
      console.error("Firestore ledger log failed:", e);
    }
  }

  // Local Fallback
  const ledgerRaw = localStorage.getItem(`${LOCAL_LEDGER_KEY}_${transaction.userId}`) || "[]";
  const ledger = JSON.parse(ledgerRaw);
  ledger.push(newTx);
  localStorage.setItem(`${LOCAL_LEDGER_KEY}_${transaction.userId}`, JSON.stringify(ledger));
  return newTx;
};

/**
 * Validates a transaction ID for idempotency (prevents replay/duplicate grants).
 */
export const isTransactionProcessed = async (userId: string, storeTransactionId: string): Promise<boolean> => {
  if (db && userId && userId !== "guest_user_local") {
    try {
      const ledgerRef = collection(db, "users360", userId, "transactions");
      const q = query(ledgerRef, where("storeTransactionId", "==", storeTransactionId));
      const querySnap = await getDocs(q);
      return !querySnap.empty;
    } catch (e) {
      console.error("Firestore transaction query failed:", e);
    }
  }

  // Local Fallback
  const ledgerRaw = localStorage.getItem(`${LOCAL_LEDGER_KEY}_${userId}`) || "[]";
  const ledger: CreditTransaction[] = JSON.parse(ledgerRaw);
  return ledger.some(tx => tx.storeTransactionId === storeTransactionId);
};

/**
 * Grants subscription credits after a verified StoreKit subscription purchase or renewal.
 * Enforces strict Idempotency checks.
 */
export const grantSubscriptionAllowance = async (
  userId: string,
  plan: "weekly" | "monthly" | "yearly",
  storeTransactionId: string
): Promise<User360Wallet> => {
  const isProcessed = await isTransactionProcessed(userId, storeTransactionId);
  if (isProcessed) {
    console.warn(`[Idempotency Warning] Store Transaction ${storeTransactionId} already processed.`);
    return getUser360Wallet(userId);
  }

  const wallet = await getUser360Wallet(userId);
  
  // Calculate allowance
  let grantAmount = threeSixtyAllowanceConfig.monthly;
  if (plan === "weekly") grantAmount = threeSixtyAllowanceConfig.weekly;
  else if (plan === "yearly") grantAmount = threeSixtyAllowanceConfig.yearlyMonthlyGrant; // Monthly allowance issued monthly

  // Update wallet
  wallet.subscriptionCredits += grantAmount;
  wallet.subscriptionPlan = plan;
  wallet.subscriptionStatus = "active";
  wallet.currentPeriodStart = new Date().toISOString();
  
  const end = new Date();
  if (plan === "weekly") end.setDate(end.getDate() + 7);
  else if (plan === "monthly" || plan === "yearly") end.setMonth(end.getMonth() + 1); // Issued monthly
  wallet.currentPeriodEnd = end.toISOString();

  await saveWallet(wallet);

  // Log in ledger
  await logTransaction({
    userId,
    amount: grantAmount,
    balanceType: "subscription",
    transactionType: "subscription_grant",
    storeTransactionId
  });

  return wallet;
};

/**
 * Grants top-up credits after a verified StoreKit consumable transaction.
 * Only allowed for active subscribers.
 */
export const purchaseTopUpCredits = async (
  userId: string,
  packType: "starter" | "pro" | "value" | "360_preview_1_subscriber" | "360_preview_3_subscriber" | "360_preview_10_subscriber",
  storeTransactionId: string
): Promise<User360Wallet> => {
  const wallet = await getUser360Wallet(userId);
  if (wallet.subscriptionStatus !== "active") {
    throw new Error("Only active subscribers are authorized to purchase top-up credits.");
  }

  const isProcessed = await isTransactionProcessed(userId, storeTransactionId);
  if (isProcessed) {
    console.warn(`[Idempotency Warning] Store Transaction ${storeTransactionId} already processed.`);
    return wallet;
  }

  let creditsToGrant = 20;
  if (packType === "pro" || packType === "360_preview_3_subscriber") creditsToGrant = 60;
  else if (packType === "value" || packType === "360_preview_10_subscriber") creditsToGrant = 150;

  wallet.purchasedCredits += creditsToGrant;
  await saveWallet(wallet);

  await logTransaction({
    userId,
    amount: creditsToGrant,
    balanceType: "purchased",
    transactionType: "top_up_purchase",
    storeTransactionId
  });

  return wallet;
};

/**
 * Handles Reserve & Finalize system.
 * Step 1: Reserve credit. Expiring subscription credits are used first!
 */
export const reserveCredit = async (userId: string, jobId: string): Promise<string> => {
  const wallet = await getUser360Wallet(userId);
  let balanceType: "subscription" | "purchased" = "subscription";
  
  if (wallet.subscriptionCredits > 0) {
    wallet.subscriptionCredits -= 1;
    balanceType = "subscription";
  } else if (wallet.purchasedCredits > 0) {
    wallet.purchasedCredits -= 1;
    balanceType = "purchased";
  } else {
    throw new Error("Insufficient 360° Preview credits.");
  }

  await saveWallet(wallet);

  const tx = await logTransaction({
    userId,
    amount: -1,
    balanceType,
    transactionType: "reservation",
    generationJobId: jobId
  });

  return tx.id;
};

/**
 * Step 2a: Finalize charge upon successful complete generation.
 */
export const finalizeCharge = async (userId: string, jobId: string, reservedTxId: string): Promise<void> => {
  await logTransaction({
    userId,
    amount: -1,
    balanceType: "subscription", // placeholder log match
    transactionType: "generation_charge",
    generationJobId: jobId,
    storeTransactionId: reservedTxId
  });
};

/**
 * Step 2b: Refund credit if generation fails (Cancel reservation).
 */
export const refundCredit = async (userId: string, jobId: string, reservedTxId: string, balanceType: "subscription" | "purchased"): Promise<User360Wallet> => {
  const wallet = await getUser360Wallet(userId);
  if (balanceType === "subscription") {
    wallet.subscriptionCredits += 1;
  } else {
    wallet.purchasedCredits += 1;
  }
  await saveWallet(wallet);

  await logTransaction({
    userId,
    amount: 1,
    balanceType,
    transactionType: "refund",
    generationJobId: jobId,
    storeTransactionId: reservedTxId
  });

  return wallet;
};

/**
 * Saves or updates a Generation Job.
 */
export const saveGenerationJob = async (job: ThreeSixtyGenerationJob): Promise<void> => {
  job.updatedAt = new Date().toISOString();
  if (db && job.userId && job.userId !== "guest_user_local") {
    try {
      const jobRef = doc(db, "generationJobs360", job.id);
      await setDoc(jobRef, job);
      return;
    } catch (e) {
      console.error("Firestore job save failed:", e);
    }
  }
  
  // Local Fallback
  const raw = localStorage.getItem(`${LOCAL_JOBS_KEY}_${job.userId}`) || "[]";
  const jobs: ThreeSixtyGenerationJob[] = JSON.parse(raw);
  const idx = jobs.findIndex(j => j.id === job.id);
  if (idx > -1) jobs[idx] = job;
  else jobs.push(job);
  localStorage.setItem(`${LOCAL_JOBS_KEY}_${job.userId}`, JSON.stringify(jobs));
};

/**
 * Fetches a Generation Job by ID.
 */
export const getGenerationJob = async (userId: string, jobId: string): Promise<ThreeSixtyGenerationJob | null> => {
  if (db && userId && userId !== "guest_user_local") {
    try {
      const jobRef = doc(db, "generationJobs360", jobId);
      const snap = await getDoc(jobRef);
      if (snap.exists()) return snap.data() as ThreeSixtyGenerationJob;
    } catch (e) {
      console.error("Firestore job fetch failed:", e);
    }
  }
  
  // Local Fallback
  const raw = localStorage.getItem(`${LOCAL_JOBS_KEY}_${userId}`) || "[]";
  const jobs: ThreeSixtyGenerationJob[] = JSON.parse(raw);
  return jobs.find(j => j.id === jobId) || null;
};

/**
 * Saves a 360 Preview record.
 */
export const save360Preview = async (preview: ThreeSixtyPreview): Promise<void> => {
  if (db && preview.userId && preview.userId !== "guest_user_local") {
    try {
      const previewRef = doc(db, "previews360", preview.id);
      await setDoc(previewRef, preview);
      return;
    } catch (e) {
      console.error("Firestore preview save failed:", e);
    }
  }

  // Local Fallback
  const raw = localStorage.getItem(`${LOCAL_PREVIEWS_KEY}_${preview.userId}`) || "[]";
  const previews: ThreeSixtyPreview[] = JSON.parse(raw);
  const idx = previews.findIndex(p => p.id === preview.id);
  if (idx > -1) previews[idx] = preview;
  else previews.push(preview);
  localStorage.setItem(`${LOCAL_PREVIEWS_KEY}_${preview.userId}`, JSON.stringify(previews));
};

/**
 * Fetches a 360 Preview by ID.
 */
export const get360Preview = async (userId: string, previewId: string): Promise<ThreeSixtyPreview | null> => {
  if (db && userId && userId !== "guest_user_local") {
    try {
      const previewRef = doc(db, "previews360", previewId);
      const snap = await getDoc(previewRef);
      if (snap.exists()) return snap.data() as ThreeSixtyPreview;
    } catch (e) {
      console.error("Firestore preview fetch failed:", e);
    }
  }

  // Local Fallback
  const raw = localStorage.getItem(`${LOCAL_PREVIEWS_KEY}_${userId}`) || "[]";
  const previews: ThreeSixtyPreview[] = JSON.parse(raw);
  return previews.find(p => p.id === previewId) || null;
};

/**
 * Fetches all completed 360 Previews for a user.
 */
export const get360PreviewsHistory = async (userId: string): Promise<ThreeSixtyPreview[]> => {
  if (db && userId && userId !== "guest_user_local") {
    try {
      const previewsRef = collection(db, "previews360");
      const q = query(previewsRef, where("userId", "==", userId), where("status", "==", "complete"));
      const snap = await getDocs(q);
      const list: ThreeSixtyPreview[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as ThreeSixtyPreview);
      });
      return list;
    } catch (e) {
      console.error("Firestore previews history fetch failed:", e);
    }
  }

  // Local Fallback
  const raw = localStorage.getItem(`${LOCAL_PREVIEWS_KEY}_${userId}`) || "[]";
  const previews: ThreeSixtyPreview[] = JSON.parse(raw);
  return previews.filter(p => p.status === "complete");
};
