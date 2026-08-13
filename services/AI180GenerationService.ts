import { AppState } from '../types';
import { generateStylePreview, validateStyleConsistency, AI180FrameMetadata } from './geminiService';
import { getFrameSharpness } from './AI180ViewProcessor';

interface StyleSnapshot {
  hairstyleId: string;
  hairColorId: string;
  beardId: string;
  beardColorId: string;
  aesthetics: Record<string, number>;
  makeup: string;
  outfitId: string;
  eyeColorId?: string;
}

// Memory cache to prevent redundant Gemini API calls
export const generationCache: Record<string, string[]> = {};

export const getCachedAI180Preview = (
  scanId: string,
  style: StyleSnapshot
): string[] | null => {
  const aestheticsHash = Object.entries(style.aesthetics || {})
    .filter(([_, val]) => val > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, val]) => `${id}:${val}`)
    .join(',');
  const eyeColor = style.eyeColorId || 'eyecolor_original';
  const cacheKey = `${scanId}_h:${style.hairstyleId}_c:${style.hairColorId}_b:${style.beardId}_bc:${style.beardColorId}_o:${style.outfitId}_m:${style.makeup}_ae:${aestheticsHash}_eye:${eyeColor}`;
  return generationCache[cacheKey] || null;
};

/**
 * Handles multi-view styling generation for the 9 anchor views.
 * Utilizes the Front View output as a visual reference for subsequent angles to enforce 3D consistency.
 */
