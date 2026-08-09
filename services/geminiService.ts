import { AppState, Gender, AppMode } from "../types";
import { AESTHETIC_TREATMENTS } from "../constants/aesthetics";
import { CUSTOM_LOOK_PRESETS } from "../constants/customLooks";
import { MAKEUP_PRESETS } from "../constants/makeupPresets";
import { Capacitor } from "@capacitor/core";

const OUTFIT_PROMPTS: Record<string, { male: string; female: string; unisex?: string }> = {
  outfit_business: { male: "professional tailored navy blazers executive business suit with a tie", female: "sharp tailored black professional suit jacket and blazer" },
  outfit_wedding: { male: "formal black tie wedding tuxedo with satin lapels", female: "stunning white lace off-the-shoulder wedding gown" },
  outfit_gala: { male: "luxury dark velvet dinner jacket blazer", female: "luxurious floor-length red silk evening gown" },
  outfit_highlife: { male: "beige linen collared shirt", female: "elegant white evening silk slip dress" },
  outfit_resort: { male: "tropical Hawaiian collared shirt", female: "summer resort floral print sundress" },
  outfit_streetwear: { male: "modern black graphic streetwear hoodie", female: "retro casual streetwear cardigan and tee" },
  outfit_retro: { male: "vintage leather bomber jacket and jeans", female: "distressed blue denim jacket over crop top and pants" },
  outfit_active: { male: "athletic running zip-up jacket and black track pants", female: "matching athletic sports crop top and performance leggings" },
  outfit_sport: { male: "gym hoodie sweatshirt and joggers", female: "white tennis sports polo and pleated skirt" },

  // Female-Specific Outfits
  female_outfit_sundress: { male: "", female: "casual summer floral sundress with spaghetti straps" },
  female_outfit_gala: { male: "", female: "elegant floor-length red silk evening gala gown" },
  female_outfit_retro: { male: "", female: "distressed blue denim jacket over a crop top and dark pants" },
  female_outfit_active: { male: "", female: "sleek black athletic performance gym crop top and matching leggings" },
  female_outfit_sport: { male: "", female: "white tennis sports polo and pleated tennis skirt" },
  female_outfit_casual_tshirt_jeans: { male: "", female: "basic fitted white crewneck t-shirt and straight-leg blue denim jeans" },
  female_outfit_casual_sweater_jeans: { male: "", female: "cozy oversized knitted cream sweater and light blue denim jeans" },
  female_outfit_casual_crop_pants: { male: "", female: "crop top and high-waisted wide-leg beige pants" },
  female_outfit_casual_leather_jacket: { male: "", female: "black leather biker jacket over a white tee, and black jeans" },
  female_outfit_business_pantsuit: { male: "", female: "professional tailored double-breasted gray business pantsuit" },
  female_outfit_business_blazer_trousers: { male: "", female: "smart navy blazer over a white blouse, and cream trousers" },
  female_outfit_business_pencil_skirt: { male: "", female: "professional satin long-sleeve blouse and high-waisted black pencil skirt" },
  female_outfit_luxury_cocktail_dress: { male: "", female: "chic knee-length emerald green silk cocktail dress" },
  female_outfit_luxury_satin_dress: { male: "", female: "sleek champagne-colored silk slip dress" },
  female_outfit_luxury_lbd: { male: "", female: "classic elegant knee-length little black dress" },
  female_outfit_luxury_wedding_guest: { male: "", female: "sophisticated elegant floral-print wedding guest midi dress" },
  female_outfit_luxury_designer: { male: "", female: "luxury tweed designer jacket and matching skirt outfit" },
  female_outfit_streetwear_hoodie_cargo: { male: "", female: "oversized streetwear hoodie and olive green cargo pants" },
  female_outfit_vacation_resort: { male: "", female: "flowing pastel vacation resort midi dress" },
  female_outfit_vacation_beach_cover: { male: "", female: "lightweight white linen cover-up shirt over swimwear" },
  female_outfit_casual_winter_coat: { male: "", female: "heavy brown wool winter trench coat and a thick scarf" },

  // Male-Specific Outfits
  male_outfit_retro: { male: "vintage leather bomber jacket over a white tee and jeans", female: "" },
  male_outfit_active: { male: "dry-fit athletic running zip-up jacket and black track pants", female: "" },
  male_outfit_sport: { male: "comfortable gray athletic gym hoodie sweatshirt and joggers", female: "" },
  male_outfit_casual_tshirt_jeans: { male: "basic white crewneck t-shirt and blue denim jeans", female: "" },
  male_outfit_casual_polo_chinos: { male: "classic pique cotton polo shirt and khaki chinos", female: "" },
  male_outfit_casual_buttondown_trousers: { male: "long-sleeve light blue button-down shirt and charcoal trousers", female: "" },
  male_outfit_casual_denim_jacket: { male: "casual blue denim jacket over a white shirt, and pants", female: "" },
  male_outfit_casual_leather_jacket: { male: "rugged black leather biker jacket over a white shirt, and jeans", female: "" },
  male_outfit_active_training: { male: "short-sleeve athletic training shirt and workout shorts", female: "" },
  male_outfit_active_basketball: { male: "athletic sleeveless basketball jersey and mesh shorts", female: "" },
  male_outfit_active_tennis: { male: "tennis polo shirt and white athletic shorts", female: "" },
  male_outfit_business_blazer: { male: "smart navy business-casual blazer over a white shirt and gray trousers", female: "" },
  male_outfit_luxury_formal_suit: { male: "premium black formal suit, white shirt, and black tie", female: "" },
  male_outfit_luxury_wedding_guest: { male: "tailored wedding guest dress suit with a pocket square", female: "" },
  male_outfit_luxury_designer: { male: "designer smart jacket and trousers with luxury label aesthetics", female: "" },
  male_outfit_vacation_linen: { male: "white linen shirt and matching linen trousers", female: "" },
  male_outfit_vacation_resort: { male: "short-sleeve resort floral print shirt and light shorts", female: "" },
  male_outfit_casual_winter_coat: { male: "gray winter wool coat over a thick knit sweater", female: "" },

  // Unisex
  unisex_outfit_oversized_streetwear: { male: "unisex oversized boxy streetwear hoodie and cargo pants", female: "unisex oversized boxy streetwear hoodie and cargo pants", unisex: "unisex oversized boxy streetwear hoodie and cargo pants" }
};

export type GenerationErrorReason =
  | "provider-rejected"
  | "moderation-blocked"
  | "timeout"
  | "rate-limited"
  | "invalid-response"
  | "empty-output"
  | "source-image-failed";

export class GenerationError extends Error {
  reason: GenerationErrorReason;
  providerCode?: string;
  details?: string;

  constructor(
    reason: GenerationErrorReason,
    details?: string,
    providerCode?: string
  ) {
    super(`Generation failed: ${reason}. Details: ${details || ""}`);
    this.name = "GenerationError";
    this.reason = reason;
    this.providerCode = providerCode;
    this.details = details;
  }
}

export type ParsedGenerationResult =
  | {
      ok: true;
      image: {
        base64: string;
        mimeType: string;
      };
      providerRequestId?: string;
    }
  | {
      ok: false;
      reason: GenerationErrorReason;
      providerCode?: string;
      details?: string;
    };

export const parseGeminiResponse = (resData: any): ParsedGenerationResult => {
  if (!resData) {
    return { ok: false, reason: "empty-output", details: "Response body is empty or undefined" };
  }

  // 1. Check promptFeedback for block reason
  if (resData.promptFeedback?.blockReason) {
    return { 
      ok: false, 
      reason: "moderation-blocked", 
      providerCode: resData.promptFeedback.blockReason,
      details: `Prompt feedback blocked: ${resData.promptFeedback.blockReason}` 
    };
  }

  const candidates = resData.candidates;
  if (!candidates || candidates.length === 0) {
    return { ok: false, reason: "invalid-response", details: "No candidates returned by Gemini" };
  }

  const candidate = candidates[0];

  // 2. Check candidate finishReason for safety blocks
  if (candidate.finishReason && candidate.finishReason === "SAFETY") {
    return { 
      ok: false, 
      reason: "moderation-blocked", 
      providerCode: "SAFETY",
      details: "Candidate finished due to SAFETY filter block" 
    };
  }

  if (candidate.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS" && candidate.finishReason !== "OTHER") {
    return { 
      ok: false, 
      reason: "provider-rejected", 
      providerCode: candidate.finishReason,
      details: `Candidate finish reason: ${candidate.finishReason}` 
    };
  }

  const parts = candidate.content?.parts;
  if (!parts || parts.length === 0) {
    return { ok: false, reason: "empty-output", details: "Candidate has no parts" };
  }

  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      const mimeType = part.inlineData.mimeType || "image/png";
      const base64Data = part.inlineData.data;
      if (base64Data.trim().length === 0) {
        return { ok: false, reason: "empty-output", details: "Image data string is empty" };
      }
      return {
        ok: true,
        image: {
          base64: base64Data,
          mimeType: mimeType
        }
      };
    }
  }

  return { ok: false, reason: "empty-output", details: "No inlineData image parts found in response" };
};

// Helper to extract mime type and base64 data from a Data URL
const parseDataUrl = (dataUrl: string) => {
  if (!dataUrl) {
    throw new Error("No image data provided");
  }
  if (!dataUrl.startsWith("data:")) {
    return { mimeType: "image/jpeg", data: dataUrl };
  }
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    const parts = dataUrl.split(";base64,");
    if (parts.length === 2) {
      return { mimeType: parts[0].replace("data:", ""), data: parts[1] };
    }
    throw new Error("Invalid image format - could not split base64 content");
  }
  return { mimeType: matches[1], data: matches[2] };
};

const compressImageBase64 = (base64Str: string, maxDim: number = 512, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

const blurCanvas = (canvas: HTMLCanvasElement, radius: number = 2) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const out = new Uint8Array(width * height);

  // 1. Horizontal Pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        if (nx >= 0 && nx < width) {
          sum += data[((y * width + nx) * 4) + 3];
          count++;
        }
      }
      out[y * width + x] = Math.round(sum / count);
    }
  }

  // 2. Vertical Pass (write back to image data alpha channel)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny >= 0 && ny < height) {
          sum += out[ny * width + x];
          count++;
        }
      }
      data[((y * width + x) * 4) + 3] = Math.round(sum / count);
    }
  }

  ctx.putImageData(imgData, 0, 0);
};

