import React from 'react';
import { StyleOption, Gender } from './types';

// --- Icons ---

export const Icons = {
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
  ),
  Styles: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
  ),
  Heart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  ),
  Album: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  ),
  Refresh: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
  ),
  Magic: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.3l-5.9 1.9 5.9 1.9a2 2 0 0 1 1.2 1.3L12 21l1.9-5.8a2 2 0 0 1 1.2-1.3l5.9-1.9-5.9-1.9a2 2 0 0 1-1.2-1.3Z" />
      <path d="m19 13-1.1 3.3a1.1 1.1 0 0 1-.7.7l-3.3 1.1 3.3 1.1a1.1 1.1 0 0 1 .7.7L19 23l1.1-3.3a1.1 1.1 0 0 1 .7-.7l3.3-1.1-3.3-1.1a1.1 1.1 0 0 1-.7-.7Z" />
    </svg>
  )
};

// --- Style Illustrations (Vector Mannequins) ---

const FacePath = "M30,45 Q30,85 50,95 Q70,85 70,45 Q70,35 70,25 Q50,25 30,25 Q30,35 30,45";
const EarsPath = "M28,45 Q25,45 25,52 Q25,58 28,58 M72,45 Q75,45 75,52 Q75,58 72,58";
const FaceFeatures = "M40,55 Q50,55 60,55 M45,70 Q50,75 55,70"; // Eyes and mouth hints

// Hair Paths (Overlay on top of face)
const HairPaths: Record<string, string> = {
  // Male
  original: "", // Default/Original
  bald: "",
  buzz: "M30,40 Q30,20 50,18 Q70,20 70,40",
  crew: "M28,42 Q28,15 50,12 Q72,15 72,42",
  undercut: "M29,40 L29,30 Q30,10 50,8 Q70,10 71,30 L71,40",
  fade: "M29,38 L29,25 Q30,8 50,6 Q70,8 71,25 L71,38",
  pompadour: "M28,40 Q25,10 50,2 Q75,10 72,40 Q50,25 28,40",
  quiff: "M28,40 Q25,15 45,10 Q55,0 72,40 Q50,28 28,40",
  slick: "M28,42 Q28,15 50,15 Q72,15 72,42 Q50,30 28,42",
  sidepart: "M28,42 Q25,15 40,15 L42,15 Q72,18 72,42 Q50,30 28,42 M42,15 L40,25",
  curlytop: "M28,40 Q25,10 35,12 Q40,5 50,8 Q60,5 65,12 Q75,10 72,40",
  dreads: "M25,45 Q20,10 50,10 Q80,10 75,45 M35,45 L35,60 M45,45 L45,65 M55,45 L55,65 M65,45 L65,60",
  manbun: "M30,40 Q30,20 50,20 Q70,20 70,40 M45,20 Q45,10 50,10 Q55,10 55,20",
  surfer: "M30,40 Q20,40 20,70 M70,40 Q80,40 80,70 M30,40 Q30,15 50,15 Q70,15 70,40",
  afro: "M20,40 Q10,15 50,10 Q90,15 80,40 Q90,60 80,75 Q50,90 20,75 Q10,60 20,40",
  mullet: "M28,40 Q25,15 50,15 Q75,15 72,40 M20,60 L20,95 M80,60 L80,95",
  fauxhawk: "M40,30 Q50,0 60,30 L70,40 Q50,25 30,40 Z",
  taper: "M28,42 Q28,25 50,22 Q72,25 72,42 Q50,30 28,42",
  topknot: "M30,42 Q30,22 50,22 Q70,22 70,42 M47,22 L53,22 L55,10 L45,10 Z",
  
  // Female
  none: "", // Just face
  pixie: "M28,45 Q25,15 50,12 Q75,15 72,45 Q70,55 65,50 Q60,40 50,42 Q30,40 28,45",
  bob: "M30,40 Q20,40 20,65 Q20,75 35,70 M70,40 Q80,40 80,65 Q80,75 65,70 M30,40 Q30,10 50,10 Q70,10 70,40",
  lob: "M30,40 Q18,40 18,80 M70,40 Q82,40 82,80 M30,40 Q30,10 50,10 Q70,10 70,40",
  shoulder: "M30,40 Q18,40 15,85 M70,40 Q82,40 85,85 M30,40 Q30,10 50,10 Q70,10 70,40",
  longstraight: "M30,40 Q15,40 15,100 M70,40 Q85,40 85,100 M30,40 Q30,10 50,10 Q70,10 70,40",
  longwavy: "M30,40 Q15,40 15,60 Q25,80 15,100 M70,40 Q85,40 85,60 Q75,80 85,100 M30,40 Q30,10 50,10 Q70,10 70,40",
  curly: "M30,40 Q10,30 10,70 Q20,90 30,80 M70,40 Q90,30 90,70 Q80,90 70,80 M30,40 Q30,5 50,5 Q70,5 70,40",
  bangs: "M30,40 Q20,40 20,80 M70,40 Q80,40 80,80 M30,40 Q30,10 50,10 Q70,10 70,40 M30,40 Q50,45 70,40",
  braids: "M30,40 Q20,40 20,90 M70,40 Q80,40 80,90 M30,40 Q30,10 50,10 Q70,10 70,40 M20,50 L25,55 M80,50 L75,55",
  updo: "M30,40 Q25,15 50,15 Q75,15 70,40 M35,15 Q35,0 50,0 Q65,0 65,15",
  shag: "M30,40 Q10,40 15,80 M70,40 Q90,40 85,80 M30,40 Q30,5 50,5 Q70,5 70,40 M32,45 Q50,52 68,45",
  curtainbangs: "M30,40 Q15,40 15,90 M70,40 Q85,40 85,90 M30,40 Q50,15 70,40 M42,40 Q50,55 58,40",
  pixiebob: "M30,40 Q20,30 20,55 Q35,50 40,42 M70,40 Q80,25 72,45 Q60,40 50,42",
  cornrows: "M30,40 Q30,10 50,10 Q70,10 70,40 M38,13 L38,40 M46,11 L46,41 M54,11 L54,41 M62,13 L62,40",
  spacebuns: "M30,40 Q30,15 50,15 Q70,15 70,40 M20,25 Q15,10 30,15 Q30,30 20,25 M80,25 Q85,10 70,15 Q70,30 80,25",
};

