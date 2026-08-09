// --- AI Style Previews Database ---
// This database links style IDs to gorgeous, curated Unsplash portraits of models
// displaying each hairstyle, color, beard, outfit, or makeup effect.

export interface PreviewPreset {
  id: string;
  label: string;
  category: 'hair' | 'beard' | 'color' | 'outfit' | 'makeup' | 'eyecolor' | 'prompt';
  subcategory?: string;
  image: string;
  description: string;
  gender?: 'Male' | 'Female';
}

// --- Male Presets ---
export const MALE_HAIR_PREVIEWS: PreviewPreset[] = [
{
    id: 'original',
    label: 'Original',
    category: 'hair',
    subcategory: 'original',
    gender: 'Male',
    image: '/presets/male_hair_original.jpg',
    description: 'Keep your current hair shape and layout.'
  },
{
    id: 'bald',
    label: 'Bald',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_bald.jpg',
    description: 'Smooth clean-shaven bald style.'
  },
{
    id: 'afro',
    label: 'Afro',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_afro.jpg',
    description: 'Premium natural textured high-volume afro.'
  },
{
    id: 'buzz',
    label: 'Buzz Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_buzz.jpg',
    description: 'Clean, modern minimalist buzz cut.'
  },
{
    id: 'crew',
    label: 'Crew Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_crew.jpg',
    description: 'Classic clean tapered crop.'
  },
{
    id: 'curlytop',
    label: 'Curly Top',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_curlytop.jpg',
    description: 'Thick natural curls on top.'
  },
{
    id: 'dreads',
    label: 'Dreadlocks',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Male',
    image: '/presets/male_hair_dreads.jpg',
    description: 'Textured locs styled down.'
  },
{
    id: 'fade',
    label: 'High Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_fade.jpg',
    description: 'Skin fade along the sides.'
  },
{
    id: 'fauxhawk',
    label: 'Faux Hawk',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_fauxhawk.jpg',
    description: 'Edgy spiky center ridge.'
  },
{
    id: 'manbun',
    label: 'Man Bun',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_manbun.jpg',
    description: 'Swept back top knot style.'
  },
{
    id: 'mullet',
    label: 'Mullet',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_hair_mullet.jpg',
    description: 'Retro style, party in the back.'
  },
{
    id: 'pompadour',
    label: 'Pompadour',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_pompadour.jpg',
    description: 'Classic high-volume swept back pompadour.'
  },
{
    id: 'quiff',
    label: 'Quiff',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_quiff.jpg',
    description: 'High volume front quiff.'
  },
{
    id: 'sidepart',
    label: 'Side Part',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_sidepart.jpg',
    description: 'Classic dapper side part.'
  },
{
    id: 'slick',
    label: 'Slicked Back',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_slick.jpg',
    description: 'Sharp, executive slicked-back formal style.'
  },
{
    id: 'surfer',
    label: 'Surfer / Long',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_surfer.jpg',
    description: 'Relaxed, shoulder-length wavy hairstyle.'
  },
{
    id: 'taper',
    label: 'Taper Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_taper.jpg',
    description: 'Clean tapered natural crop.'
  },
{
    id: 'topknot',
    label: 'Top Knot',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_topknot.jpg',
    description: 'High bun with shaved undercut.'
  },
{
    id: 'undercut',
    label: 'Undercut',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_undercut.jpg',
    description: 'Sharp faded sides with structured top.'
  },
{
    id: 'male_induction_cut',
    label: 'Induction Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_induction_cut.jpg',
    description: 'Ultra-short uniform military shave.'
  },
{
    id: 'male_caesar_cut',
    label: 'Caesar Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_caesar_cut.jpg',
    description: 'Short haircut with straight horizontal fringe.'
  },
{
    id: 'male_french_crop',
    label: 'French Crop',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_french_crop.jpg',
    description: 'Textured crop with a blunt fringe.'
  },
{
    id: 'male_textured_crop',
    label: 'Textured Crop',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_textured_crop.jpg',
    description: 'Modern crop with messy layers.'
  },
{
    id: 'male_ivy_league',
    label: 'Ivy League',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_ivy_league.jpg',
    description: 'Elegant crew cut with side part.'
  },
{
    id: 'male_flat_top',
    label: 'Flat Top',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_flat_top.jpg',
    description: 'Classic flat-cut standing top.'
  },
{
    id: 'male_high_tight',
    label: 'High & Tight',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_high_tight.jpg',
    description: 'High shaved sides and short top.'
  },
{
    id: 'male_low_fade',
    label: 'Low Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_low_fade.jpg',
    description: 'Tapered sides fading low above ears.'
  },
{
    id: 'male_mid_fade',
    label: 'Mid Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_mid_fade.jpg',
    description: 'Tapered blend starting halfway up.'
  },
{
    id: 'male_skin_fade',
    label: 'Skin Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_skin_fade.jpg',
    description: 'Sleek high-contrast bald fade.'
  },
{
    id: 'male_drop_fade',
    label: 'Drop Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_drop_fade.jpg',
    description: 'Fade contour that drops behind ears.'
  },
{
    id: 'male_burst_fade',
    label: 'Burst Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_burst_fade.jpg',
    description: 'Circular fade surrounding the ears.'
  },
{
    id: 'male_temple_fade',
    label: 'Temple Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_temple_fade.jpg',
    description: 'Tapered look localized at temples.'
  },
{
    id: 'male_low_taper',
    label: 'Low Taper',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_low_taper.jpg',
    description: 'Subtle taper at neck and sideburns.'
  },
{
    id: 'male_mid_taper',
    label: 'Mid Taper',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_mid_taper.jpg',
    description: 'Balanced taper blend on the sides.'
  },
{
    id: 'male_bro_flow',
    label: 'Bro Flow',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_bro_flow.jpg',
    description: 'Relaxed swept-back medium locks.'
  },
{
    id: 'male_comb_over',
    label: 'Comb Over',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_comb_over.jpg',
    description: 'Neat side part with comb over.'
  },
{
    id: 'male_brushed_back',
    label: 'Brushed Back',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_brushed_back.jpg',
    description: 'Neat brushed back look.'
  },
{
    id: 'male_textured_fringe',
    label: 'Textured Fringe',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_textured_fringe.jpg',
    description: 'Textured bangs falling forward.'
  },
{
    id: 'male_middle_part',
    label: 'Middle Part',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_middle_part.jpg',
    description: 'Symmetrical split middle part.'
  },
{
    id: 'male_curtains',
    label: 'Curtains',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_curtains.jpg',
    description: '90s middle-part curtain look.'
  },
{
    id: 'male_messy_quiff',
    label: 'Messy Quiff',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_messy_quiff.jpg',
    description: 'Textured front volume with messy styling.'
  },
{
    id: 'male_slick_back_fade',
    label: 'Slick Back Fade',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_slick_back_fade.jpg',
    description: 'Slicked back hair with side fade.'
  },
{
    id: 'male_wavy_side_part',
    label: 'Wavy Side Part',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_wavy_side_part.jpg',
    description: 'Natural waves with neat side part.'
  },
{
    id: 'male_long_straight',
    label: 'Long Straight Hair',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_long_straight.jpg',
    description: 'Sleek long hair past shoulders.'
  },
{
    id: 'male_long_wavy',
    label: 'Long Wavy Hair',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_long_wavy.jpg',
    description: 'Cascading long wavy locks.'
  },
{
    id: 'male_long_curly',
    label: 'Long Curly Hair',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_long_curly.jpg',
    description: 'Voluminous curls falling long.'
  },
{
    id: 'male_shoulder_length',
    label: 'Shoulder-Length Hair',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_shoulder_length.jpg',
    description: 'Casual shoulder-length flow.'
  },
{
    id: 'male_half_up_bun',
    label: 'Half-Up Man Bun',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_half_up_bun.jpg',
    description: 'Top section tied, bottom loose.'
  },
{
    id: 'male_long_undercut',
    label: 'Long Hair with Undercut',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_long_undercut.jpg',
    description: 'Swept to side with sharp undercut.'
  },
{
    id: 'male_curly_fringe',
    label: 'Curly Fringe',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_male_curly_fringe.jpg',
    description: 'Bouncy curls falling forward.'
  },
{
    id: 'male_curly_fade',
    label: 'Curly Fade',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_male_curly_fade.jpg',
    description: 'Natural curls blended down sides.'
  },
{
    id: 'male_two_strand_twists',
    label: 'Two-Strand Twists',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_male_two_strand_twists.jpg',
    description: 'Neat twists all over head.'
  },
{
    id: 'male_short_locs',
    label: 'Short Locs',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Male',
    image: '/presets/male_hair_male_short_locs.jpg',
    description: 'Neat short locs close to head.'
  },
{
    id: 'male_braided_cornrows',
    label: 'Braided Cornrows',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Male',
    image: '/presets/male_hair_male_braided_cornrows.jpg',
    description: 'Cornrow braids running front-to-back.'
  },
{
    id: 'male_modern_mullet',
    label: 'Modern Mullet',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_hair_male_modern_mullet.jpg',
    description: 'Textured modern shaggy mullet.'
  }
];

