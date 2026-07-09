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
const applyDifferenceMask = async (originalSrc: string, generatedSrc: string): Promise<string> => {
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
    const threshold = 55; // Color distance threshold
    const featherColor = 10; // Color blend boundary width

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

      // Calculate spatial distance from the center of the face ellipse
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const ellipseDistance = dx * dx + dy * dy; // <= 1.0 is inside face, > 1.0 is outside

      if (ellipseDistance > 1.25) {
        // 100% OUTSIDE FACE (Hair, Ears, Shoulders, Background)
        // Always use the generated image directly to prevent ghosting/bleeding of original ears/hair
        outputData.data[i] = r2;
        outputData.data[i+1] = g2;
        outputData.data[i+2] = b2;
        outputData.data[i+3] = a2;
      } else {
        // INSIDE FACE OR TRANSITION REGION
        // Calculate difference color distance
        const colorDist = Math.sqrt(
          (r1 - r2) * (r1 - r2) +
          (g1 - g2) * (g1 - g2) +
          (b1 - b2) * (b1 - b2)
        );

        let finalR = r2, finalG = g2, finalB = b2, finalA = a2;

        if (colorDist < threshold - featherColor) {
          // No significant change: Restore original details (pores, skin lines, eyebrows)
          finalR = r1;
          finalG = g1;
          finalB = b1;
          finalA = a1;
        } else if (colorDist < threshold + featherColor) {
          // Transition zone: Blend smoothly
          const factor = (colorDist - (threshold - featherColor)) / (2 * featherColor);
          finalR = Math.round(r1 * (1 - factor) + r2 * factor);
          finalG = Math.round(g1 * (1 - factor) + g2 * factor);
          finalB = Math.round(b1 * (1 - factor) + b2 * factor);
          finalA = Math.round(a1 * (1 - factor) + a2 * factor);
        }

        if (ellipseDistance > 0.85) {
          // Boundary of the face ellipse: Blend smoothly with the fully generated region
          const spatialFactor = (ellipseDistance - 0.85) / 0.40; // 0 at 0.85, 1 at 1.25
          outputData.data[i] = Math.round(finalR * (1 - spatialFactor) + r2 * spatialFactor);
          outputData.data[i+1] = Math.round(finalG * (1 - spatialFactor) + g2 * spatialFactor);
          outputData.data[i+2] = Math.round(finalB * (1 - spatialFactor) + b2 * spatialFactor);
          outputData.data[i+3] = Math.round(finalA * (1 - spatialFactor) + a2 * spatialFactor);
        } else {
          // Center of the face: Use the difference mask result directly
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
  const isHairStyleOriginal = !selectedHairStyle || selectedHairStyle.id === 'original';
  if (isHairStyleOriginal) {
    promptParts.push("- HAIRSTYLE: Do not change the hairstyle. Keep the hair length, shape, and cut exactly as it is in the original photo.");
  } else {
    const styleDesc = STYLE_PROMPTS[selectedHairStyle.id] || selectedHairStyle.label;
    promptParts.push(`- HAIRSTYLE: Replace the current hair with a ${styleDesc}.`);
  }

  // --- 2. HAIR COLOR ---
  const isHairColorOriginal = !selectedHairColor || selectedHairColor.id === 'original';
  if (isHairColorOriginal) {
    promptParts.push("- HAIR COLOR: Do not change the hair color. Keep the original hair color exactly as it is.");
  } else {
    const colorDesc = COLOR_PROMPTS[selectedHairColor.id] || selectedHairColor.label;
    promptParts.push(`- HAIR COLOR: Dye the hair on the head to a ${colorDesc} color. Ensure all hair strands are evenly dyed to this color.`);
  }

  // --- 3. FACIAL HAIR (BEARD / MUSTACHE) ---
  if (gender === Gender.MALE) {
    // Beard Style
    const isBeardStyleOriginal = !selectedBeardStyle || selectedBeardStyle.id === 'original';
    if (isBeardStyleOriginal) {
      promptParts.push("- BEARD STYLE: Do not change the beard style. Keep the original facial hair shape, density, or lack of facial hair exactly as it is.");
    } else if (selectedBeardStyle.id === 'none') {
      promptParts.push("- BEARD STYLE: Remove all facial hair completely. The subject must be clean-shaven (no mustache, no goatee, no beard, no stubble).");
    } else {
      const styleDesc = STYLE_PROMPTS[selectedBeardStyle.id] || selectedBeardStyle.label;
      promptParts.push(`- BEARD STYLE: Apply a ${styleDesc}. Remove any other facial hair that does not belong to this style.`);
    }

    // Beard Color
    const isBeardColorOriginal = !selectedBeardColor || selectedBeardColor.id === 'original';
    if (isBeardColorOriginal) {
      promptParts.push("- BEARD COLOR: Do not change the facial hair color. Keep the original mustache and beard color exactly as it is.");
    } else if (selectedBeardColor.id === 'match') {
      const targetColor = isHairColorOriginal ? "the original hair color" : `${COLOR_PROMPTS[selectedHairColor.id]} (matching the new hair color)`;
      promptParts.push(`- BEARD COLOR: Dye the mustache and beard hair to ${targetColor}.`);
    } else {
      const colorDesc = COLOR_PROMPTS[selectedBeardColor.id] || selectedBeardColor.label;
      promptParts.push(`- BEARD COLOR: Dye the mustache and beard hair to a ${colorDesc} color. Ensure all facial hair matches this exact color.`);
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
          const blendedBase64 = await applyDifferenceMask(currentState.originalImage, generatedBase64);
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