const dilateCanvas = (canvas: HTMLCanvasElement, radius: number = 8) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return;
  tempCtx.drawImage(canvas, 0, 0);

  ctx.globalCompositeOperation = 'source-over';
  for (let angle = 0; angle < 360; angle += 15) {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.round(Math.cos(rad) * radius);
    const dy = Math.round(Math.sin(rad) * radius);
    ctx.drawImage(tempCanvas, dx, dy);
  }
};

// Return generatedSrc blended with originalSrc using a pixel-by-pixel smart difference mask
const applyDifferenceMask = async (originalSrc: string, generatedSrc: string, currentState: AppState): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(generatedSrc);
      return;
    }
    const imgOrig = new Image();
    const imgGen = new Image();
    let loadedCount = 0;
    
    const onLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // 1. Create downsampled comparison canvas (1024px width) to compute the difference mask
        const compWidth = 1024;
        const compHeight = Math.round((imgOrig.height * compWidth) / imgOrig.width);
        
        const compCanvas = document.createElement("canvas");
        compCanvas.width = compWidth;
        compCanvas.height = compHeight;
        const compCtx = compCanvas.getContext("2d");
        if (!compCtx) {
          resolve(generatedSrc);
          return;
        }

        // Read downsampled original pixels
        compCtx.drawImage(imgOrig, 0, 0, compWidth, compHeight);
        const origPixels = compCtx.getImageData(0, 0, compWidth, compHeight);

        // Read downsampled generated pixels
        compCtx.drawImage(imgGen, 0, 0, compWidth, compHeight);
        const genPixels = compCtx.getImageData(0, 0, compWidth, compHeight);

        // --- SKIN COLOR CONSISTENCY CORRECTION (YCbCr space) ---
        let cbOrigSum = 0;
        let crOrigSum = 0;
        let origSkinCount = 0;

        let cbGenSum = 0;
        let crGenSum = 0;
        let genSkinCount = 0;

        const isSkinColor = (r: number, g: number, b: number) => {
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
          // Skin tones cluster inside Cb [77, 127] and Cr [133, 177]
          return (cb >= 77 && cb <= 127 && cr >= 133 && cr <= 177);
        };

        const pixelCount = origPixels.data.length;
        for (let i = 0; i < pixelCount; i += 4) {
          const rOrig = origPixels.data[i];
          const gOrig = origPixels.data[i+1];
          const bOrig = origPixels.data[i+2];

          if (isSkinColor(rOrig, gOrig, bOrig)) {
            const cb = 128 - 0.168736 * rOrig - 0.331264 * gOrig + 0.5 * bOrig;
            const cr = 128 + 0.5 * rOrig - 0.418688 * gOrig - 0.081312 * bOrig;
            cbOrigSum += cb;
            crOrigSum += cr;
            origSkinCount++;
          }

          const rGen = genPixels.data[i];
          const gGen = genPixels.data[i+1];
          const bGen = genPixels.data[i+2];

          if (isSkinColor(rGen, gGen, bGen)) {
            const cb = 128 - 0.168736 * rGen - 0.331264 * gGen + 0.5 * bGen;
            const cr = 128 + 0.5 * rGen - 0.418688 * gGen - 0.081312 * bGen;
            cbGenSum += cb;
            crGenSum += cr;
            genSkinCount++;
          }
        }

        let cbOffset = 0;
        let crOffset = 0;
        let hasCorrectionOffsets = false;

        if (origSkinCount > 200 && genSkinCount > 200) {
          const cbOrigMean = cbOrigSum / origSkinCount;
          const crOrigMean = crOrigSum / origSkinCount;
          
          const cbGenMean = cbGenSum / genSkinCount;
          const crGenMean = crGenSum / genSkinCount;

          // Adjust strength based on creative overlays (Custom Looks or aesthetics)
          const hasCustomLook = !!currentState.selectedCustomLookId;
          const hasAesthetic = currentState.selectedTreatments?.some(t => t.value > 0);
          const correctionStrength = (hasCustomLook || hasAesthetic) ? 0.35 : 0.85;

          cbOffset = (cbOrigMean - cbGenMean) * correctionStrength;
          crOffset = (crOrigMean - crGenMean) * correctionStrength;
          hasCorrectionOffsets = true;

          console.log(`[COLOR_CONSISTENCY] Detected ${origSkinCount} skin pixels. Applying Cb offset: ${cbOffset.toFixed(2)}, Cr offset: ${crOffset.toFixed(2)} with strength ${correctionStrength}`);

          // Correct the genPixels array directly for the downsampled comparison
          for (let i = 0; i < pixelCount; i += 4) {
            const r = genPixels.data[i];
            const g = genPixels.data[i+1];
            const b = genPixels.data[i+2];

            if (isSkinColor(r, g, b)) {
              const y = 0.299 * r + 0.587 * g + 0.114 * b;
              let cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
              let cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

              cb += cbOffset;
              cr += crOffset;

              cb = Math.max(0, Math.min(255, cb));
              cr = Math.max(0, Math.min(255, cr));

              let newR = y + 1.402 * (cr - 128);
              let newG = y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128);
              let newB = y + 1.772 * (cb - 128);

              genPixels.data[i] = Math.max(0, Math.min(255, Math.round(newR)));
              genPixels.data[i+1] = Math.max(0, Math.min(255, Math.round(newG)));
              genPixels.data[i+2] = Math.max(0, Math.min(255, Math.round(newB)));
            }
          }
        }

        // 1. Find face bounding box from skin pixels
        let minSkinX = compWidth;
        let maxSkinX = 0;
        let minSkinY = compHeight;
        let maxSkinY = 0;

        for (let y = 0; y < compHeight; y++) {
          for (let x = 0; x < compWidth; x++) {
            const idx = (y * compWidth + x) * 4;
            const r = origPixels.data[idx];
            const g = origPixels.data[idx+1];
            const b = origPixels.data[idx+2];
            if (isSkinColor(r, g, b)) {
              if (x < minSkinX) minSkinX = x;
              if (x > maxSkinX) maxSkinX = x;
              if (y < minSkinY) minSkinY = y;
              if (y > maxSkinY) maxSkinY = y;
            }
          }
        }

        const hasFace = (maxSkinX > minSkinX && maxSkinY > minSkinY);

        // 2. Define face preservation zones
        const isHairEdited = (currentState.selectedHairStyle && currentState.selectedHairStyle.id !== 'original') ||
                             (currentState.selectedHairColor && currentState.selectedHairColor.id !== 'original');
        const isBeardEdited = currentState.selectedBeardStyle && currentState.selectedBeardStyle.id !== 'original';
        const isMakeupEdited = currentState.selectedMakeup && currentState.selectedMakeup.id !== 'original';
        const isAestheticsActive = currentState.selectedTreatments && currentState.selectedTreatments.some(t => t.value > 0);

        const isReplacementActive = isHairEdited || isBeardEdited;
        const threshold = (isAestheticsActive || isMakeupEdited) ? 8 : 18;

        // 2. Define the collar line where the head/face region ends and clothing begins
        let collarY = Math.round(compHeight * 0.70);

        if (hasFace) {
          const faceWidth = maxSkinX - minSkinX;
          const faceHeight = Math.min(maxSkinY - minSkinY, Math.round(faceWidth * 1.35));
          // Collar line is located just below the chin/jaw (bottom of the skin bounding box)
          collarY = maxSkinY + Math.round(faceHeight * 0.08);
        }

        // Create 1024px alpha mask canvas
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = compWidth;
        maskCanvas.height = compHeight;
        const maskCtx = maskCanvas.getContext("2d");
        if (!maskCtx) {
          resolve(generatedSrc);
          return;
        }
        const maskData = maskCtx.createImageData(compWidth, compHeight);
        const len = origPixels.data.length;
        const feather = 20; // Feather size at the neck boundary

        for (let i = 0; i < len; i += 4) {
          const pixelIdx = i / 4;
          const x = pixelIdx % compWidth;
          const y = Math.floor(pixelIdx / compWidth);

          let maskValue = 255; // Default: fully generated

          if (isReplacementActive) {
            if (y < collarY - feather) {
              // Entire head, hair, face, beard, and upper neck come 100% from the generated image
              // This guarantees ZERO ghosting and 100% sharpness for all facial features
              maskValue = 255;
            } else if (y >= collarY - feather && y <= collarY) {
              // Smoothly transition from head (generated) to clothing/shoulders
              const factor = (y - (collarY - feather)) / feather; // 0.0 at top of feather, 1.0 at collarY
              
              // Calculate difference mask for clothing/shoulders at this pixel
              const rDiff = Math.abs(genPixels.data[i] - origPixels.data[i]);
              const gDiff = Math.abs(genPixels.data[i+1] - origPixels.data[i+1]);
              const bDiff = Math.abs(genPixels.data[i+2] - origPixels.data[i+2]);
              const diff = (rDiff + gDiff + bDiff) / 3.0;

              const blendRange = 12;
              let diffValue = 0;
              if (diff < threshold) {
                diffValue = 0;
              } else if (diff > (threshold + blendRange)) {
                diffValue = 255;
              } else {
                const f = (diff - threshold) / blendRange;
                diffValue = Math.round(f * 255);
              }

              // Blend: at top of feather, it is 100% generated (255). At bottom (collarY), it uses the difference value
              maskValue = Math.round(255 * (1.0 - factor) + diffValue * factor);
            } else {
              // Below collar line (shoulders, clothing, background), use the difference mask
              const rDiff = Math.abs(genPixels.data[i] - origPixels.data[i]);
              const gDiff = Math.abs(genPixels.data[i+1] - origPixels.data[i+1]);
              const bDiff = Math.abs(genPixels.data[i+2] - origPixels.data[i+2]);
              const diff = (rDiff + gDiff + bDiff) / 3.0;

              const blendRange = 12;
              if (diff < threshold) {
                maskValue = 0;
              } else if (diff > (threshold + blendRange)) {
                maskValue = 255;
              } else {
                const factor = (diff - threshold) / blendRange;
                maskValue = Math.round(factor * 255);
              }
            }
          } else {
            // For outfits, makeup, or aesthetic treatments where face/hair preservation is inactive,
            // we use the difference mask thresholding everywhere
            const rDiff = Math.abs(genPixels.data[i] - origPixels.data[i]);
            const gDiff = Math.abs(genPixels.data[i+1] - origPixels.data[i+1]);
            const bDiff = Math.abs(genPixels.data[i+2] - origPixels.data[i+2]);
            const diff = (rDiff + gDiff + bDiff) / 3.0;

            const blendRange = 12;
            if (diff < threshold) {
              maskValue = 0;
            } else if (diff > (threshold + blendRange)) {
              maskValue = 255;
            } else {
              const factor = (diff - threshold) / blendRange;
              maskValue = Math.round(factor * 255);
            }
          }

          maskData.data[i] = 255;
          maskData.data[i+1] = 255;
          maskData.data[i+2] = 255;
          maskData.data[i+3] = maskValue;
        }
        maskCtx.putImageData(maskData, 0, 0);

        // Compute dilation radius dynamically for non-hair categories (beards, outfits)
        let dilationRadius = 0;
        const isOutfitEdited = currentState.selectedOutfit && currentState.selectedOutfit.id !== 'original';
        const isCustomLookActive = !!currentState.selectedCustomLookId;

        if (isBeardEdited) {
          dilationRadius = Math.max(dilationRadius, currentState.selectedBeardStyle?.id === 'none' ? 14 : 8);
        }
        if (isOutfitEdited || isCustomLookActive) {
          dilationRadius = Math.max(dilationRadius, 12);
        }

        if (dilationRadius > 0) {
          dilateCanvas(maskCanvas, dilationRadius);
        }

        // Apply pure-JS box blur to feather the mask edges smoothly, avoiding iOS filter-blur software-rendering fallback
        // Changed to 1 pass for sharp, high-frequency generated details while preserving antialiasing
        blurCanvas(maskCanvas, 1);

        // 2. Composite at full resolution matching the original image
        const finalCanvas = document.createElement("canvas");
        const finalWidth = imgOrig.width;
        const finalHeight = imgOrig.height;
        finalCanvas.width = finalWidth;
        finalCanvas.height = finalHeight;
        const finalCtx = finalCanvas.getContext("2d");
        if (!finalCtx) {
          resolve(generatedSrc);
          return;
        }

        // Enable high-quality scaling on final canvas
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';

        // Draw original high-resolution image first
        finalCtx.drawImage(imgOrig, 0, 0, finalWidth, finalHeight);

        // Create temporary canvas to draw the generated image masked
        const genCanvas = document.createElement("canvas");
        genCanvas.width = finalWidth;
        genCanvas.height = finalHeight;
        const genCtx = genCanvas.getContext("2d");
        if (!genCtx) {
          resolve(generatedSrc);
          return;
        }

        // Enable high-quality scaling on temp canvas
        genCtx.imageSmoothingEnabled = true;
        genCtx.imageSmoothingQuality = 'high';

        // Draw generated image onto temporary canvas
        genCtx.drawImage(imgGen, 0, 0, finalWidth, finalHeight);

        // Apply skin color consistency correction at full resolution if offsets are active
        if (hasCorrectionOffsets) {
          const genFullData = genCtx.getImageData(0, 0, finalWidth, finalHeight);
          const fullLen = genFullData.data.length;

          // If bald is selected, we avoid correcting the top scalp area to keep the generated bald head consistent
          const isBaldSelected = currentState.selectedHairStyle?.id === 'bald';

          for (let i = 0; i < fullLen; i += 4) {
            const pixelIdx = i / 4;
            const y = Math.floor(pixelIdx / finalWidth);

            // Skip top 38% of image when bald to prevent skin offset tinting the new smooth scalp
            if (isBaldSelected && y < (finalHeight * 0.38)) {
              continue;
            }

            const r = genFullData.data[i];
            const g = genFullData.data[i+1];
            const b = genFullData.data[i+2];

            if (isSkinColor(r, g, b)) {
              let cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
              let cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
              const yVal = 0.299 * r + 0.587 * g + 0.114 * b;

              cb += cbOffset;
              cr += crOffset;

              const newR = yVal + 1.402 * (cr - 128);
              const newG = yVal - 0.344136 * (cb - 128) - 0.714136 * (cr - 128);
              const newB = yVal + 1.772 * (cb - 128);

              genFullData.data[i] = Math.max(0, Math.min(255, Math.round(newR)));
              genFullData.data[i+1] = Math.max(0, Math.min(255, Math.round(newG)));
              genFullData.data[i+2] = Math.max(0, Math.min(255, Math.round(newB)));
            }
          }
          genCtx.putImageData(genFullData, 0, 0);
        }

        // Apply high-res masked compositing: draw the mask upscaled (edges are already smooth)
        genCtx.globalCompositeOperation = 'destination-in';
        genCtx.drawImage(maskCanvas, 0, 0, finalWidth, finalHeight);

        // Draw the masked generated image on top of the original
        finalCtx.drawImage(genCanvas, 0, 0);

        // Attach debug information for visual developer inspection
        if (typeof window !== 'undefined') {
          // Extract final alpha array for debug visualization
          const finalMaskData = maskCtx.getImageData(0, 0, compWidth, compHeight);
          const finalAlphaArray = new Uint8Array(compWidth * compHeight);
          for (let i = 0; i < len; i += 4) {
            finalAlphaArray[i/4] = finalMaskData.data[i+3];
          }

          (window as any).__debugMasks = {
            compWidth,
            compHeight,
            hairMask: finalAlphaArray,
            diffMask: maskData.data,
            originalImage: currentState.originalImage,
            generatedImage: generatedSrc,
            finalComposite: finalCanvas.toDataURL("image/jpeg", 0.95)
          };
        }

        resolve(finalCanvas.toDataURL("image/jpeg", 0.95));
      }
    };

    imgOrig.onload = onLoaded;
    imgGen.onload = onLoaded;
    imgOrig.onerror = () => resolve(generatedSrc);
    imgGen.onerror = () => resolve(generatedSrc);
    imgOrig.src = originalSrc;
    imgGen.src = generatedSrc;
  });
};