export const ARCHIVED_MALE_HAIR_PREVIEWS: PreviewPreset[] = [
{
    id: 'male_burr_cut',
    label: 'Burr Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_burr_cut.jpg',
    description: 'Very short rounded buzz cut.'
  },
{
    id: 'male_butch_cut',
    label: 'Butch Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_butch_cut.jpg',
    description: 'Short flat top buzz style.'
  },
{
    id: 'male_regulation_cut',
    label: 'Regulation Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_regulation_cut.jpg',
    description: 'Military crop with shaved side part.'
  },
{
    id: 'male_short_spiky',
    label: 'Short Spiky',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_short_spiky.jpg',
    description: 'Textured short spikes on top.'
  },
{
    id: 'male_short_messy',
    label: 'Short Messy',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_short_messy.jpg',
    description: 'Textured messy top with clean sides.'
  },
{
    id: 'male_short_curly_fade',
    label: 'Short Curly Fade',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_short_curly_fade.jpg',
    description: 'Tight curls with a clean high fade.'
  },
{
    id: 'male_shadow_fade',
    label: 'Shadow Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_shadow_fade.jpg',
    description: 'Light, low-contrast shadow blend.'
  },
{
    id: 'male_bald_fade',
    label: 'Bald Fade',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_bald_fade.jpg',
    description: 'Sleek high fade down to bare skin.'
  },
{
    id: 'male_edgar_cut',
    label: 'Edgar Cut',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_edgar_cut.jpg',
    description: 'Straight fringe with high skin fade.'
  },
{
    id: 'male_textured_edgar',
    label: 'Textured Edgar',
    category: 'hair',
    subcategory: 'fade',
    gender: 'Male',
    image: '/presets/male_hair_male_textured_edgar.jpg',
    description: 'Textured messy top with Edgar fringe.'
  },
{
    id: 'male_modern_comb_over',
    label: 'Modern Comb Over',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_modern_comb_over.jpg',
    description: 'High volume side sweep with fade.'
  },
{
    id: 'male_angular_fringe',
    label: 'Angular Fringe',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_angular_fringe.jpg',
    description: 'Asymmetric side-swept fringe.'
  },
{
    id: 'male_modern_pompadour',
    label: 'Modern Pompadour',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_modern_pompadour.jpg',
    description: 'High volume top with skin fade.'
  },
{
    id: 'male_side_swept',
    label: 'Side-Swept',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Male',
    image: '/presets/male_hair_male_side_swept.jpg',
    description: 'Medium-length side-swept locks.'
  },
{
    id: 'male_low_bun',
    label: 'Low Man Bun',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_low_bun.jpg',
    description: 'Gathered neatly at base of neck.'
  },
{
    id: 'male_samurai_knot',
    label: 'Samurai Top Knot',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_samurai_knot.jpg',
    description: 'High tied knot with shaved sides.'
  },
{
    id: 'male_viking_hair',
    label: 'Viking Hair',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_viking_hair.jpg',
    description: 'Long braided warrior styling.'
  },
{
    id: 'male_layered_long',
    label: 'Layered Long',
    category: 'hair',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_hair_male_layered_long.jpg',
    description: 'Long locks with flowing layers.'
  },
{
    id: 'male_curly_undercut',
    label: 'Curly Undercut',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_male_curly_undercut.jpg',
    description: 'High curls with shaved sides.'
  },
{
    id: 'male_coiled_top',
    label: 'Coiled Top',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_male_coiled_top.jpg',
    description: 'Tight natural coils with clean sides.'
  },
{
    id: 'male_twist_out',
    label: 'Twist Out',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_male_twist_out.jpg',
    description: 'Voluminous textured twist out.'
  },
{
    id: 'male_short_twists',
    label: 'Short Twists',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_male_short_twists.jpg',
    description: 'Short twists close to scalp.'
  },
{
    id: 'male_sponge_twists',
    label: 'Sponge Twists',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Male',
    image: '/presets/male_hair_male_sponge_twists.jpg',
    description: 'Coiled texture sponge styling.'
  },
{
    id: 'male_freeform_locs',
    label: 'Freeform Locs',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Male',
    image: '/presets/male_hair_male_freeform_locs.jpg',
    description: 'Natural organic Locs style.'
  },
{
    id: 'male_medium_locs',
    label: 'Medium Locs',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Male',
    image: '/presets/male_hair_male_medium_locs.jpg',
    description: 'Medium-length locs hanging down.'
  },
{
    id: 'male_box_braids',
    label: 'Box Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Male',
    image: '/presets/male_hair_male_box_braids.jpg',
    description: 'Neat square parted box braids.'
  },
{
    id: 'male_braided_top_knot',
    label: 'Braided Top Knot',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Male',
    image: '/presets/male_hair_male_braided_top_knot.jpg',
    description: 'Undercut sides with braided top bun.'
  },
{
    id: 'male_burst_fade_mullet',
    label: 'Burst Fade Mullet',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_hair_male_burst_fade_mullet.jpg',
    description: 'Burst fade side with mullet back.'
  },
{
    id: 'male_wolf_cut',
    label: 'Wolf Cut',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_hair_male_wolf_cut.jpg',
    description: 'Shaggy layers with messy flow.'
  },
{
    id: 'male_mohawk',
    label: 'Mohawk',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_hair_male_mohawk.jpg',
    description: 'Classic shaved sides with center strip.'
  },
{
    id: 'male_braided_mohawk',
    label: 'Braided Mohawk',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_hair_male_braided_mohawk.jpg',
    description: 'Braids forming center Mohawk strip.'
  },
{
    id: 'male_faux_locs',
    label: 'Faux Locs',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Male',
    image: '/presets/male_hair_male_faux_locs.jpg',
    description: 'Textured protective Loc styling.'
  },
{
    id: 'male_clean_shaved_head',
    label: 'Clean Shaved Head',
    category: 'hair',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_hair_male_clean_shaved_head.jpg',
    description: 'Completely shaved smooth scalp.'
  },
{
    id: 'male_receding_hairline',
    label: 'Receding Hairline',
    category: 'hair',
    subcategory: 'mature',
    gender: 'Male',
    image: '/presets/male_hair_male_receding_hairline.jpg',
    description: 'Mature receding hairline style.'
  },
{
    id: 'male_salt_pepper_hair',
    label: 'Salt & Pepper Hair',
    category: 'hair',
    subcategory: 'mature',
    gender: 'Male',
    image: '/presets/male_hair_male_salt_pepper_hair.jpg',
    description: 'Classic cut with mature grey tones.'
  },
{
    id: 'male_mature_classic_cut',
    label: 'Mature Classic',
    category: 'hair',
    subcategory: 'mature',
    gender: 'Male',
    image: '/presets/male_hair_male_mature_classic_cut.jpg',
    description: 'Neat clean cut for mature styling.'
  }
];

