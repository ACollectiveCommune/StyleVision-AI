import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface SaveResult {
  success: boolean;
  method: 'photos' | 'download' | 'share';
  message: string;
}

/**
 * Helper to strip base64 data URI header if present
 */
const getRawBase64 = (base64String: string): string => {
  if (base64String.includes(',')) {
    return base64String.split(',')[1];
  }
  return base64String;
};

/**
 * Saves a single generated style preview image to Photos/Camera Roll or Downloads.
 */
export const saveImageToPhotos = async (
  base64Image: string,
  filename: string
): Promise<SaveResult> => {
  if (!base64Image) {
    throw new Error("No image data available");
  }

  const cleanName = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Check and request storage permissions (if required by platform)
      const permStatus = await Filesystem.checkPermissions();
      if (permStatus.publicStorage !== 'granted') {
        const reqStatus = await Filesystem.requestPermissions();
        if (reqStatus.publicStorage !== 'granted') {
          return {
            success: false,
            method: 'share',
            message: 'Photos storage permission denied. Please allow access in System Settings.'
          };
        }
      }

      // 2. Write file to local cached directory
      const rawData = getRawBase64(base64Image);
      const writeResult = await Filesystem.writeFile({
        path: cleanName,
        data: rawData,
        directory: Directory.Cache
      });

      // 3. Open Native Share sheet with file URI
      await Share.share({
        title: cleanName,
        url: writeResult.uri,
        dialogTitle: 'Save image to your Photos'
      });

      return {
        success: true,
        method: 'share',
        message: 'Share sheet opened - tap "Save Image" to add to Photos'
      };
    } catch (err: any) {
      console.error("[SAVE SERVICE] Native save failure:", err);
      throw new Error(err.message || "Failed to save image to device");
    }
  } else {
    // Web / Safari / PWA Flow
    try {
      const response = await fetch(base64Image);
      const blob = await response.blob();
      const cleanType = blob.type || 'image/jpeg';
      const file = new File([blob], cleanName, { type: cleanType });

      // Try Web Share API with file support first (e.g. mobile Safari)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: cleanName
        });
        return {
          success: true,
          method: 'share',
          message: 'System share options opened successfully'
        };
      }
      
      // Fallback: standard virtual Blob anchor download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke the Object URL shortly after
      setTimeout(() => URL.revokeObjectURL(blobUrl), 150);

      return {
        success: true,
        method: 'download',
        message: `${cleanName.replace('stylevision_', '').replace('.jpg', '')} view downloaded to Files/Downloads`
      };
    } catch (err: any) {
      console.error("[SAVE SERVICE] Web save failure:", err);
      throw new Error(err.message || "Browser download failed");
    }
  }
};

/**
 * Saves all 5 generated angles to Photos/Camera Roll or Downloads.
 */
export const saveAllImagesToPhotos = async (
  images: { base64: string; filename: string }[],
  onProgress?: (current: number, total: number) => void
): Promise<SaveResult> => {
  if (!images || images.length === 0) {
    throw new Error("No images available to save");
  }

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Check and request storage permissions
      const permStatus = await Filesystem.checkPermissions();
      if (permStatus.publicStorage !== 'granted') {
        const reqStatus = await Filesystem.requestPermissions();
        if (reqStatus.publicStorage !== 'granted') {
          return {
            success: false,
            method: 'share',
            message: 'Photos storage permission denied. Please allow access in System Settings.'
          };
        }
      }

      const fileUris: string[] = [];

      // 2. Cache all 5 files locally
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (onProgress) onProgress(i + 1, images.length);

        const rawData = getRawBase64(img.base64);
        const writeResult = await Filesystem.writeFile({
          path: img.filename,
          data: rawData,
          directory: Directory.Cache
        });
        fileUris.push(writeResult.uri);
      }

      // 3. Open share sheet with multiple files
      // Check if the current Capacitor Share plugin version supports sharing multiple files via 'files' parameter
      try {
        await Share.share({
          title: 'My 180° StyleVision Preview',
          // Pass the primary file URL as standard fallback, and provide files array
          url: fileUris[0],
          // @ts-ignore - files is supported in newer Capacitor Share versions
          files: fileUris,
          dialogTitle: 'Save all 5 views to Photos'
        });
      } catch (shareErr) {
        // Fallback: If sharing multiple fails, share them one by one or share the first one
        console.warn("Multi-file sharing failed, sharing first frame:", shareErr);
        await Share.share({
          title: images[0].filename,
          url: fileUris[0],
          dialogTitle: 'Save frame to Photos'
        });
      }

      return {
        success: true,
        method: 'share',
        message: 'Share sheet opened - tap "Save Image" to save views'
      };
    } catch (err: any) {
      console.error("[SAVE SERVICE] Native save-all failure:", err);
      throw new Error(err.message || "Failed to save all views");
    }
  } else {
    // Web / Safari / PWA Flow
    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (onProgress) onProgress(i + 1, images.length);

        const response = await fetch(img.base64);
        const blob = await response.blob();
        
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = img.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Stagger revokes and download clicks to prevent browser throttling
        await new Promise(r => setTimeout(r, 250));
        URL.revokeObjectURL(blobUrl);
      }

      return {
        success: true,
        method: 'download',
        message: 'All 5 views downloaded successfully to Files/Downloads'
      };
    } catch (err: any) {
      console.error("[SAVE SERVICE] Web save-all failure:", err);
      throw new Error(err.message || "Browser batch download failed");
    }
  }
};