// Detailed Style Prompt Mappings for 100% Accuracy
const STYLE_PROMPTS: Record<string, string> = {
  bald: "completely bald head, shaved smooth to the skin",
  buzz: "short military buzz cut close to the scalp",
  crew: "classic crew cut with short tapered sides and slightly longer hair on top",
  undercut: "undercut haircut with shaved sides and back, and longer styled hair swept back on top",
  fade: "high skin fade haircut, where the hair tapers down to bare skin on the sides and back",
  pompadour: "classic voluminous pompadour hairstyle, swept upwards and backwards from the forehead",
  quiff: "modern quiff hairstyle with height and volume at the front hairline",
  slick: "slicked-back hairstyle, combed flat and straight back using pomade",
  sidepart: "classic gentleman's side-parted hairstyle, split on one side and combed neatly",
  curlytop: "curly top haircut with short sides and thick, textured curly hair on top",
  dreads: "medium-length dreadlock locs hanging down",
  manbun: "man bun hairstyle, with hair pulled back and tied into a bun at the crown",
  surfer: "long wavy surfer style hair, falling naturally down to the shoulders",
  afro: "classic volumetric rounded afro hairstyle with thick, dense kinky hair curls",
  fauxhawk: "faux hawk hairstyle with short tapered sides and a spiked central ridge of hair running from front to back",
  mullet: "classic retro mullet hairstyle, short on the front and sides, and flowing into long hair covering the back of the neck",
  taper: "clean classic taper fade haircut, with short sides and natural texture on top",
  topknot: "top knot hairstyle, with shaved undercut sides and back, and hair gathered into a neat bun or ponytail at the crown of the head",
  male_induction_cut: "induction cut, which is an ultra-short buzz cut shaved to a uniform level very close to the scalp",
  male_burr_cut: "burr cut, which is a very short buzz cut clipper-shaved uniformly close to the head",
  male_butch_cut: "butch cut, which is a short haircut styled flat on top and tapered slightly on the sides",
  male_caesar_cut: "classic Caesar cut with short, horizontally cut straight bangs on the forehead",
  male_french_crop: "French crop haircut with a textured crop on top and a clean blunt fringe",
  male_textured_crop: "modern textured crop with messy, textured layers on top and short sides",
  male_ivy_league: "Ivy League haircut, neatly parted on the side with a short front quiff",
  male_regulation_cut: "neat regulation military haircut, parted on the side with closely cropped sides showing the scalp",
  male_short_spiky: "short spiky hair with defined textured spikes on top and short sides",
  male_short_messy: "short messy crop with textured layers styled casually",
  male_short_curly_fade: "short curly fade with natural tight curls on top and a clean skin fade on the sides",
  male_flat_top: "classic flat top haircut, where the hair on top is cut to stand flat and boxy",
  male_high_tight: "high and tight military haircut with completely shaved sides and a very short cropped patch on top",
  male_low_fade: "low fade haircut where the hair tapers down to skin very low on the head, just above the ears",
  male_mid_fade: "mid fade haircut where the hair tapers down to skin halfway up the sides and back",
  male_skin_fade: "skin fade haircut with high-contrast shaved sides transitioning smoothly into textured hair on top",
  male_drop_fade: "drop fade haircut that curves down behind the ears for a sleek, contoured outline",
  male_burst_fade: "burst fade haircut tapering in a circular pattern around the ears",
  male_temple_fade: "temple fade haircut, tapering only at the temples and sideburns",
  male_shadow_fade: "shadow fade haircut with a light, low-contrast blend on the sides and back",
  male_bald_fade: "high bald fade haircut, exposing the scalp on the sides and back",
  male_low_taper: "low taper haircut with a clean, subtle taper at the sideburns and neckline",
  male_mid_taper: "mid taper haircut with a balanced taper blend on the sides and back",
  male_edgar_cut: "sharp Edgar cut with a straight blunt fringe across the forehead and high faded sides",
  male_textured_edgar: "textured Edgar cut with messy textured layers on top and a straight blunt fringe",
  male_bro_flow: "bro flow hairstyle with medium-length hair swept back naturally behind the ears",
  male_comb_over: "classic comb over haircut with a neat side part and hair combed to one side",
  male_modern_comb_over: "modern comb over with a sharp part, high volume on top, and faded sides",
  male_brushed_back: "medium-length brushed back hairstyle with soft texture",
  male_textured_fringe: "textured fringe haircut with messy layers falling forward over the forehead",
  male_angular_fringe: "angular fringe haircut with side-swept asymmetric bangs cut at an angle",
  male_middle_part: "classic middle part hairstyle with medium-length hair falling symmetrically on both sides",
  male_curtains: "curtains hairstyle with parted medium-length hair framing the face",
  male_messy_quiff: "messy quiff hairstyle with textured, voluminous front lift",
  male_modern_pompadour: "modern pompadour with high-contrast faded sides and a high-volume swept-back top",
  male_slick_back_fade: "slicked-back hairstyle with a high taper fade on the sides",
  male_side_swept: "side-swept hair styled with medium volume swept to one side",
  male_wavy_side_part: "wavy side part haircut with textured natural waves combed to the side",
  male_long_straight: "long straight hair falling naturally past the shoulders",
  male_long_wavy: "long wavy hair with natural flowing waves falling past the shoulders",
  male_long_curly: "long curly hair with voluminous natural curls falling past the shoulders",
  male_shoulder_length: "shoulder-length hair styled with relaxed middle part",
  male_half_up_bun: "half-up man bun with the top section tied into a bun and the lower half flowing down",
  male_low_bun: "low man bun gathered neatly at the nape of the neck",
  male_samurai_knot: "samurai top knot style with shaved sides and a high tied knot on top",
  male_viking_hair: "long rugged Viking hair with braids and a high half-undercut bun",
  male_long_undercut: "long hair styled swept to one side with a sharp undercut underneath",
  male_layered_long: "long hair with textured flowing layers",
  male_curly_fringe: "curly fringe haircut with defined curls falling forward over the forehead",
  male_curly_undercut: "curly undercut with shaved sides and voluminous tight curls on top",
  male_curly_fade: "curly fade with tapered sides and textured curls on top",
  male_coiled_top: "coiled top haircut with tight natural coils on top and short sides",
  male_twist_out: "twist out hairstyle with defined natural texture and volume",
  male_two_strand_twists: "two-strand twists styled neatly over the scalp",
  male_short_twists: "short twists styled close to the head",
  male_sponge_twists: "sponge twists with textured coiled curl definition",
  male_freeform_locs: "natural freeform locs styled with organic texture",
  male_short_locs: "neat short locs styled close to the scalp",
  male_medium_locs: "medium-length locs hanging down",
  male_braided_cornrows: "neat braided cornrows styled in parallel lines along the scalp",
  male_box_braids: "classic neat box braids hanging down",
  male_braided_top_knot: "braided top knot with clean undercut sides and braids gathered into a bun",
  male_modern_mullet: "modern mullet haircut with textured layers and a tapered temple area",
  male_burst_fade_mullet: "burst fade mullet with faded temple circles and long textured hair in the back",
  male_wolf_cut: "textured wolf cut with shaggy layers and a soft fringe",
  male_mohawk: "classic mohawk with completely shaved sides and a narrow spiked central strip of hair",
  male_braided_mohawk: "braided mohawk with shaved sides and neat braids forming a center crest",
  male_faux_locs: "textured faux locs styled over the scalp",
  male_clean_shaved_head: "completely smooth, clean shaved head showing the skin",
  male_receding_hairline: "mature receding hairline cut with thinning hair at the temples",
  male_salt_pepper_hair: "classic short haircut with mature salt-and-pepper grey hair color",
  male_mature_classic_cut: "clean, classic gentlemen's haircut suitable for mature styles",
  cornrows: "neatly braided cornrows styled in tight parallel rows along the scalp, extending back to the nape of the neck",
  pixie: "short pixie haircut with textured layers and short sides",
  bob: "straight, chin-length bob haircut, cut evenly all around",
  lob: "long bob (lob) haircut, resting just above the shoulders",
  shoulder: "shoulder-length hair with soft layers",
  longstraight: "long, straight, sleek hair falling down past the shoulders",
  longwavy: "long, wavy hair with loose beach waves falling past the shoulders",
  curly: "voluminous curly hairstyle with defined curls, ringlets, and thick texture",
  bangs: "straight hair with flat bangs (fringe) covering the forehead",
  braids: "hair styled into long, neat braids",
  updo: "elegant updo hairstyle, with hair swept up and pinned neatly in a bun",
  shag: "shag haircut with highly textured layered shag cuts, choppy layers, and full bangs covering the forehead",
  curtainbangs: "long wavy hair styled with middle-parted curtain bangs framing both sides of the face",
  pixiebob: "asymmetrical pixie bob cut, combines short cropped pixie layers on one side with a chin-length bob crop on the other",
  spacebuns: "fun double space buns hairstyle, with two high buns styled symmetrically on each side of the head",
  female_classic_pixie: "classic pixie haircut with short textured layers",
  female_textured_pixie: "shaggy textured pixie cut with choppy layers",
  female_curly_pixie: "curly pixie haircut with defined short curls on top",
  female_long_pixie: "long pixie cut with side-swept bangs",
  female_bixie_cut: "bixie cut, blending elements of a pixie and a bob",
  female_french_bob: "French bob cut, chin-length with straight blunt bangs",
  female_blunt_bob: "straight chin-length blunt bob",
  female_chin_length_bob: "chin-length bob haircut with subtle face-framing",
  female_layered_bob: "layered bob with soft textured volume",
  female_asymmetrical_bob: "asymmetrical bob cut, longer on one side",
  female_angled_bob: "angled bob, shorter in the back and sloping longer toward the front",
  female_curly_bob: "curly bob haircut with voluminous natural curls",
  female_wavy_bob: "wavy bob haircut with soft beachy waves",
  female_sleek_bob: "sleek, straight, high-shine bob haircut",
  female_bob_with_bangs: "classic bob haircut with thick straight bangs",
  female_medium_straight: "straight medium-length haircut falling to the collarbone",
  female_medium_wavy: "wavy medium-length hairstyle with soft layers",
  female_medium_curly: "curly medium-length hairstyle with textured ringlets",
  female_collarbone_length: "chic collarbone-length haircut",
  female_layered_shoulder: "shoulder-length haircut with textured layers",
  female_butterfly_cut: "butterfly cut with voluminous, wispy layers",
  female_medium_shag: "shaggy medium-length haircut with choppy layers",
  female_face_framing_layers: "medium-length hair with soft face-framing layers",
  female_blunt_lob: "blunt lob (long bob) haircut",
  female_layered_lob: "long bob with light texturizing layers",
  female_wavy_lob: "long bob styled with soft waves",
  female_curly_lob: "long bob styled with bouncy curls",
  female_sleek_lob: "sleek, straight long bob",
  female_extra_long_straight: "extra-long straight hair falling past the waist",
  female_extra_long_wavy: "extra-long wavy hair cascading past the waist",
  female_extra_long_curly: "extra-long curly hair with voluminous coils falling past the waist",
  female_long_layers: "long hair styled with flowing textured layers",
  female_feathered_layers: "long hair with classic feathered layers",
  female_butterfly_layers: "long hair with voluminous butterfly layers",
  female_long_face_framing: "long hair with soft face-framing layers",
  female_long_side_part: "long hair styled with a deep side part",
  female_long_middle_part: "long hair styled with a neat middle part",
  female_mermaid_waves: "long, deep, cascading mermaid waves",
  female_beach_waves: "long hair with relaxed, textured beach waves",
  female_hollywood_waves: "long hair styled with elegant, structured vintage Hollywood waves",
  female_loose_curls: "long hair styled with loose bouncy curls",
  female_defined_curls: "long hair with tight defined ringlet curls",
  female_voluminous_curls: "long hair with high-volume, bouncy curly texture",
  female_blunt_bangs: "straight haircut with thick, heavy blunt bangs covering the forehead",
  female_wispy_bangs: "soft, light wispy bangs framing the forehead",
  female_side_swept_bangs: "long hair with elegant side-swept bangs",
  female_micro_bangs: "haircut with short micro bangs cut high on the forehead",
  female_baby_bangs: "short baby bangs cut above the eyebrows",
  female_bottleneck_bangs: "bottleneck bangs that start narrow at the top and flare out around the eyes",
  female_birkin_bangs: "wispy, full French-style Birkin bangs",
  female_curly_bangs: "curly hair styled with defined curly bangs",
  female_long_curtain_bangs: "long curtain bangs that sweep outwards to frame the face",
  female_layered_fringe: "textured haircut with choppy layered fringe",
  female_box_braids: "long, neat box braids parting sections of the scalp",
  female_knotless_braids: "flat, seamless knotless braids styled neatly",
  female_cornrows: "neat parallel cornrow braids close to the scalp",
  female_fulani_braids: "Fulani braids with a center braid and side-swept beads",
  female_french_braids: "classic double French braids",
  female_dutch_braids: "double raised Dutch braids",
  female_fishtail_braid: "long, detailed fishtail braid",
  female_crown_braid: "neat braided crown wrapped around the head",
  female_halo_braid: "thick halo braid surrounding the crown",
  female_side_braid: "loose side-swept braid",
  female_braided_ponytail: "high sleek ponytail ending in a thick braid",
  female_braided_bun: "high bun styled from twisted braids",
  female_goddess_braids: "thick cornrow-style goddess braids",
  female_lemonade_braids: "side-swept lemonade braids",
  female_micro_braids: "tiny, thin micro braids flowing down",
  female_high_ponytail: "high, sleek ponytail gathered at the crown",
  female_low_ponytail: "neat low ponytail tied at the nape of the neck",
  female_sleek_ponytail: "super-sleek straight ponytail",
  female_bubble_ponytail: "trendy high bubble ponytail with tiered sections",
  female_curly_ponytail: "high ponytail showing voluminous curly texture",
  female_half_up_ponytail: "half-up ponytail with the rest of the hair flowing down",
  female_high_bun: "high, neat topknot bun",
  female_low_bun: "classic low bun resting at the neck",
  female_messy_bun: "casual, textured messy bun",
  female_sleek_bun: "sleek ballerina bun",
  female_top_knot: "neat, small top knot bun on top of the head",
  female_half_up_bun: "half-up bun with long waves flowing below",
  female_double_buns: "double top-knot buns",
  female_chignon: "elegant low chignon bun",
  female_french_twist: "classic sophisticated French twist updo",
  female_natural_afro: "voluminous, natural rounded afro style with tight coily texture",
  female_rounded_afro: "perfectly rounded voluminous afro",
  female_tapered_afro: "tapered afro, shorter on the sides and back, with volume on top",
  female_twist_out: "twist out style with defined coily curl patterns",
  female_braid_out: "braid out style with textured, wavy volume",
  female_wash_go: "natural wash-and-go curly hairstyle",
  female_defined_coils: "tight, highly defined natural coils",
  female_finger_coils: "neat finger coils styled over the scalp",
  female_two_strand_twists: "two-strand twists styled with natural coily hair",
  female_flat_twists: "flat twists running close to the scalp",
  female_passion_twists: "long passion twists with a curly texture",
  female_senegalese_twists: "neat, smooth Senegalese twists",
  female_faux_locs: "long, textured faux locs",
  female_butterfly_locs: "textured butterfly locs with distressed loops",
  female_short_locs: "short, neat locs",
  female_long_locs: "long, flowing locs",
  female_wolf_cut: "shaggy wolf cut with voluminous choppy layers and a wispy fringe",
  female_soft_wolf_cut: "softer wolf cut with gentle face-framing layers",
  female_jellyfish_cut: "jellyfish cut with a blunt bob outer layer and long under-layers",
  female_hime_cut: "classic Hime cut with straight bangs and cheek-length side-locks",
  female_octopus_cut: "octopus cut with a round top volume and wispy bottom layers",
  female_modern_shag: "modern shaggy haircut with textured layers",
  female_retro_shag: "retro 70s-style shag cut with high volume",
  female_mullet_shag: "mullet-shag hybrid cut",
  female_wet_look: "wet-look hairstyle, slicked back with high-gloss shine",
  female_slicked_back: "clean, straight slicked-back hairstyle",
  female_pin_curls: "structured vintage pin curls flat to the scalp",
  female_old_hollywood: "elegant, glossy Old Hollywood glam waves",
  female_boho_waves: "loose, flowing boho waves",
  female_bridal_updo: "elegant bridal updo with soft tendrils",
  female_braided_bridal: "detailed braided bridal updo",
  female_formal_updo: "sophisticated, structured formal updo",
  stubble: "light 3-day stubble facial hair along the jawline, chin, and upper lip",
  mustache: "thick classic mustache on the upper lip, with completely clean-shaven cheeks, jaw, and chin (absolutely no beard)",
  goatee: "a classic goatee beard consisting of hair only on the chin and a mustache forming a circle around the mouth, with completely clean-shaven cheeks and jawline (no hair on the sides of the face)",
  vandyke: "classic Van Dyke beard, consisting of a short pointed chin goatee and a separate classic mustache, with completely clean-shaven cheeks and jawline",
  balbo: "classic Balbo beard, consisting of a mustache, a wide chin beard, and a soul patch resembling an inverted T, with completely clean-shaven cheeks and sideburns",
  ducktail: "neatly trimmed full beard that tapers down to a sharp point at the chin, resembling a ducktail shape",
  anchor: "anchor-shaped beard, combining a thin mustache, a soul patch, and a thin chin strap along the jawline forming an anchor shape",
  chinstrap: "thin chinstrap beard running along the jawline from ear to ear, with clean-shaven cheeks and neck",
  muttonchops: "classic mutton chops sideburns extending down the cheeks to the corners of the mouth, with a clean-shaven chin and upper lip",
  short: "short, neatly trimmed full beard including mustache, cheeks, and chin",
  medium: "medium-length full beard covering the cheeks, chin, and mustache",
  long: "long, full bushy beard (lumberjack style) covering the chin, cheeks, and mustache",
  full: "thick full beard covering the cheeks, chin, and mustache",
  bandholz: "very long, full, natural-growing Bandholz beard with a thick, naturally styled mustache, flowing freely down without sharp edges",
  male_five_oclock_shadow: "very light five o\'clock shadow stubble across the cheeks, jaw, and upper lip",
  male_designer_stubble: "clean, trimmed designer stubble outlining the jawline",
  male_heavy_stubble: "dense, dark heavy stubble beard",
  male_chevron_mustache: "thick Chevron mustache covering the upper lip",
  male_pencil_mustache: "thin, sharp pencil mustache just above the upper lip line",
  male_handlebar_mustache: "handlebar mustache with curled-up tips",
  male_horseshoe_mustache: "Horseshoe mustache with vertical extensions running down to the jaw",
  male_walrus_mustache: "thick, bushy Walrus mustache drooping over the lips",
  male_natural_mustache: "naturally growing, unstyled mustache",
  male_petite_mustache: "small, neatly trimmed mustache",
  male_english_mustache: "English mustache with straight, pointed ends",
  male_lampshade_mustache: "lampshade mustache, straight along the lip and angled upwards",
  male_soul_patch: "small soul patch beard just below the lower lip",
  male_circle_beard: "round circle beard connecting the mustache and chin goatee",
  male_extended_goatee: "extended goatee running further along the jawline",
  male_petite_goatee: "small, narrow chin goatee",
  male_chin_puff: "narrow chin puff beard growing straight down from the chin",
  male_goatee_mustache: "classic goatee with connected mustache",
  male_detached_goatee: "chin goatee with a separate, disconnected mustache",
  male_short_boxed_beard: "short boxed beard with neat defined cheek lines",
  male_corporate_beard: "neat corporate beard, medium-short and well-groomed",
  male_tapered_beard: "tapered beard fading smoothly into the sideburns",
  male_faded_beard: "faded beard with a skin fade on the sideburns and upper cheeks",
  male_sculpted_beard: "sharp, sculpted beard with crisp, defined lines",
  male_defined_jawline: "beard styled to emphasize and define the jawline",
  male_short_rounded: "short full beard trimmed to a round shape",
  male_long_boxed_beard: "long boxed beard with structured cheek and jaw lines",
  male_garibaldi: "wide, round Garibaldi beard with a connected mustache",
  male_verdi: "styled Verdi beard with a handlebar mustache and a short, rounded chin beard",
  male_hollywoodian: "Hollywoodian beard, connecting the chin and jaw with shaved sideburns",
  male_yeard: "yeard beard representing one full year of natural growth",
  male_natural_full_beard: "naturally growing, unstyled full beard",
  male_groomed_full_beard: "thick full beard, perfectly trimmed and groomed",
  male_beardstache: "prominent thick mustache combined with short stubble on the cheeks and jaw",
  male_mustache_stubble: "defined mustache with light stubble",
  male_mustache_short_beard: "mustache paired with a short, trimmed beard",
  male_bald_with_beard: "full beard paired with a clean shaved head",
  male_fade_beard_blend: "clean skin fade haircut that blends seamlessly into sideburns and a full beard",
  male_sharp_line_up: "beard with a sharp, clean line-up along the cheeks and neck",
  male_salt_pepper_beard: "mature full beard with a natural salt-and-pepper grey blend",
  male_mature_trimmed_beard: "neat, classic trimmed beard suitable for a mature look",
};