export const MALE_BEARD_PREVIEWS: PreviewPreset[] = [
  {
    id: 'original',
    label: 'Original',
    category: 'beard',
    subcategory: 'original',
    gender: 'Male',
    image: '/presets/male_beard_original.jpg',
    description: 'Keep your current facial hair.'
  },
  {
    id: 'none',
    label: 'Clean Shaven',
    category: 'beard',
    subcategory: 'clean',
    gender: 'Male',
    image: '/presets/male_beard_none.jpg',
    description: 'Smooth, clean shaven face.'
  },
  {
    id: 'stubble',
    label: 'Stubble',
    category: 'beard',
    subcategory: 'stubble',
    gender: 'Male',
    image: '/presets/male_beard_stubble.jpg',
    description: 'Low-maintenance, rugged 5 o\'clock shadow.'
  },
  {
    id: 'mustache',
    label: 'Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_mustache.jpg',
    description: 'Retro-classic defined upper-lip mustache.'
  },
  {
    id: 'goatee',
    label: 'Goatee',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_goatee.jpg',
    description: 'Refined goatee tracing the mouth and chin.'
  },
  {
    id: 'vandyke',
    label: 'Van Dyke',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_vandyke.jpg',
    description: 'Pointed chin goatee and mustache.'
  },
  {
    id: 'balbo',
    label: 'Balbo',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_balbo.jpg',
    description: 'Inverted T-shaped beard and mustache.'
  },
  {
    id: 'ducktail',
    label: 'Ducktail',
    category: 'beard',
    subcategory: 'full',
    gender: 'Male',
    image: '/presets/male_beard_ducktail.jpg',
    description: 'Trimmed full beard tapering to a point.'
  },
  {
    id: 'anchor',
    label: 'Anchor',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_anchor.jpg',
    description: 'Strap along jaw with disconnected mustache.'
  },
  {
    id: 'chinstrap',
    label: 'Chin Strap',
    category: 'beard',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_beard_chinstrap.jpg',
    description: 'Thin strap beard following jawline.'
  },
  {
    id: 'muttonchops',
    label: 'Mutton Chops',
    category: 'beard',
    subcategory: 'mature',
    gender: 'Male',
    image: '/presets/male_beard_muttonchops.jpg',
    description: 'Extended sideburns to corners of mouth.'
  },
  {
    id: 'short',
    label: 'Short Beard',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_short.jpg',
    description: 'Short, neatly trimmed full beard.'
  },
  {
    id: 'medium',
    label: 'Medium Beard',
    category: 'beard',
    subcategory: 'full',
    gender: 'Male',
    image: '/presets/male_beard_medium.jpg',
    description: 'Medium length well-groomed full beard.'
  },
  {
    id: 'long',
    label: 'Long Beard',
    category: 'beard',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_beard_long.jpg',
    description: 'Long bushy natural lumberjack beard.'
  },
  {
    id: 'full',
    label: 'Full Beard',
    category: 'beard',
    subcategory: 'full',
    gender: 'Male',
    image: '/presets/male_beard_full.jpg',
    description: 'Thick, well-groomed traditional full beard.'
  },
  {
    id: 'bandholz',
    label: 'Bandholz',
    category: 'beard',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_beard_bandholz.jpg',
    description: 'Very long, full beard and mustache.'
  },
  {
    id: 'male_five_oclock_shadow',
    label: 'Five O\'Clock Shadow',
    category: 'beard',
    subcategory: 'stubble',
    gender: 'Male',
    image: '/presets/male_beard_male_male_five_oclock_shadow.jpg',
    description: 'Very light stubble shading cheeks.'
  },
  {
    id: 'male_designer_stubble',
    label: 'Designer Stubble',
    category: 'beard',
    subcategory: 'stubble',
    gender: 'Male',
    image: '/presets/male_beard_male_male_designer_stubble.jpg',
    description: 'Sleek, neatly lined short stubble.'
  },
  {
    id: 'male_heavy_stubble',
    label: 'Heavy Stubble',
    category: 'beard',
    subcategory: 'stubble',
    gender: 'Male',
    image: '/presets/male_beard_male_male_heavy_stubble.jpg',
    description: 'Dense dark stubble all over cheeks.'
  },
  {
    id: 'male_chevron_mustache',
    label: 'Chevron Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_chevron_mustache.jpg',
    description: 'Thick blocky upper-lip mustache.'
  },
  {
    id: 'male_pencil_mustache',
    label: 'Pencil Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_pencil_mustache.jpg',
    description: 'Thin retro styled lip mustache.'
  },
  {
    id: 'male_handlebar_mustache',
    label: 'Handlebar Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_handlebar_mustache.jpg',
    description: 'Mustache with curved side tips.'
  },
  {
    id: 'male_horseshoe_mustache',
    label: 'Horseshoe Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_horseshoe_mustache.jpg',
    description: 'U-shaped mustache extending down.'
  },
  {
    id: 'male_walrus_mustache',
    label: 'Walrus Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_walrus_mustache.jpg',
    description: 'Thick bushy drooping mustache.'
  },
  {
    id: 'male_natural_mustache',
    label: 'Natural Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_natural_mustache.jpg',
    description: 'Naturally growing full mustache.'
  },
  {
    id: 'male_petite_mustache',
    label: 'Petite Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_petite_mustache.jpg',
    description: 'Small neat cropped mustache.'
  },
  {
    id: 'male_english_mustache',
    label: 'English Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_english_mustache.jpg',
    description: 'Straight pointed side mustache.'
  },
  {
    id: 'male_lampshade_mustache',
    label: 'Lampshade Mustache',
    category: 'beard',
    subcategory: 'mustache',
    gender: 'Male',
    image: '/presets/male_beard_male_male_lampshade_mustache.jpg',
    description: 'Angled short blocky mustache.'
  },
  {
    id: 'male_soul_patch',
    label: 'Soul Patch',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_male_male_soul_patch.jpg',
    description: 'Small patch under lower lip.'
  },
  {
    id: 'male_circle_beard',
    label: 'Circle Beard',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_male_male_circle_beard.jpg',
    description: 'Round ring beard surrounding mouth.'
  },
  {
    id: 'male_extended_goatee',
    label: 'Extended Goatee',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_male_male_extended_goatee.jpg',
    description: 'Goatee extending along jaw sides.'
  },
  {
    id: 'male_petite_goatee',
    label: 'Petite Goatee',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_male_male_petite_goatee.jpg',
    description: 'Small narrow patch chin goatee.'
  },
  {
    id: 'male_chin_puff',
    label: 'Chin Puff',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_male_male_chin_puff.jpg',
    description: 'Narrow vertical strip chin goatee.'
  },
  {
    id: 'male_goatee_mustache',
    label: 'Goatee & Mustache',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_male_male_goatee_mustache.jpg',
    description: 'Goatee beard with connected mustache.'
  },
  {
    id: 'male_detached_goatee',
    label: 'Detached Goatee',
    category: 'beard',
    subcategory: 'goatee',
    gender: 'Male',
    image: '/presets/male_beard_male_male_detached_goatee.jpg',
    description: 'Chin goatee with separate mustache.'
  },
  {
    id: 'male_short_boxed_beard',
    label: 'Short Boxed Beard',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_male_male_short_boxed_beard.jpg',
    description: 'Short boxed cut with clean edges.'
  },
  {
    id: 'male_corporate_beard',
    label: 'Corporate Beard',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_male_male_corporate_beard.jpg',
    description: 'Groomed short professional beard.'
  },
  {
    id: 'male_tapered_beard',
    label: 'Tapered Beard',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_male_male_tapered_beard.jpg',
    description: 'Beard tapering up into sideburns.'
  },
  {
    id: 'male_faded_beard',
    label: 'Faded Beard',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_male_male_faded_beard.jpg',
    description: 'Beard with faded cheeks sideburns.'
  },
  {
    id: 'male_sculpted_beard',
    label: 'Sculpted Beard',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_male_male_sculpted_beard.jpg',
    description: 'Sharp crisp outline sculpted beard.'
  },
  {
    id: 'male_defined_jawline',
    label: 'Defined Jawline Beard',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_male_male_defined_jawline.jpg',
    description: 'Beard trimmed to accent jaw structure.'
  },
  {
    id: 'male_short_rounded',
    label: 'Short Rounded Beard',
    category: 'beard',
    subcategory: 'short',
    gender: 'Male',
    image: '/presets/male_beard_male_male_short_rounded.jpg',
    description: 'Short full beard cut rounded.'
  },
  {
    id: 'male_long_boxed_beard',
    label: 'Long Boxed Beard',
    category: 'beard',
    subcategory: 'full',
    gender: 'Male',
    image: '/presets/male_beard_male_male_long_boxed_beard.jpg',
    description: 'Long boxed beard with clean lines.'
  },
  {
    id: 'male_garibaldi',
    label: 'Garibaldi',
    category: 'beard',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_beard_male_male_garibaldi.jpg',
    description: 'Wide rounded bottom full beard.'
  },
  {
    id: 'male_verdi',
    label: 'Verdi',
    category: 'beard',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_beard_male_male_verdi.jpg',
    description: 'Rounded beard with handlebar mustache.'
  },
  {
    id: 'male_hollywoodian',
    label: 'Hollywoodian',
    category: 'beard',
    subcategory: 'full',
    gender: 'Male',
    image: '/presets/male_beard_male_male_hollywoodian.jpg',
    description: 'Jawline beard with shaved sideburns.'
  },
  {
    id: 'male_yeard',
    label: 'Yeard',
    category: 'beard',
    subcategory: 'long',
    gender: 'Male',
    image: '/presets/male_beard_male_male_yeard.jpg',
    description: 'One full year of natural beard growth.'
  },
  {
    id: 'male_natural_full_beard',
    label: 'Natural Full Beard',
    category: 'beard',
    subcategory: 'full',
    gender: 'Male',
    image: '/presets/male_beard_male_male_natural_full_beard.jpg',
    description: 'Unstyled, naturally growing full beard.'
  },
  {
    id: 'male_groomed_full_beard',
    label: 'Groomed Full Beard',
    category: 'beard',
    subcategory: 'full',
    gender: 'Male',
    image: '/presets/male_beard_male_male_groomed_full_beard.jpg',
    description: 'Groomed traditional full beard.'
  },
  {
    id: 'male_beardstache',
    label: 'Beardstache',
    category: 'beard',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_beard_male_male_beardstache.jpg',
    description: 'Thick mustache with light jaw stubble.'
  },
  {
    id: 'male_mustache_stubble',
    label: 'Mustache with Stubble',
    category: 'beard',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_beard_male_male_mustache_stubble.jpg',
    description: 'Thick mustache paired with stubble.'
  },
  {
    id: 'male_mustache_short_beard',
    label: 'Mustache with Short Beard',
    category: 'beard',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_beard_male_male_mustache_short_beard.jpg',
    description: 'Classic mustache with trimmed beard.'
  },
  {
    id: 'male_bald_with_beard',
    label: 'Bald with Beard',
    category: 'beard',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_beard_male_male_bald_with_beard.jpg',
    description: 'Smooth shaved head with full beard.'
  },
  {
    id: 'male_fade_beard_blend',
    label: 'Fade & Beard Blend',
    category: 'beard',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_beard_male_male_fade_beard_blend.jpg',
    description: 'Skin fade blended into full beard.'
  },
  {
    id: 'male_sharp_line_up',
    label: 'Sharp Line-Up Beard',
    category: 'beard',
    subcategory: 'trendy',
    gender: 'Male',
    image: '/presets/male_beard_male_male_sharp_line_up.jpg',
    description: 'Crisp razor line-up sculpted beard.'
  },
  {
    id: 'male_salt_pepper_beard',
    label: 'Salt & Pepper Beard',
    category: 'beard',
    subcategory: 'mature',
    gender: 'Male',
    image: '/presets/male_beard_male_male_salt_pepper_beard.jpg',
    description: 'Full beard with mature grey blend.'
  },
  {
    id: 'male_mature_trimmed_beard',
    label: 'Mature Trimmed Beard',
    category: 'beard',
    subcategory: 'mature',
    gender: 'Male',
    image: '/presets/male_beard_male_male_mature_trimmed_beard.jpg',
    description: 'Groomed classic beard for mature look.'
  }
];

