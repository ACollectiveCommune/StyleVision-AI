import { CapgoInAppReview } from '@capgo/capacitor-in-app-review';
import { Capacitor } from '@capacitor/core';

/**
 * Triggers Apple's native SKStoreReviewController rating dialog.
 * Note: Apple automatically caps this to a maximum of 3 times per 365-day period.
 */
export const triggerAppStoreReview = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await CapgoInAppReview.requestReview();
      console.log("[RATE SERVICE] Native App Store review prompt requested.");
    } catch (err) {
      console.error("[RATE SERVICE] Failed to request review:", err);
    }
  } else {
    console.log("[RATE SERVICE] Simulated review request (App Store review prompts only display on native iOS/Android devices).");
  }
};