export const generateAI180Preview = async (
  uid: string,
  scanId: string,
  sourceFrames: string[], // 9 frames
  style: StyleSnapshot,
  appState: AppState,
  onProgress: (percent: number, msg: string) => void,
  metadata?: AI180FrameMetadata[]
): Promise<string[]> => {
  const aestheticsHash = Object.entries(style.aesthetics || {})
    .filter(([_, val]) => val > 0)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, val]) => `${id}:${val}`)
    .join(',');
  const eyeColor = style.eyeColorId || 'eyecolor_original';
  const cacheKey = `${scanId}_h:${style.hairstyleId}_c:${style.hairColorId}_b:${style.beardId}_bc:${style.beardColorId}_o:${style.outfitId}_m:${style.makeup}_ae:${aestheticsHash}_eye:${eyeColor}`;
  
  if (generationCache[cacheKey]) {
    console.log('[AI180GenService] Cache hit! Returning cached styled frames.', cacheKey);
    onProgress(100, 'Loading styled frames from cache...');
    return generationCache[cacheKey];
  }

  console.log('[AI180GenService] Cache miss. Initiating 9-view Gemini generation loop...', cacheKey);
  const startTime = Date.now();
  let totalUploadedBytes = 0;
  let geminiCallsCount = 0;
  const resolvedMetadata = metadata && metadata.length === sourceFrames.length
    ? metadata
    : sourceFrames.map((_, i) => {
        const stepSize = sourceFrames.length > 1 ? 180 / (sourceFrames.length - 1) : 22.5;
        const yaw = Math.round(-90 + (i * stepSize));
        const side = yaw < -15 ? "left" : yaw > 15 ? "right" : "front";
        const viewLabel =
          yaw <= -75 ? "left-profile" :
          yaw <= -45 ? "left-3q" :
          yaw <= -15 ? "front-left" :
          yaw <= 15 ? "front" :
          yaw <= 45 ? "front-right" :
          yaw <= 75 ? "right-3q" : "right-profile";
        return { index: i, yaw, side, viewLabel } as AI180FrameMetadata;
      });

  const frontMeta = resolvedMetadata.find(m => m.viewLabel === 'front') || resolvedMetadata[Math.floor(sourceFrames.length / 2)];
  const frontFrameIdx = frontMeta.index;
  const styledFrames: string[] = new Array(sourceFrames.length).fill('');

  const sessionSeed = Math.floor(Math.random() * 900000) + 100000;

  // 1. Generate Front Frame (Anchor Reference)
  onProgress(10, 'Styling front face portrait...');
  
  const mockFrontState: AppState = {
    ...appState,
    originalImage: sourceFrames[frontFrameIdx]
  };

  const frontStyleOverride = {
    hairstyleId: style.hairstyleId,
    hairColorId: style.hairColorId,
    beardId: style.beardId,
    beardColorId: style.beardColorId,
    aesthetics: style.aesthetics,
    makeup: style.makeup,
    outfitId: style.outfitId,
    eyeColorId: style.eyeColorId
  };
  const frontResult = await generateStylePreview(mockFrontState, frontStyleOverride, sessionSeed, undefined, frontMeta.viewLabel);
  styledFrames[frontFrameIdx] = frontResult;
  geminiCallsCount++;
  
  const frontSharpness = await getFrameSharpness(frontResult);
  console.log(`[AI180GenService] Front Master sharpness measured: ${frontSharpness}`);
  totalUploadedBytes += sourceFrames[frontFrameIdx].length;

  // 2. Build branching sequence from metadata
  const leftBranch = resolvedMetadata
    .filter(m => m.yaw < -15)
    .sort((a, b) => b.yaw - a.yaw); // e.g. -30, -60, -90

  const rightBranch = resolvedMetadata
    .filter(m => m.yaw > 15)
    .sort((a, b) => a.yaw - b.yaw); // e.g. 30, 60, 90

  const sequence: Array<{ idx: number; parent: number; neighbor: number | null; label: string; viewLabel: string }> = [];

  for (let i = 0; i < leftBranch.length; i++) {
    const item = leftBranch[i];
    const parent = i === 0 ? frontFrameIdx : leftBranch[i - 1].index;
    const neighbor = i === 0 ? null : leftBranch[i - 1].index;
    sequence.push({
      idx: item.index,
      parent,
      neighbor,
      label: `${item.viewLabel} (${item.yaw}°)`,
      viewLabel: item.viewLabel
    });
  }

  for (let i = 0; i < rightBranch.length; i++) {
    const item = rightBranch[i];
    const parent = i === 0 ? frontFrameIdx : rightBranch[i - 1].index;
    const neighbor = i === 0 ? null : rightBranch[i - 1].index;
    sequence.push({
      idx: item.index,
      parent,
      neighbor,
      label: `${item.viewLabel} (${item.yaw}°)`,
      viewLabel: item.viewLabel
    });
  }

  for (let step = 0; step < sequence.length; step++) {
    const item = sequence[step];
    
    // Spacing requests by 1.8 seconds prevents sudden API token-rate limit bursts with high-resolution frames
    if (step > 0) {
      await new Promise(resolve => setTimeout(resolve, 1800));
    }

    const progressPercent = 15 + Math.floor((step / sequence.length) * 80);
    onProgress(progressPercent, `Generating style consistency for ${item.label}...`);

    const sourceFrame = sourceFrames[item.idx];
    const mockAngleState: AppState = {
      ...appState,
      originalImage: sourceFrame
    };

    // Construct references array: [FrontMaster, NeighborMaster (if present)]
    const refImages: string[] = [];
    if (styledFrames[item.parent]) {
      refImages.push(styledFrames[item.parent]);
    }
    if (item.neighbor !== null && styledFrames[item.neighbor]) {
      refImages.push(styledFrames[item.neighbor]);
    }

    // Try generating the angle
    let angleResult = await generateStylePreview(mockAngleState, frontStyleOverride, sessionSeed, refImages, item.viewLabel);
    geminiCallsCount++;
    
    // Verify consistency & quality
    let angleSharpness = await getFrameSharpness(angleResult);
    let isSoft = angleSharpness < Math.min(25, frontSharpness * 0.65);
    
    console.log(`[AI180GenService] Verifying consistency & quality for ${item.label} (sharpness: ${angleSharpness} vs front: ${frontSharpness})...`);
    let validation = await validateStyleConsistency(frontResult, angleResult, style);
    
    if (!validation.consistent || isSoft) {
      const failReason = !validation.consistent ? validation.reason : "blurry/soft output";
      console.warn(`[AI180GenService] Quality check failed on ${item.label}: ${failReason}. Retrying generation...`);
      // Spacing delay before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retry once with slightly altered seed and extra sharpness instruction
      angleResult = await generateStylePreview(mockAngleState, frontStyleOverride, sessionSeed + step + 100, refImages, item.viewLabel, true);
      geminiCallsCount++;
      
      // Re-verify
      validation = await validateStyleConsistency(frontResult, angleResult, style);
      angleSharpness = await getFrameSharpness(angleResult);
      console.log(`[AI180GenService] Retry result for ${item.label}: consistent=${validation.consistent}, sharpness=${angleSharpness}`);
    } else {
      console.log(`[AI180GenService] ${item.label} passed consistency & quality check.`);
    }

    styledFrames[item.idx] = angleResult;
    totalUploadedBytes += sourceFrame.length;
  }

  const durationMs = Date.now() - startTime;
  console.log(`[AI180GenService METRICS] Style Generation Complete:
  - Total Gemini API Calls: ${geminiCallsCount}
  - Total Duration: ${(durationMs / 1000).toFixed(2)}s
  - Approximate Upload Bytes: ${totalUploadedBytes} bytes
  - Cache Status: MISS (Written to memory)`);

  // Write to memory cache
  generationCache[cacheKey] = styledFrames;
  
  onProgress(100, 'Styled preview generated successfully!');
  return styledFrames;
};