export const MALE_OUTFIT_PREVIEWS: PreviewPreset[] = [
  {
    id: 'original',
    label: 'Original Outfit',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_hair_original.jpg',
    description: 'Revert to your original uploaded outfit.'
  },
  {
    id: 'outfit_business',
    label: 'Business Formal',
    category: 'outfit',
    subcategory: 'business',
    gender: 'Male',
    image: '/presets/male_outfit_business.jpg',
    description: 'Tailored navy executive business suit with tie.'
  },
  {
    id: 'outfit_wedding',
    label: 'Wedding Theme',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Male',
    image: '/presets/male_outfit_wedding.jpg',
    description: 'Elegant formal black tie tuxedo with satin lapels.'
  },
  {
    id: 'outfit_gala',
    label: 'Luxury Gala Gown',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Male',
    image: '/presets/male_outfit_gala.jpg',
    description: 'Luxury dark velvet dinner jacket blazer.'
  },
  {
    id: 'outfit_highlife',
    label: 'Yacht Casual',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Male',
    image: '/presets/male_outfit_highlife.jpg',
    description: 'Beige linen collared shirt.'
  },
  {
    id: 'outfit_resort',
    label: 'Summer Resort',
    category: 'outfit',
    subcategory: 'vacation',
    gender: 'Male',
    image: '/presets/male_outfit_resort.jpg',
    description: 'Short-sleeve resort floral print shirt.'
  },
  {
    id: 'outfit_streetwear',
    label: 'Streetwear Tech',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_outfit_streetwear.jpg',
    description: 'Modern black graphic streetwear hoodie.'
  },
  {
    id: 'outfit_retro',
    label: 'Retro Vintage',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_outfit_retro.jpg',
    description: 'Vintage brown leather bomber jacket and jeans.'
  },
  {
    id: 'outfit_active',
    label: 'Athletic Wear',
    category: 'outfit',
    subcategory: 'active',
    gender: 'Male',
    image: '/presets/male_outfit_active.jpg',
    description: 'Dry-fit performance athletic running zip-up.'
  },
  {
    id: 'outfit_sport',
    label: 'Sport Active',
    category: 'outfit',
    subcategory: 'active',
    gender: 'Male',
    image: '/presets/male_outfit_sport.jpg',
    description: 'Comfortable fleece hoodie sweater and jogger set.'
  },
  {
    id: 'male_outfit_casual_tshirt_jeans',
    label: 'T-Shirt & Jeans',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_outfit_casual_tshirt_jeans.jpg',
    description: 'Basic white crewneck T-shirt and blue jeans.'
  },
  {
    id: 'male_outfit_casual_polo_chinos',
    label: 'Polo & Chinos',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_outfit_casual_polo_chinos.jpg',
    description: 'Classic cotton polo shirt and khaki chinos.'
  },
  {
    id: 'male_outfit_casual_buttondown_trousers',
    label: 'Button-Down & Pants',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_outfit_casual_buttondown_trousers.jpg',
    description: 'Long-sleeve collared button-down shirt and trousers.'
  },
  {
    id: 'male_outfit_casual_denim_jacket',
    label: 'Denim Jacket Outfit',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_outfit_casual_denim_jacket.jpg',
    description: 'Casual blue denim jacket over a white shirt.'
  },
  {
    id: 'male_outfit_casual_leather_jacket',
    label: 'Biker Leather Jacket',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_outfit_casual_leather_jacket.jpg',
    description: 'Rugged black leather biker jacket and jeans.'
  },
  {
    id: 'male_outfit_casual_winter_coat',
    label: 'Winter Wool Coat',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Male',
    image: '/presets/male_outfit_casual_winter_coat.jpg',
    description: 'Heavy wool trench coat and thick crewneck sweater.'
  },
  {
    id: 'male_outfit_business_blazer',
    label: 'Business-Casual Blazer',
    category: 'outfit',
    subcategory: 'business',
    gender: 'Male',
    image: '/presets/male_outfit_business_blazer.jpg',
    description: 'Smart navy blazer over a light blue dress shirt.'
  },
  {
    id: 'male_outfit_luxury_formal_suit',
    label: 'Black Formal Suit',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Male',
    image: '/presets/male_outfit_luxury_formal_suit.jpg',
    description: 'Premium tailored formal black suit.'
  },
  {
    id: 'male_outfit_luxury_wedding_guest',
    label: 'Wedding Guest Suit',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Male',
    image: '/presets/male_outfit_luxury_wedding_guest.jpg',
    description: 'Sophisticated dress suit perfect for formal events.'
  },
  {
    id: 'male_outfit_luxury_designer',
    label: 'Designer Smart Jacket',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Male',
    image: '/presets/male_outfit_luxury_designer.jpg',
    description: 'High-fashion luxury tailored smart jacket.'
  },
  {
    id: 'male_outfit_active_training',
    label: 'Athletic Training Tee',
    category: 'outfit',
    subcategory: 'active',
    gender: 'Male',
    image: '/presets/male_outfit_active_training.jpg',
    description: 'Performance short-sleeve training shirt and shorts.'
  },
  {
    id: 'male_outfit_active_basketball',
    label: 'Basketball Uniform',
    category: 'outfit',
    subcategory: 'active',
    gender: 'Male',
    image: '/presets/male_outfit_active_basketball.jpg',
    description: 'Athletic sleeveless basketball jersey and mesh shorts.'
  },
  {
    id: 'male_outfit_active_tennis',
    label: 'Tennis Outfit',
    category: 'outfit',
    subcategory: 'active',
    gender: 'Male',
    image: '/presets/male_outfit_active_tennis.jpg',
    description: 'Tennis sports polo and white athletic shorts.'
  },
  {
    id: 'male_outfit_vacation_linen',
    label: 'Linen Vacation Wear',
    category: 'outfit',
    subcategory: 'vacation',
    gender: 'Male',
    image: '/presets/male_outfit_vacation_linen.jpg',
    description: 'Relaxed white linen collared shirt and pants.'
  },
  {
    id: 'male_outfit_vacation_resort',
    label: 'Tropical Resort Shirt',
    category: 'outfit',
    subcategory: 'vacation',
    gender: 'Male',
    image: '/presets/male_outfit_vacation_resort.jpg',
    description: 'Short-sleeve floral Hawaiian shirt and shorts.'
  },
  {
    id: 'unisex_outfit_oversized_streetwear',
    label: 'Oversized Streetwear',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'unisex',
    image: '/presets/male_outfit_unisex_oversized_streetwear.jpg',
    description: 'Unisex oversized boxy streetwear hoodie.'
  }
];

export const MALE_MAKEUP_PREVIEWS: PreviewPreset[] = [
  {
    id: 'makeup_none',
    label: 'Original Skin',
    category: 'makeup',
    gender: 'Male',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=450&q=80',
    description: 'Maintain original image textures.'
  }
];

