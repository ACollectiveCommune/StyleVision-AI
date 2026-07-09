import React from 'react';
import { StyleOption, Gender } from './types';

// --- Icons ---

export const Icons = {
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
  ),
  Styles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
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
  { id: 'original', label: 'Original', category: 'hair', type: 'style' },
  { id: 'bald', label: 'Bald', category: 'hair', type: 'style' },
  { id: 'buzz', label: 'Buzz Cut', category: 'hair', type: 'style' },
  { id: 'crew', label: 'Crew Cut', category: 'hair', type: 'style' },
  { id: 'curlytop', label: 'Curly Top', category: 'hair', type: 'style' },
  { id: 'dreads', label: 'Dreadlocks', category: 'hair', type: 'style' },
  { id: 'fade', label: 'High Fade', category: 'hair', type: 'style' },
  { id: 'manbun', label: 'Man Bun', category: 'hair', type: 'style' },
  { id: 'pompadour', label: 'Pompadour', category: 'hair', type: 'style' },
  { id: 'quiff', label: 'Quiff', category: 'hair', type: 'style' },
  { id: 'sidepart', label: 'Side Part', category: 'hair', type: 'style' },
  { id: 'slick', label: 'Slicked Back', category: 'hair', type: 'style' },
  { id: 'surfer', label: 'Surfer / Long', category: 'hair', type: 'style' },
  { id: 'undercut', label: 'Undercut', category: 'hair', type: 'style' },
];

export const HAIR_STYLES_FEMALE: StyleOption[] = [
  { id: 'original', label: 'Original', category: 'hair', type: 'style' },
  { id: 'bangs', label: 'Bangs / Fringe', category: 'hair', type: 'style' },
  { id: 'bob', label: 'Bob Cut', category: 'hair', type: 'style' },
  { id: 'braids', label: 'Braids', category: 'hair', type: 'style' },
  { id: 'curly', label: 'Curly / Afro', category: 'hair', type: 'style' },
  { id: 'lob', label: 'Long Bob', category: 'hair', type: 'style' },
  { id: 'longstraight', label: 'Long Straight', category: 'hair', type: 'style' },
  { id: 'longwavy', label: 'Long Wavy', category: 'hair', type: 'style' },
  { id: 'pixie', label: 'Pixie Cut', category: 'hair', type: 'style' },
  { id: 'shoulder', label: 'Shoulder Length', category: 'hair', type: 'style' },
  { id: 'updo', label: 'Updo / Bun', category: 'hair', type: 'style' },
];

export const BEARD_STYLES: StyleOption[] = [
  { id: 'original', label: 'Original', category: 'beard', type: 'style' },
  { id: 'none', label: 'Clean Shaven', category: 'beard', type: 'style' },
  { id: 'chinstrap', label: 'Chin Strap', category: 'beard', type: 'style' },
  { id: 'full', label: 'Full Beard', category: 'beard', type: 'style' },
  { id: 'goatee', label: 'Goatee', category: 'beard', type: 'style' },
  { id: 'long', label: 'Long Beard', category: 'beard', type: 'style' },
  { id: 'medium', label: 'Medium Beard', category: 'beard', type: 'style' },
  { id: 'mustache', label: 'Mustache', category: 'beard', type: 'style' },
  { id: 'short', label: 'Short Beard', category: 'beard', type: 'style' },
  { id: 'stubble', label: 'Stubble', category: 'beard', type: 'style' },
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
  { id: 'grey_highlights', label: 'Salt & Pepper', category: 'beard', type: 'color' },
  { id: 'blonde_highlights', label: 'Blonde Highlights', category: 'beard', type: 'color' },
];