export interface TreatmentStep {
  value: number;
  label: string;
  promptDesc: string;
}

export interface AestheticTreatment {
  id: string;
  label: string;
  category: 'filler' | 'botox' | 'skin';
  shortDesc: string;
  commonAreas: string;
  disclaimer: string;
  intensityType: 'ml' | 'units' | 'level';
  steps: TreatmentStep[];
}

export const CANONICAL_STEPS = [
  { value: 0, label: 'Natural' },
  { value: 1, label: 'Subtle' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Defined' },
  { value: 4, label: 'Strong' },
  { value: 5, label: 'Maximum' }
];

export const AESTHETIC_TREATMENTS: AestheticTreatment[] = [
  // FILLERS CATEGORY
  {
    id: 'lip_filler',
    label: 'Lip Filler',
    category: 'filler',
    shortDesc: 'Adds volume, definition, and hydration to the lips using simulated hyaluronic acid filler.',
    commonAreas: 'Upper and lower lips, cupid\'s bow contouring.',
    disclaimer: 'This simulation is a visual illustration of volume options only. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original lips' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly plumper lips with visible natural volume and refined border' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably plumper lips with contoured shape and defined vermilion border' },
      { value: 3, label: 'Defined', promptDesc: 'highly voluminous plump lips, prominent cosmetic volume' },
      { value: 4, label: 'Strong', promptDesc: 'extremely voluminous plump lips, dramatic cosmetic lip projection' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum voluminous plump lips, peak cosmetic lip filler projection' }
    ]
  },
  {
    id: 'cheek_filler',
    label: 'Cheek Filler',
    category: 'filler',
    shortDesc: 'Restores volume and creates definition over the cheekbones for a lifted appearance.',
    commonAreas: 'Cheekbones, mid-face area.',
    disclaimer: 'This simulation is a visual illustration of volume options only. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original cheeks' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly fuller cheekbones, visible natural mid-face volume' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably fuller cheekbones with contoured definition' },
      { value: 3, label: 'Defined', promptDesc: 'strongly defined cheek filler simulation, prominent and contoured cheekbones' },
      { value: 4, label: 'Strong', promptDesc: 'highly contoured cheekbones, prominent cheek filler projection' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum contoured cheekbones, absolute peak cheek volume projection' }
    ]
  },
  {
    id: 'chin_filler',
    label: 'Chin Filler',
    category: 'filler',
    shortDesc: 'Elongates or projects the chin profile to improve facial symmetry and balance.',
    commonAreas: 'Lower chin point, chin border.',
    disclaimer: 'This simulation is a visual illustration of volume options only. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original chin' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly projected chin, visible natural lengthening' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably projected chin, visible natural lengthening and refinement' },
      { value: 3, label: 'Defined', promptDesc: 'strongly defined chin projection, contoured lower face shape' },
      { value: 4, label: 'Strong', promptDesc: 'highly projected structured chin, prominent jawline alignment' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum projected structured chin, peak chin elongation and projection' }
    ]
  },
  {
    id: 'jaw_contour',
    label: 'Jawline Contouring',
    category: 'filler',
    shortDesc: 'Sculpts and defines the jaw border and angle for a more structured, angular profile.',
    commonAreas: 'Jaw angle, mandibles, chin transition.',
    disclaimer: 'This simulation is a visual illustration of volume options only. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original jawline' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly defined jawline, visible natural jaw border structure' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably defined jawline, visible natural jaw border structure and angle' },
      { value: 3, label: 'Defined', promptDesc: 'strongly contoured jawline simulation, crisp and prominent jaw border' },
      { value: 4, label: 'Strong', promptDesc: 'highly contoured jawline, extremely contoured jaw angle' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum razor-sharp angular jawline, peak contoured jaw angle' }
    ]
  },
  {
    id: 'undereye_filler',
    label: 'Under-Eye Filler',
    category: 'filler',
    shortDesc: 'Fills deep tear troughs to soften under-eye hollows and reduce shadowing.',
    commonAreas: 'Tear troughs, lower eyelids border.',
    disclaimer: 'This simulation is a visual illustration of volume options only. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original under-eye' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly filled under-eye hollows, visible natural shadow reduction' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably filled under-eye hollows, visible natural shadow reduction and blending' },
      { value: 3, label: 'Defined', promptDesc: 'strongly filled tear troughs, prominent volume under lower lids' },
      { value: 4, label: 'Strong', promptDesc: 'highly filled tear troughs, smooth transition between under-eye and cheek' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum filled tear troughs, completely flat filled tear troughs, brightened under-eye' }
    ]
  },
  {
    id: 'temple_filler',
    label: 'Temple Filler',
    category: 'filler',
    shortDesc: 'Softens temporal hollows to create a smoother, more youthful upper facial curve.',
    commonAreas: 'Temples, outer upper brows.',
    disclaimer: 'This simulation is a visual illustration of volume options only. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original temples' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly smoothed temporal hollows, visible natural curve correction' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably smoothed temporal hollows, visible natural curve correction and blending' },
      { value: 3, label: 'Defined', promptDesc: 'strongly filled temple hollows, smooth transition from forehead to temples' },
      { value: 4, label: 'Strong', promptDesc: 'highly filled temple hollows, flawless forehead transition' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum filled temple hollows, absolute forehead transition smoothing' }
    ]
  },
  {
    id: 'nose_enhancement',
    label: 'Nose Enhancement',
    category: 'filler',
    shortDesc: 'Non-surgical rhinoplasty simulation using fillers to straighten the nose bridge and lift the tip.',
    commonAreas: 'Nose bridge, nasal tip, dorsal hump.',
    disclaimer: 'This simulation is a visual illustration of volume options only. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original nose shape' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly straight nose bridge, visible natural dorsal hump reduction' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably straight nose bridge, visible natural dorsal hump reduction and tip refinement' },
      { value: 3, label: 'Defined', promptDesc: 'straight nose bridge, strongly lifted tip, smoothed dorsal hump' },
      { value: 4, label: 'Strong', promptDesc: 'highly straight nose bridge, highly lifted tip, completely smoothed dorsal hump' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum straight nose bridge, maximum lifted tip, peak non-surgical rhinoplasty look' }
    ]
  },

  // BOTOX CATEGORY
  {
    id: 'botox_forehead',
    label: 'Botox – Forehead Lines',
    category: 'botox',
    shortDesc: 'Relaxes frontalis muscles to smooth horizontal creases and lines on the forehead.',
    commonAreas: 'Horizontal forehead forehead lines.',
    disclaimer: 'This is a visual illustration of wrinkle reduction levels. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original forehead' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly smoothed and softened forehead lines' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably smoothed forehead lines, relaxed expression lines' },
      { value: 3, label: 'Defined', promptDesc: 'highly smoothed wrinkle-free forehead with relaxed lines' },
      { value: 4, label: 'Strong', promptDesc: 'completely smoothed line-free forehead with absolute wrinkle relaxation' },
      { value: 5, label: 'Maximum', promptDesc: 'perfectly flat flawless glass forehead, maximum wrinkle erasure' }
    ]
  },
  {
    id: 'botox_frown',
    label: 'Botox – Frown Lines (11s)',
    category: 'botox',
    shortDesc: 'Relaxes glabellar muscle clusters to smooth vertical lines between the eyebrows.',
    commonAreas: 'Glabellar area, frown lines between the brows.',
    disclaimer: 'This is a visual illustration of wrinkle reduction levels. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original frown area' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly softened vertical frown lines between eyebrows' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably softened vertical frown lines between eyebrows' },
      { value: 3, label: 'Defined', promptDesc: 'fully smoothed frown-free glabellar, relaxed brow wrinkles' },
      { value: 4, label: 'Strong', promptDesc: 'completely smooth frown-free brow, complete glabellar erasure' },
      { value: 5, label: 'Maximum', promptDesc: 'perfectly smooth frown-free brow, absolute glabellar wrinkle erasure' }
    ]
  },
  {
    id: 'botox_crow',
    label: 'Botox – Crow\'s Feet',
    category: 'botox',
    shortDesc: 'Softens dynamic wrinkles extending from the outer corners of the eyes.',
    commonAreas: 'Orbicularis oculi, outer eye corners.',
    disclaimer: 'This is a visual illustration of wrinkle reduction levels. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original crow\'s feet lines' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly softened dynamic laugh wrinkles around outer eyes' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably softened dynamic laugh wrinkles around outer eyes' },
      { value: 3, label: 'Defined', promptDesc: 'smooth and relaxed crow\'s feet lines near outer eye borders' },
      { value: 4, label: 'Strong', promptDesc: 'completely line-free eye borders, perfect wrinkle-free skin' },
      { value: 5, label: 'Maximum', promptDesc: 'completely line-free eye borders, absolute wrinkle relaxation' }
    ]
  },
  {
    id: 'brow_lift',
    label: 'Brow Lift',
    category: 'botox',
    shortDesc: 'Relaxes brow depressors to lift the outer eyebrows and create a more open, refreshed look.',
    commonAreas: 'Outer lateral eyebrow tails.',
    disclaimer: 'This is a visual illustration of brow height levels. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original brow height' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly lifted outer lateral eyebrow tails' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably lifted outer lateral eyebrow tails' },
      { value: 3, label: 'Defined', promptDesc: 'highly arched lifted outer brows, open and youthful eye area' },
      { value: 4, label: 'Strong', promptDesc: 'highly arched lifted outer brows, very open and youthful eye area' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum arched lifted outer brows, peak brow lift look' }
    ]
  },
  {
    id: 'masseter_botox',
    label: 'Masseter Botox',
    category: 'botox',
    shortDesc: 'Relaxes jaw masseter muscles to slim the jawline shape and soften a square lower face.',
    commonAreas: 'Lower masseter cheek muscles, jaw corners.',
    disclaimer: 'This is a visual illustration of muscle relaxation levels. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original masseter jaw size' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly slimmed jaw angle shape' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably slimmed jaw angle shape' },
      { value: 3, label: 'Defined', promptDesc: 'strongly contoured jaw slimming, narrower face silhouette' },
      { value: 4, label: 'Strong', promptDesc: 'highly contoured jaw slimming, highly pronounced V-shape jaw' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum jaw slimming contour, peak V-shape jaw' }
    ]
  },
  {
    id: 'lip_flip',
    label: 'Lip Flip',
    category: 'botox',
    shortDesc: 'Uses Botox to gently roll the upper lip border outward for a fuller show without filler volume.',
    commonAreas: 'Orbicularis oris, upper lip line.',
    disclaimer: 'This is a visual illustration of muscle relaxation levels. It is not dosing advice.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original lip curl' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly flipped upper lip border, visible natural pout' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably flipped upper lip border, visible natural pout and volume' },
      { value: 3, label: 'Defined', promptDesc: 'highly flipped upper lip, increased show of pink lip tissue' },
      { value: 4, label: 'Strong', promptDesc: 'highly flipped upper lip, highly increased show of pink lip tissue' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum flipped upper lip, peak upper lip roll-out show' }
    ]
  },

  // SKIN TONE CATEGORY
  {
    id: 'skin_smoothing',
    label: 'Skin Smoothing',
    category: 'skin',
    shortDesc: 'Refines skin pores, removes dry textures, and balances overall skin consistency.',
    commonAreas: 'Face cheeks, forehead, chin, nose skin.',
    disclaimer: 'This simulation is a visual airbrushing effect simulation only.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original skin pores' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly smoothed skin pores and texture' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably smoothed skin pores and texture' },
      { value: 3, label: 'Defined', promptDesc: 'highly airbrushed uniform skin texture' },
      { value: 4, label: 'Strong', promptDesc: 'flawless smooth porcelain skin texture, zero visible pores' },
      { value: 5, label: 'Maximum', promptDesc: 'perfectly smooth porcelain skin texture, absolute flawless airbrushed skin' }
    ]
  },
  {
    id: 'skin_glow',
    label: 'Skin Glow',
    category: 'skin',
    shortDesc: 'Adds hydration and a luminous, dewy finish to simulate high-end skin hydrators.',
    commonAreas: 'Cheekbones, nose bridge, overall complexion.',
    disclaimer: 'This simulation is a visual highlighting effect simulation only.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original skin highlight' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly radiant dewy skin complexion' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably radiant dewy skin complexion' },
      { value: 3, label: 'Defined', promptDesc: 'strongly highlighting reflective skin complexion' },
      { value: 4, label: 'Strong', promptDesc: 'ultra-luminous reflective glass skin glow, intense highlighting' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum luminous reflective glass skin glow, absolute highlighting' }
    ]
  },
  {
    id: 'acne_reduction',
    label: 'Acne Reduction',
    category: 'skin',
    shortDesc: 'Visually reduces minor skin blemishes, redness, spots, and acne markings.',
    commonAreas: 'Face skin surface.',
    disclaimer: 'This simulation is a visual blemish removal effect simulation only.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original skin surface' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly cleared minor skin blemishes and redness' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably cleared minor skin blemishes and redness' },
      { value: 3, label: 'Defined', promptDesc: 'strongly cleared skin surface with zero spots' },
      { value: 4, label: 'Strong', promptDesc: 'perfectly cleared skin surface, completely erased spots/acne' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum perfectly cleared skin surface, absolute spot removal' }
    ]
  },
  {
    id: 'fineline_reduction',
    label: 'Fine Line Reduction',
    category: 'skin',
    shortDesc: 'Smoothes fine superficial lines around the mouth and eyes for a fresher look.',
    commonAreas: 'Nasolabial folds, periorbital lines.',
    disclaimer: 'This simulation is a visual lines softening effect simulation only.',
    intensityType: 'level',
    steps: [
      { value: 0, label: 'Natural', promptDesc: 'original facial lines' },
      { value: 1, label: 'Subtle', promptDesc: 'slightly softened smile lines and superficial wrinkles' },
      { value: 2, label: 'Moderate', promptDesc: 'noticeably softened smile lines and superficial wrinkles' },
      { value: 3, label: 'Defined', promptDesc: 'strongly reduced smile lines and fine eye wrinkles' },
      { value: 4, label: 'Strong', promptDesc: 'completely erased fine facial lines, zero nasolabial folds' },
      { value: 5, label: 'Maximum', promptDesc: 'maximum erased fine facial lines, absolute wrinkle erasure' }
    ]
  }
];
