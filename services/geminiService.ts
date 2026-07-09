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

// Detailed Style Prompt Mappings for Accuracy
const STYLE_PROMPTS: Record<string, string> = {
  // Male Hair
  bald: "completely bald head (smooth shaved)",
  buzz: "short military buzz cut",
  crew: "classic crew cut with short tapered sides",
  undercut: "disconnected undercut hairstyle (shaved sides, long top)",
  fade: "high skin fade haircut",
  pompadour: "classic voluminous pompadour hairstyle",
  quiff: "modern quiff hairstyle with volume at the front",
  slick: "slicked back hair using pomade",
  sidepart: "classic gentleman's side part hairstyle",
  curlytop: "short sides with a thick curly textured top",
  dreads: "medium length dreadlocks",
  manbun: "man bun with hair tied back",
  surfer: "long wavy surfer style hair",
  
  // Female Hair
  pixie: "short modern pixie cut",
  bob: "classic chin-length bob cut",
  lob: "long bob (lob) hairstyle",
  shoulder: "shoulder-length hair",
  longstraight: "long straight sleek hair",
  longwavy: "long wavy beach hair",
  curly: "voluminous curly hairstyle with defined ringlets and strong texture",
  bangs: "hairstyle with bangs (fringe) covering the forehead",
  braids: "braided hairstyle",
  updo: "elegant updo (hair tied up)",

  // Beard
  stubble: "light 3-day stubble beard",
  mustache: "thick mustache (no chin beard)",
  goatee: "goatee beard",
  chinstrap: "thin chin strap beard along the jawline",
  short: "short, neatly trimmed full beard",
  medium: "medium-length full beard",
  long: "long, bushy full beard (lumberjack style)",
  full: "thick full beard",
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

  // --- 1. Base Instruction ---
  promptParts.push(`Task: Edit the photo of the person. ID: ${Date.now()}`);
  
  // --- 2. Hair Style Logic ---
  if (!selectedHairStyle || selectedHairStyle.id === 'original') {
    promptParts.push("CONSTRAINT: Keep the original hairstyle exactly as it is. Do NOT change the hair length or shape.");
  } else if (selectedHairStyle.id === 'none') {
    promptParts.push("CONSTRAINT: Keep the original hairstyle.");
  } else {
    const desc = STYLE_PROMPTS[selectedHairStyle.id] || selectedHairStyle.label;
    promptParts.push(`ACTION: Change the hairstyle to ${desc}. Replace the existing hair completely. Make the change drastic and visible.`);
  }

  // --- 3. Hair Color Logic ---
  if (!selectedHairColor || selectedHairColor.id === 'original') {
    promptParts.push("CONSTRAINT: Keep the original hair color.");
  } else {
    const desc = COLOR_PROMPTS[selectedHairColor.id] || selectedHairColor.label;
    promptParts.push(`ACTION: Change the hair color to ${desc}. Do not change the beard color.`);
  }

  // --- 4. Beard Logic (Male Only) ---
  if (gender === Gender.MALE) {
    if (!selectedBeardStyle || selectedBeardStyle.id === 'original') {
         promptParts.push("CONSTRAINT: Keep the original beard (or lack of beard) exactly as it is.");
    } else if (selectedBeardStyle.id === 'none') {
         promptParts.push("ACTION: Remove any beard completely (clean shaven).");
    } else {
         const desc = STYLE_PROMPTS[selectedBeardStyle.id] || selectedBeardStyle.label;
         promptParts.push(`ACTION: Change the beard style to ${desc}.`);
    }

    if (!selectedBeardColor || selectedBeardColor.id === 'original') {
         promptParts.push("CONSTRAINT: Keep the original beard color.");
    } else {
         if (selectedBeardColor.id === 'match') {
              promptParts.push("ACTION: Match the beard color to the hair color.");
         } else {
              const desc = COLOR_PROMPTS[selectedBeardColor.id] || selectedBeardColor.label;
              promptParts.push(`ACTION: Change the beard color to ${desc}. Do not change the hair color.`);
         }
    }
  } else {
    promptParts.push("CONSTRAINT: Ensure face is clean shaven (no beard).");
  }

  // --- 5. Strict Separation & Preservation ---
  promptParts.push(`
    CRITICAL RULES:
    1. INDEPENDENCE: Changes to hair must NOT affect beard. Changes to beard must NOT affect hair.
    2. PRESERVATION: Do NOT change facial features (eyes, nose, mouth, jawline, ears). Do NOT change background, clothing, or lighting.
    3. REALISM: The result must be a photorealistic photograph, not a drawing.
    4. If a feature is marked "Keep original", do not modify it.
    5. Ignore the previous hairstyle completely when applying a new one.
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
      console.error("Gemini API direct error response:", errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resData = await response.json();
    const candidates = resData.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const returnedMime = part.inlineData.mimeType || "image/png";
          return `data:${returnedMime};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated by AI.");
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw error;
  }
};