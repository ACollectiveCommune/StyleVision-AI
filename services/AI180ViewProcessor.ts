/**
 * Local client-side frame selector and quality analysis engine.
 */

// Helper to compute Laplacian variance of an ImageData to measure blurriness
const computeLaplacianVariance = (imgData: ImageData): number => {
  const data = imgData.data;
  const w = imgData.width;
  const h = imgData.height;

  const grid = 30; // Small grid for fast processing
  const lats = new Float32Array(grid * grid);
  const stepX = Math.floor(w / grid);
  const stepY = Math.floor(h / grid);

  const getGray = (gx: number, gy: number) => {
    const idx = (gy * stepY * w + gx * stepX) * 4;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  };

  for (let y = 1; y < grid - 1; y++) {
    for (let x = 1; x < grid - 1; x++) {
      const val = 4 * getGray(x, y) - getGray(x - 1, y) - getGray(x + 1, y) - getGray(x, y - 1) - getGray(x, y + 1);
      lats[y * grid + x] = val;
    }
  }

  let sum = 0;
  for (let i = 0; i < lats.length; i++) sum += lats[i];
  const mean = sum / lats.length;

  let varianceSum = 0;
  for (let i = 0; i < lats.length; i++) {
    varianceSum += Math.pow(lats[i] - mean, 2);
  }
  return varianceSum / lats.length;
};

// Analyze frame quality on a temporary canvas
const getFrameSharpness = (base64Str: string): Promise<number> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(0);
        return;
      }
      ctx.drawImage(img, 0, 0, 120, 120);
      const imgData = ctx.getImageData(0, 0, 120, 120);
      resolve(computeLaplacianVariance(imgData));
    };
    img.onerror = () => resolve(0);
  });
};

/**
 * Extracts 9 high-quality, sharp anchor frames from a raw 100-frame video sequence.
 */
export const extractAnchorFrames = async (rawFrames: string[]): Promise<string[]> => {
  const total = rawFrames.length;
  if (total < 10) return rawFrames;

  // Ideal target index positions for the 9 anchor angles
  const targetIndexes = [0, 12, 25, 37, 50, 62, 75, 87, total - 1];
  const selectedFrames: string[] = [];

  for (let i = 0; i < targetIndexes.length; i++) {
    const targetIdx = targetIndexes[i];
    
    // Search window +/- 3 frames to find the sharpest frame
    let bestIdx = targetIdx;
    let maxSharpness = -1;

    const startIdx = Math.max(0, targetIdx - 3);
    const endIdx = Math.min(total - 1, targetIdx + 3);

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