// Detailed Color Prompt Mappings
const COLOR_PROMPTS: Record<string, string> = {
  black: "jet black",
  darkbrown: "dark brown",
  brown: "medium brown",
  lightbrown: "light brown",
  blonde: "golden blonde",
  platinum: "icy platinum blonde",
  red: "ginger red",
  auburn: "deep auburn",
  grey: "natural silver grey",
  white: "pure white",
  blue: "vibrant electric blue",
  green: "emerald green",
  pink: "hot pink",
  blonde_highlights: "natural dark base hair with golden blonde highlights woven throughout the strands",
  brown_highlights: "dark base hair with warm honey brown highlights woven throughout the strands",
  platinum_highlights: "dark base hair with icy platinum silver highlights woven throughout the strands",
  blue_highlights: "dark base hair with vibrant electric blue highlights woven throughout the strands",
  pink_highlights: "dark base hair with bright pastel pink highlights woven throughout the strands",
  blonde_ombre: "dark roots fading smoothly into golden blonde mid-shafts and tips (ombre style)",
  brown_ombre: "dark roots fading smoothly into warm medium brown tips (ombre style)",
  red_ombre: "dark roots fading smoothly into vibrant ginger red tips (ombre style)",
  blue_ombre: "dark roots fading smoothly into electric blue tips (ombre style)",
  pink_ombre: "dark roots fading smoothly into soft pastel pink tips (ombre style)",
  grey_highlights: "natural salt and pepper style with silver grey highlights woven through the dark base",
};