// --- Female Presets ---
export const FEMALE_HAIR_PREVIEWS: PreviewPreset[] = [
{
    id: 'original',
    label: 'Original',
    category: 'hair',
    subcategory: 'original',
    gender: 'Female',
    image: '/presets/female_hair_original.jpg',
    description: 'Keep your current hair shape and layout.'
  },
{
    id: 'bangs',
    label: 'Bangs / Fringe',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_bangs.jpg',
    description: 'Soft curtain bangs framing the eyes.'
  },
{
    id: 'bob',
    label: 'Bob Cut',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_bob.jpg',
    description: 'Chic chin-length blunt cut bob.'
  },
{
    id: 'braids',
    label: 'Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_braids.jpg',
    description: 'Genteel braided locks and extensions.'
  },
{
    id: 'curly',
    label: 'Curly / Afro',
    category: 'hair',
    subcategory: 'curly',
    gender: 'Female',
    image: '/presets/female_hair_curly.jpg',
    description: 'Voluminous textured ringlet curls.'
  },
{
    id: 'curtainbangs',
    label: 'Curtain Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_curtainbangs.jpg',
    description: 'Soft split fringe framing face.'
  },
{
    id: 'lob',
    label: 'Long Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_lob.jpg',
    description: 'Straight long bob cut.'
  },
{
    id: 'longstraight',
    label: 'Long Straight',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_longstraight.jpg',
    description: 'Sleek straight flowing hair.'
  },
{
    id: 'longwavy',
    label: 'Long Wavy',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_longwavy.jpg',
    description: 'Cascading, high-volume wavy hair.'
  },
{
    id: 'pixie',
    label: 'Pixie Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Female',
    image: '/presets/female_hair_pixie.jpg',
    description: 'Edgy, low-maintenance short pixie crop.'
  },
{
    id: 'pixiebob',
    label: 'Pixie Bob',
    category: 'hair',
    subcategory: 'short',
    gender: 'Female',
    image: '/presets/female_hair_pixiebob.jpg',
    description: 'Textured short stacked bob crop.'
  },
{
    id: 'shag',
    label: 'Shag Cut',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_shag.jpg',
    description: 'Layered shag cut with full fringe.'
  },
{
    id: 'shoulder',
    label: 'Shoulder Length',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_shoulder.jpg',
    description: 'Standard shoulder-length layout.'
  },
{
    id: 'spacebuns',
    label: 'Space Buns',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_spacebuns.jpg',
    description: 'Fun, youthful double top-knot space buns.'
  },
{
    id: 'updo',
    label: 'Updo / Bun',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_updo.jpg',
    description: 'Elegant clean updo bun.'
  },
{
    id: 'female_classic_pixie',
    label: 'Classic Pixie',
    category: 'hair',
    subcategory: 'short',
    gender: 'Female',
    image: '/presets/female_hair_female_female_classic_pixie.jpg',
    description: 'Traditional closely cropped pixie.'
  },
{
    id: 'female_textured_pixie',
    label: 'Textured Pixie',
    category: 'hair',
    subcategory: 'short',
    gender: 'Female',
    image: '/presets/female_hair_female_female_textured_pixie.jpg',
    description: 'Choppy textured layers on top.'
  },
{
    id: 'female_curly_pixie',
    label: 'Curly Pixie',
    category: 'hair',
    subcategory: 'short',
    gender: 'Female',
    image: '/presets/female_hair_female_female_curly_pixie.jpg',
    description: 'Short tight ringlets pixie cut.'
  },
{
    id: 'female_bixie_cut',
    label: 'Bixie Cut',
    category: 'hair',
    subcategory: 'short',
    gender: 'Female',
    image: '/presets/female_hair_female_female_bixie_cut.jpg',
    description: 'Hybrid pixie-bob shaggy crop.'
  },
{
    id: 'female_french_bob',
    label: 'French Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_french_bob.jpg',
    description: 'Chin-length bob with blunt bangs.'
  },
{
    id: 'female_blunt_bob',
    label: 'Blunt Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_blunt_bob.jpg',
    description: 'Straight solid edge classic bob.'
  },
{
    id: 'female_layered_bob',
    label: 'Layered Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_layered_bob.jpg',
    description: 'Textured volume layered bob.'
  },
{
    id: 'female_asymmetrical_bob',
    label: 'Asymmetrical Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_asymmetrical_bob.jpg',
    description: 'Longer side crop bob design.'
  },
{
    id: 'female_curly_bob',
    label: 'Curly Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_curly_bob.jpg',
    description: 'Bouncy natural curls bob cut.'
  },
{
    id: 'female_sleek_bob',
    label: 'Sleek Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_sleek_bob.jpg',
    description: 'Super straight high-shine bob.'
  },
{
    id: 'female_medium_straight',
    label: 'Medium Straight',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_female_female_medium_straight.jpg',
    description: 'Straight shoulder-skimming layers.'
  },
{
    id: 'female_medium_wavy',
    label: 'Medium Wavy',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_female_female_medium_wavy.jpg',
    description: 'Mid-length locks with soft waves.'
  },
{
    id: 'female_medium_curly',
    label: 'Medium Curly',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_female_female_medium_curly.jpg',
    description: 'Mid-length curls and bouncy coils.'
  },
{
    id: 'female_collarbone_length',
    label: 'Collarbone Length',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_female_female_collarbone_length.jpg',
    description: 'Chic even shoulder-length lob.'
  },
{
    id: 'female_layered_shoulder',
    label: 'Layered Shoulder Length',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_female_female_layered_shoulder.jpg',
    description: 'Textured layers falling to shoulders.'
  },
{
    id: 'female_butterfly_cut',
    label: 'Butterfly Cut',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_female_female_butterfly_cut.jpg',
    description: 'Wispy multi-layered butterfly style.'
  },
{
    id: 'female_face_framing_layers',
    label: 'Face-Framing Layers',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_female_female_face_framing_layers.jpg',
    description: 'Inward face-contouring layers.'
  },
{
    id: 'female_layered_lob',
    label: 'Layered Lob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_layered_lob.jpg',
    description: 'Textured long bob with layers.'
  },
{
    id: 'female_wavy_lob',
    label: 'Wavy Lob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_wavy_lob.jpg',
    description: 'Wavy textured long bob.'
  },
{
    id: 'female_extra_long_straight',
    label: 'Extra-Long Straight',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_extra_long_straight.jpg',
    description: 'Waist-length sleek straight hair.'
  },
{
    id: 'female_extra_long_wavy',
    label: 'Extra-Long Wavy',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_extra_long_wavy.jpg',
    description: 'Waist-length flowing waves.'
  },
{
    id: 'female_extra_long_curly',
    label: 'Extra-Long Curly',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_extra_long_curly.jpg',
    description: 'Waist-length voluminous coils.'
  },
{
    id: 'female_long_layers',
    label: 'Long Layers',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_long_layers.jpg',
    description: 'Long hair with textured layers.'
  },
{
    id: 'female_butterfly_layers',
    label: 'Butterfly Layers',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_butterfly_layers.jpg',
    description: 'Voluminous butterfly cut layers.'
  },
{
    id: 'female_mermaid_waves',
    label: 'Mermaid Waves',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_mermaid_waves.jpg',
    description: 'Deep crimped mermaid wave style.'
  },
{
    id: 'female_beach_waves',
    label: 'Beach Waves',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_beach_waves.jpg',
    description: 'Tousled natural sun-kissed waves.'
  },
{
    id: 'female_hollywood_waves',
    label: 'Hollywood Waves',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_hollywood_waves.jpg',
    description: 'Elegant vintage formal waves.'
  },
{
    id: 'female_voluminous_curls',
    label: 'Voluminous Curls',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_voluminous_curls.jpg',
    description: 'High-volume bouncy curly locks.'
  },
{
    id: 'female_blunt_bangs',
    label: 'Blunt Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_blunt_bangs.jpg',
    description: 'Thick straight eyebrow-skimming bangs.'
  },
{
    id: 'female_wispy_bangs',
    label: 'Wispy Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_wispy_bangs.jpg',
    description: 'Feathered see-through wispy fringe.'
  },
{
    id: 'female_side_swept_bangs',
    label: 'Side-Swept Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_side_swept_bangs.jpg',
    description: 'Soft elegant side-combed fringe.'
  },
{
    id: 'female_bottleneck_bangs',
    label: 'Bottleneck Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_bottleneck_bangs.jpg',
    description: 'Bangs that start short and widen.'
  },
{
    id: 'female_box_braids',
    label: 'Box Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_box_braids.jpg',
    description: 'Classic square parted box braids.'
  },
{
    id: 'female_knotless_braids',
    label: 'Knotless Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_knotless_braids.jpg',
    description: 'Flat, natural-looking root braids.'
  },
{
    id: 'female_french_braids',
    label: 'French Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_french_braids.jpg',
    description: 'Double woven French braids.'
  },
{
    id: 'female_high_ponytail',
    label: 'High Ponytail',
    category: 'hair',
    subcategory: 'ponytails',
    gender: 'Female',
    image: '/presets/female_hair_female_female_high_ponytail.jpg',
    description: 'High sleek ponytail at crown.'
  },
{
    id: 'female_sleek_bun',
    label: 'Sleek Bun',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_sleek_bun.jpg',
    description: 'Tight, glossy ballerina bun.'
  },
{
    id: 'female_natural_afro',
    label: 'Natural Afro',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_natural_afro.jpg',
    description: 'Voluminous rounded tight coily afro.'
  },
{
    id: 'female_defined_coils',
    label: 'Defined Coils',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_defined_coils.jpg',
    description: 'Highly defined natural coils.'
  },
  {
    id: 'cornrows',
    label: 'Cornrows',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_cornrows.jpg',
    description: 'Neat parallel braided cornrows.'
  }
];

