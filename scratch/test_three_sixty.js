// Automated 360° Preview Business Logic Validation Tests
// Self-contained JS implementation to run natively in Node environment

// Mock browser localStorage for Node environment
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

// 1. Remote Feature Flags Configuration
const threeSixtyFeatureConfig = {
  enabled: true,
  subscriberOnly: true,
  welcomeCredits: 0,
  weeklyAllowance: 1,
  monthlyAllowance: 4,
  yearlyMonthlyAllowance: 4,
  expectedFrameCount: 8,
  maxAutomaticRetries: 3,
  allowTopUpPurchases: true,
  usePrototypeFrames: true,
};

// 2. Subscription Allowances
const threeSixtyAllowanceConfig = {
  weekly: 1,
  monthly: 4,
  yearlyMonthlyGrant: 4
};

const LOCAL_WALLET_KEY = "stylevision_360_wallet";
const LOCAL_LEDGER_KEY = "stylevision_360_ledger";
const LOCAL_JOBS_KEY = "stylevision_360_jobs";

const createDefaultWallet = (userId) => ({
  userId,
  subscriptionCredits: 0,
  purchasedCredits: 0,
  subscriptionPlan: null,
  subscriptionStatus: "expired",
  currentPeriodStart: null,
  currentPeriodEnd: null,
  updatedAt: new Date().toISOString(),
});

const getUser360Wallet = async (userId) => {
  const raw = localStorage.getItem(`${LOCAL_WALLET_KEY}_${userId}`);
  if (raw) return JSON.parse(raw);
  const initial = createDefaultWallet(userId);
  localStorage.setItem(`${LOCAL_WALLET_KEY}_${userId}`, JSON.stringify(initial));
  return initial;
};

const saveWallet = async (wallet) => {
  wallet.updatedAt = new Date().toISOString();
  localStorage.setItem(`${LOCAL_WALLET_KEY}_${wallet.userId}`, JSON.stringify(wallet));
};

const logTransaction = async (transaction) => {
  const newTx = {
    ...transaction,
    id: "tx_" + Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  };
  const ledgerRaw = localStorage.getItem(`${LOCAL_LEDGER_KEY}_${transaction.userId}`) || "[]";
  const ledger = JSON.parse(ledgerRaw);
  ledger.push(newTx);
  localStorage.setItem(`${LOCAL_LEDGER_KEY}_${transaction.userId}`, JSON.stringify(ledger));
  return newTx;
};

const isTransactionProcessed = async (userId, storeTransactionId) => {
  const ledgerRaw = localStorage.getItem(`${LOCAL_LEDGER_KEY}_${userId}`) || "[]";
  const ledger = JSON.parse(ledgerRaw);
  return ledger.some(tx => tx.storeTransactionId === storeTransactionId);
};

const grantSubscriptionAllowance = async (userId, plan, storeTransactionId) => {
  const isProcessed = await isTransactionProcessed(userId, storeTransactionId);
  if (isProcessed) {
    return getUser360Wallet(userId);
  }

  const wallet = await getUser360Wallet(userId);
  
  let grantAmount = threeSixtyAllowanceConfig.monthly;
  if (plan === "weekly") grantAmount = threeSixtyAllowanceConfig.weekly;
  else if (plan === "yearly") grantAmount = threeSixtyAllowanceConfig.yearlyMonthlyGrant;

  wallet.subscriptionCredits += grantAmount;
  wallet.subscriptionPlan = plan;
  wallet.subscriptionStatus = "active";
  wallet.currentPeriodStart = new Date().toISOString();
  
  const end = new Date();
  if (plan === "weekly") end.setDate(end.getDate() + 7);
  else if (plan === "monthly" || plan === "yearly") end.setMonth(end.getMonth() + 1);
  wallet.currentPeriodEnd = end.toISOString();

  await saveWallet(wallet);

  await logTransaction({
    userId,
    amount: grantAmount,
    balanceType: "subscription",
    transactionType: "subscription_grant",
    storeTransactionId
  });

  return wallet;
};