export const generateStylePreview = async (
  currentState: AppState,
  styleSnapshotOverride?: {
    hairstyleId: string;
    hairColorId: string;
    beardId: string;
    beardColorId: string;
    aesthetics: Record<string, number>;
    makeup: string;
    outfitId: string;
    eyeColorId?: string;
  },
  seedOverride?: number
): Promise<string> => {
  if (!currentState.originalImage) {
    throw new Error("No image to edit");
  }

  const gender = currentState.gender;
  let selectedHairStyle = currentState.selectedHairStyle;
  let selectedHairColor = currentState.selectedHairColor;
  let selectedBeardStyle = currentState.selectedBeardStyle;
  let selectedBeardColor = currentState.selectedBeardColor;
  let selectedOutfit = currentState.selectedOutfit;
  let selectedMakeup = currentState.selectedMakeup;
  let selectedEyeColor = currentState.selectedEyeColor;
  let selectedTreatments = currentState.selectedTreatments || [];

  if (styleSnapshotOverride) {
    selectedHairStyle = styleSnapshotOverride.hairstyleId === "original" ? null : { id: styleSnapshotOverride.hairstyleId, label: styleSnapshotOverride.hairstyleId, category: "hair", type: "style" };
    selectedHairColor = styleSnapshotOverride.hairColorId === "natural" ? null : { id: styleSnapshotOverride.hairColorId, label: styleSnapshotOverride.hairColorId, category: "hair", type: "color" };
    selectedBeardStyle = styleSnapshotOverride.beardId === "beard_none" ? { id: "none", label: "Clean Shaven", category: "beard", type: "style" } : { id: styleSnapshotOverride.beardId, label: styleSnapshotOverride.beardId, category: "beard", type: "style" };
    selectedBeardColor = styleSnapshotOverride.beardColorId === "natural" ? null : { id: styleSnapshotOverride.beardColorId, label: styleSnapshotOverride.beardColorId, category: "beard", type: "color" };
    selectedOutfit = styleSnapshotOverride.outfitId === "original" ? null : { id: styleSnapshotOverride.outfitId, label: styleSnapshotOverride.outfitId, category: "outfit", type: "style" };
    selectedMakeup = styleSnapshotOverride.makeup === "makeup_none" ? null : { id: styleSnapshotOverride.makeup, label: styleSnapshotOverride.makeup, category: "makeup", type: "style" };
    
    const targetEyeColorId = styleSnapshotOverride.eyeColorId || "eyecolor_original";
    selectedEyeColor = targetEyeColorId === "eyecolor_original" ? null : { id: targetEyeColorId, label: targetEyeColorId, category: "eyecolor", type: "style" };

    selectedTreatments = Object.entries(styleSnapshotOverride.aesthetics)
      .filter(([_, val]) => (val as number) > 0)
      .map(([id, val]) => ({
        treatmentId: id,
        value: Math.ceil((val as number) / 20),
        label: id
      }));
  }
  
  const promptParts: string[] = [];

  // Fetch custom look preset if active (safely validating preset exists and is enabled)
  const activePreset = currentState.selectedCustomLookId 
    ? CUSTOM_LOOK_PRESETS.find(p => p.id === currentState.selectedCustomLookId && p.enabled)
    : null;

  if (activePreset) {
    promptParts.push("Modify the subject in this photo with highly realistic, visible, and pronounced style transformations according to these specifications:");
    promptParts.push(`- BASE CUSTOM LOOK: ${activePreset.prompt}`);

    // Compile category overrides that take precedence over the Custom Look base style
    
    // --- Hairstyle override ---
    if (selectedHairStyle && selectedHairStyle.id !== 'original') {
      const isBald = selectedHairStyle.id === 'bald';
      if (isBald) {
        promptParts.push(`- HAIRSTYLE OVERRIDE: Regardless of the Custom Look base style, create a completely bald, fully shaved scalp. Remove all existing scalp hair, including the main hairstyle, hairline, temple hair, side hair, crown hair, stray strands, wisps, flyaways, and the full outline or silhouette of the original hairstyle. Reconstruct the natural scalp beneath the removed hair with realistic skin texture, pores, lighting, highlights, shadows, and consistent skin tone. The final image must contain no visible hair strands, no hair shadow, no transparent hair remnants, no ghosted original hairstyle, no buzz cut, and no receding-hair interpretation.
- STRICT EYEBROW PRESERVATION: Do NOT modify or remove the eyebrows or eyelashes. The eyebrows must remain exactly identical to the input image in shape, thickness, density, color, and position.`);
      } else {
        const styleDesc = STYLE_PROMPTS[selectedHairStyle.id] || selectedHairStyle.label;
        promptParts.push(`- HAIRSTYLE OVERRIDE: Regardless of the Custom Look base style, completely replace the existing hairstyle with: ${styleDesc}. Remove the full previous hairstyle, including the crown, top volume, side volume, temples, back hair, loose strands, flyaways, outer silhouette, and any visible remnants of the previous hair. Do not layer the new hairstyle over the previous hairstyle. Do not preserve or blend the old hair. Do not leave transparent, faded, doubled, shadowed, or ghosted hair behind. Generate one single coherent hairstyle that is fully opaque, naturally attached to the scalp, and correctly blended with the forehead, ears, head shape, lighting, and background.`);
      }
    }

    // --- Hair color override ---
    if (selectedHairColor && selectedHairColor.id !== 'original' && selectedHairStyle?.id !== 'bald') {
      const colorDesc = COLOR_PROMPTS[selectedHairColor.id] || selectedHairColor.label;
      promptParts.push(`- HAIR COLOR OVERRIDE: Regardless of the Custom Look base style, dye all head hair specifically to a vibrant, clearly visible ${colorDesc} color.`);
    }

    // --- Beard style override ---
    const hasSelectedBeard = selectedBeardStyle && selectedBeardStyle.id !== 'original' && selectedBeardStyle.id !== 'none';
    if ((gender === Gender.MALE || hasSelectedBeard) && selectedBeardStyle && selectedBeardStyle.id !== 'original') {
      const isCleanShaven = selectedBeardStyle.id === 'none';
      if (isCleanShaven) {
        promptParts.push(`- BEARD OVERRIDE: Regardless of the Custom Look base style, create a completely clean-shaven face. Remove all beard and mustache hair, including dense hair, individual hairs, stubble, beard shadow, sideburn remnants, jaw hair, chin hair, upper-lip hair, cheek hair, and neck hair associated with the beard. Reconstruct natural skin beneath the removed facial hair with realistic pores, texture, lighting, contours, and consistent skin tone. The final image must contain no beard hairs, no mustache hairs, no stubble, no dark or gray beard shadow, and no ghosted facial-hair remnants.`);
      } else {
        const styleDesc = STYLE_PROMPTS[selectedBeardStyle.id] || selectedBeardStyle.label;
        const styleId = selectedBeardStyle.id;
        const isMustacheOnly = (styleId.includes("mustache") || styleId === "mustache") && !styleId.includes("stubble") && !styleId.includes("beard");
        const isGoateeStyle = styleId === 'goatee' || 
                              styleId === 'vandyke' || 
                              styleId === 'balbo' || 
                              styleId === 'anchor' || 
                              styleId.includes('goatee') || 
                              styleId.includes('chin_puff') || 
                              styleId.includes('circle_beard') || 
                              styleId.includes('soul_patch');
        const isChinstrap = styleId === 'chinstrap' || styleId.includes('chinstrap');
        const isMuttonChops = styleId === 'muttonchops' || styleId.includes('muttonchops');
        
        if (isMustacheOnly) {
          promptParts.push(`- BEARD OVERRIDE: Regardless of the Custom Look base style, completely replace all facial hair with: ${styleDesc}.
- CLEAN SHAVEN JAW & CHEEKS: The cheeks, jawline, chin, and neck must be completely clean-shaven with smooth skin, absolutely no beard, no stubble, no sideburn hair, and no shadow. Only the mustache on the upper lip must remain.`);
        } else if (isGoateeStyle) {
          promptParts.push(`- BEARD OVERRIDE: Regardless of the Custom Look base style, completely replace all facial hair with: ${styleDesc} specifically on the chin and mustache area.
- CLEAN SHAVEN CHEEKS & SIDES: The cheeks, sideburns, upper jawline, and sides of the face must be completely clean-shaven with smooth, clear skin. There must be absolutely no beard, no stubble, no sideburn hair, and no shadow on the sides of the face. Hair must ONLY remain on the chin, mouth area, and mustache as defined.`);
        } else if (isChinstrap) {
          promptParts.push(`- BEARD OVERRIDE: Regardless of the Custom Look base style, completely replace all facial hair with: ${styleDesc} running as a thin line along the jawline.
- CLEAN SHAVEN CHEEKS & MUSTACHE: The cheeks, neck, chin center, and upper lip must be completely clean-shaven with smooth, clear skin. There must be absolutely no mustache, no neck beard, and no cheek hair.`);
        } else if (isMuttonChops) {
          promptParts.push(`- BEARD OVERRIDE: Regardless of the Custom Look base style, completely replace all facial hair with: ${styleDesc} on the sideburns and cheeks.
- CLEAN SHAVEN CHIN & MUSTACHE: The chin, neck, and upper lip must be completely clean-shaven with smooth, clear skin. There must be absolutely no mustache, no soul patch, and no chin beard.`);
        } else {
          promptParts.push(`- BEARD OVERRIDE: Regardless of the Custom Look base style, completely replace all facial hair with: ${styleDesc}.
- DENSE & OPAQUE BEARD: The generated beard and mustache must be thick, dense, and completely opaque (never thin, sparse, or transparent). For long or full beard styles, the hair must grow naturally downwards from the jaw and chin, fully covering the neck and the upper collar of the clothing, hiding them completely behind the thick hair strands. There must be no visible skin or collar showing through the beard body.`);
        }
      }
    }

    // --- Outfit override ---
    if (selectedOutfit && selectedOutfit.id !== 'original') {
      let outfitDesc = selectedOutfit.label;
      const isMale = gender === Gender.MALE;
      const mapped = OUTFIT_PROMPTS[selectedOutfit.id];
      if (mapped) {
        outfitDesc = isMale 
          ? (mapped.male || mapped.unisex || selectedOutfit.label) 
          : (mapped.female || mapped.unisex || selectedOutfit.label);
      }
      promptParts.push(`- OUTFIT OVERRIDE: Regardless of the Custom Look base style, replace the clothing with: ${outfitDesc}.`);
    }

    // --- Makeup override ---
    if (selectedMakeup && selectedMakeup.id !== 'original') {
      let makeupDesc = selectedMakeup.label;
      if (selectedMakeup.id === 'makeup_natural') makeupDesc = "soft natural glaze makeup: dewy skin foundation, mascara, pink lip balm";
      else if (selectedMakeup.id === 'makeup_bold') makeupDesc = "bold beauty makeup: matte red lipstick, winged black eyeliner, contouring";
      else if (selectedMakeup.id === 'makeup_smokey') makeupDesc = "smokey eyes makeup: charcoal eyeshadow, mascara, nude lip tone";
      else if (selectedMakeup.id === 'makeup_rose') makeupDesc = "warm rose glow makeup: soft pink blush, pink lip gloss, highlighter";
      else if (selectedMakeup.id === 'makeup_retouch') makeupDesc = "studio portrait skin retouching and clarity enhancement";

      promptParts.push(`- MAKEUP OVERRIDE: Regardless of the Custom Look base style, apply makeup specifically matching: ${makeupDesc}.`);
    }

    // --- Eye Color override ---
    if (selectedEyeColor && selectedEyeColor.id !== 'eyecolor_original') {
      let eyeColorDesc = "";
      if (selectedEyeColor.id === 'eyecolor_blue') eyeColorDesc = "a realistic, high-fidelity deep sapphire blue shade";
      else if (selectedEyeColor.id === 'eyecolor_green') eyeColorDesc = "a realistic, high-fidelity forest emerald green shade";
      else if (selectedEyeColor.id === 'eyecolor_hazel') eyeColorDesc = "a realistic, high-fidelity warm hazel shade with light golden tones";
      else if (selectedEyeColor.id === 'eyecolor_gray') eyeColorDesc = "a realistic, high-fidelity light slate steel gray shade";
      else if (selectedEyeColor.id === 'eyecolor_amber') eyeColorDesc = "a realistic, high-fidelity luminous light amber-yellow shade";

      promptParts.push(`- EYE COLOR OVERRIDE: Regardless of the Custom Look base style, transform the subject's iris color to: ${eyeColorDesc}. Keep the pupils, reflections, and surrounding eye details natural.`);
    }

  } else {
    // Normal compiler flow when no Custom Look is active
    promptParts.push("Modify the subject in this photo with highly realistic, visible, and pronounced style transformations according to these specifications (ensure the changes are clearly noticeable and prominent):");

    // --- 1. HAIRSTYLE ---
    const isHairStyleOriginal = !selectedHairStyle || selectedHairStyle.id === 'original';
    const isBald = selectedHairStyle?.id === 'bald';
    if (isHairStyleOriginal) {
      promptParts.push("- HAIRSTYLE: Do not change the hairstyle. Keep the hair length, shape, and cut exactly as it is in the original photo.");
    } else if (isBald) {
      promptParts.push(`- HAIRSTYLE TRANSFORMATION: Create a completely bald, fully shaved scalp.
Remove all existing scalp hair, including the main hairstyle, hairline, temple hair, side hair, crown hair, stray strands, wisps, flyaways, and the full outline or silhouette of the original hairstyle.
Reconstruct the natural scalp beneath the removed hair with realistic skin texture, pores, lighting, highlights, shadows, and consistent skin tone.
The final image must contain no visible hair strands, no hair shadow, no transparent hair remnants, no ghosted original hairstyle, no buzz cut, and no receding-hair interpretation.
- STRICT EYEBROW PRESERVATION: Do NOT modify or remove the eyebrows or eyelashes. The eyebrows must remain exactly identical to the input image in shape, thickness, density, color, and position. Preserve the person's identity, facial features, head shape, expression, pose, background, and all unrelated active customizations.`);
    } else {
      const styleDesc = STYLE_PROMPTS[selectedHairStyle.id] || selectedHairStyle.label;
      promptParts.push(`- HAIRSTYLE TRANSFORMATION: Completely erase and replace the original hair on top, sides, and back of the head. Completely replace the existing hairstyle with: ${styleDesc}. Remove the full previous hairstyle, including the crown, top volume, side volume, temples, back hair, loose strands, flyaways, outer silhouette, and any visible remnants of the previous hair. Do not layer the new hairstyle over the previous hairstyle. Do not preserve or blend the old hair. Do not leave transparent, faded, doubled, shadowed, or ghosted hair behind. Generate one single coherent hairstyle that is fully opaque, naturally attached to the scalp, and correctly blended with the forehead, ears, head shape, lighting, and background. Preserve the person's face, identity, skin tone, eyebrows, expression, pose, and unrelated active customizations.`);
    }

    // --- 2. HAIR COLOR ---
    const isHairColorOriginal = !selectedHairColor || selectedHairColor.id === 'original';
    if (!isBald) {
      if (isHairColorOriginal) {
        promptParts.push("- HAIR COLOR: Do not change the hair color. Keep the original hair color exactly as it is.");
      } else {
        const colorDesc = COLOR_PROMPTS[selectedHairColor.id] || selectedHairColor.label;
        promptParts.push(`- HAIR COLOR TRANSFORMATION: Dye all head hair to a vibrant, clearly visible ${colorDesc} color.`);
      }
    }

    // --- 3. FACIAL HAIR (BEARD / MUSTACHE) ---
    const hasSelectedBeard = selectedBeardStyle && selectedBeardStyle.id !== 'original' && selectedBeardStyle.id !== 'none';
    if (gender === Gender.MALE || hasSelectedBeard) {
      const isBeardStyleOriginal = !selectedBeardStyle || selectedBeardStyle.id === 'original';
      const isCleanShaven = selectedBeardStyle?.id === 'none';

      if (isBeardStyleOriginal) {
        promptParts.push("- BEARD STYLE: Do not change the beard style. Keep the original facial hair shape, density, or lack of facial hair exactly as it is.");
      } else if (isCleanShaven) {
        promptParts.push(`- BEARD TRANSFORMATION: Create a completely clean-shaven face.
Remove all beard and mustache hair, including dense hair, individual hairs, stubble, beard shadow, sideburn remnants, jaw hair, chin hair, upper-lip hair, cheek hair, and neck hair associated with the beard.
Reconstruct natural skin beneath the removed facial hair with realistic pores, texture, lighting, contours, and consistent skin tone.
The final image must contain no beard hairs, no mustache hairs, no stubble, no dark or gray beard shadow, and no ghosted facial-hair remnants.
Preserve the person's identity, facial structure, lips, skin tone, expression, scalp hairstyle, background, and all unrelated active customizations.`);
      } else {
        const styleDesc = STYLE_PROMPTS[selectedBeardStyle.id] || selectedBeardStyle.label;
        const styleId = selectedBeardStyle.id;
        const isMustacheOnly = (styleId.includes("mustache") || styleId === "mustache") && !styleId.includes("stubble") && !styleId.includes("beard");
        const isGoateeStyle = styleId === 'goatee' || 
                              styleId === 'vandyke' || 
                              styleId === 'balbo' || 
                              styleId === 'anchor' || 
                              styleId.includes('goatee') || 
                              styleId.includes('chin_puff') || 
                              styleId.includes('circle_beard') || 
                              styleId.includes('soul_patch');
        const isChinstrap = styleId === 'chinstrap' || styleId.includes('chinstrap');
        const isMuttonChops = styleId === 'muttonchops' || styleId.includes('muttonchops');
        
        if (isMustacheOnly) {
          promptParts.push(`- BEARD TRANSFORMATION: Completely replace all existing facial hair. Paint a brand new, highly visible, photorealistic ${styleDesc} on the upper lip.
- CLEAN SHAVEN JAW & CHEEKS: The cheeks, jawline, chin, and neck must be completely clean-shaven with smooth skin, absolutely no beard, no stubble, no sideburn hair, and no shadow. Only the mustache on the upper lip must remain.`);
        } else if (isGoateeStyle) {
          promptParts.push(`- BEARD TRANSFORMATION: Completely replace all existing facial hair. Paint a brand new, highly visible, photorealistic ${styleDesc} specifically on the chin and mustache area.
- CLEAN SHAVEN CHEEKS & SIDES: The cheeks, sideburns, upper jawline, and sides of the face must be completely clean-shaven with smooth, clear skin. There must be absolutely no beard, no stubble, no sideburn hair, and no shadow on the sides of the face. Hair must ONLY remain on the chin, mouth area, and mustache as defined.`);
        } else if (isChinstrap) {
          promptParts.push(`- BEARD TRANSFORMATION: Completely replace all existing facial hair. Paint a brand new, highly visible, photorealistic ${styleDesc} running as a thin line along the jawline.
- CLEAN SHAVEN CHEEKS & MUSTACHE: The cheeks, neck, chin center, and upper lip must be completely clean-shaven with smooth, clear skin. There must be absolutely no mustache, no neck beard, and no cheek hair.`);
        } else if (isMuttonChops) {
          promptParts.push(`- BEARD TRANSFORMATION: Completely replace all existing facial hair. Paint a brand new, highly visible, photorealistic ${styleDesc} on the sideburns and cheeks.
- CLEAN SHAVEN CHIN & MUSTACHE: The chin, neck, and upper lip must be completely clean-shaven with smooth, clear skin. There must be absolutely no mustache, no soul patch, and no chin beard.`);
        } else {
          promptParts.push(`- BEARD TRANSFORMATION: Completely replace all existing facial hair. Paint a brand new, highly visible, photorealistic ${styleDesc} covering the chin, cheeks, jawline, and mustache.
- DENSE & OPAQUE BEARD: The generated beard and mustache must be thick, dense, and completely opaque (never thin, sparse, or transparent). For long or full beard styles, the hair must grow naturally downwards from the jaw and chin, fully covering the neck and the upper collar of the clothing, hiding them completely behind the thick hair strands. There must be no visible skin or collar showing through the beard body.`);
        }
      }

      if (!isCleanShaven) {
        const isBeardColorOriginal = !selectedBeardColor || selectedBeardColor.id === 'original';
        if (isBeardColorOriginal) {
          promptParts.push("- BEARD COLOR: Do not change the facial hair color. Keep the original mustache and beard color exactly as it is.");
        } else if (selectedBeardColor.id === 'match') {
          const targetColor = isHairColorOriginal ? "the original hair color" : `${COLOR_PROMPTS[selectedHairColor.id]} (matching the new hair color)`;
          promptParts.push(`- BEARD COLOR: Dye all facial hair to ${targetColor}.`);
        } else {
          const colorDesc = COLOR_PROMPTS[selectedBeardColor.id] || selectedBeardColor.label;
          promptParts.push(`- BEARD COLOR: Dye all facial hair to a clearly visible ${colorDesc} color.`);
        }
      }
    } else {
      promptParts.push("- FACIAL HAIR: The face must remain completely clean-shaven with absolutely no mustache, stubble, or beard.");
    }

    // --- 4. OUTFIT / CLOTHING ---
    const isOutfitOriginal = !selectedOutfit || selectedOutfit.id === 'original';
    if (!isOutfitOriginal) {
      let outfitDesc = selectedOutfit.label;
      const isMale = gender === Gender.MALE;
      const mapped = OUTFIT_PROMPTS[selectedOutfit.id];
      if (mapped) {
        outfitDesc = isMale 
          ? (mapped.male || mapped.unisex || selectedOutfit.label) 
          : (mapped.female || mapped.unisex || selectedOutfit.label);
      }
      promptParts.push(`- OUTFIT: Apply simulated Outfit transformation: Replace clothing with ${outfitDesc}. Ensure fabric folds, lighting on material, shadows, and textures are photorealistic. Avoid distorted accessories or overlapping sleeves.`);
    } else {
      promptParts.push("- OUTFIT: Do not change the clothing. Keep the clothing exactly as it is in the original photo.");
    }

    // --- 5. MAKEUP ---
    const isMakeupOriginal = !selectedMakeup || selectedMakeup.id === 'original';
    if (!isMakeupOriginal) {
      const preset = MAKEUP_PRESETS.find(p => p.id === selectedMakeup.id);
      if (preset) {
        promptParts.push(`- MAKEUP: Apply the structured '${preset.name}' makeup look to the face. You MUST use the following precise cosmetics values:
        * Complexion Finish: ${preset.complexion.finish} finish with ${preset.complexion.coverage}% coverage, ${preset.complexion.glow}% glow, and ${preset.complexion.warmth}% warmth.
        * Eye Makeup: ${preset.eyes.eyeshadowStyle} eyeshadow in '${preset.eyes.eyeshadowColor}' color, '${preset.eyes.eyelinerStyle}' eyeliner style, and lash intensity at ${preset.eyes.lashIntensity}%.
        * Eyebrows: ${preset.brows.definition}% brow definition with a '${preset.brows.shape}' shape.
        * Cheeks & Face Contour: ${preset.cheeks.blushColor} blush at ${preset.cheeks.blushIntensity}% intensity, bronzer contour at ${preset.cheeks.bronzerIntensity}% intensity, and highlighter highlight at ${preset.cheeks.highlighterIntensity}% intensity.
        * Lip Color & Finish: '${preset.lips.color}' lip color with a '${preset.lips.finish}' texture finish and ${preset.lips.intensity}% intensity.
        
        Strictly preserve the subject's original facial anatomy, face shape, eye shape, and nose structure. Apply the makeup consistently so that the color shade, intensity, finish, and shape do not drift or vary across multiple rendering angles.`);
      } else if (selectedMakeup.id === 'makeup_retouch') {
        promptParts.push("- MAKEUP: Apply studio portrait skin retouching and clarity enhancement.");
      } else {
        promptParts.push(`- MAKEUP: Apply the styling look: ${selectedMakeup.label}. Keep the makeup clean, polished, and wearable.`);
      }
    } else {
      promptParts.push("- MAKEUP: Do not apply any makeup or cosmetics. Keep the face, skin texture, lips, and eye makeup exactly as they are in the original photo.");
    }

    // --- 5.5 EYE COLOR ---
    const isEyeColorOriginal = !selectedEyeColor || selectedEyeColor.id === 'eyecolor_original';
    if (!isEyeColorOriginal) {
      let eyeColorDesc = "";
      if (selectedEyeColor.id === 'eyecolor_blue') eyeColorDesc = "a realistic, high-fidelity deep sapphire blue shade";
      else if (selectedEyeColor.id === 'eyecolor_green') eyeColorDesc = "a realistic, high-fidelity forest emerald green shade";
      else if (selectedEyeColor.id === 'eyecolor_hazel') eyeColorDesc = "a realistic, high-fidelity warm hazel shade with light golden tones";
      else if (selectedEyeColor.id === 'eyecolor_gray') eyeColorDesc = "a realistic, high-fidelity light slate steel gray shade";
      else if (selectedEyeColor.id === 'eyecolor_amber') eyeColorDesc = "a realistic, high-fidelity luminous light amber-yellow shade";

      promptParts.push(`- EYE COLOR: Transform the subject's iris color to: ${eyeColorDesc}. Keep the pupils, white of the eyes (sclera), reflections, eye shape, and surrounding facial structures exactly as they are in the original photo.`);
    } else {
      promptParts.push("- EYE COLOR: Strictly preserve the subject's original natural eye color and iris details. Do not modify the eyes.");
    }
  }

  // --- 6. AESTHETICS (IF ACTIVE) ---
  if (selectedTreatments && selectedTreatments.length > 0) {
    selectedTreatments.forEach((treat) => {
      const fullTreat = AESTHETIC_TREATMENTS.find(t => t.id === treat.treatmentId);
      if (fullTreat) {
        const activeStep = fullTreat.steps.find(s => s.value === treat.value);
        if (activeStep && treat.value > 0) {
          let intensityDirective = "";
          if (treat.value === 1) {
            intensityDirective = "INTENSITY: Very subtle, soft, natural-looking simulation (approx 20% change). It must look refined, gentle, and barely perceptible.";
          } else if (treat.value === 2) {
            intensityDirective = "INTENSITY: Clearly visible, balanced, moderate simulation (approx 40% change). The change must be noticeable but remain aesthetically proportioned.";
          } else if (treat.value === 3) {
            intensityDirective = "INTENSITY: Highly contoured, defined, and prominent simulation (approx 60% change). The modification must be bold and immediately noticeable.";
          } else if (treat.value === 4) {
            intensityDirective = "INTENSITY: Very strong, highly pronounced simulation (approx 80% change). The modification must be very bold, striking, and dominant.";
          } else if (treat.value >= 5) {
            intensityDirective = "INTENSITY: Absolute maximum dramatic simulation (100% change). Completely erase wrinkles/blemishes or project the volume to its peak cosmetic level.";
          }
          promptParts.push(`- ${fullTreat.label.toUpperCase()}: Apply simulated ${fullTreat.label} (Dosing Delineator: ${activeStep.label}). ${intensityDirective} Instruction: ${activeStep.promptDesc}.`);
        }
      }
    });
  }

  promptParts.push(`
    CRITICAL QUALITY CONTROL RULES:
    1. Only modify the hair and facial hair regions (unless outfit, makeup, or aesthetic treatments are specified). 
    2. Do NOT change the shape, color, or style of anything else.
    3. NO HEAD SHIFTING: The head position, size, rotation, and angle must remain in the exact same pixel coordinates as the input photo. Do NOT shift, rotate, scale, or move the head. The eyes, nose, mouth, and chin must align perfectly.
    4. SKIN COMPLEXION PRESERVATION: Preserve the person's original natural skin tone and complexion exactly. Maintain consistent skin color across the forehead, cheeks, nose, lips, jaw, ears, neck, and all visible skin. Do not introduce pink, purple, green, gray, yellow, blue, or orange patches. Do not change ethnicity, complexion, undertone, tanning, or pigmentation. Do not apply global skin smoothing, whitening, darkening, recoloring, or airbrushing. Keep all natural skin texture, visible pores, freckles, and details exactly as in the original image.
    5. Keep the eyebrows 100% identical to the original image in shape, thickness, position, and color (unless specific cosmetic treatments/makeup are applied).
    6. PHOTOREALISTIC BEARD: Make sure the generated beard/mustache hair looks extremely natural and realistic with visible, fine, individual hair strands that naturally feather into the skin.
    7. STYLE CONSISTENCY: Keep all specified style selections (hairstyle, beard style, hair color, outfit, makeup) completely consistent and exactly as requested in this prompt. Do not drift, randomize, or revert these styles even while adjusting or applying other treatments (like skin glow, fillers, or botox).
  `);

  if (seedOverride !== undefined) {
    promptParts.push(`
      STRICT CROSS-ANGLE IDENTITY & STYLE COHERENCE:
      The subject in this photo is being generated as part of a 180° interactive preview. 
      You MUST keep the subject's face shape, jawline structure, skin tone, skin texture, age, hairline, fade height, hair texture, beard density, beard lines, outfit cut, outfit colors, outfit fabric, makeup intensity, and lighting 100% consistent with other generated angles. 
      Avoid any random style drift or identity shifts. Perform the try-on precisely on the source angle.
    `);
  }

  const prompt = promptParts.join("\n");
  console.log("[GEMINI_SERVICE] Compiled Prompt:\n", prompt);

  try {
    const compressedImage = await compressImageBase64(currentState.originalImage, 1440, 0.98);
    const { mimeType, data } = parseDataUrl(compressedImage);

    // Setup base URL. If in development on web local browser, route through Vite proxy to bypass CORS
    const isNative = Capacitor.isNativePlatform() || !!(window as any).Capacitor;
    let baseUrl = "https://generativelanguage.googleapis.com";
    if (!isNative && typeof window !== "undefined" && window.location.hostname === "localhost") {
      baseUrl = window.location.origin + "/api-gemini";
    }

    const apiKey = 
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.VITE_API_KEY ||
      import.meta.env.GEMINI_API_KEY ||
      (typeof process !== "undefined" && process.env ? (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY) : "") ||
      "AQ.Ab8RN6Kuy24bsVnPE4FhWqxW_4mT0kbMlQa8jTy1vHNiwZNMUg";

    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your environment variables or .env file.");
    }
    const url = `${baseUrl}/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;

    const payload: any = {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType, 
              data: data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE"
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: `You are a high-fidelity virtual try-on hair stylist, barber, and fashion editor. 
            
            YOUR TARGET MANDATE:
            - Accurately apply the requested style and color changes to the hair and beard.
            - If a style or color is marked "Do not change" or "Keep original", you must leave that specific feature untouched.
            - Ensure the colors selected for hair and beard match the prompt exactly (e.g. if blonde is selected, hair must be dyed golden blonde).
            - NATURAL FACIAL HAIR TEXTURE: The generated beard and mustache must look like real, high-resolution facial hair. It must feature distinct, fine hair strands, natural shading, and soft feathering where the hair meets the skin. Do NOT generate solid-painted blocks of color, blur, or drawn-on cartoon lines.
            
            IDENTITY, FACE, & SPATIAL ALIGNMENT RULES:
            - NO HEAD SHIFTING: The head position, size, rotation, and angle must remain in the exact same pixel coordinates as the input photo. Do NOT shift, rotate, scale, or move the head. The eyes, eyebrows, nose, mouth, and chin must align perfectly.
            - STRICT SKIN TEXTURE PRESERVATION: Do NOT smooth, blur, soften, filter, or airbrush the skin (except where makeup or skin aesthetic treatments are applied). The skin texture must remain completely natural, showing the original pores, freckles, wrinkles, facial lines, grain, skin tone, and details exactly as they are in the original image. Avoid any 'beautified', 'plastic', or 'airbrushed' look on the skin.
            - STRICT EYEBROW PRESERVATION: Do NOT modify the eyebrows. The shape, thickness, arches, density, color, and placement of the eyebrows must remain exactly identical to the input image.
            - The background, clothing, camera angle, lighting, and ambient shadows must not change at all.
            - Only modify pixels representing the hair-on-head region and the facial hair region.`
          }
        ]
      }
    };

    if (seedOverride !== undefined) {
      payload.generationConfig = {
        seed: seedOverride,
        temperature: 0.1
      };
    }

    // Generate a unique Request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Dev-only structured logging of request parameters (excluding raw base64 data)
    console.log(`[GEMINI_API_REQUEST] [ID: ${requestId}]`, {
      requestId,
      presetId: currentState.selectedCustomLookId || "none",
      presetVersion: activePreset ? activePreset.version : 0,
      imageDimensions: "1440px max dim (downsampled)",
      model: "gemini-3.1-flash-image",
      endpoint: baseUrl + "/v1beta/models/gemini-3.1-flash-image:generateContent",
      promptLength: prompt.length,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    console.log(`[GEMINI_API_RESPONSE] [ID: ${requestId}] [Duration: ${duration}ms] [Status: ${response.status}]`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GEMINI_API_ERROR] [ID: ${requestId}] Status: ${response.status}`, errText);
      
      let reason: GenerationErrorReason = "provider-rejected";
      if (response.status === 408 || response.status === 504) {
        reason = "timeout";
      } else if (response.status === 429) {
        reason = "rate-limited";
      } else if (response.status === 400 && errText.toLowerCase().includes("safety")) {
        reason = "moderation-blocked";
      }

      throw new GenerationError(reason, errText, String(response.status));
    }

    const resData = await response.json();
    
    // Log parsed shape for audit purposes
    console.log(`[GEMINI_API_PARSE] [ID: ${requestId}] Candidates: ${resData.candidates?.length || 0}, BlockReason: ${resData.promptFeedback?.blockReason || "none"}`);

    const parsedResult = parseGeminiResponse(resData);
    if (!parsedResult.ok) {
      console.error(`[GEMINI_API_PARSE_FAILED] [ID: ${requestId}] Reason: ${parsedResult.reason}, Details: ${parsedResult.details}`);
      throw new GenerationError(parsedResult.reason, parsedResult.details, parsedResult.providerCode);
    }

    const generatedBase64 = `data:${parsedResult.image.mimeType};base64,${parsedResult.image.base64}`;
    const blendedBase64 = await applyDifferenceMask(currentState.originalImage, generatedBase64, currentState);
    return blendedBase64;
  } catch (error: any) {
    if (error instanceof GenerationError) {
      throw error;
    }
    console.error("Gemini API Error details:", error?.message || error, error?.stack);
    throw new GenerationError("provider-rejected", error?.message || String(error));
  }
};