export const ARCHIVED_FEMALE_HAIR_PREVIEWS: PreviewPreset[] = [
{
    id: 'female_long_pixie',
    label: 'Long Pixie',
    category: 'hair',
    subcategory: 'short',
    gender: 'Female',
    image: '/presets/female_hair_female_female_long_pixie.jpg',
    description: 'Longer layers with side sweep.'
  },
{
    id: 'female_chin_length_bob',
    label: 'Chin-Length Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_chin_length_bob.jpg',
    description: 'Even chin-skimming crop.'
  },
{
    id: 'female_angled_bob',
    label: 'Angled Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_angled_bob.jpg',
    description: 'Sloping forward angled haircut.'
  },
{
    id: 'female_wavy_bob',
    label: 'Wavy Bob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_wavy_bob.jpg',
    description: 'Soft beach waves bob cut.'
  },
{
    id: 'female_bob_with_bangs',
    label: 'Bob with Bangs',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_bob_with_bangs.jpg',
    description: 'Classic bob with thick full bangs.'
  },
{
    id: 'female_medium_shag',
    label: 'Medium Shag',
    category: 'hair',
    subcategory: 'medium',
    gender: 'Female',
    image: '/presets/female_hair_female_female_medium_shag.jpg',
    description: 'Choppy retro layered shag.'
  },
{
    id: 'female_blunt_lob',
    label: 'Blunt Lob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_blunt_lob.jpg',
    description: 'Solid straight-edge long bob.'
  },
{
    id: 'female_curly_lob',
    label: 'Curly Lob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_curly_lob.jpg',
    description: 'Long bob with bouncy curls.'
  },
{
    id: 'female_sleek_lob',
    label: 'Sleek Lob',
    category: 'hair',
    subcategory: 'bob',
    gender: 'Female',
    image: '/presets/female_hair_female_female_sleek_lob.jpg',
    description: 'Sleek straight long bob crop.'
  },
{
    id: 'female_feathered_layers',
    label: 'Feathered Layers',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_feathered_layers.jpg',
    description: 'Vintage feathered layers.'
  },
{
    id: 'female_long_face_framing',
    label: 'Long Face-Framing',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_long_face_framing.jpg',
    description: 'Long hair with chin-length framing.'
  },
{
    id: 'female_long_side_part',
    label: 'Long with Side Part',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_long_side_part.jpg',
    description: 'Sleek deep side part long hair.'
  },
{
    id: 'female_long_middle_part',
    label: 'Long with Middle Part',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_long_middle_part.jpg',
    description: 'Neat center split long straight hair.'
  },
{
    id: 'female_loose_curls',
    label: 'Loose Curls',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_loose_curls.jpg',
    description: 'Soft bouncy loose ringlet curls.'
  },
{
    id: 'female_defined_curls',
    label: 'Defined Curls',
    category: 'hair',
    subcategory: 'long',
    gender: 'Female',
    image: '/presets/female_hair_female_female_defined_curls.jpg',
    description: 'Tight defined spiral curls.'
  },
{
    id: 'female_micro_bangs',
    label: 'Micro Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_micro_bangs.jpg',
    description: 'Ultra-short avant-garde fringe.'
  },
{
    id: 'female_baby_bangs',
    label: 'Baby Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_baby_bangs.jpg',
    description: 'Short cropped bangs above brows.'
  },
{
    id: 'female_birkin_bangs',
    label: 'Birkin Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_birkin_bangs.jpg',
    description: 'French-style messy wispy fringe.'
  },
{
    id: 'female_curly_bangs',
    label: 'Curly Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_curly_bangs.jpg',
    description: 'Defined bouncy curls fringe.'
  },
{
    id: 'female_long_curtain_bangs',
    label: 'Long Curtain Bangs',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_long_curtain_bangs.jpg',
    description: 'Long cheek-skimming curtain fringe.'
  },
{
    id: 'female_layered_fringe',
    label: 'Layered Fringe',
    category: 'hair',
    subcategory: 'bangs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_layered_fringe.jpg',
    description: 'Textured shaggy layered bangs.'
  },
{
    id: 'female_cornrows',
    label: 'Cornrows',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_cornrows.jpg',
    description: 'Neat parallel cornrow tracks.'
  },
{
    id: 'female_fulani_braids',
    label: 'Fulani Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_fulani_braids.jpg',
    description: 'Braids with beads and center parts.'
  },
{
    id: 'female_dutch_braids',
    label: 'Dutch Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_dutch_braids.jpg',
    description: 'Double raised Dutch style braids.'
  },
{
    id: 'female_fishtail_braid',
    label: 'Fishtail Braid',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_fishtail_braid.jpg',
    description: 'Detailed fishtail weave design.'
  },
{
    id: 'female_crown_braid',
    label: 'Crown Braid',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_crown_braid.jpg',
    description: 'Braided crown wrap styling.'
  },
{
    id: 'female_halo_braid',
    label: 'Halo Braid',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_halo_braid.jpg',
    description: 'Thick circular halo crown braid.'
  },
{
    id: 'female_side_braid',
    label: 'Side Braid',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_side_braid.jpg',
    description: 'Loose casual side-swept braid.'
  },
{
    id: 'female_braided_ponytail',
    label: 'Braided Ponytail',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_braided_ponytail.jpg',
    description: 'Sleek high ponytail ending in braid.'
  },
{
    id: 'female_braided_bun',
    label: 'Braided Bun',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_braided_bun.jpg',
    description: 'High bun styled from braided locks.'
  },
{
    id: 'female_goddess_braids',
    label: 'Goddess Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_goddess_braids.jpg',
    description: 'Thick protective cornrow styling.'
  },
{
    id: 'female_lemonade_braids',
    label: 'Lemonade Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_lemonade_braids.jpg',
    description: 'Side-swept Lemonade braids style.'
  },
{
    id: 'female_micro_braids',
    label: 'Micro Braids',
    category: 'hair',
    subcategory: 'braids',
    gender: 'Female',
    image: '/presets/female_hair_female_female_micro_braids.jpg',
    description: 'Tiny individual micro braids.'
  },
{
    id: 'female_low_ponytail',
    label: 'Low Ponytail',
    category: 'hair',
    subcategory: 'ponytails',
    gender: 'Female',
    image: '/presets/female_hair_female_female_low_ponytail.jpg',
    description: 'Neat low ponytail at neck.'
  },
{
    id: 'female_sleek_ponytail',
    label: 'Sleek Ponytail',
    category: 'hair',
    subcategory: 'ponytails',
    gender: 'Female',
    image: '/presets/female_hair_female_female_sleek_ponytail.jpg',
    description: 'Glossy, super straight flat ponytail.'
  },
{
    id: 'female_bubble_ponytail',
    label: 'Bubble Ponytail',
    category: 'hair',
    subcategory: 'ponytails',
    gender: 'Female',
    image: '/presets/female_hair_female_female_bubble_ponytail.jpg',
    description: 'Trendy bubbled tier segments ponytail.'
  },
{
    id: 'female_curly_ponytail',
    label: 'Curly Ponytail',
    category: 'hair',
    subcategory: 'ponytails',
    gender: 'Female',
    image: '/presets/female_hair_female_female_curly_ponytail.jpg',
    description: 'Voluminous curls high ponytail.'
  },
{
    id: 'female_half_up_ponytail',
    label: 'Half-Up Ponytail',
    category: 'hair',
    subcategory: 'ponytails',
    gender: 'Female',
    image: '/presets/female_hair_female_female_half_up_ponytail.jpg',
    description: 'Half-up top pony with flowing lock.'
  },
{
    id: 'female_high_bun',
    label: 'High Bun',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_high_bun.jpg',
    description: 'Sleek topknot bun high on head.'
  },
{
    id: 'female_low_bun',
    label: 'Low Bun',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_low_bun.jpg',
    description: 'Classic neat low bun at neck.'
  },
{
    id: 'female_messy_bun',
    label: 'Messy Bun',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_messy_bun.jpg',
    description: 'Casual, textured loose messy bun.'
  },
{
    id: 'female_top_knot',
    label: 'Top Knot',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_top_knot.jpg',
    description: 'Small tight topknot bun design.'
  },
{
    id: 'female_half_up_bun',
    label: 'Half-Up Bun',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_half_up_bun.jpg',
    description: 'Top section bun with wavy flow.'
  },
{
    id: 'female_double_buns',
    label: 'Double Buns',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_double_buns.jpg',
    description: 'Symmetrical double topknot buns.'
  },
{
    id: 'female_chignon',
    label: 'Chignon',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_chignon.jpg',
    description: 'Sophisticated low chignon wrap.'
  },
{
    id: 'female_french_twist',
    label: 'French Twist',
    category: 'hair',
    subcategory: 'buns',
    gender: 'Female',
    image: '/presets/female_hair_female_female_french_twist.jpg',
    description: 'Elegant upward fold classic twist.'
  },
{
    id: 'female_rounded_afro',
    label: 'Rounded Afro',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_rounded_afro.jpg',
    description: 'Perfectly rounded volumetric afro.'
  },
{
    id: 'female_tapered_afro',
    label: 'Tapered Afro',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_tapered_afro.jpg',
    description: 'Afro with tapered sides and back.'
  },
{
    id: 'female_twist_out',
    label: 'Twist Out',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_twist_out.jpg',
    description: 'Twist out defined coily curls.'
  },
{
    id: 'female_braid_out',
    label: 'Braid Out',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_braid_out.jpg',
    description: 'Crimped textured braid out volume.'
  },
{
    id: 'female_wash_go',
    label: 'Wash and Go',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_wash_go.jpg',
    description: 'Natural wash-and-go ringlet curls.'
  },
{
    id: 'female_finger_coils',
    label: 'Finger Coils',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_finger_coils.jpg',
    description: 'Coils defined by finger styling.'
  },
{
    id: 'female_two_strand_twists',
    label: 'Two-Strand Twists',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_two_strand_twists.jpg',
    description: 'Two-strand twistsprotective design.'
  },
{
    id: 'female_flat_twists',
    label: 'Flat Twists',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_flat_twists.jpg',
    description: 'Flat twists close to the scalp.'
  },
{
    id: 'female_passion_twists',
    label: 'Passion Twists',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_passion_twists.jpg',
    description: 'Long passion twists with curl texture.'
  },
{
    id: 'female_senegalese_twists',
    label: 'Senegalese Twists',
    category: 'hair',
    subcategory: 'natural',
    gender: 'Female',
    image: '/presets/female_hair_female_female_senegalese_twists.jpg',
    description: 'Neat smooth Senegalese twists.'
  },
{
    id: 'female_faux_locs',
    label: 'Faux Locs',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_faux_locs.jpg',
    description: 'Long protective textured Locs.'
  },
{
    id: 'female_butterfly_locs',
    label: 'Butterfly Locs',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_butterfly_locs.jpg',
    description: 'Distressed looped butterfly Locs.'
  },
{
    id: 'female_short_locs',
    label: 'Short Locs',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_short_locs.jpg',
    description: 'Neat short locs styled close.'
  },
{
    id: 'female_long_locs',
    label: 'Long Locs',
    category: 'hair',
    subcategory: 'locs',
    gender: 'Female',
    image: '/presets/female_hair_female_female_long_locs.jpg',
    description: 'Long flowing natural Locs style.'
  },
{
    id: 'female_wolf_cut',
    label: 'Wolf Cut',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_wolf_cut.jpg',
    description: 'Shaggy multi-layered wolf crop.'
  },
{
    id: 'female_soft_wolf_cut',
    label: 'Soft Wolf Cut',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_soft_wolf_cut.jpg',
    description: 'Subtle face-framing shaggy layers.'
  },
{
    id: 'female_jellyfish_cut',
    label: 'Jellyfish Cut',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_jellyfish_cut.jpg',
    description: 'Short outer bob, long under-layers.'
  },
{
    id: 'female_hime_cut',
    label: 'Hime Cut',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_hime_cut.jpg',
    description: 'Straight bangs and side bangs crop.'
  },
{
    id: 'female_octopus_cut',
    label: 'Octopus Cut',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_octopus_cut.jpg',
    description: 'Top volume with long wispy base.'
  },
{
    id: 'female_modern_shag',
    label: 'Modern Shag',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_modern_shag.jpg',
    description: 'Textured choppy medium shag.'
  },
{
    id: 'female_retro_shag',
    label: 'Retro Shag',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_retro_shag.jpg',
    description: 'Voluminous 70s-style shaggy cut.'
  },
{
    id: 'female_mullet_shag',
    label: 'Mullet Shag',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_mullet_shag.jpg',
    description: 'Edgy mullet-shag hybrid crop.'
  },
{
    id: 'female_wet_look',
    label: 'Wet Look',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_wet_look.jpg',
    description: 'Slicked-back high-shine look.'
  },
{
    id: 'female_slicked_back',
    label: 'Slicked-Back',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_slicked_back.jpg',
    description: 'Neat, straight slicked-back style.'
  },
{
    id: 'female_pin_curls',
    label: 'Vintage Pin Curls',
    category: 'hair',
    subcategory: 'formal',
    gender: 'Female',
    image: '/presets/female_hair_female_female_pin_curls.jpg',
    description: 'Flat vintage structured waves.'
  },
{
    id: 'female_old_hollywood',
    label: 'Old Hollywood Glam',
    category: 'hair',
    subcategory: 'formal',
    gender: 'Female',
    image: '/presets/female_hair_female_female_old_hollywood.jpg',
    description: 'Glossy, retro movie star waves.'
  },
{
    id: 'female_boho_waves',
    label: 'Boho Waves',
    category: 'hair',
    subcategory: 'trendy',
    gender: 'Female',
    image: '/presets/female_hair_female_female_boho_waves.jpg',
    description: 'Loose, organic bohemian waves.'
  },
{
    id: 'female_bridal_updo',
    label: 'Bridal Updo',
    category: 'hair',
    subcategory: 'formal',
    gender: 'Female',
    image: '/presets/female_hair_female_female_bridal_updo.jpg',
    description: 'Elegant romantic wedding updo.'
  },
{
    id: 'female_braided_bridal',
    label: 'Braided Bridal Updo',
    category: 'hair',
    subcategory: 'formal',
    gender: 'Female',
    image: '/presets/female_hair_female_female_braided_bridal.jpg',
    description: 'Detailed braids wedding updo.'
  },
{
    id: 'female_formal_updo',
    label: 'Elegant Formal Updo',
    category: 'hair',
    subcategory: 'formal',
    gender: 'Female',
    image: '/presets/female_hair_female_female_formal_updo.jpg',
    description: 'Sophisticated structured evening updo.'
  }
];

