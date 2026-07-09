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

  // --- 1. Base Task ---
  promptParts.push("Modify the hairstyle and/or facial hair of the subject in the photo according to these specific requests:");

  // --- 2. Hair Style & Color Integration ---
  const isHairStyleOriginal = !selectedHairStyle || selectedHairStyle.id === 'original';
  const isHairColorOriginal = !selectedHairColor || selectedHairColor.id === 'original';

  if (isHairStyleOriginal && isHairColorOriginal) {
    promptParts.push("- Hairstyle & Color: Preserve the original hair structure, length, volume, and color exactly as they are.");
  } else if (!isHairStyleOriginal && isHairColorOriginal) {
    const styleDesc = STYLE_PROMPTS[selectedHairStyle.id] || selectedHairStyle.label;
    promptParts.push(`- Hairstyle: Change the style to a ${styleDesc}. Preserve the original natural hair color.`);
  } else if (isHairStyleOriginal && !isHairColorOriginal) {
    const colorDesc = COLOR_PROMPTS[selectedHairColor.id] || selectedHairColor.label;
    promptParts.push(`- Hair Color: Keep the original hairstyle, but dye the hair to a ${colorDesc} color.`);
  } else {
    const styleDesc = STYLE_PROMPTS[selectedHairStyle.id] || selectedHairStyle.label;
    const colorDesc = COLOR_PROMPTS[selectedHairColor.id] || selectedHairColor.label;
    promptParts.push(`- Hairstyle & Color: Replace the hair with a ${styleDesc} in a ${colorDesc} color.`);
  }

  // --- 3. Beard Style & Color Integration (Male Only) ---
  if (gender === Gender.MALE) {
    const isBeardStyleOriginal = !selectedBeardStyle || selectedBeardStyle.id === 'original';
    const isBeardColorOriginal = !selectedBeardColor || selectedBeardColor.id === 'original';

    if (isBeardStyleOriginal && isBeardColorOriginal) {
      promptParts.push("- Beard: Preserve the original facial hair exactly as it is.");
    } else if (selectedBeardStyle?.id === 'none') {
      promptParts.push("- Beard: Remove any beard or mustache completely, leaving a clean-shaven face.");
    } else {
      let beardDesc = "";
      if (!isBeardStyleOriginal) {
        beardDesc = STYLE_PROMPTS[selectedBeardStyle.id] || selectedBeardStyle.label;
      }
      
      let colorDesc = "";
      if (!isBeardColorOriginal) {
        if (selectedBeardColor.id === 'match') {
          colorDesc = isHairColorOriginal ? "matching the original hair color" : `matching the new ${COLOR_PROMPTS[selectedHairColor.id]} hair color`;
        } else {
          colorDesc = COLOR_PROMPTS[selectedBeardColor.id] || selectedBeardColor.label;
        }
      }

      if (beardDesc && colorDesc) {
        promptParts.push(`- Beard: Change the facial hair to a ${beardDesc} in a ${colorDesc} color.`);
      } else if (beardDesc) {
        promptParts.push(`- Beard: Change the facial hair style to a ${beardDesc}. Keep the original beard color.`);
      } else if (colorDesc) {
        promptParts.push(`- Beard: Keep the original beard shape, but change its color to ${colorDesc}.`);
      }
    }
  } else {
    // Female
    promptParts.push("- Facial Hair: The face must remain clean-shaven (no beard or mustache).");
  }

  // --- 4. Extra Prompt Rules ---
  promptParts.push(`
    CRITICAL RULES:
    1. Only modify the hair and facial hair regions. 
    2. Do NOT change the shape, color, or style of anything else.
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
            text: `You are a high-fidelity virtual barbershop and hair try-on editor. 
            
            YOUR ABSOLUTE TOP PRIORITY IS IDENTITY PRESERVATION:
            - The person's facial structure, identity, age, expression, eyes, nose, mouth, cheeks, chin, jawline, ears, skin texture, and wrinkles MUST remain 100% identical to the input image.
            - The background, clothing, lighting, shadows, camera angle, and overall image composition MUST NOT change at all.
            - You are ONLY permitted to modify the pixels representing the hair on the head and the facial hair (beard, mustache). 
            - The newly edited hair and beard must blend realistically into the natural hairline and face boundary, maintaining high photorealism.`
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