import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Downloads or shares the generated image.
 * On native iOS/Android devices, this presents the native system Share Sheet,
 * allowing the user to click "Save Image" (saving it directly to their Photos app),
 * copy it, or send it to friends.
 * On Web, it falls back to standard browser file download download links.
 */
export const downloadOrShareImage = async (base64Image: string): Promise<void> => {
  if (!base64Image) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title: 'My StyleVision AI Photo',
        text: 'Check out my new hairstyle preview from StyleVision AI!',
        url: base64Image,
        dialogTitle: 'Save or Share preview'
      });
      console.log("[SHARE SERVICE] Photo shared successfully.");
    } catch (err) {
      console.error("[SHARE SERVICE] Failed to share photo:", err);
    }
  } else {
    // Web fallback: standard virtual link download trigger
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = `StyleVision_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
