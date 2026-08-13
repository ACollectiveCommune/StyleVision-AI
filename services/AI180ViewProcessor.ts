/**
 * Local client-side frame selector and quality analysis engine.
 */
import { AI180FrameMetadata } from './geminiService';

// Helper to compute Laplacian variance of an ImageData to measure blurriness
// Helper to compute Laplacian variance of an ImageData to measure blurriness focusing on the face region
const computeLaplacianVariance = (imgData: ImageData): number => {
  const data = imgData.data;
  const w = imgData.width;
  const h = imgData.height;

  // Evaluate the middle 60% of the image (face/hair region) to avoid background noise
  const startX = Math.floor(w * 0.2);
  const endX = Math.floor(w * 0.8);
  const startY = Math.floor(h * 0.2);
  const endY = Math.floor(h * 0.8);

  const getGray = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  };

  let sum = 0;
  let count = 0;
  const laplacians: number[] = [];

  for (let y = startY + 1; y < endY - 1; y += 2) {
    for (let x = startX + 1; x < endX - 1; x += 2) {
      // 3x3 Laplacian kernel:
      //  0  1  0
      //  1 -4  1
      //  0  1  0
      const val = getGray(x - 1, y) + getGray(x + 1, y) + getGray(x, y - 1) + getGray(x, y + 1) - 4 * getGray(x, y);
      laplacians.push(val);
      sum += val;
      count++;
    }
  }

  const mean = sum / count;
  let varianceSum = 0;
  for (let i = 0; i < laplacians.length; i++) {
    varianceSum += Math.pow(laplacians[i] - mean, 2);
  }
  return varianceSum / count;
};

// Analyze frame quality on a temporary canvas (higher resolution for fine detail detection)
export const getFrameSharpness = (base64Str: string): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(0);
        return;
      }
      ctx.drawImage(img, 0, 0, 256, 256);
      const imgData = ctx.getImageData(0, 0, 256, 256);
      resolve(computeLaplacianVariance(imgData));
    };
    img.onerror = () => resolve(0);
    img.src = base64Str;
  });
};

/**
 * Extracts 7 high-quality, sharp anchor frames from a raw 100-frame video sequence.
 */
export const extractAnchorFrames = async (rawFrames: string[]): Promise<string[]> => {
  const total = rawFrames.length;
  if (total < 10) return rawFrames;

  const targetIndexes = [
    0,
    Math.round((total - 1) * 1 / 6),
    Math.round((total - 1) * 2 / 6),
    Math.round((total - 1) * 3 / 6),
    Math.round((total - 1) * 4 / 6),
    Math.round((total - 1) * 5 / 6),
    total - 1
  ];

  const selectedFrames: string[] = [];

  for (let i = 0; i < targetIndexes.length; i++) {
    const targetIdx = targetIndexes[i];
    
    // Search window +/- 6 frames to find the sharpest frame
    let bestIdx = targetIdx;
    let maxSharpness = -1;

    const startIdx = Math.max(0, targetIdx - 6);
    const endIdx = Math.min(total - 1, targetIdx + 6);

    for (let checkIdx = startIdx; checkIdx <= endIdx; checkIdx++) {
      const frame = rawFrames[checkIdx];
      const sharpness = await getFrameSharpness(frame);
      if (sharpness > maxSharpness) {
        maxSharpness = sharpness;
        bestIdx = checkIdx;
      }
    }

    selectedFrames.push(rawFrames[bestIdx]);
  }

  return selectedFrames;
};

export const normalizeAndSortMetadata = (
  metadata: AI180FrameMetadata[],
  sourceFrames: string[]
): { sortedFrames: string[]; sortedMeta: AI180FrameMetadata[] } => {
  // 1. Sort the metadata objects by their estimated yaw (ascending, from -90 to +90)
  // Each metadata object has an 'index' that maps to the sourceFrames array.
  const sortedMetaByYaw = [...metadata].sort((a, b) => a.yaw - b.yaw);

  // 2. Map them to the 7 canonical slots:
  const labels: Array<'left-profile' | 'left-3q' | 'front-left' | 'front' | 'front-right' | 'right-3q' | 'right-profile'> = [
    'left-profile',
    'left-3q',
    'front-left',
    'front',
    'front-right',
    'right-3q',
    'right-profile'
  ];
  const yaws = [-90, -60, -30, 0, 30, 60, 90];
  const sides: Array<'left' | 'right' | 'front'> = ['left', 'left', 'left', 'front', 'right', 'right', 'right'];

  const normalizedMeta: AI180FrameMetadata[] = [];
  const normalizedFrames: string[] = [];

  for (let i = 0; i < 7; i++) {
    // Pick the metadata item that is closest to this slot
    // Since sortedMetaByYaw has at most 7 items (or more/less), we can map them proportionally:
    const sourceMetaIndex = Math.max(0, Math.min(sortedMetaByYaw.length - 1, Math.round((i / 6) * (sortedMetaByYaw.length - 1))));
    const metaItem = sortedMetaByYaw[sourceMetaIndex];
    
    normalizedFrames.push(sourceFrames[metaItem.index]);
    normalizedMeta.push({
      index: i, // New index in the sorted/normalized array
      yaw: yaws[i],
      side: sides[i],
      viewLabel: labels[i],
      canonicalSlot: i
    });
  }

  return { sortedFrames: normalizedFrames, sortedMeta: normalizedMeta };
};