export const FEMALE_OUTFIT_PREVIEWS: PreviewPreset[] = [
  {
    id: 'original',
    label: 'Original Outfit',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_hair_original.jpg',
    description: 'Revert to your original uploaded outfit.'
  },
  {
    id: 'outfit_business',
    label: 'Business Formal',
    category: 'outfit',
    subcategory: 'business',
    gender: 'Female',
    image: '/presets/female_outfit_business.jpg',
    description: 'Sharp tailored black professional suit jacket and blazer.'
  },
  {
    id: 'outfit_wedding',
    label: 'Wedding Theme',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Female',
    image: '/presets/female_outfit_wedding.jpg',
    description: 'Stunning white lace off-the-shoulder wedding gown.'
  },
  {
    id: 'outfit_gala',
    label: 'Luxury Gala Gown',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Female',
    image: '/presets/female_outfit_gala.jpg',
    description: 'Luxurious floor-length red silk evening gown.'
  },
  {
    id: 'outfit_highlife',
    label: 'Yacht Casual',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Female',
    image: '/presets/female_outfit_highlife.jpg',
    description: 'Elegant white evening silk slip resort wear.'
  },
  {
    id: 'outfit_resort',
    label: 'Summer Resort',
    category: 'outfit',
    subcategory: 'vacation',
    gender: 'Female',
    image: '/presets/female_outfit_vacation_resort.jpg',
    description: 'Flowing pastel vacation resort midi dress.'
  },
  {
    id: 'outfit_streetwear',
    label: 'Streetwear Tech',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_outfit_streetwear.jpg',
    description: 'Retro casual streetwear cardigan and tee.'
  },
  {
    id: 'outfit_retro',
    label: 'Retro Vintage',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_outfit_retro.jpg',
    description: 'Distressed blue denim jacket over crop top and pants.'
  },
  {
    id: 'outfit_active',
    label: 'Athletic Wear',
    category: 'outfit',
    subcategory: 'active',
    gender: 'Female',
    image: '/presets/female_outfit_active.jpg',
    description: 'Matching athletic sports crop top and performance leggings.'
  },
  {
    id: 'outfit_sport',
    label: 'Sport Active',
    category: 'outfit',
    subcategory: 'active',
    gender: 'Female',
    image: '/presets/female_outfit_sport.jpg',
    description: 'White tennis sports polo and pleated skirt.'
  },
  {
    id: 'female_outfit_casual_tshirt_jeans',
    label: 'Basic Tee & Jeans',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_outfit_casual_tshirt_jeans.jpg',
    description: 'Basic fitted white T-shirt and blue denim jeans.'
  },
  {
    id: 'female_outfit_casual_sweater_jeans',
    label: 'Oversized Sweater & Jeans',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_outfit_casual_sweater_jeans.jpg',
    description: 'Cozy oversized knitted cream sweater and jeans.'
  },
  {
    id: 'female_outfit_casual_crop_pants',
    label: 'Crop Top & Pants',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_outfit_casual_crop_pants.jpg',
    description: 'Fitted cropped top and high-waisted wide-leg trousers.'
  },
  {
    id: 'female_outfit_sundress',
    label: 'Casual Sundress',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_outfit_sundress.jpg',
    description: 'Casual summer floral sundress with spaghetti straps.'
  },
  {
    id: 'female_outfit_casual_leather_jacket',
    label: 'Leather Jacket Outfit',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_outfit_casual_leather_jacket.jpg',
    description: 'Edgy black leather biker jacket over a white tee.'
  },
  {
    id: 'female_outfit_casual_winter_coat',
    label: 'Winter Coat & Boots',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'Female',
    image: '/presets/female_outfit_casual_winter_coat.jpg',
    description: 'Heavy brown wool winter trench coat and a thick scarf.'
  },
  {
    id: 'female_outfit_business_pantsuit',
    label: 'Business Pantsuit',
    category: 'outfit',
    subcategory: 'business',
    gender: 'Female',
    image: '/presets/female_outfit_business_pantsuit.jpg',
    description: 'Professional tailored double-breasted gray business pantsuit.'
  },
  {
    id: 'female_outfit_business_blazer_trousers',
    label: 'Blazer & Trousers',
    category: 'outfit',
    subcategory: 'business',
    gender: 'Female',
    image: '/presets/female_outfit_business_blazer_trousers.jpg',
    description: 'Smart navy blazer over a white blouse, and cream trousers.'
  },
  {
    id: 'female_outfit_business_pencil_skirt',
    label: 'Blouse & Pencil Skirt',
    category: 'outfit',
    subcategory: 'business',
    gender: 'Female',
    image: '/presets/female_outfit_business_pencil_skirt.jpg',
    description: 'Professional satin long-sleeve blouse and high-waisted black pencil skirt.'
  },
  {
    id: 'female_outfit_luxury_cocktail_dress',
    label: 'Cocktail Dress',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Female',
    image: '/presets/female_outfit_luxury_cocktail_dress.jpg',
    description: 'Chic knee-length emerald green silk cocktail dress.'
  },
  {
    id: 'female_outfit_luxury_satin_dress',
    label: 'Satin slip dress',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Female',
    image: '/presets/female_outfit_luxury_satin_dress.jpg',
    description: 'Sleek champagne-colored silk slip dress.'
  },
  {
    id: 'female_outfit_luxury_lbd',
    label: 'Little Black Dress',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Female',
    image: '/presets/female_outfit_luxury_lbd.jpg',
    description: 'Classic elegant knee-length little black dress.'
  },
  {
    id: 'female_outfit_luxury_wedding_guest',
    label: 'Wedding Guest Dress',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Female',
    image: '/presets/female_outfit_luxury_wedding_guest.jpg',
    description: 'Sophisticated elegant floral-print wedding guest midi dress.'
  },
  {
    id: 'female_outfit_luxury_designer',
    label: 'Luxury Designer Tweed',
    category: 'outfit',
    subcategory: 'luxury',
    gender: 'Female',
    image: '/presets/female_outfit_luxury_designer.jpg',
    description: 'High-fashion tailored designer tweed set.'
  },
  {
    id: 'female_outfit_vacation_beach_cover',
    label: 'Beach Cover-Up',
    category: 'outfit',
    subcategory: 'vacation',
    gender: 'Female',
    image: '/presets/female_outfit_vacation_beach_cover.jpg',
    description: 'Lightweight linen beach cover shirt and shorts.'
  },
  {
    id: 'unisex_outfit_oversized_streetwear',
    label: 'Oversized Streetwear',
    category: 'outfit',
    subcategory: 'casual',
    gender: 'unisex',
    image: '/presets/female_outfit_unisex_oversized_streetwear.jpg',
    description: 'Unisex oversized boxy streetwear hoodie.'
  }
];

