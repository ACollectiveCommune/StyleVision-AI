import { AppState, Gender } from "../types";
import { Capacitor } from "@capacitor/core";

// Helper to extract mime type and base64 data from a Data URL
const parseDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image format");
  }
  return { mimeType: matches[1], data: matches[2] };
};

// Loader helper for canvas blending
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

// Client-side Pixel-by-Pixel difference restorer with spatial face-masking
const applyDifferenceMask = async (originalSrc: string, generatedSrc: string, currentState: AppState): Promise<string> => {
  try {
    const [imgOrig, imgGen] = await Promise.all([
      loadImage(originalSrc),
      loadImage(generatedSrc)
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = imgOrig.width;
    canvas.height = imgOrig.height;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context for mask blending");

    // Draw original image to extract original pixels
    ctx.drawImage(imgOrig, 0, 0);
    const origData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Draw generated image to extract edited pixels
    ctx.drawImage(imgGen, 0, 0, canvas.width, canvas.height);
    const genData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const outputData = ctx.createImageData(canvas.width, canvas.height);
    
    const w = canvas.width;
    const h = canvas.height;
    
    // Define an elliptical face region to target our detail preservation
    const cx = w / 2;
    const cy = h * 0.52;
    const rx = w * 0.22; // Horizontal radius (covers eyes, eyebrows, cheeks, nose, mouth)
    const ry = h * 0.22; // Vertical radius (covers forehead to chin)

    const len = origData.data.length;
    
    const isHairEdited = (currentState.selectedHairStyle.id !== 'original') || (currentState.selectedHairColor.id !== 'original');
    const isBeardStyleChanged = currentState.selectedBeardStyle.id !== 'original';
    const isBeardEdited = isBeardStyleChanged || (currentState.selectedBeardColor.id !== 'original');

    console.log("[MASK LOG] Blending image coordinates:", w, "x", h);
    console.log("[MASK LOG] isHairEdited:", isHairEdited, "isBeardEdited:", isBeardEdited, "isBeardStyleChanged:", isBeardStyleChanged);
    console.log("[MASK LOG] Selected style:", currentState.selectedHairStyle?.id, "/", currentState.selectedBeardStyle?.id);
    console.log("[MASK LOG] Selected color:", currentState.selectedHairColor?.id, "/", currentState.selectedBeardColor?.id);

    // We use a lower threshold of 32 (with a feather of 8) so that AI-generated shifts/shadows
    // are cleanly applied without leaving "residue" outlines, while preserving high-contrast
    // micro-features (like eyebrows/eyes) perfectly.
    const threshold = 32; 
    const featherColor = 8; 

    for (let i = 0; i < len; i += 4) {
      const pxIdx = i / 4;
      const x = pxIdx % w;
      const y = Math.floor(pxIdx / w);

      const r1 = origData.data[i];
      const g1 = origData.data[i+1];
      const b1 = origData.data[i+2];
      const a1 = origData.data[i+3];

      const r2 = genData.data[i];
      const g2 = genData.data[i+1];
      const b2 = genData.data[i+2];
      const a2 = genData.data[i+3];

      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const ellipseDistance = dx * dx + dy * dy;

      const nx = x / w;
      const ny = y / h;

      // Classify spatial regions
      const isHairRegion = (ny < 0.42) || (ellipseDistance > 0.85 && ny < 0.70);
      const isBeardRegion = (ny >= 0.58) || (ny >= 0.45 && Math.abs(nx - 0.5) > 0.20);
      
      const isEyebrowsOrEyes = (nx >= 0.28 && nx <= 0.72) && (ny >= 0.34 && ny <= 0.50);
      const isNose = (nx >= 0.38 && nx <= 0.62) && (ny >= 0.50 && ny <= 0.58);
      const isLips = (nx >= 0.36 && nx <= 0.64) && (ny >= 0.60 && ny <= 0.72);

      if (ellipseDistance > 1.25 && isHairEdited) {
        // Hair is edited, and we are in the outer hair region: Use generated pixels directly
        outputData.data[i] = r2;
        outputData.data[i+1] = g2;
        outputData.data[i+2] = b2;
        outputData.data[i+3] = a2;
      } else {
        // INSIDE FACE OR TRANSITION REGION OR NOT-EDITED OUTER REGION
        const colorDist = Math.sqrt(
          (r1 - r2) * (r1 - r2) +
          (g1 - g2) * (g1 - g2) +
          (b1 - b2) * (b1 - b2)
        );

        let finalR = r2, finalG = g2, finalB = b2, finalA = a2;

        // Set dynamic threshold based on semantic facial zones with soft boundaries
        let currentThreshold = 32;
        let currentFeather = 8;

        // Tight Lips Box (rx = 0.08, ry = 0.02, center = [0.5, 0.65])
        // Spans ny from 0.63 to 0.67. This strictly covers only red lip tissue,
        // leaving the mustache region above (0.55 - 0.62) and chin/goatee below (0.68+) editable.
        const distLips = Math.max(Math.abs(nx - 0.5) / 0.08, Math.abs(ny - 0.65) / 0.02);

        // Tight Eyebrows/Eyes/Nose Box (rx = 0.20, ry = 0.10, center = [0.5, 0.44])
        // Spans ny from 0.34 to 0.54. This covers brows, eyes, and nose base,
        // leaving the mustache region below (0.55+) editable.
        const distFace = Math.max(Math.abs(nx - 0.5) / 0.20, Math.abs(ny - 0.44) / 0.10);

        if (distFace < 1.0) {
          // Smoothly scale threshold up to 999 at the center of eyes/nose/brows
          currentThreshold = Math.round(32 + (999 - 32) * (1.0 - distFace));
        } else if (distLips < 1.0) {
          // Smoothly scale threshold up to 999 at the center of the lips
          currentThreshold = Math.round(32 + (999 - 32) * (1.0 - distLips));
        } else if (isHairRegion && !isHairEdited) {
          // Outer/upper hair is not edited: force preserve original
          currentThreshold = 999;
        } else if (isBeardRegion && !isBeardEdited) {
          // Beard is not edited: force preserve original facial hair/skin details
          currentThreshold = 999;
        } else if (isBeardRegion && isBeardEdited) {
          // Beard IS edited: set threshold to 14 (with feather 4)
          // to allow new style/color edits to pass through cleanly, while restoring
          // the original skin pore details on unaltered cheeks/jaw to look 100% natural.
          currentThreshold = 14;
          currentFeather = 4;
        }

        if (colorDist < currentThreshold - currentFeather) {
          // Restore original details (pores, skin lines, eyebrows)
          finalR = r1;
          finalG = g1;
          finalB = b1;
          finalA = a1;
        } else if (colorDist < currentThreshold + currentFeather) {
          // Transition zone: Blend smoothly
          const factor = (colorDist - (currentThreshold - currentFeather)) / (2 * currentFeather);
          finalR = Math.round(r1 * (1 - factor) + r2 * factor);
          finalG = Math.round(g1 * (1 - factor) + g2 * factor);
          finalB = Math.round(b1 * (1 - factor) + b2 * factor);
          finalA = Math.round(a1 * (1 - factor) + a2 * factor);
        }

        // Apply spatial boundary blending for the outer ellipse if hair is edited
        if (ellipseDistance > 0.85 && isHairEdited) {
          const spatialFactor = (ellipseDistance - 0.85) / 0.40; // 0 at 0.85, 1 at 1.25
          outputData.data[i] = Math.round(finalR * (1 - spatialFactor) + r2 * spatialFactor);
          outputData.data[i+1] = Math.round(finalG * (1 - spatialFactor) + g2 * spatialFactor);
          outputData.data[i+2] = Math.round(finalB * (1 - spatialFactor) + b2 * spatialFactor);
          outputData.data[i+3] = Math.round(finalA * (1 - spatialFactor) + a2 * spatialFactor);
        } else {
          outputData.data[i] = finalR;
          outputData.data[i+1] = finalG;
          outputData.data[i+2] = finalB;
          outputData.data[i+3] = finalA;
        }
      }
    }

    ctx.putImageData(outputData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.95);
  } catch (err) {
    console.error("Mask blending failed, falling back to raw generated image:", err);
    return generatedSrc;
  }
};

// Detailed Style Prompt Mappings for 100% Accuracy
const STYLE_PROMPTS: Record<string, string> = {
  // Male Hair
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
  
  // Female Hair
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

  // Beard
  stubble: "light 3-day stubble facial hair along the jawline, chin, and upper lip",
  mustache: "thick classic mustache on the upper lip, with completely clean-shaven cheeks, jaw, and chin (absolutely no beard)",
  goatee: "a classic goatee beard consisting of hair only on the chin and a mustache forming a circle around the mouth, with completely clean-shaven cheeks and jawline (no hair on the sides of the face)",
  chinstrap: "thin chinstrap beard running along the jawline from ear to ear, with clean-shaven cheeks and neck",
  short: "short, neatly trimmed full beard including mustache, cheeks, and chin",
  medium: "medium-length full beard covering the cheeks, chin, and mustache",
  long: "long, full bushy beard (lumberjack style) covering the chin, cheeks, and mustache",
  full: "thick full beard covering the cheeks, chin, and mustache",
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
  currentState: AppState
): Promise<string> => {
  if (!currentState.originalImage) {
    throw new Error("No image to edit");
  }

  const { gender, selectedHairStyle, selectedHairColor, selectedBeardStyle, selectedBeardColor } = currentState;
  
  const promptParts: string[] = [];

  promptParts.push("Modify the hair and facial hair in this photo according to the following specifications:");

  // --- 1. HAIRSTYLE ---
  const isHairStyleOriginal = selectedHairStyle.id === 'original';
  if (isHairStyleOriginal) {
    promptParts.push("- HAIRSTYLE: Do not change the hairstyle. Keep the hair length, shape, and cut exactly as it is in the original photo.");
  } else {
    const styleDesc = STYLE_PROMPTS[selectedHairStyle.id] || selectedHairStyle.label;
    promptParts.push(`- HAIRSTYLE: Replace the current hair with a ${styleDesc}.`);
  }

  // --- 2. HAIR COLOR ---
  const isHairColorOriginal = selectedHairColor.id === 'original';
  if (isHairColorOriginal) {
    promptParts.push("- HAIR COLOR: Do not change the hair color. Keep the original hair color exactly as it is.");
  } else {
    const colorDesc = COLOR_PROMPTS[selectedHairColor.id] || selectedHairColor.label;
    promptParts.push(`- HAIR COLOR: Dye the hair on the head to a ${colorDesc} color. Ensure all hair strands are evenly dyed to this color.`);
  }

  // --- 3. FACIAL HAIR (BEARD / MUSTACHE) ---
  if (gender === Gender.MALE) {
    // Beard Style
    const isBeardStyleOriginal = selectedBeardStyle.id === 'original';
    const isCleanShaven = selectedBeardStyle.id === 'none';

    if (isBeardStyleOriginal) {
      promptParts.push("- BEARD STYLE: Do not change the beard style. Keep the original facial hair shape, density, or lack of facial hair exactly as it is.");
    } else if (isCleanShaven) {
      promptParts.push("- BEARD STYLE: Remove all facial hair completely. The subject must be clean-shaven (no mustache, no goatee, no beard, no stubble).");
    } else {
      const styleDesc = STYLE_PROMPTS[selectedBeardStyle.id] || selectedBeardStyle.label;
      promptParts.push(`- BEARD STYLE: Apply a ${styleDesc}. Remove any other facial hair that does not belong to this style.`);
    }

    // Beard Color (Only send if they are NOT clean-shaven!)
    if (!isCleanShaven) {
      const isBeardColorOriginal = selectedBeardColor.id === 'original';
      if (isBeardColorOriginal) {
        promptParts.push("- BEARD COLOR: Do not change the facial hair color. Keep the original mustache and beard color exactly as it is.");
      } else if (selectedBeardColor.id === 'match') {
        const targetColor = isHairColorOriginal ? "the original hair color" : `${COLOR_PROMPTS[selectedHairColor.id]} (matching the new hair color)`;
        promptParts.push(`- BEARD COLOR: Dye the mustache and beard hair to ${targetColor}.`);
      } else {
        const colorDesc = COLOR_PROMPTS[selectedBeardColor.id] || selectedBeardColor.label;
        promptParts.push(`- BEARD COLOR: Dye the mustache and beard hair to a ${colorDesc} color. Ensure all facial hair matches this exact color.`);
      }
    }
  } else {
    // Female
    promptParts.push("- FACIAL HAIR: The face must remain completely clean-shaven with absolutely no mustache, stubble, or beard.");
  }

  // --- 4. STRICT PRESERVATION & ALIGNMENT IN USER PROMPT ---
  promptParts.push(`
    CRITICAL QUALITY CONTROL RULES:
    1. Only modify the hair and facial hair regions. 
    2. Do NOT change the shape, color, or style of anything else.
    3. NO HEAD SHIFTING: The head position, size, rotation, and angle must remain in the exact same pixel coordinates as the input photo. Do NOT shift, rotate, scale, or move the head. The eyes, nose, mouth, and chin must align perfectly.
    4. Do NOT smooth, blur, soften, or airbrush the skin. Keep all natural skin texture, visible pores, freckles, and natural skin details exactly as in the original image.
    5. Keep the eyebrows 100% identical to the original image in shape, thickness, position, and color.
    6. PHOTOREALISTIC BEARD: Make sure the generated beard/mustache hair looks extremely natural and realistic. It must have visible, fine, individual hair strands that naturally feather into the skin. Avoid blocky, solid-painted, drawn-on, or artificial-looking facial hair shapes.
  `);

  const prompt = promptParts.join("\n");

  try {
    const { mimeType, data } = parseDataUrl(currentState.originalImage);

    // Setup base URL. If in development on web local browser, route through Vite proxy to bypass CORS
    let baseUrl = "https://generativelanguage.googleapis.com";
    if (!Capacitor.isNativePlatform() && window.location.hostname === "localhost") {
      baseUrl = window.location.origin + "/api-gemini";
    }

    const apiKey = process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
    const url = `${baseUrl}/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

    const payload = {
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
      systemInstruction: {
        parts: [
          {
            text: `You are a high-fidelity virtual try-on hair stylist and barber. 
            
            YOUR TARGET MANDATE:
            - Accurately apply the requested style and color changes to the hair and beard.
            - If a style or color is marked "Do not change" or "Keep original", you must leave that specific feature untouched.
            - Ensure the colors selected for hair and beard match the prompt exactly (e.g. if blonde is selected, hair must be dyed golden blonde).
            - NATURAL FACIAL HAIR TEXTURE: The generated beard and mustache must look like real, high-resolution facial hair. It must feature distinct, fine hair strands, natural shading, and soft feathering where the hair meets the skin. Do NOT generate solid-painted blocks of color, blur, or drawn-on cartoon lines.
            
            IDENTITY, FACE, & SPATIAL ALIGNMENT RULES:
            - NO HEAD SHIFTING: The head position, size, rotation, and angle must remain in the exact same pixel coordinates as the input photo. Do NOT shift, rotate, scale, or move the head. The eyes, eyebrows, nose, mouth, and chin must align perfectly.
            - STRICT SKIN TEXTURE PRESERVATION: Do NOT smooth, blur, soften, filter, or airbrush the skin. The skin texture must remain completely natural, showing the original pores, freckles, wrinkles, facial lines, grain, skin tone, and details exactly as they are in the original image. Avoid any 'beautified', 'plastic', or 'airbrushed' look on the skin.
            - STRICT EYEBROW PRESERVATION: Do NOT modify the eyebrows. The shape, thickness, arches, density, color, and placement of the eyebrows must remain exactly identical to the input image.
            - The background, clothing, camera angle, lighting, and ambient shadows must not change at all.
            - Only modify pixels representing the hair-on-head region and the facial hair region.`
          }
        ]
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resData = await response.json();
    const candidates = resData.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const returnedMime = part.inlineData.mimeType || "image/png";
          const generatedBase64 = `data:${returnedMime};base64,${part.inlineData.data}`;
          
          // Apply pixel-by-pixel difference mask to restore original face skin and eyebrows perfectly
          const blendedBase64 = await applyDifferenceMask(currentState.originalImage, generatedBase64, currentState);
          return blendedBase64;
        }
      }
    }

    throw new Error("No image generated by AI.");
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};