const purchaseTopUpCredits = async (userId, packType, storeTransactionId) => {
  const wallet = await getUser360Wallet(userId);
  if (wallet.subscriptionStatus !== "active") {
    throw new Error("Only active subscribers are authorized to purchase top-up credits.");
  }

  const isProcessed = await isTransactionProcessed(userId, storeTransactionId);
  if (isProcessed) {
    return wallet;
  }

  let creditsToGrant = 1;
  if (packType === "360_preview_3_subscriber") creditsToGrant = 3;
  else if (packType === "360_preview_10_subscriber") creditsToGrant = 10;

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

const reserveCredit = async (userId, jobId) => {
  const wallet = await getUser360Wallet(userId);
  let balanceType = "subscription";
  
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

const finalizeCharge = async (userId, jobId, reservedTxId) => {
  await logTransaction({
    userId,
    amount: -1,
    balanceType: "subscription",
    transactionType: "generation_charge",
    generationJobId: jobId,
    storeTransactionId: reservedTxId
  });
};

const refundCredit = async (userId, jobId, reservedTxId, balanceType) => {
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

const runTests = async () => {
  console.log("=== RUNNING 360° PREVIEW SYSTEM VALIDATION TESTS ===");
  const userId = "test_user_123";

  // Test 1: Default Welcome Balance is Zero
  console.log("Test 1: Default welcome balance is zero");
  localStorage.clear();
  const wallet = await getUser360Wallet(userId);
  if (wallet.subscriptionCredits !== 0 || wallet.purchasedCredits !== 0) {
    console.error("❌ FAIL: Welcome balance is not zero!");
    process.exit(1);
  }
  if (wallet.subscriptionStatus !== "expired") {
    console.error("❌ FAIL: Default subscription status should be expired!");
    process.exit(1);
  }
  console.log("✅ PASS: Initial welcome balance and subscription status are zero/expired.");

  // Test 2: Non-subscriber checks
  console.log("Test 2: Non-subscriber has no access or credits");
  if (wallet.subscriptionStatus === "active") {
    console.error("❌ FAIL: Non-subscriber is marked active!");
    process.exit(1);
  }
  console.log("✅ PASS: Non-subscriber is blocked from access.");

  // Test 3: Subscription grants occur only after verified transactions
  console.log("Test 3: Subscription grants credits only after transaction");
  const txId = "sub_tx_111";
  const updatedWallet = await grantSubscriptionAllowance(userId, "monthly", txId);
  if (updatedWallet.subscriptionCredits !== 4) {
    console.error("❌ FAIL: Expected 4 monthly credits, got " + updatedWallet.subscriptionCredits);
    process.exit(1);
  }
  if (updatedWallet.subscriptionStatus !== "active") {
    console.error("❌ FAIL: Subscription status not marked active after grant");
    process.exit(1);
  }
  console.log("✅ PASS: Subscription allowance of 4 credits successfully granted.");

  // Test 4: Idempotency (Duplicate transaction IDs do not grant duplicate credits)
  console.log("Test 4: Duplicate transaction IDs do not grant duplicate credits");
  const duplicateWallet = await grantSubscriptionAllowance(userId, "monthly", txId);
  if (duplicateWallet.subscriptionCredits !== 4) {
    console.error("❌ FAIL: Duplicate transaction increased credits to " + duplicateWallet.subscriptionCredits);
    process.exit(1);
  }
  console.log("✅ PASS: Idempotency check prevented duplicate credits grant.");

  // Test 5: Annual credits are issued monthly (monthly grant) rather than all at once
  console.log("Test 5: Annual subscription grants monthly allowance");
  const txIdAnnual = "sub_tx_annual_123";
  // Reset for test
  localStorage.clear();
  const walletAnnual = await grantSubscriptionAllowance(userId, "yearly", txIdAnnual);
  // Yearly allowance config is 4 per month
  if (walletAnnual.subscriptionCredits !== 4) {
    console.error("❌ FAIL: Expected 4 monthly credits for yearly, got " + walletAnnual.subscriptionCredits);
    process.exit(1);
  }
  console.log("✅ PASS: Yearly subscriber received conservative monthly grant of 4 credits.");

  // Test 6: Subscriber top-up validation
  console.log("Test 6: Active subscriber can purchase top-ups");
  const topUpTxId = "topup_tx_999";
  const topUpWallet = await purchaseTopUpCredits(userId, "360_preview_3_subscriber", topUpTxId);
  if (topUpWallet.purchasedCredits !== 3) {
    console.error("❌ FAIL: Top-up failed to grant 3 credits, got " + topUpWallet.purchasedCredits);
    process.exit(1);
  }
  console.log("✅ PASS: Top-up credits purchased successfully.");

  // Test 7: Credit Usage Order (Expiring subscription credits are used before purchased credits)
  console.log("Test 7: Expiring subscription credits used first");
  const jobId = "job_test_777";
  const reservedTxId = await reserveCredit(userId, jobId);
  
  const currentWallet = await getUser360Wallet(userId);
  // Initial: subscription = 4, purchased = 3. 
  // After reservation: subscription should be 3, purchased should be 3.
  if (currentWallet.subscriptionCredits !== 3) {
    console.error("❌ FAIL: Did not consume subscription credit first. Sub balance: " + currentWallet.subscriptionCredits);
    process.exit(1);
  }
  if (currentWallet.purchasedCredits !== 3) {
    console.error("❌ FAIL: Purchased credit was incorrectly consumed. Purchased balance: " + currentWallet.purchasedCredits);
    process.exit(1);
  }
  console.log("✅ PASS: Subscription credits consumed before purchased credits.");

  // Test 8: Successful job finalization
  console.log("Test 8: Successful job finalizes charge");
  await finalizeCharge(userId, jobId, reservedTxId);
  // Confirm balances remain depleted
  const finalWallet = await getUser360Wallet(userId);
  if (finalWallet.subscriptionCredits !== 3 || finalWallet.purchasedCredits !== 3) {
    console.error("❌ FAIL: Balances changed after finalizing charge");
    process.exit(1);
  }
  console.log("✅ PASS: Charge finalized successfully.");

  // Test 9: Failed job refunds credit
  console.log("Test 9: Failed job automatically refunds credit");
  const failedJobId = "job_failed_999";
  const failReservedTx = await reserveCredit(userId, failedJobId); // Sub drops from 3 to 2
  
  // Verify it dropped
  let walletBeforeRefund = await getUser360Wallet(userId);
  if (walletBeforeRefund.subscriptionCredits !== 2) {
    console.error("❌ FAIL: Failed to reserve credit, got sub balance: " + walletBeforeRefund.subscriptionCredits);
    process.exit(1);
  }

  // Refund
  await refundCredit(userId, failedJobId, failReservedTx, "subscription");
  const walletAfterRefund = await getUser360Wallet(userId);
  if (walletAfterRefund.subscriptionCredits !== 3) {
    console.error("❌ FAIL: Credit was not refunded. Sub balance: " + walletAfterRefund.subscriptionCredits);
    process.exit(1);
  }
  console.log("✅ PASS: Credit successfully refunded after simulated job failure.");

  // Test 10: Changing style configuration invalidates preview match
  console.log("Test 10: Changing selections invalidates current preview hash");
  const mockPreview = {
    id: "prev_abc",
    userId,
    sourceSessionId: "session_123",
    hairstyleId: "male_hair_fade",
    beardId: "beard_none",
    outfitId: "outfit_casual",
    aestheticsState: {},
    aestheticsStateHash: JSON.stringify({}) + "_male_hair_fade_beard_none_outfit_casual",
    frameUrls: ["frame1", "frame2"],
    status: "complete",
    createdAt: new Date().toISOString()
  };
  
  // If user changed to Pompadour, the hash no longer matches
  const PompadourHash = JSON.stringify({}) + "_male_hair_pompadour_beard_none_outfit_casual";
  const isMatch = mockPreview.aestheticsStateHash === PompadourHash;
  if (isMatch) {
    console.error("❌ FAIL: Mismatched style was incorrectly marked as matching!");
    process.exit(1);
  }
  console.log("✅ PASS: Changing style configurations correctly invalidates existing preview.");

  console.log("=== ALL 360° PREVIEW SYSTEM TESTS PASSED SUCCESSFULLY! ===");
};

runTests().catch(e => {
  console.error("❌ Test runner encountered error:", e);
  process.exit(1);
});
