import { AppState } from '../types';
import { generateStylePreview } from './geminiService';

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
const generationCache: Record<string, string[]> = {};

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
  onProgress: (percent: number, msg: string) => void
): Promise<string[]> => {
  const cacheKey = `${scanId}_h:${style.hairstyleId}_c:${style.hairColorId}_b:${style.beardId}_bc:${style.beardColorId}_o:${style.outfitId}_m:${style.makeup}`;
  
  if (generationCache[cacheKey]) {
    console.log('[AI180GenService] Cache hit! Returning cached styled frames.', cacheKey);
    onProgress(100, 'Loading styled frames from cache...');
    return generationCache[cacheKey];
  }

  console.log('[AI180GenService] Cache miss. Initiating 9-view Gemini generation loop...', cacheKey);
  const startTime = Date.now();
  let totalUploadedBytes = 0;
  let geminiCallsCount = 0;

  // Generate the Front view (index 4) first to establish the look baseline
  const frontFrameIdx = 4;
  const styledFrames: string[] = new Array(9).fill('');

  // Generate a deterministic seed number (reused for all 9 generation calls to lock hairstyle/beard/outfit visual features)
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

  const frontResult = await generateStylePreview(mockFrontState, frontStyleOverride, sessionSeed);
  styledFrames[frontFrameIdx] = frontResult;
  geminiCallsCount++;
  
  totalUploadedBytes += sourceFrames[frontFrameIdx].length;

  // 2. Generate remaining angles sequentially to respect rate limits
  const angleOrder = [0, 1, 2, 3, 5, 6, 7, 8];
  
  for (let step = 0; step < angleOrder.length; step++) {
    // Spacing requests by 1.8 seconds prevents sudden API token-rate limit bursts with high-resolution frames
    if (step > 0) {
      await new Promise(resolve => setTimeout(resolve, 1800));
    }

    const idx = angleOrder[step];
    const progressPercent = 15 + Math.floor((step / angleOrder.length) * 80);
    onProgress(progressPercent, `Generating style consistency for angle ${step + 1} of 8...`);

    const sourceFrame = sourceFrames[idx];
    
    const mockAngleState: AppState = {
      ...appState,
      originalImage: sourceFrame
    };

    // seedOverride triggers cross-angle style coherence checks in the system prompt
    const angleResult = await generateStylePreview(mockAngleState, frontStyleOverride, sessionSeed);
    styledFrames[idx] = angleResult;
    geminiCallsCount++;
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