// Beard Paths (Overlay on bottom of face)
const BeardPaths: Record<string, string> = {
  original: "",
  none: "",
  stubble: "M32,60 Q50,70 68,60 L68,65 Q50,100 32,65 Z", // Very light fill in CSS
  mustache: "M40,72 Q50,68 60,72 Q50,76 40,72",
  goatee: "M45,85 Q50,95 55,85 Q55,80 45,80",
  chinstrap: "M28,55 Q28,95 50,98 Q72,95 72,55 L68,55 Q68,90 50,94 Q32,90 32,55 Z",
  short: "M28,52 Q28,95 50,98 Q72,95 72,52 L72,48 Q72,90 50,105 Q28,90 28,48 Z",
  medium: "M28,52 Q28,100 50,105 Q72,100 72,52 L72,48 Q72,110 50,115 Q28,110 28,48 Z",
  long: "M28,52 Q30,120 50,125 Q70,120 72,52 L72,48 Q75,130 50,135 Q25,130 28,48 Z",
  full: "M28,48 Q25,100 50,105 Q75,100 72,48 L72,45 Q50,55 28,45 Z", // Covers cheek
  vandyke: "M40,72 Q50,68 60,72 Q50,76 40,72 M44,82 L44,92 Q50,97 56,92 L56,82 Z",
  balbo: "M40,72 Q50,68 60,72 Q50,76 40,72 M38,90 L38,94 Q50,98 62,94 L62,90 Q50,88 38,90 Z",
  ducktail: "M28,48 Q25,95 50,118 Q75,95 72,48 L72,45 Q50,55 28,45 Z",
  anchor: "M40,72 Q50,68 60,72 Q50,76 40,72 M35,90 Q50,95 65,90 L65,92 Q50,100 35,92 Z",
  muttonchops: "M28,45 L36,45 L36,75 Q28,70 28,45 M72,45 L64,45 L64,75 Q72,70 72,45",
  bandholz: "M28,48 Q25,130 50,140 Q75,130 72,48 L72,45 Q50,55 28,45 Z",
};

export const StyleIllustration = ({ id, type }: { id: string, type: 'hair' | 'beard' }) => {
  const isHair = type === 'hair';
  const path = isHair ? HairPaths[id] : BeardPaths[id];
  
  // Opacity helper: if highlighting hair, fade beard and vice versa
  const hairOpacity = isHair ? 0.9 : 0.1;
  const beardOpacity = !isHair ? 0.9 : 0.1;

  // If drawing hair, use the ID. If drawing beard, use the ID.
  // For the 'other' part, use a generic ghost outline to show context.
  const activePath = path || "";
  const ghostHair = !isHair ? "M30,40 Q30,20 50,18 Q70,20 70,40" : ""; // Generic buzz for context
  const ghostBeard = isHair ? "" : ""; // No beard context needed for hair selection usually

  return (
    <svg viewBox="0 0 100 130" className="w-full h-full p-1">
      {/* Head Base */}
      <path d={FacePath} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <path d={EarsPath} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      
      {/* Context/Ghost Features */}
      {ghostHair && <path d={ghostHair} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />}

      {/* The Active Style */}
      {activePath && (
        <path 
          d={activePath} 
          fill="none" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="drop-shadow-md"
        />
      )}
      
      {/* Simple Face Features for realism */}
      <path d={FaceFeatures} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    </svg>
  );
};

// --- Data Lists ---

export const HAIR_STYLES_MALE: StyleOption[] = [
{ id: 'original', label: 'Original', category: 'hair', type: 'style', subcategory: 'original' },
{ id: 'bald', label: 'Bald', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'afro', label: 'Afro', category: 'hair', type: 'style', subcategory: 'curly' },
{ id: 'buzz', label: 'Buzz Cut', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'crew', label: 'Crew Cut', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'curlytop', label: 'Curly Top', category: 'hair', type: 'style', subcategory: 'curly' },
{ id: 'dreads', label: 'Dreadlocks', category: 'hair', type: 'style', subcategory: 'locs' },
{ id: 'fade', label: 'High Fade', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'fauxhawk', label: 'Faux Hawk', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'manbun', label: 'Man Bun', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'mullet', label: 'Mullet', category: 'hair', type: 'style', subcategory: 'trendy' },
{ id: 'pompadour', label: 'Pompadour', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'quiff', label: 'Quiff', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'sidepart', label: 'Side Part', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'slick', label: 'Slicked Back', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'surfer', label: 'Surfer / Long', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'taper', label: 'Taper Fade', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'topknot', label: 'Top Knot', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'undercut', label: 'Undercut', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_induction_cut', label: 'Induction Cut', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'male_caesar_cut', label: 'Caesar Cut', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'male_french_crop', label: 'French Crop', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'male_textured_crop', label: 'Textured Crop', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'male_ivy_league', label: 'Ivy League', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'male_flat_top', label: 'Flat Top', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'male_high_tight', label: 'High & Tight', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'male_low_fade', label: 'Low Fade', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_mid_fade', label: 'Mid Fade', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_skin_fade', label: 'Skin Fade', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_drop_fade', label: 'Drop Fade', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_burst_fade', label: 'Burst Fade', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_temple_fade', label: 'Temple Fade', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_low_taper', label: 'Low Taper', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_mid_taper', label: 'Mid Taper', category: 'hair', type: 'style', subcategory: 'fade' },
{ id: 'male_bro_flow', label: 'Bro Flow', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_comb_over', label: 'Comb Over', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_brushed_back', label: 'Brushed Back', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_textured_fringe', label: 'Textured Fringe', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_middle_part', label: 'Middle Part', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_curtains', label: 'Curtains', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_messy_quiff', label: 'Messy Quiff', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_slick_back_fade', label: 'Slick Back Fade', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_wavy_side_part', label: 'Wavy Side Part', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'male_long_straight', label: 'Long Straight Hair', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'male_long_wavy', label: 'Long Wavy Hair', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'male_long_curly', label: 'Long Curly Hair', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'male_shoulder_length', label: 'Shoulder-Length Hair', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'male_half_up_bun', label: 'Half-Up Man Bun', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'male_long_undercut', label: 'Long Hair with Undercut', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'male_curly_fringe', label: 'Curly Fringe', category: 'hair', type: 'style', subcategory: 'curly' },
{ id: 'male_curly_fade', label: 'Curly Fade', category: 'hair', type: 'style', subcategory: 'curly' },
{ id: 'male_two_strand_twists', label: 'Two-Strand Twists', category: 'hair', type: 'style', subcategory: 'curly' },
{ id: 'male_short_locs', label: 'Short Locs', category: 'hair', type: 'style', subcategory: 'locs' },
{ id: 'male_braided_cornrows', label: 'Braided Cornrows', category: 'hair', type: 'style', subcategory: 'braids' },
{ id: 'male_modern_mullet', label: 'Modern Mullet', category: 'hair', type: 'style', subcategory: 'trendy' }
];