export const FEMALE_MAKEUP_PREVIEWS: PreviewPreset[] = [
  {
    id: 'makeup_natural',
    label: 'Natural Glaze',
    category: 'makeup',
    gender: 'Female',
    image: '/presets/female_makeup_natural.jpg',
    description: 'Dewy foundation, light mascara, and natural lip balm.'
  },
  {
    id: 'makeup_bold',
    label: 'Bold Crimson',
    category: 'makeup',
    gender: 'Female',
    image: '/presets/female_makeup_bold.jpg',
    description: 'Vibrant matte red lipstick with winged eyeliner.'
  },
  {
    id: 'makeup_smokey',
    label: 'Smokey Eyes',
    category: 'makeup',
    gender: 'Female',
    image: '/presets/female_makeup_smokey.jpg',
    description: 'Intense charcoal eyeshadow and soft cheek contour.'
  },
  {
    id: 'makeup_rose',
    label: 'Rose Glow',
    category: 'makeup',
    gender: 'Female',
    image: '/presets/female_makeup_rose.jpg',
    description: 'Warm pink blush, soft highlighter, and lip gloss.'
  },
  {
    id: "makeup_no_makeup",
    label: "No-Makeup Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_no_makeup.jpg",
    description: "Ultra-light coverage, sheer lip tint, and soft brows."
  },
  {
    id: "makeup_clean_girl",
    label: "Clean Girl Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_clean_girl.jpg",
    description: "Glowy complexion, brushed brows, and fresh tint."
  },
  {
    id: "makeup_soft_glam",
    label: "Soft Glam",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_soft_glam.jpg",
    description: "Diffused warm shadows, soft lips, and seamless blend."
  },
  {
    id: "makeup_full_glam",
    label: "Full Glam",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_full_glam.jpg",
    description: "Cut crease, thick lashes, contouring, and defined lip."
  },
  {
    id: "makeup_natural_everyday",
    label: "Natural Everyday",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_natural_everyday.jpg",
    description: "Light concealer, brown mascara, and nude pink lips."
  },
  {
    id: "makeup_dewy_glow",
    label: "Dewy Glow",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_dewy_glow.jpg",
    description: "Wet-look skin, minimal powder, and super-glossy accents."
  },
  {
    id: "makeup_matte_glam",
    label: "Matte Glam",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_matte_glam.jpg",
    description: "Zero shine, full coverage, and velvet soft-focus lips."
  },
  {
    id: "makeup_glass_skin",
    label: "Glass Skin Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_glass_skin.jpg",
    description: "Highly reflective, translucent skin with minimal makeup."
  },
  {
    id: "makeup_latte",
    label: "Latte Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_latte.jpg",
    description: "Monochromatic caramel, coffee, and bronze tones."
  },
  {
    id: "makeup_strawberry",
    label: "Strawberry Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_strawberry.jpg",
    description: "Fresh pink cheeks, sun-kissed freckles, and red tint."
  },
  {
    id: "makeup_peach",
    label: "Peach Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_peach.jpg",
    description: "Warm peach tones on eyes, cheeks, and lips."
  },
  {
    id: "makeup_rosy",
    label: "Rosy Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_rosy.jpg",
    description: "Romantic flush of roses with matching soft pink eyes."
  },
  {
    id: "makeup_bronze_goddess",
    label: "Bronze Goddess",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_bronze_goddess.jpg",
    description: "Deep golden highlights, sun-sculpted cheekbones."
  },
  {
    id: "makeup_smokey_eye",
    label: "Smokey Eye",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_smokey_eye.jpg",
    description: "Dramatic dark gradient eyeshadow, nude lip contrast."
  },
  {
    id: "makeup_soft_smokey",
    label: "Soft Smokey Eye",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_soft_smokey.jpg",
    description: "Subtle smudge of brown and taupe for day-friendly smoke."
  },
  {
    id: "makeup_classic_red_lip",
    label: "Classic Red Lip",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_classic_red_lip.jpg",
    description: "Minimal eye makeup paired with a retro bold red lip."
  },
  {
    id: "makeup_nude_glam",
    label: "Nude Glam",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_nude_glam.jpg",
    description: "Contoured face, brown liners, and soft caramel hues."
  },
  {
    id: "makeup_bridal",
    label: "Bridal Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_bridal.jpg",
    description: "Classic romantic glow, airbrushed skin, timeless eyes."
  },
  {
    id: "makeup_evening_glam",
    label: "Evening Glam",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_evening_glam.jpg",
    description: "Shimmering eyes, dramatic contour, glossy bold lips."
  },
  {
    id: "makeup_y2k",
    label: "Y2K Makeup",
    category: "makeup",
    gender: "Female",
    image: "/presets/female_makeup_makeup_y2k.jpg",
    description: "Frosted blue/silver eyeshadow, heavy liner, and brown lip."
  }
];

// --- Hair Colors (Unified) ---
export const COLOR_PREVIEWS: PreviewPreset[] = [
  {
    id: 'original',
    label: 'Original Color',
    category: 'color',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=450&q=80',
    description: 'Maintain original hair color.'
  },
  {
    id: 'black',
    label: 'Jet Black',
    category: 'color',
    image: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?w=450&q=80',
    description: 'Deep, glossy solid black dye.'
  },
  {
    id: 'brown',
    label: 'Chocolate Brown',
    category: 'color',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=450&q=80',
    description: 'Warm medium chocolate brown shade.'
  },
  {
    id: 'blonde',
    label: 'Honey Blonde',
    category: 'color',
    image: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=450&q=80',
    description: 'Rich, sun-kissed honey blonde tone.'
  },
  {
    id: 'platinum',
    label: 'Platinum',
    category: 'color',
    image: 'https://images.unsplash.com/photo-1595959183075-c1d0a161b03d?w=450&q=80',
    description: 'Bright ice platinum blonde dye.'
  },
  {
    id: 'red',
    label: 'Copper Red',
    category: 'color',
    image: 'https://images.unsplash.com/photo-1595959183075-c1d0a161b03d?w=450&q=80',
    description: 'Vibrant ginger copper red shade.'
  },
  {
    id: 'pink',
    label: 'Pastel Pink',
    category: 'color',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=450&q=80',
    description: 'Trendy, soft pastel pink dye.'
  },
  {
    id: 'grey',
    label: 'Silver / Grey',
    category: 'color',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=450&q=80',
    description: 'Sleek gunmetal silver metallic dye.'
  }
];

// --- Eye Colors (Unified) ---
export const EYE_COLOR_PREVIEWS: PreviewPreset[] = [
  {
    id: 'eyecolor_original',
    label: 'Original',
    category: 'eyecolor',
    image: '/presets/eyecolor_original.jpg',
    description: 'Keep your current natural eye color.'
  },
  {
    id: 'eyecolor_blue',
    label: 'Blue',
    category: 'eyecolor',
    image: '/presets/eyecolor_blue.jpg',
    description: 'Deep sapphire blue contact lenses.'
  },
  {
    id: 'eyecolor_green',
    label: 'Green',
    category: 'eyecolor',
    image: '/presets/eyecolor_green.jpg',
    description: 'Vibrant forest emerald green contacts.'
  },
  {
    id: 'eyecolor_hazel',
    label: 'Hazel',
    category: 'eyecolor',
    image: '/presets/eyecolor_hazel.jpg',
    description: 'Warm golden honey-brown hazel contacts.'
  },
  {
    id: 'eyecolor_gray',
    label: 'Gray',
    category: 'eyecolor',
    image: '/presets/eyecolor_gray.jpg',
    description: 'Sleek steel gray contact lenses.'
  },
  {
    id: 'eyecolor_amber',
    label: 'Amber',
    category: 'eyecolor',
    image: '/presets/eyecolor_amber.jpg',
    description: 'Luminous light amber-yellow contacts.'
  }
];
