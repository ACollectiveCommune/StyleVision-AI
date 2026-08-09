export interface CustomLookPreset {
  id: string;
  name: string;
  description: string;
  category: 'Decades & Retro' | 'Sci-Fi & Cyber' | 'Fantasy & Myth' | 'Warriors & History' | 'Modern & High Fashion';
  prompt: string;
  version: number;
  enabled: boolean;
  thumbnailGradient: string; // Sleek HSL/RGB CSS Gradients matching the look
}

export const CUSTOM_LOOK_PRESETS: CustomLookPreset[] = [
  // --- 1. EXISTING 7 PRESETS ---
  {
    id: 'disco_1970',
    name: '1970s Disco',
    description: 'Voluminous feathered hair and glittering dancefloor glamour.',
    category: 'Decades & Retro',
    prompt: 'A person with voluminous 1970s feathered hair, glamorous disco-inspired metallic sequined blazer, warm club lighting with light rays and reflections, glittering gold eyeshadow, retro dance-floor background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(38, 92%, 50%), hsl(340, 82%, 52%))'
  },
  {
    id: 'rockstar_90s',
    name: '90s Rockstar',
    description: 'Rebellious shaggy hair, leather, and dim backstage concert vibes.',
    category: 'Decades & Retro',
    prompt: 'A person with 1990s rock grunge shaggy hairstyle, vintage black leather motorcycle jacket, worn-out band t-shirt, dim backstage concert lighting, rebel rockstar aesthetic.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(0, 0%, 20%), hsl(220, 10%, 40%))'
  },
  {
    id: 'cyberpunk_glow',
    name: 'Cyberpunk Glow',
    description: 'Futuristic neon highlights and urban cybernetic accents.',
    category: 'Sci-Fi & Cyber',
    prompt: 'A person with futuristic cyberpunk hairstyle with neon cyan and magenta streaks, glowing cybernetic neural port on temple, high-tech black collar jacket, urban neon city street at night, atmospheric fog.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(180, 100%, 45%), hsl(320, 100%, 50%))'
  },
  {
    id: 'viking_warrior',
    name: 'Viking Warrior',
    description: 'Rugged braided hair, fur mantle, and Nordic misty fjords.',
    category: 'Warriors & History',
    prompt: 'A person with rugged Viking braided hair, practical brown leather tunic with dark fur mantle collar, ancient runic silver necklace, misty Scandinavian fjord background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(30, 40%, 30%), hsl(140, 20%, 30%))'
  },
  {
    id: 'anime_spiky',
    name: 'Anime Spiky Hair',
    description: 'Sharp spiky silhouette and cell-shaded high-detail hair.',
    category: 'Modern & High Fashion',
    prompt: 'A person with highly-detailed styled anime spiky black hair, clean strand separation, sharp silhouette, dramatic cinematic lighting, stylized cell-shaded highlight accents, matching the subject\'s face shape.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(260, 80%, 45%), hsl(290, 90%, 50%))'
  },
  {
    id: 'gangster_1920s',
    name: '1920s Gangster',
    description: 'Slicked undercut, vintage suit, and speakeasy parlor vibes.',
    category: 'Decades & Retro',
    prompt: 'A person with a classic 1920s slicked back undercut hairstyle, tailored vintage charcoal pinstripe suit, black waistcoat, silk tie, classic speakeasy parlor background with warm ambient light.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(210, 20%, 15%), hsl(240, 5%, 45%))'
  },
  {
    id: 'elven_braids',
    name: 'Elven Braids',
    description: 'Intricate silver-blonde braids and ethereal sunlit forest tiara.',
    category: 'Fantasy & Myth',
    prompt: 'A person with intricate elegant silver-blonde elven braids, long flowing hair structure, delicate leaf-shaped silver tiara headpiece, ethereal golden sun rays filtering through forest trees.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(45, 90%, 85%), hsl(150, 40%, 65%))'
  },

  // --- 2. REQUIRED 30 NEW PRESETS ---
  {
    id: 'pinup_1950s',
    name: '1950s Pin-Up',
    description: 'Retro victory rolls, red lipstick, and polka-dot diner style.',
    category: 'Decades & Retro',
    prompt: 'A person with 1950s vintage victory rolls hairstyle, classic red lipstick, retro pin-up polka-dot halter dress, soft warm studio lighting, 50s diner background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(350, 85%, 45%), hsl(45, 100%, 90%))'
  },
  {
    id: 'mod_1960s',
    name: '1960s Mod',
    description: 'Sleek mod bob, winged eyeliner, and geometric retro patterns.',
    category: 'Decades & Retro',
    prompt: 'A person with a sleek 1960s mod bob haircut, dramatic winged eyeliner, vintage shift dress with geometric patterns, pastel studio backdrop, retro retro-chic aesthetic.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(15, 90%, 50%), hsl(200, 80%, 45%))'
  },
  {
    id: 'glam_rock_1980s',
    name: '1980s Glam Rock',
    description: 'Wild teased hair, colorful spotlights, and neon tiger stripes.',
    category: 'Decades & Retro',
    prompt: 'A person with 1980s wild teased big hair, metallic glitter face makeup, neon pink tiger-stripe jacket, rock stage with colorful spotlight beams and fog.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(325, 95%, 45%), hsl(270, 85%, 50%))'
  },
  {
    id: 'y2k_popstar',
    name: 'Y2K Pop Star',
    description: 'Double-buns, frosted eyeshadow, and silver puffer jacket.',
    category: 'Decades & Retro',
    prompt: 'A person with Y2K double-bun hairstyle with face-framing tendrils, metallic silver puffer jacket, frosted blue eyeshadow, futuristic white cyber-room backdrop.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(190, 80%, 70%), hsl(220, 90%, 80%))'
  },
  {
    id: 'old_hollywood',
    name: 'Old Hollywood',
    description: 'Classic 1940s Hollywood waves and velvet evening gown.',
    category: 'Decades & Retro',
    prompt: 'A person with 1940s classic Hollywood soft waves, elegant black velvet evening gown, diamond necklace, vintage black-and-white studio portrait lighting.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(45, 60%, 45%), hsl(0, 0%, 10%))'
  },
  {
    id: 'film_noir',
    name: 'Film Noir Detective',
    description: 'Vintage fedora hat, trench coat, and moody detective shadows.',
    category: 'Decades & Retro',
    prompt: 'A person with a vintage detective fedora hat, classic trench coat with high collar, moody shadow lighting with venetian blind shadow casting, retro street light background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(0, 0%, 15%), hsl(0, 0%, 50%))'
  },
  {
    id: 'renaissance_noble',
    name: 'Renaissance Noble',
    description: 'Rich velvet tunic, head chains, and oil-portrait glow.',
    category: 'Fantasy & Myth',
    prompt: 'A person with Renaissance golden embroidered velvet doublet tunic, intricate pearl head chain hair ornament, rich oil painting portrait style with warm soft light.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(25, 75%, 35%), hsl(45, 80%, 55%))'
  },
  {
    id: 'victorian_gothic',
    name: 'Victorian Gothic',
    description: 'Black lace high collar, braided updo, and cathedral library.',
    category: 'Fantasy & Myth',
    prompt: 'A person with Victorian high lace collar black mourning gown, dark braided updo hairstyle, gothic silver brooch, gloomy stone cathedral library background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(270, 20%, 10%), hsl(290, 30%, 25%))'
  },
  {
    id: 'steampunk_explorer',
    name: 'Steampunk Explorer',
    description: 'Brass goggles on top hat, shearling jacket, and gears.',
    category: 'Fantasy & Myth',
    prompt: 'A person with steampunk brass goggles resting on leather top hat, aviator shearling jacket, clockwork brass gears accessory, antique airship cabin background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(28, 65%, 25%), hsl(40, 60%, 45%))'
  },
  {
    id: 'space_royalty',
    name: 'Futuristic Space Royalty',
    description: 'Flowing cosmic hair, metallic crown, and nebula window.',
    category: 'Sci-Fi & Cyber',
    prompt: 'A person with futuristic royal metallic headpiece, flowing cosmic silver hair, iridescent high-collar dress, window overlooking outer space nebula.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(280, 80%, 30%), hsl(230, 90%, 55%))'
  },
  {
    id: 'neon_rave',
    name: 'Neon Rave',
    description: 'UV neon hair, glowing face paint, and holographic jacket.',
    category: 'Sci-Fi & Cyber',
    prompt: 'A person with vibrant ultraviolet neon hair, glowing neon face paint lines under blacklight, modern holographic reflective windbreaker jacket, electronic music festival rave stage.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(120, 100%, 45%), hsl(300, 100%, 50%))'
  },
  {
    id: 'desert_nomad',
    name: 'Desert Nomad',
    description: 'Linen head wrap cowl, dust goggles, and sunlit dunes.',
    category: 'Fantasy & Myth',
    prompt: 'A person with a practical sand-colored linen head wrap cowl, protective dust goggles around neck, rugged utility vest, sun-drenched rolling desert sand dunes background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(35, 60%, 45%), hsl(50, 50%, 75%))'
  },
  {
    id: 'samurai',
    name: 'Samurai',
    description: 'Chonmage topknot, black plate armor, and sunlit bamboo.',
    category: 'Warriors & History',
    prompt: 'A person with traditional samurai topknot (chonmage) hairstyle, black plate armor dou lacquer, bamboo forest background with soft sunbeams filtering through.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(120, 25%, 20%), hsl(0, 0%, 15%))'
  },
  {
    id: 'egyptian_royalty',
    name: 'Ancient Egyptian Royalty',
    description: 'Golden nemes crown, winged kohl eyeliner, and lapis collar.',
    category: 'Fantasy & Myth',
    prompt: 'A person with ancient Egyptian nemes golden headpiece, heavy kohl eyeliner wing, wide beaded lapis lazuli collar necklace, temple stone wall background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(45, 95%, 45%), hsl(200, 85%, 35%))'
  },
  {
    id: 'greek_goddess',
    name: 'Greek Goddess',
    description: 'Olive branch crown, draped stola toga, and marble ruins.',
    category: 'Warriors & History',
    prompt: 'A person with ancient Greek golden olive branch crown, elegant white draped toga stola, warm golden hour sun filtering through classic marble column ruins.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(40, 85%, 65%), hsl(200, 30%, 80%))'
  },
  {
    id: 'roman_emperor',
    name: 'Roman Emperor',
    description: 'Laurel wreath crown, purple toga, and marble senate hall.',
    category: 'Warriors & History',
    prompt: 'A person with a classic laurel wreath crown, rich purple toga with golden embroidery, ancient Roman senate hall background with warm marble lighting.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(280, 70%, 25%), hsl(45, 75%, 55%))'
  },
  {
    id: 'medieval_knight',
    name: 'Medieval Knight',
    description: 'Polished steel plate armor, chainmail coif, and castle keep.',
    category: 'Warriors & History',
    prompt: 'A person with polished medieval steel plate armor cuirass, chainmail coif hood, gothic stone castle keep background with torchlight glow.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(210, 10%, 30%), hsl(0, 0%, 55%))'
  },
  {
    id: 'fairy_queen',
    name: 'Fairy Queen',
    description: 'Ethereal flower crown, wings, and glowing fireflies.',
    category: 'Fantasy & Myth',
    prompt: 'A person with ethereal flower crown, translucent fairy wings behind shoulders, glowing forest fireflies at dusk, soft magical portrait glow.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(140, 60%, 55%), hsl(300, 75%, 70%))'
  },
  {
    id: 'dark_fantasy_sorcerer',
    name: 'Dark Fantasy Sorcerer',
    description: 'Arcane wizard robes, glowing runes, and stone tower.',
    category: 'Fantasy & Myth',
    prompt: 'A person with dark embroidered wizard robes, glowing purple energy runes around hands, ancient stone wizard tower background with arcane magical glow.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(280, 90%, 20%), hsl(250, 85%, 45%))'
  },
  {
    id: 'mermaid_waves',
    name: 'Mermaid Waves',
    description: 'Flowing sea-green hair, shell crown, and deep ocean rays.',
    category: 'Fantasy & Myth',
    prompt: 'A person with flowing long sea-green wavy hair, delicate pearl and seashell crown headpiece, underwater background with light rays filtering through water.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(175, 80%, 40%), hsl(210, 90%, 55%))'
  },
  {
    id: 'cottagecore_romantic',
    name: 'Cottagecore Romantic',
    description: 'Straw hat, romantic braids, and sunny flower meadow.',
    category: 'Fantasy & Myth',
    prompt: 'A person with a straw hat, loose romantic braids, floral linen cottage dress, sunny wildflower meadow background, warm soft light.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(90, 50%, 65%), hsl(45, 90%, 75%))'
  },
  {
    id: 'coquette_glam',
    name: 'Coquette Glam',
    description: 'Pink bows in wavy hair, pearl necklace, and lace top.',
    category: 'Modern & High Fashion',
    prompt: 'A person with baby pink satin bows in soft wavy hair, delicate pearl necklace, lace top, soft pink studio backdrop with dreamy lighting.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(340, 90%, 80%), hsl(0, 0%, 95%))'
  },
  {
    id: 'editorial_high_fashion',
    name: 'Editorial High Fashion',
    description: 'Avant-garde collar, high pony, and sharp studio contour.',
    category: 'Modern & High Fashion',
    prompt: 'A person with an avant-garde high-fashion structured collar, sleek high ponytail, sharp editorial contour makeup, high-contrast studio background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(0, 0%, 5%), hsl(0, 0%, 40%))'
  },
  {
    id: 'red_carpet',
    name: 'Red Carpet Glamour',
    description: 'Emerald evening gown, elegant updo, and camera flashes.',
    category: 'Modern & High Fashion',
    prompt: 'A person with a classic elegant formal updo, diamond drop earrings, designer dark emerald satin gown, celebrity step-and-repeat backdrop with camera flashes.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(150, 95%, 20%), hsl(45, 75%, 75%))'
  },
  {
    id: 'festival_boho',
    name: 'Festival Boho',
    description: 'Felt hat, layered feather braids, and sunset festival tents.',
    category: 'Modern & High Fashion',
    prompt: 'A person with a wide-brimmed felt hat, loose layered feather braids, fringe suede vest, outdoor music festival tents at sunset.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(25, 60%, 45%), hsl(355, 65%, 50%))'
  },
  {
    id: 'punk_rebellion',
    name: 'Punk Rebellion',
    description: 'Neon green mohawk, studded leather, and dark brick alley.',
    category: 'Modern & High Fashion',
    prompt: 'A person with a tall neon green spiky mohawk, black leather jacket covered in steel studs and safety pins, dark brick alleyway background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(90, 95%, 45%), hsl(0, 0%, 15%))'
  },
  {
    id: 'grunge_icon',
    name: 'Grunge Icon',
    description: 'Bleach-blonde hair, red flannel shirt, and dark music venue.',
    category: 'Decades & Retro',
    prompt: 'A person with messy bleach-blonde hair, oversized red plaid flannel shirt, dark grunge concert venue background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(0, 85%, 45%), hsl(0, 0%, 25%))'
  },
  {
    id: 'kpop_idol',
    name: 'K-Pop Idol',
    description: 'Pastel purple hair, sequined jacket, and neon stage light.',
    category: 'Modern & High Fashion',
    prompt: 'A person with sleek pastel purple hair, modern streetwear sequined bomber jacket, glossy glass-skin makeup, neon K-Pop stage backdrop.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(270, 90%, 65%), hsl(330, 95%, 65%))'
  },
  {
    id: 'superhero',
    name: 'Superhero Comic Style',
    description: 'Armored suit, high-tech mask, and dramatic action sparks.',
    category: 'Modern & High Fashion',
    prompt: 'A person with a sleek high-tech superhero mask, vibrant blue and red armored suit, dramatic comic-book line shading backdrop with action sparks.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(220, 95%, 45%), hsl(0, 95%, 45%))'
  },
  {
    id: 'sci_fi_android',
    name: 'Sci-Fi Android',
    description: 'Metallic face panels, glowing circuitry, and tech lab.',
    category: 'Sci-Fi & Cyber',
    prompt: 'A person with metallic silver face panels, glowing blue LED circuitry lines running down neck and cheek, sleek futuristic high-collar suit, tech lab background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(200, 100%, 50%), hsl(0, 0%, 80%))'
  },
  {
    id: 'samurai_warrior',
    name: 'Samurai Warrior',
    description: 'Topknot hair, red lacquer armor, and cherry blossoms.',
    category: 'Warriors & History',
    prompt: 'A person with a traditional Japanese samurai topknot hairstyle, detailed red and black lacquer samurai armor plating, ancient bamboo forest with falling pink cherry blossom petals.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(0, 80%, 35%), hsl(45, 60%, 45%))'
  },
  {
    id: 'vintage_starlet',
    name: 'Vintage Starlet',
    description: 'Vintage finger waves, fur stole, and black and white studio.',
    category: 'Decades & Retro',
    prompt: 'A person with elegant 1930s finger wave hair, luxury white fur stole, classic black and white cinema lighting, vintage Hollywood studio portrait backdrop.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(0, 0%, 15%), hsl(0, 0%, 75%))'
  },
  {
    id: 'grecian_nymph',
    name: 'Grecian Nymph',
    description: 'Golden laurel wreath, braided curls, and white marble temple.',
    category: 'Fantasy & Myth',
    prompt: 'A person with braided Grecian curls, golden laurel wreath crown, white silk toga robe, ancient sunlit white marble temple background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(45, 95%, 65%), hsl(200, 30%, 80%))'
  },
  {
    id: 'steampunk_aviator',
    name: 'Steampunk Aviator',
    description: 'Leather aviator hat, brass goggles, and clockwork gears.',
    category: 'Fantasy & Myth',
    prompt: 'A person with a brown leather aviator hat, brass clockwork goggles pushed up on forehead, leather vest with golden buckles, clockwork gears and steam background.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(35, 55%, 35%), hsl(45, 45%, 55%))'
  },
  {
    id: 'y2k_popstar_frosted',
    name: 'Y2K Frosted Star',
    description: 'Frosted spiky tips, metallic futuristic visor, and CD reflections.',
    category: 'Decades & Retro',
    prompt: 'A person with frosted spiky tips, futuristic metallic silver sunglasses, shiny metallic puffer jacket, colorful iridescent CD reflections backdrop.',
    version: 1,
    enabled: true,
    thumbnailGradient: 'linear-gradient(135deg, hsl(190, 80%, 65%), hsl(300, 75%, 70%))'
  }
];

// Runtime self-validation to prevent ID drift and configuration errors
const verifiedIds = new Set<string>();
for (const preset of CUSTOM_LOOK_PRESETS) {
  if (!preset.id || typeof preset.id !== 'string') {
    throw new Error(`Preset validation error: Preset ID is missing or not a string.`);
  }
  if (verifiedIds.has(preset.id)) {
    throw new Error(`Preset validation error: Duplicate preset ID detected: "${preset.id}".`);
  }
  verifiedIds.add(preset.id);

  if (!preset.name || preset.name.trim().length === 0) {
    throw new Error(`Preset validation error: Preset "${preset.id}" must have a non-empty name.`);
  }
  if (!preset.prompt || preset.prompt.trim().length === 0) {
    throw new Error(`Preset validation error: Preset "${preset.id}" must have a non-empty prompt.`);
  }
  if (typeof preset.version !== 'number' || preset.version <= 0) {
    throw new Error(`Preset validation error: Preset "${preset.id}" must have a valid version (> 0).`);
  }
}
console.log(`[LOOK_REGISTRY] Successfully validated ${CUSTOM_LOOK_PRESETS.length} presets with 0 collisions.`);