export const ARCHIVED_HAIR_STYLES_MALE: StyleOption[] = [
{ id: 'male_burr_cut', label: 'Burr Cut', category: 'hair', type: 'style', subcategory: 'short' , active: false, archived: true },
{ id: 'male_butch_cut', label: 'Butch Cut', category: 'hair', type: 'style', subcategory: 'short' , active: false, archived: true },
{ id: 'male_regulation_cut', label: 'Regulation Cut', category: 'hair', type: 'style', subcategory: 'short' , active: false, archived: true },
{ id: 'male_short_spiky', label: 'Short Spiky', category: 'hair', type: 'style', subcategory: 'short' , active: false, archived: true },
{ id: 'male_short_messy', label: 'Short Messy', category: 'hair', type: 'style', subcategory: 'short' , active: false, archived: true },
{ id: 'male_short_curly_fade', label: 'Short Curly Fade', category: 'hair', type: 'style', subcategory: 'short' , active: false, archived: true },
{ id: 'male_shadow_fade', label: 'Shadow Fade', category: 'hair', type: 'style', subcategory: 'fade' , active: false, archived: true },
{ id: 'male_bald_fade', label: 'Bald Fade', category: 'hair', type: 'style', subcategory: 'fade' , active: false, archived: true },
{ id: 'male_edgar_cut', label: 'Edgar Cut', category: 'hair', type: 'style', subcategory: 'fade' , active: false, archived: true },
{ id: 'male_textured_edgar', label: 'Textured Edgar', category: 'hair', type: 'style', subcategory: 'fade' , active: false, archived: true },
{ id: 'male_modern_comb_over', label: 'Modern Comb Over', category: 'hair', type: 'style', subcategory: 'medium' , active: false, archived: true },
{ id: 'male_angular_fringe', label: 'Angular Fringe', category: 'hair', type: 'style', subcategory: 'medium' , active: false, archived: true },
{ id: 'male_modern_pompadour', label: 'Modern Pompadour', category: 'hair', type: 'style', subcategory: 'medium' , active: false, archived: true },
{ id: 'male_side_swept', label: 'Side-Swept', category: 'hair', type: 'style', subcategory: 'medium' , active: false, archived: true },
{ id: 'male_low_bun', label: 'Low Man Bun', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'male_samurai_knot', label: 'Samurai Top Knot', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'male_viking_hair', label: 'Viking Hair', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'male_layered_long', label: 'Layered Long', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'male_curly_undercut', label: 'Curly Undercut', category: 'hair', type: 'style', subcategory: 'curly' , active: false, archived: true },
{ id: 'male_coiled_top', label: 'Coiled Top', category: 'hair', type: 'style', subcategory: 'curly' , active: false, archived: true },
{ id: 'male_twist_out', label: 'Twist Out', category: 'hair', type: 'style', subcategory: 'curly' , active: false, archived: true },
{ id: 'male_short_twists', label: 'Short Twists', category: 'hair', type: 'style', subcategory: 'curly' , active: false, archived: true },
{ id: 'male_sponge_twists', label: 'Sponge Twists', category: 'hair', type: 'style', subcategory: 'curly' , active: false, archived: true },
{ id: 'male_freeform_locs', label: 'Freeform Locs', category: 'hair', type: 'style', subcategory: 'locs' , active: false, archived: true },
{ id: 'male_medium_locs', label: 'Medium Locs', category: 'hair', type: 'style', subcategory: 'locs' , active: false, archived: true },
{ id: 'male_box_braids', label: 'Box Braids', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'male_braided_top_knot', label: 'Braided Top Knot', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'male_burst_fade_mullet', label: 'Burst Fade Mullet', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'male_wolf_cut', label: 'Wolf Cut', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'male_mohawk', label: 'Mohawk', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'male_braided_mohawk', label: 'Braided Mohawk', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'male_faux_locs', label: 'Faux Locs', category: 'hair', type: 'style', subcategory: 'locs' , active: false, archived: true },
{ id: 'male_clean_shaved_head', label: 'Clean Shaved Head', category: 'hair', type: 'style', subcategory: 'short' , active: false, archived: true },
{ id: 'male_receding_hairline', label: 'Receding Hairline', category: 'hair', type: 'style', subcategory: 'mature' , active: false, archived: true },
{ id: 'male_salt_pepper_hair', label: 'Salt & Pepper Hair', category: 'hair', type: 'style', subcategory: 'mature' , active: false, archived: true },
{ id: 'male_mature_classic_cut', label: 'Mature Classic', category: 'hair', type: 'style', subcategory: 'mature' , active: false, archived: true }
];

