import { MakeupPreset } from "../types";

export const MAKEUP_PRESETS: MakeupPreset[] = [
  // --- Existing 4 Options ---
  {
    id: "makeup_natural",
    name: "Natural Glaze",
    description: "Dewy foundation, light mascara, and natural lip balm.",
    coverImage: "/presets/female_makeup_natural.jpg",
    complexion: { finish: "dewy", coverage: 30, glow: 70, warmth: 40 },
    eyes: { eyeshadowStyle: "subtle shimmer", eyeshadowColor: "champagne", eyelinerStyle: "none", lashIntensity: 30 },
    brows: { definition: 40, shape: "natural feathered" },
    cheeks: { blushColor: "peach pink", blushIntensity: 30, bronzerIntensity: 20, highlighterIntensity: 50 },
    lips: { color: "soft pink", finish: "glossy", intensity: 40 }
  },
  {
    id: "makeup_bold",
    name: "Bold Crimson",
    description: "Vibrant matte red lipstick with winged eyeliner.",
    coverImage: "/presets/female_makeup_bold.jpg",
    complexion: { finish: "velvet matte", coverage: 80, glow: 20, warmth: 30 },
    eyes: { eyeshadowStyle: "clean base", eyeshadowColor: "cream", eyelinerStyle: "sharp winged cat-eye", lashIntensity: 80 },
    brows: { definition: 80, shape: "defined arch" },
    cheeks: { blushColor: "dusty rose", blushIntensity: 40, bronzerIntensity: 50, highlighterIntensity: 30 },
    lips: { color: "vibrant crimson red", finish: "matte", intensity: 90 }
  },
  {
    id: "makeup_smokey",
    name: "Smokey Eyes",
    description: "Intense charcoal eyeshadow and soft cheek contour.",
    coverImage: "/presets/female_makeup_smokey.jpg",
    complexion: { finish: "matte", coverage: 70, glow: 30, warmth: 40 },
    eyes: { eyeshadowStyle: "heavy blended smokey", eyeshadowColor: "charcoal black and slate grey", eyelinerStyle: "smudged kohl", lashIntensity: 90 },
    brows: { definition: 70, shape: "bold structured" },
    cheeks: { blushColor: "nude peach", blushIntensity: 30, bronzerIntensity: 70, highlighterIntensity: 40 },
    lips: { color: "muted beige nude", finish: "creamy satin", intensity: 50 }
  },
  {
    id: "makeup_rose",
    name: "Rose Glow",
    description: "Warm pink blush, soft highlighter, and lip gloss.",
    coverImage: "/presets/female_makeup_rose.jpg",
    complexion: { finish: "dewy satin", coverage: 50, glow: 80, warmth: 50 },
    eyes: { eyeshadowStyle: "soft crease", eyeshadowColor: "dusty rose and shimmer pink", eyelinerStyle: "thin brown line", lashIntensity: 60 },
    brows: { definition: 50, shape: "softly filled" },
    cheeks: { blushColor: "warm rose pink", blushIntensity: 60, bronzerIntensity: 30, highlighterIntensity: 80 },
    lips: { color: "sheer rose pink", finish: "high gloss", intensity: 70 }
  },

  // --- 20 New Options ---
  {
    id: "makeup_no_makeup",
    name: "No-Makeup Makeup",
    description: "Ultra-light coverage, sheer lip tint, and soft brows.",
    coverImage: "/presets/female_makeup_no_makeup.jpg",
    complexion: { finish: "natural skin", coverage: 15, glow: 50, warmth: 30 },
    eyes: { eyeshadowStyle: "none", eyeshadowColor: "transparent", eyelinerStyle: "none", lashIntensity: 10 },
    brows: { definition: 30, shape: "brushed up clear gel" },
    cheeks: { blushColor: "sheer apricot", blushIntensity: 15, bronzerIntensity: 10, highlighterIntensity: 20 },
    lips: { color: "sheer natural pink", finish: "balm tint", intensity: 20 }
  },
  {
    id: "makeup_clean_girl",
    name: "Clean Girl Makeup",
    description: "Glowy complexion, brushed brows, and fresh tint.",
    coverImage: "/presets/female_makeup_clean_girl.jpg",
    complexion: { finish: "radiant dewy", coverage: 40, glow: 90, warmth: 45 },
    eyes: { eyeshadowStyle: "glossy lid", eyeshadowColor: "nude glaze", eyelinerStyle: "none", lashIntensity: 40 },
    brows: { definition: 60, shape: "laminated soap brow" },
    cheeks: { blushColor: "sunkissed peach", blushIntensity: 40, bronzerIntensity: 30, highlighterIntensity: 90 },
    lips: { color: "glossy peach honey", finish: "high shine oil", intensity: 50 }
  },
  {
    id: "makeup_soft_glam",
    name: "Soft Glam",
    description: "Diffused warm shadows, soft lips, and seamless blend.",
    coverImage: "/presets/female_makeup_soft_glam.jpg",
    complexion: { finish: "satin matte", coverage: 65, glow: 50, warmth: 60 },
    eyes: { eyeshadowStyle: "diffused cut crease", eyeshadowColor: "taupe and warm brown", eyelinerStyle: "soft brown wing", lashIntensity: 70 },
    brows: { definition: 70, shape: "groomed arch" },
    cheeks: { blushColor: "dusty mauve", blushIntensity: 50, bronzerIntensity: 60, highlighterIntensity: 60 },
    lips: { color: "warm mauve nude", finish: "velvet satin", intensity: 75 }
  },
  {
    id: "makeup_full_glam",
    name: "Full Glam",
    description: "Cut crease, thick lashes, contouring, and defined lip.",
    coverImage: "/presets/female_makeup_full_glam.jpg",
    complexion: { finish: "full matte", coverage: 95, glow: 20, warmth: 70 },
    eyes: { eyeshadowStyle: "dramatic cut crease with glitter", eyeshadowColor: "gold glitter and dark espresso", eyelinerStyle: "thick winged black liquid liner", lashIntensity: 100 },
    brows: { definition: 95, shape: "sculpted ombré arch" },
    cheeks: { blushColor: "deep coral", blushIntensity: 65, bronzerIntensity: 90, highlighterIntensity: 90 },
    lips: { color: "defined dark nude with liner", finish: "matte with gloss center", intensity: 95 }
  },
  {
    id: "makeup_natural_everyday",
    name: "Natural Everyday",
    description: "Light concealer, brown mascara, and nude pink lips.",
    coverImage: "/presets/female_makeup_natural_everyday.jpg",
    complexion: { finish: "semi-matte", coverage: 35, glow: 40, warmth: 35 },
    eyes: { eyeshadowStyle: "flat base", eyeshadowColor: "soft beige", eyelinerStyle: "tightline brown", lashIntensity: 35 },
    brows: { definition: 50, shape: "lightly filled" },
    cheeks: { blushColor: "rosewood", blushIntensity: 30, bronzerIntensity: 25, highlighterIntensity: 30 },
    lips: { color: "soft dusty rose", finish: "satin", intensity: 50 }
  },
  {
    id: "makeup_dewy_glow",
    name: "Dewy Glow",
    description: "Wet-look skin, minimal powder, and super-glossy accents.",
    coverImage: "/presets/female_makeup_dewy_glow.jpg",
    complexion: { finish: "ultra dewy glass", coverage: 45, glow: 100, warmth: 40 },
    eyes: { eyeshadowStyle: "wet-look gloss", eyeshadowColor: "clear shimmer", eyelinerStyle: "none", lashIntensity: 50 },
    brows: { definition: 50, shape: "feathered soft" },
    cheeks: { blushColor: "dewy berry", blushIntensity: 45, bronzerIntensity: 20, highlighterIntensity: 100 },
    lips: { color: "sheer berry glaze", finish: "glass gloss", intensity: 60 }
  },
  {
    id: "makeup_matte_glam",
    name: "Matte Glam",
    description: "Zero shine, full coverage, and velvet soft-focus lips.",
    coverImage: "/presets/female_makeup_matte_glam.jpg",
    complexion: { finish: "velvet matte", coverage: 85, glow: 0, warmth: 45 },
    eyes: { eyeshadowStyle: "soft matte smoke", eyeshadowColor: "neutral browns", eyelinerStyle: "classic matte black wing", lashIntensity: 75 },
    brows: { definition: 80, shape: "defined soft arch" },
    cheeks: { blushColor: "cool pink", blushIntensity: 50, bronzerIntensity: 65, highlighterIntensity: 0 },
    lips: { color: "deep rose nude", finish: "matte liquid lip", intensity: 85 }
  },
  {
    id: "makeup_glass_skin",
    name: "Glass Skin Makeup",
    description: "Highly reflective, translucent skin with minimal makeup.",
    coverImage: "/presets/female_makeup_glass_skin.jpg",
    complexion: { finish: "translucent glass shine", coverage: 25, glow: 100, warmth: 30 },
    eyes: { eyeshadowStyle: "clear glaze", eyeshadowColor: "sheer pearl", eyelinerStyle: "none", lashIntensity: 30 },
    brows: { definition: 40, shape: "brushed and set" },
    cheeks: { blushColor: "sheer peach cream", blushIntensity: 25, bronzerIntensity: 10, highlighterIntensity: 100 },
    lips: { color: "glass clear glaze", finish: "extreme gloss", intensity: 30 }
  },
  {
    id: "makeup_latte",
    name: "Latte Makeup",
    description: "Monochromatic caramel, coffee, and bronze tones.",
    coverImage: "/presets/female_makeup_latte.jpg",
    complexion: { finish: "bronzed satin", coverage: 60, glow: 60, warmth: 80 },
    eyes: { eyeshadowStyle: "bronze halo", eyeshadowColor: "metallic copper and warm espresso", eyelinerStyle: "smudged brown kohl", lashIntensity: 70 },
    brows: { definition: 70, shape: "soft structured arch" },
    cheeks: { blushColor: "nude terracotta", blushIntensity: 40, bronzerIntensity: 90, highlighterIntensity: 70 },
    lips: { color: "creamy coffee caramel", finish: "glossy satin", intensity: 80 }
  },
  {
    id: "makeup_strawberry",
    name: "Strawberry Makeup",
    description: "Fresh pink cheeks, sun-kissed freckles, and red tint.",
    coverImage: "/presets/female_makeup_strawberry.jpg",
    complexion: { finish: "fresh dewy", coverage: 35, glow: 80, warmth: 45 },
    eyes: { eyeshadowStyle: "sheer pink wash", eyeshadowColor: "soft strawberry pink", eyelinerStyle: "micro brown wing", lashIntensity: 55 },
    brows: { definition: 50, shape: "natural brushed" },
    cheeks: { blushColor: "vibrant strawberry pink", blushIntensity: 80, bronzerIntensity: 20, highlighterIntensity: 75 },
    lips: { color: "bitten strawberry red", finish: "sheer gloss tint", intensity: 75 }
  },
  {
    id: "makeup_peach",
    name: "Peach Makeup",
    description: "Warm peach tones on eyes, cheeks, and lips.",
    coverImage: "/presets/female_makeup_peach.jpg",
    complexion: { finish: "satin", coverage: 50, glow: 60, warmth: 60 },
    eyes: { eyeshadowStyle: "soft crease peach", eyeshadowColor: "pastel apricot and peach gold", eyelinerStyle: "soft brown eyeliner", lashIntensity: 60 },
    brows: { definition: 60, shape: "softly groomed arch" },
    cheeks: { blushColor: "bright peach nectar", blushIntensity: 70, bronzerIntensity: 40, highlighterIntensity: 60 },
    lips: { color: "creamy peach coral", finish: "satin cream", intensity: 70 }
  },
  {
    id: "makeup_rosy",
    name: "Rosy Makeup",
    description: "Romantic flush of roses with matching soft pink eyes.",
    coverImage: "/presets/female_makeup_rosy.jpg",
    complexion: { finish: "dewy rose", coverage: 55, glow: 70, warmth: 45 },
    eyes: { eyeshadowStyle: "rosy shimmer halo", eyeshadowColor: "rose petal pink and silver pearl", eyelinerStyle: "thin charcoal line", lashIntensity: 65 },
    brows: { definition: 55, shape: "groomed clean" },
    cheeks: { blushColor: "rose bud pink", blushIntensity: 75, bronzerIntensity: 25, highlighterIntensity: 70 },
    lips: { color: "soft rosewood pink", finish: "creamy gloss", intensity: 80 }
  },
  {
    id: "makeup_bronze_goddess",
    name: "Bronze Goddess",
    description: "Deep golden highlights, sun-sculpted cheekbones.",
    coverImage: "/presets/female_makeup_bronze_goddess.jpg",
    complexion: { finish: "metallic glow", coverage: 70, glow: 90, warmth: 95 },
    eyes: { eyeshadowStyle: "gold leaf halo", eyeshadowColor: "24k gold shimmer and deep bronze", eyelinerStyle: "smudged black kohl", lashIntensity: 80 },
    brows: { definition: 75, shape: "defined arches" },
    cheeks: { blushColor: "golden apricot", blushIntensity: 30, bronzerIntensity: 100, highlighterIntensity: 100 },
    lips: { color: "golden nude shimmer", finish: "glossy glaze", intensity: 70 }
  },
  {
    id: "makeup_smokey_eye",
    name: "Smokey Eye",
    description: "Dramatic dark gradient eyeshadow, nude lip contrast.",
    coverImage: "/presets/female_makeup_smokey_eye.jpg",
    complexion: { finish: "flawless matte", coverage: 80, glow: 20, warmth: 40 },
    eyes: { eyeshadowStyle: "intense charcoal smoke", eyeshadowColor: "jet black and gunmetal shimmer", eyelinerStyle: "thick kohl lining", lashIntensity: 90 },
    brows: { definition: 80, shape: "bold defined arch" },
    cheeks: { blushColor: "soft nude", blushIntensity: 35, bronzerIntensity: 70, highlighterIntensity: 30 },
    lips: { color: "pale cream nude", finish: "matte velvet", intensity: 60 }
  },
  {
    id: "makeup_soft_smokey",
    name: "Soft Smokey Eye",
    description: "Subtle smudge of brown and taupe for day-friendly smoke.",
    coverImage: "/presets/female_makeup_soft_smokey.jpg",
    complexion: { finish: "satin", coverage: 50, glow: 50, warmth: 50 },
    eyes: { eyeshadowStyle: "diffused brown halo", eyeshadowColor: "warm cocoa and taupe matte", eyelinerStyle: "soft smudged brown wing", lashIntensity: 65 },
    brows: { definition: 60, shape: "softly groomed" },
    cheeks: { blushColor: "muted mauve", blushIntensity: 45, bronzerIntensity: 50, highlighterIntensity: 55 },
    lips: { color: "soft mauve nude", finish: "creamy satin", intensity: 70 }
  },
  {
    id: "makeup_classic_red_lip",
    name: "Classic Red Lip",
    description: "Minimal eye makeup paired with a retro bold red lip.",
    coverImage: "/presets/female_makeup_classic_red_lip.jpg",
    complexion: { finish: "velvet", coverage: 70, glow: 30, warmth: 35 },
    eyes: { eyeshadowStyle: "matte bone base", eyeshadowColor: "ivory bone", eyelinerStyle: "thin black flick", lashIntensity: 50 },
    brows: { definition: 70, shape: "groomed structure" },
    cheeks: { blushColor: "soft rosewood", blushIntensity: 25, bronzerIntensity: 40, highlighterIntensity: 30 },
    lips: { color: "true blue-toned classic red", finish: "matte satin", intensity: 100 }
  },
  {
    id: "makeup_nude_glam",
    name: "Nude Glam",
    description: "Contoured face, brown liners, and soft caramel hues.",
    coverImage: "/presets/female_makeup_nude_glam.jpg",
    complexion: { finish: "semi-matte", coverage: 75, glow: 40, warmth: 70 },
    eyes: { eyeshadowStyle: "matte cut crease", eyeshadowColor: "milk chocolate and sandy nude", eyelinerStyle: "faded brown wing", lashIntensity: 75 },
    brows: { definition: 80, shape: "structured arch" },
    cheeks: { blushColor: "dusty peach", blushIntensity: 40, bronzerIntensity: 80, highlighterIntensity: 60 },
    lips: { color: "medium brown-nude with lip liner", finish: "creamy velvet", intensity: 85 }
  },
  {
    id: "makeup_bridal",
    name: "Bridal Makeup",
    description: "Classic romantic glow, airbrushed skin, timeless eyes.",
    coverImage: "/presets/female_makeup_bridal.jpg",
    complexion: { finish: "satin airbrush", coverage: 80, glow: 60, warmth: 50 },
    eyes: { eyeshadowStyle: "soft shimmer smoke", eyeshadowColor: "soft champagne and mauve brown", eyelinerStyle: "soft black liner", lashIntensity: 85 },
    brows: { definition: 75, shape: "perfectly symmetrical soft arch" },
    cheeks: { blushColor: "blushing bridal pink", blushIntensity: 60, bronzerIntensity: 45, highlighterIntensity: 70 },
    lips: { color: "timeless dusty rose pink", finish: "long-wear satin gloss", intensity: 80 }
  },
  {
    id: "makeup_evening_glam",
    name: "Evening Glam",
    description: "Shimmering eyes, dramatic contour, glossy bold lips.",
    coverImage: "/presets/female_makeup_evening_glam.jpg",
    complexion: { finish: "glowing velvet", coverage: 85, glow: 50, warmth: 65 },
    eyes: { eyeshadowStyle: "smokey cut crease", eyeshadowColor: "silver bronze shimmer and dark mocha", eyelinerStyle: "dramatic winged liquid liner", lashIntensity: 95 },
    brows: { definition: 85, shape: "defined arch" },
    cheeks: { blushColor: "plumiest berry", blushIntensity: 55, bronzerIntensity: 75, highlighterIntensity: 85 },
    lips: { color: "deep berry wine", finish: "glossy lip lacquer", intensity: 90 }
  },
  {
    id: "makeup_y2k",
    name: "Y2K Makeup",
    description: "Frosted blue/silver eyeshadow, heavy liner, and brown lip.",
    coverImage: "/presets/female_makeup_y2k.jpg",
    complexion: { finish: "semi-dewy", coverage: 60, glow: 70, warmth: 40 },
    eyes: { eyeshadowStyle: "frosted pastel wash", eyeshadowColor: "frosted baby blue and metallic silver", eyelinerStyle: "full outer rim kohl liner", lashIntensity: 75 },
    brows: { definition: 65, shape: "thin sculpted arch" },
    cheeks: { blushColor: "cool pink tint", blushIntensity: 50, bronzerIntensity: 40, highlighterIntensity: 80 },
    lips: { color: "dark brown liner with clear glossy center", finish: "super high shine gloss", intensity: 90 }
  }
];
