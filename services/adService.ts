import { Capacitor } from "@capacitor/core";

// Test Ad Unit IDs provided by Google AdMob for iOS testing
const IOS_REWARDED_TEST_UNIT_ID = "ca-app-pub-3940256099942544/1712485313";

/**
 * Helper to check if Google AdMob plugin is loaded and registered
 */
export const getAdMobPlugin = (): any | null => {
  if (Capacitor.isNativePlatform()) {
    return (window as any).AdMob || null;
  }
  return null;
};

/**
 * Initializes Google AdMob in the native Capacitor app (if installed)
 */
export const initializeAdMob = async (): Promise<boolean> => {
  const AdMob = getAdMobPlugin();
  if (!AdMob) {
    console.log("[ADMOB LOG] AdMob SDK is running in simulator mock fallback mode.");
    return false;
  }

  try {
    await AdMob.initialize();
    console.log("[ADMOB LOG] AdMob SDK initialized successfully.");
    return true;
  } catch (err) {
    console.error("[ADMOB LOG] AdMob initialization failed:", err);
    return false;
  }
};

/**
 * Loads and displays a Rewarded Video Ad.
 * Returns true if the user completed watching the ad and earned the reward.
 */
export const showRewardedVideoAd = async (): Promise<boolean> => {
  const AdMob = getAdMobPlugin();
  if (!AdMob) {
    console.log("[ADMOB LOG] Using mock simulation for rewarded ad playback.");
    return false; // Fallback to simulated Modal UI
  }

  try {
    // 1. Prepare/load the rewarded ad
    await AdMob.prepareRewardVideoAd({
      adId: IOS_REWARDED_TEST_UNIT_ID,
      clearprior: true
    });

    // 2. Show the rewarded ad and wait for callback events
    let adEarnedReward = false;

    // Attach rewarded listener
    const onRewardListener = AdMob.addListener("onRewardedVideoAdReward", (info: any) => {
      console.log("[ADMOB LOG] Reward earned:", info);
      adEarnedReward = true;
    });

    // Display the ad
    await AdMob.showRewardVideoAd();

    // Clean up listener after completion (or simple timeout)
    setTimeout(() => {
      onRewardListener.remove();
    }, 45000);

    return adEarnedReward;
  } catch (err) {
    console.error("[ADMOB LOG] Failed to show rewarded video ad:", err);
    return false;
  }
};