export const HAIR_STYLES_FEMALE: StyleOption[] = [
{ id: 'original', label: 'Original', category: 'hair', type: 'style', subcategory: 'original' },
{ id: 'bangs', label: 'Bangs / Fringe', category: 'hair', type: 'style', subcategory: 'bangs' },
{ id: 'bob', label: 'Bob Cut', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'braids', label: 'Braids', category: 'hair', type: 'style', subcategory: 'braids' },
{ id: 'curly', label: 'Curly / Afro', category: 'hair', type: 'style', subcategory: 'curly' },
{ id: 'curtainbangs', label: 'Curtain Bangs', category: 'hair', type: 'style', subcategory: 'bangs' },
{ id: 'lob', label: 'Long Bob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'longstraight', label: 'Long Straight', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'longwavy', label: 'Long Wavy', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'pixie', label: 'Pixie Cut', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'pixiebob', label: 'Pixie Bob', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'shag', label: 'Shag Cut', category: 'hair', type: 'style', subcategory: 'trendy' },
{ id: 'shoulder', label: 'Shoulder Length', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'spacebuns', label: 'Space Buns', category: 'hair', type: 'style', subcategory: 'buns' },
{ id: 'updo', label: 'Updo / Bun', category: 'hair', type: 'style', subcategory: 'buns' },
{ id: 'female_classic_pixie', label: 'Classic Pixie', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'female_textured_pixie', label: 'Textured Pixie', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'female_curly_pixie', label: 'Curly Pixie', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'female_bixie_cut', label: 'Bixie Cut', category: 'hair', type: 'style', subcategory: 'short' },
{ id: 'female_french_bob', label: 'French Bob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'female_blunt_bob', label: 'Blunt Bob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'female_layered_bob', label: 'Layered Bob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'female_asymmetrical_bob', label: 'Asymmetrical Bob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'female_curly_bob', label: 'Curly Bob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'female_sleek_bob', label: 'Sleek Bob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'female_medium_straight', label: 'Medium Straight', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'female_medium_wavy', label: 'Medium Wavy', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'female_medium_curly', label: 'Medium Curly', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'female_collarbone_length', label: 'Collarbone Length', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'female_layered_shoulder', label: 'Layered Shoulder Length', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'female_butterfly_cut', label: 'Butterfly Cut', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'female_face_framing_layers', label: 'Face-Framing Layers', category: 'hair', type: 'style', subcategory: 'medium' },
{ id: 'female_layered_lob', label: 'Layered Lob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'female_wavy_lob', label: 'Wavy Lob', category: 'hair', type: 'style', subcategory: 'bob' },
{ id: 'female_extra_long_straight', label: 'Extra-Long Straight', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_extra_long_wavy', label: 'Extra-Long Wavy', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_extra_long_curly', label: 'Extra-Long Curly', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_long_layers', label: 'Long Layers', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_butterfly_layers', label: 'Butterfly Layers', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_mermaid_waves', label: 'Mermaid Waves', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_beach_waves', label: 'Beach Waves', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_hollywood_waves', label: 'Hollywood Waves', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_voluminous_curls', label: 'Voluminous Curls', category: 'hair', type: 'style', subcategory: 'long' },
{ id: 'female_blunt_bangs', label: 'Blunt Bangs', category: 'hair', type: 'style', subcategory: 'bangs' },
{ id: 'female_wispy_bangs', label: 'Wispy Bangs', category: 'hair', type: 'style', subcategory: 'bangs' },
{ id: 'female_side_swept_bangs', label: 'Side-Swept Bangs', category: 'hair', type: 'style', subcategory: 'bangs' },
{ id: 'female_bottleneck_bangs', label: 'Bottleneck Bangs', category: 'hair', type: 'style', subcategory: 'bangs' },
{ id: 'female_box_braids', label: 'Box Braids', category: 'hair', type: 'style', subcategory: 'braids' },
{ id: 'female_knotless_braids', label: 'Knotless Braids', category: 'hair', type: 'style', subcategory: 'braids' },
{ id: 'female_french_braids', label: 'French Braids', category: 'hair', type: 'style', subcategory: 'braids' },
{ id: 'female_high_ponytail', label: 'High Ponytail', category: 'hair', type: 'style', subcategory: 'ponytails' },
{ id: 'female_sleek_bun', label: 'Sleek Bun', category: 'hair', type: 'style', subcategory: 'buns' },
{ id: 'female_natural_afro', label: 'Natural Afro', category: 'hair', type: 'style', subcategory: 'natural' },
{ id: 'female_defined_coils', label: 'Defined Coils', category: 'hair', type: 'style', subcategory: 'natural' },
  { id: 'cornrows', label: 'Cornrows', category: 'hair', type: 'style', subcategory: 'braids' }
];

export const ARCHIVED_HAIR_STYLES_FEMALE: StyleOption[] = [
{ id: 'female_long_pixie', label: 'Long Pixie', category: 'hair', type: 'style', subcategory: 'short' , active: false, archived: true },
{ id: 'female_chin_length_bob', label: 'Chin-Length Bob', category: 'hair', type: 'style', subcategory: 'bob' , active: false, archived: true },
{ id: 'female_angled_bob', label: 'Angled Bob', category: 'hair', type: 'style', subcategory: 'bob' , active: false, archived: true },
{ id: 'female_wavy_bob', label: 'Wavy Bob', category: 'hair', type: 'style', subcategory: 'bob' , active: false, archived: true },
{ id: 'female_bob_with_bangs', label: 'Bob with Bangs', category: 'hair', type: 'style', subcategory: 'bob' , active: false, archived: true },
{ id: 'female_medium_shag', label: 'Medium Shag', category: 'hair', type: 'style', subcategory: 'medium' , active: false, archived: true },
{ id: 'female_blunt_lob', label: 'Blunt Lob', category: 'hair', type: 'style', subcategory: 'bob' , active: false, archived: true },
{ id: 'female_curly_lob', label: 'Curly Lob', category: 'hair', type: 'style', subcategory: 'bob' , active: false, archived: true },
{ id: 'female_sleek_lob', label: 'Sleek Lob', category: 'hair', type: 'style', subcategory: 'bob' , active: false, archived: true },
{ id: 'female_feathered_layers', label: 'Feathered Layers', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'female_long_face_framing', label: 'Long Face-Framing', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'female_long_side_part', label: 'Long with Side Part', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'female_long_middle_part', label: 'Long with Middle Part', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'female_loose_curls', label: 'Loose Curls', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'female_defined_curls', label: 'Defined Curls', category: 'hair', type: 'style', subcategory: 'long' , active: false, archived: true },
{ id: 'female_micro_bangs', label: 'Micro Bangs', category: 'hair', type: 'style', subcategory: 'bangs' , active: false, archived: true },
{ id: 'female_baby_bangs', label: 'Baby Bangs', category: 'hair', type: 'style', subcategory: 'bangs' , active: false, archived: true },
{ id: 'female_birkin_bangs', label: 'Birkin Bangs', category: 'hair', type: 'style', subcategory: 'bangs' , active: false, archived: true },
{ id: 'female_curly_bangs', label: 'Curly Bangs', category: 'hair', type: 'style', subcategory: 'bangs' , active: false, archived: true },
{ id: 'female_long_curtain_bangs', label: 'Long Curtain Bangs', category: 'hair', type: 'style', subcategory: 'bangs' , active: false, archived: true },
{ id: 'female_layered_fringe', label: 'Layered Fringe', category: 'hair', type: 'style', subcategory: 'bangs' , active: false, archived: true },
{ id: 'female_cornrows', label: 'Cornrows', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_fulani_braids', label: 'Fulani Braids', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_dutch_braids', label: 'Dutch Braids', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_fishtail_braid', label: 'Fishtail Braid', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_crown_braid', label: 'Crown Braid', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_halo_braid', label: 'Halo Braid', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_side_braid', label: 'Side Braid', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_braided_ponytail', label: 'Braided Ponytail', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_braided_bun', label: 'Braided Bun', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_goddess_braids', label: 'Goddess Braids', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_lemonade_braids', label: 'Lemonade Braids', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_micro_braids', label: 'Micro Braids', category: 'hair', type: 'style', subcategory: 'braids' , active: false, archived: true },
{ id: 'female_low_ponytail', label: 'Low Ponytail', category: 'hair', type: 'style', subcategory: 'ponytails' , active: false, archived: true },
{ id: 'female_sleek_ponytail', label: 'Sleek Ponytail', category: 'hair', type: 'style', subcategory: 'ponytails' , active: false, archived: true },
{ id: 'female_bubble_ponytail', label: 'Bubble Ponytail', category: 'hair', type: 'style', subcategory: 'ponytails' , active: false, archived: true },
{ id: 'female_curly_ponytail', label: 'Curly Ponytail', category: 'hair', type: 'style', subcategory: 'ponytails' , active: false, archived: true },
{ id: 'female_half_up_ponytail', label: 'Half-Up Ponytail', category: 'hair', type: 'style', subcategory: 'ponytails' , active: false, archived: true },
{ id: 'female_high_bun', label: 'High Bun', category: 'hair', type: 'style', subcategory: 'buns' , active: false, archived: true },
{ id: 'female_low_bun', label: 'Low Bun', category: 'hair', type: 'style', subcategory: 'buns' , active: false, archived: true },
{ id: 'female_messy_bun', label: 'Messy Bun', category: 'hair', type: 'style', subcategory: 'buns' , active: false, archived: true },
{ id: 'female_top_knot', label: 'Top Knot', category: 'hair', type: 'style', subcategory: 'buns' , active: false, archived: true },
{ id: 'female_half_up_bun', label: 'Half-Up Bun', category: 'hair', type: 'style', subcategory: 'buns' , active: false, archived: true },
{ id: 'female_double_buns', label: 'Double Buns', category: 'hair', type: 'style', subcategory: 'buns' , active: false, archived: true },
{ id: 'female_chignon', label: 'Chignon', category: 'hair', type: 'style', subcategory: 'buns' , active: false, archived: true },
{ id: 'female_french_twist', label: 'French Twist', category: 'hair', type: 'style', subcategory: 'buns' , active: false, archived: true },
{ id: 'female_rounded_afro', label: 'Rounded Afro', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_tapered_afro', label: 'Tapered Afro', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_twist_out', label: 'Twist Out', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_braid_out', label: 'Braid Out', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_wash_go', label: 'Wash and Go', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_finger_coils', label: 'Finger Coils', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_two_strand_twists', label: 'Two-Strand Twists', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_flat_twists', label: 'Flat Twists', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_passion_twists', label: 'Passion Twists', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_senegalese_twists', label: 'Senegalese Twists', category: 'hair', type: 'style', subcategory: 'natural' , active: false, archived: true },
{ id: 'female_faux_locs', label: 'Faux Locs', category: 'hair', type: 'style', subcategory: 'locs' , active: false, archived: true },
{ id: 'female_butterfly_locs', label: 'Butterfly Locs', category: 'hair', type: 'style', subcategory: 'locs' , active: false, archived: true },
{ id: 'female_short_locs', label: 'Short Locs', category: 'hair', type: 'style', subcategory: 'locs' , active: false, archived: true },
{ id: 'female_long_locs', label: 'Long Locs', category: 'hair', type: 'style', subcategory: 'locs' , active: false, archived: true },
{ id: 'female_wolf_cut', label: 'Wolf Cut', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_soft_wolf_cut', label: 'Soft Wolf Cut', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_jellyfish_cut', label: 'Jellyfish Cut', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_hime_cut', label: 'Hime Cut', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_octopus_cut', label: 'Octopus Cut', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_modern_shag', label: 'Modern Shag', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_retro_shag', label: 'Retro Shag', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_mullet_shag', label: 'Mullet Shag', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_wet_look', label: 'Wet Look', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_slicked_back', label: 'Slicked-Back', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_pin_curls', label: 'Vintage Pin Curls', category: 'hair', type: 'style', subcategory: 'formal' , active: false, archived: true },
{ id: 'female_old_hollywood', label: 'Old Hollywood Glam', category: 'hair', type: 'style', subcategory: 'formal' , active: false, archived: true },
{ id: 'female_boho_waves', label: 'Boho Waves', category: 'hair', type: 'style', subcategory: 'trendy' , active: false, archived: true },
{ id: 'female_bridal_updo', label: 'Bridal Updo', category: 'hair', type: 'style', subcategory: 'formal' , active: false, archived: true },
{ id: 'female_braided_bridal', label: 'Braided Bridal Updo', category: 'hair', type: 'style', subcategory: 'formal' , active: false, archived: true },
{ id: 'female_formal_updo', label: 'Elegant Formal Updo', category: 'hair', type: 'style', subcategory: 'formal' , active: false, archived: true }
];

export const BEARD_STYLES: StyleOption[] = [
  { id: 'original', label: 'Original', category: 'beard', type: 'style', subcategory: 'original' },
  { id: 'none', label: 'Clean Shaven', category: 'beard', type: 'style', subcategory: 'clean' },
  { id: 'stubble', label: 'Stubble', category: 'beard', type: 'style', subcategory: 'stubble' },
  { id: 'mustache', label: 'Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'goatee', label: 'Goatee', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'vandyke', label: 'Van Dyke', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'balbo', label: 'Balbo', category: 'beard', type: 'style', subcategory: 'short' },
  { id: 'ducktail', label: 'Ducktail', category: 'beard', type: 'style', subcategory: 'full' },
  { id: 'anchor', label: 'Anchor', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'chinstrap', label: 'Chin Strap', category: 'beard', type: 'style', subcategory: 'trendy' },
  { id: 'muttonchops', label: 'Mutton Chops', category: 'beard', type: 'style', subcategory: 'mature' },
  { id: 'short', label: 'Short Beard', category: 'beard', type: 'style', subcategory: 'short' },
  { id: 'medium', label: 'Medium Beard', category: 'beard', type: 'style', subcategory: 'full' },
  { id: 'long', label: 'Long Beard', category: 'beard', type: 'style', subcategory: 'long' },
  { id: 'full', label: 'Full Beard', category: 'beard', type: 'style', subcategory: 'full' },
  { id: 'bandholz', label: 'Bandholz', category: 'beard', type: 'style', subcategory: 'long' },

  // --- New Shaved & Light Growth ---
  { id: 'male_five_oclock_shadow', label: "Five O'Clock Shadow", category: 'beard', type: 'style', subcategory: 'stubble' },
  { id: 'male_designer_stubble', label: 'Designer Stubble', category: 'beard', type: 'style', subcategory: 'stubble' },
  { id: 'male_heavy_stubble', label: 'Heavy Stubble', category: 'beard', type: 'style', subcategory: 'stubble' },

  // --- New Mustache Styles ---
  { id: 'male_chevron_mustache', label: 'Chevron Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'male_pencil_mustache', label: 'Pencil Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'male_handlebar_mustache', label: 'Handlebar Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'male_horseshoe_mustache', label: 'Horseshoe Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'male_walrus_mustache', label: 'Walrus Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'male_natural_mustache', label: 'Natural Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'male_petite_mustache', label: 'Petite Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'male_english_mustache', label: 'English Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },
  { id: 'male_lampshade_mustache', label: 'Lampshade Mustache', category: 'beard', type: 'style', subcategory: 'mustache' },

  // --- New Goatee & Partial Beard Styles ---
  { id: 'male_soul_patch', label: 'Soul Patch', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'male_circle_beard', label: 'Circle Beard', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'male_extended_goatee', label: 'Extended Goatee', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'male_petite_goatee', label: 'Petite Goatee', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'male_chin_puff', label: 'Chin Puff', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'male_goatee_mustache', label: 'Goatee & Mustache', category: 'beard', type: 'style', subcategory: 'goatee' },
  { id: 'male_detached_goatee', label: 'Detached Goatee', category: 'beard', type: 'style', subcategory: 'goatee' },

  // --- New Short & Professional Beard Styles ---
  { id: 'male_short_boxed_beard', label: 'Short Boxed Beard', category: 'beard', type: 'style', subcategory: 'short' },
  { id: 'male_corporate_beard', label: 'Corporate Beard', category: 'beard', type: 'style', subcategory: 'short' },
  { id: 'male_tapered_beard', label: 'Tapered Beard', category: 'beard', type: 'style', subcategory: 'short' },
  { id: 'male_faded_beard', label: 'Faded Beard', category: 'beard', type: 'style', subcategory: 'short' },
  { id: 'male_sculpted_beard', label: 'Sculpted Beard', category: 'beard', type: 'style', subcategory: 'short' },
  { id: 'male_defined_jawline', label: 'Defined Jawline Beard', category: 'beard', type: 'style', subcategory: 'short' },
  { id: 'male_short_rounded', label: 'Short Rounded Beard', category: 'beard', type: 'style', subcategory: 'short' },

  // --- New Full & Longer Beard Styles ---
  { id: 'male_long_boxed_beard', label: 'Long Boxed Beard', category: 'beard', type: 'style', subcategory: 'full' },
  { id: 'male_garibaldi', label: 'Garibaldi', category: 'beard', type: 'style', subcategory: 'long' },
  { id: 'male_verdi', label: 'Verdi', category: 'beard', type: 'style', subcategory: 'long' },
  { id: 'male_hollywoodian', label: 'Hollywoodian', category: 'beard', type: 'style', subcategory: 'full' },
  { id: 'male_yeard', label: 'Yeard', category: 'beard', type: 'style', subcategory: 'long' },
  { id: 'male_natural_full_beard', label: 'Natural Full Beard', category: 'beard', type: 'style', subcategory: 'full' },
  { id: 'male_groomed_full_beard', label: 'Groomed Full Beard', category: 'beard', type: 'style', subcategory: 'full' },

  // --- New Combination / Trend Styles ---
  { id: 'male_beardstache', label: 'Beardstache', category: 'beard', type: 'style', subcategory: 'trendy' },
  { id: 'male_mustache_stubble', label: 'Mustache with Stubble', category: 'beard', type: 'style', subcategory: 'trendy' },
  { id: 'male_mustache_short_beard', label: 'Mustache with Short Beard', category: 'beard', type: 'style', subcategory: 'trendy' },
  { id: 'male_bald_with_beard', label: 'Bald with Beard', category: 'beard', type: 'style', subcategory: 'trendy' },
  { id: 'male_fade_beard_blend', label: 'Fade & Beard Blend', category: 'beard', type: 'style', subcategory: 'trendy' },
  { id: 'male_sharp_line_up', label: 'Sharp Line-Up Beard', category: 'beard', type: 'style', subcategory: 'trendy' },
  { id: 'male_salt_pepper_beard', label: 'Salt & Pepper Beard', category: 'beard', type: 'style', subcategory: 'mature' },
  { id: 'male_mature_trimmed_beard', label: 'Mature Trimmed Beard', category: 'beard', type: 'style', subcategory: 'mature' },
];

export const HAIR_COLORS: StyleOption[] = [
  { id: 'original', label: 'Original', category: 'hair', type: 'color' },
  { id: 'black', label: 'Black', category: 'hair', type: 'color' },
  { id: 'darkbrown', label: 'Dark Brown', category: 'hair', type: 'color' },
  { id: 'brown', label: 'Medium Brown', category: 'hair', type: 'color' },
  { id: 'lightbrown', label: 'Light Brown', category: 'hair', type: 'color' },
  { id: 'blonde', label: 'Blonde', category: 'hair', type: 'color' },
  { id: 'platinum', label: 'Platinum', category: 'hair', type: 'color' },
  { id: 'red', label: 'Red / Ginger', category: 'hair', type: 'color' },
  { id: 'auburn', label: 'Auburn', category: 'hair', type: 'color' },
  { id: 'grey', label: 'Grey / Silver', category: 'hair', type: 'color' },
  { id: 'white', label: 'White', category: 'hair', type: 'color' },
  { id: 'blue', label: 'Blue', category: 'hair', type: 'color' },
  { id: 'green', label: 'Green', category: 'hair', type: 'color' },
  { id: 'pink', label: 'Pink', category: 'hair', type: 'color' },
  { id: 'blonde_highlights', label: 'Blonde Highlights', category: 'hair', type: 'color' },
  { id: 'brown_highlights', label: 'Brown Highlights', category: 'hair', type: 'color' },
  { id: 'platinum_highlights', label: 'Platinum Highlights', category: 'hair', type: 'color' },
  { id: 'blue_highlights', label: 'Blue Highlights', category: 'hair', type: 'color' },
  { id: 'pink_highlights', label: 'Pink Highlights', category: 'hair', type: 'color' },
  { id: 'blonde_ombre', label: 'Blonde Ombre', category: 'hair', type: 'color' },
  { id: 'brown_ombre', label: 'Brown Ombre', category: 'hair', type: 'color' },
  { id: 'red_ombre', label: 'Red Ombre', category: 'hair', type: 'color' },
  { id: 'blue_ombre', label: 'Blue Ombre', category: 'hair', type: 'color' },
  { id: 'pink_ombre', label: 'Pink Ombre', category: 'hair', type: 'color' },
];

export const BEARD_COLORS: StyleOption[] = [
  { id: 'original', label: 'Original', category: 'beard', type: 'color' },
  { id: 'match', label: 'Match Hair', category: 'beard', type: 'color' },
  { id: 'black', label: 'Black', category: 'beard', type: 'color' },
  { id: 'darkbrown', label: 'Dark Brown', category: 'beard', type: 'color' },
  { id: 'brown', label: 'Brown', category: 'beard', type: 'color' },
  { id: 'blonde', label: 'Blonde', category: 'beard', type: 'color' },
  { id: 'red', label: 'Red', category: 'beard', type: 'color' },
  { id: 'grey', label: 'Grey', category: 'beard', type: 'color' },
  { id: 'white', label: 'White', category: 'beard', type: 'color' },
];

export const OUTFIT_STYLES: StyleOption[] = [
  { id: 'original', label: 'Original Outfit', category: 'outfit', type: 'style', gender: 'unisex' },
  
  // Existing/Legacy Styles (Mapped as Unisex for backwards compatibility)
  { id: 'outfit_business', label: 'Business Formal', category: 'outfit', type: 'style', gender: 'unisex' },
  { id: 'outfit_wedding', label: 'Wedding Theme', category: 'outfit', type: 'style', gender: 'unisex' },
  { id: 'outfit_gala', label: 'Luxury Gala Gown', category: 'outfit', type: 'style', gender: 'unisex' },
  { id: 'outfit_highlife', label: 'Yacht Casual', category: 'outfit', type: 'style', gender: 'unisex' },
  { id: 'outfit_resort', label: 'Summer Resort', category: 'outfit', type: 'style', gender: 'unisex' },
  { id: 'outfit_streetwear', label: 'Streetwear Tech', category: 'outfit', type: 'style', gender: 'unisex' },
  { id: 'outfit_retro', label: 'Retro Vintage', category: 'outfit', type: 'style', gender: 'unisex' },
  { id: 'outfit_active', label: 'Athletic Wear', category: 'outfit', type: 'style', gender: 'unisex' },
  { id: 'outfit_sport', label: 'Sport Active', category: 'outfit', type: 'style', gender: 'unisex' },

  // Female-Specific Outfits
  { id: 'female_outfit_sundress', label: 'Casual Sundress', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_casual_tshirt_jeans', label: 'Basic Tee & Jeans', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_casual_sweater_jeans', label: 'Oversized Sweater & Jeans', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_casual_crop_pants', label: 'Crop Top & Pants', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_casual_leather_jacket', label: 'Leather Jacket Outfit', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_business_pantsuit', label: 'Business Pantsuit', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_business_blazer_trousers', label: 'Blazer & Trousers', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_business_pencil_skirt', label: 'Blouse & Pencil Skirt', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_luxury_cocktail_dress', label: 'Cocktail Dress', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_luxury_satin_dress', label: 'Satin slip dress', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_luxury_lbd', label: 'Little Black Dress', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_luxury_wedding_guest', label: 'Wedding Guest Dress', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_luxury_designer', label: 'Luxury Designer Tweed', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_streetwear_hoodie_cargo', label: 'Streetwear Hoodie & Cargo', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_vacation_beach_cover', label: 'Beach Cover-Up', category: 'outfit', type: 'style', gender: 'Female' },
  { id: 'female_outfit_casual_winter_coat', label: 'Winter Coat & Boots', category: 'outfit', type: 'style', gender: 'Female' },

  // Male-Specific Outfits
  { id: 'male_outfit_casual_tshirt_jeans', label: 'T-Shirt & Jeans', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_casual_polo_chinos', label: 'Polo & Chinos', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_casual_buttondown_trousers', label: 'Button-Down & Pants', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_casual_denim_jacket', label: 'Denim Jacket Outfit', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_casual_leather_jacket', label: 'Biker Leather Jacket', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_casual_winter_coat', label: 'Winter Wool Coat', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_business_blazer', label: 'Business-Casual Blazer', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_luxury_formal_suit', label: 'Black Formal Suit', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_luxury_wedding_guest', label: 'Wedding Guest Suit', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_luxury_designer', label: 'Designer Smart Jacket', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_active_training', label: 'Athletic Training Tee', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_active_basketball', label: 'Basketball Uniform', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_active_tennis', label: 'Tennis Outfit', category: 'outfit', type: 'style', gender: 'Male' },
  { id: 'male_outfit_vacation_linen', label: 'Linen Vacation Wear', category: 'outfit', type: 'style', gender: 'Male' },

  { id: 'unisex_outfit_oversized_streetwear', label: 'Oversized Streetwear', category: 'outfit', type: 'style', gender: 'unisex' }
];

export const MAKEUP_STYLES: StyleOption[] = [
  { id: 'original', label: 'Original Skin', category: 'makeup', type: 'style' },
  { id: 'makeup_natural', label: 'Natural Glaze', category: 'makeup', type: 'style' },
  { id: 'makeup_bold', label: 'Bold Crimson', category: 'makeup', type: 'style' },
  { id: 'makeup_smokey', label: 'Smokey Eyes', category: 'makeup', type: 'style' },
  { id: 'makeup_rose', label: 'Rose Glow', category: 'makeup', type: 'style' },

  { id: 'makeup_no_makeup', label: 'No-Makeup Makeup', category: 'makeup', type: 'style' },
  { id: 'makeup_clean_girl', label: 'Clean Girl Makeup', category: 'makeup', type: 'style' },
  { id: 'makeup_soft_glam', label: 'Soft Glam', category: 'makeup', type: 'style' },
  { id: 'makeup_full_glam', label: 'Full Glam', category: 'makeup', type: 'style' },
  { id: 'makeup_natural_everyday', label: 'Natural Everyday', category: 'makeup', type: 'style' },
  { id: 'makeup_dewy_glow', label: 'Dewy Glow', category: 'makeup', type: 'style' },
  { id: 'makeup_matte_glam', label: 'Matte Glam', category: 'makeup', type: 'style' },
  { id: 'makeup_glass_skin', label: 'Glass Skin Makeup', category: 'makeup', type: 'style' },
  { id: 'makeup_latte', label: 'Latte Makeup', category: 'makeup', type: 'style' },
  { id: 'makeup_strawberry', label: 'Strawberry Makeup', category: 'makeup', type: 'style' },
  { id: 'makeup_peach', label: 'Peach Makeup', category: 'makeup', type: 'style' },
  { id: 'makeup_rosy', label: 'Rosy Makeup', category: 'makeup', type: 'style' },
  { id: 'makeup_bronze_goddess', label: 'Bronze Goddess', category: 'makeup', type: 'style' },
  { id: 'makeup_smokey_eye', label: 'Smokey Eye', category: 'makeup', type: 'style' },
  { id: 'makeup_soft_smokey', label: 'Soft Smokey Eye', category: 'makeup', type: 'style' },
  { id: 'makeup_classic_red_lip', label: 'Classic Red Lip', category: 'makeup', type: 'style' },
  { id: 'makeup_nude_glam', label: 'Nude Glam', category: 'makeup', type: 'style' },
  { id: 'makeup_bridal', label: 'Bridal Makeup', category: 'makeup', type: 'style' },
  { id: 'makeup_evening_glam', label: 'Evening Glam', category: 'makeup', type: 'style' },
  { id: 'makeup_y2k', label: 'Y2K Makeup', category: 'makeup', type: 'style' },
];
// --- Validation Assertions ---
if (HAIR_STYLES_MALE.length !== 55) {
  throw new Error("Expected 55 active male hairstyles, found " + HAIR_STYLES_MALE.length);
}
if (HAIR_STYLES_FEMALE.length !== 55) {
  throw new Error("Expected 55 active female hairstyles, found " + HAIR_STYLES_FEMALE.length);
}
const maleIdsSet = new Set(HAIR_STYLES_MALE.map(x => x.id));
if (maleIdsSet.size !== 55) {
  throw new Error("Duplicate active male hairstyle IDs detected");
}
const femaleIdsSet = new Set(HAIR_STYLES_FEMALE.map(x => x.id));
if (femaleIdsSet.size !== 55) {
  throw new Error("Duplicate active female hairstyle IDs detected");
}
