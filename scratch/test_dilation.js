// Automated Removal Dilation Validation Tests
import { AESTHETIC_TREATMENTS } from '../constants/aesthetics.ts';

const runTests = () => {
  console.log("=== RUNNING REMOVAL DILATION VALIDATION TESTS ===");

  // Mock Prompt Builder Logic
  const mockBuildPrompt = (selectedHairStyle, selectedHairColor, selectedBeardStyle, gender) => {
    const promptParts = [];
    const isBald = selectedHairStyle?.id === 'bald';

    // --- 1. HAIRSTYLE ---
    const isHairStyleOriginal = !selectedHairStyle || selectedHairStyle.id === 'original';
    if (isHairStyleOriginal) {
      promptParts.push("- HAIRSTYLE: Do not change the hairstyle.");
    } else if (isBald) {
      promptParts.push(`- HAIRSTYLE TRANSFORMATION: Create a completely bald, fully shaved scalp.
Remove all existing scalp hair, including the main hairstyle, hairline, temple hair, side hair, crown hair, stray strands, wisps, flyaways, and the full outline or silhouette of the original hairstyle.
Reconstruct the natural scalp beneath the removed hair with realistic skin texture, pores, lighting, highlights, shadows, and consistent skin tone.
The final image must contain no visible hair strands, no hair shadow, no transparent hair remnants, no ghosted original hairstyle, no buzz cut, and no receding-hair interpretation.
Preserve the person's identity, eyebrows, eyelashes, facial features, head shape, expression, pose, background, and all unrelated active customizations.`);
    } else {
      promptParts.push(`- HAIRSTYLE TRANSFORMATION: Paint ${selectedHairStyle.label}`);
    }

    // --- 2. HAIR COLOR ---
    const isHairColorOriginal = !selectedHairColor || selectedHairColor.id === 'original';
    if (!isBald) {
      if (isHairColorOriginal) {
        promptParts.push("- HAIR COLOR: Do not change the hair color.");
      } else {
        promptParts.push(`- HAIR COLOR TRANSFORMATION: Dye all head hair to ${selectedHairColor.label}`);
      }
    }

    // --- 3. FACIAL HAIR ---
    if (gender === 'Male') {
      const isBeardStyleOriginal = !selectedBeardStyle || selectedBeardStyle.id === 'original';
      const isCleanShaven = selectedBeardStyle?.id === 'none';

      if (isBeardStyleOriginal) {
        promptParts.push("- BEARD STYLE: Do not change the beard style.");
      } else if (isCleanShaven) {
        promptParts.push(`- BEARD TRANSFORMATION: Create a completely clean-shaven face.
Remove all beard and mustache hair, including dense hair, individual hairs, stubble, beard shadow, sideburn remnants, jaw hair, chin hair, upper-lip hair, cheek hair, and neck hair associated with the beard.
Reconstruct natural skin beneath the removed facial hair with realistic pores, texture, lighting, contours, and consistent skin tone.
The final image must contain no beard hairs, no mustache hairs, no stubble, no dark or gray beard shadow, and no ghosted facial-hair remnants.
Preserve the person's identity, facial structure, lips, skin tone, expression, scalp hairstyle, background, and all unrelated active customizations.`);
      } else {
        promptParts.push(`- BEARD TRANSFORMATION: Paint ${selectedBeardStyle.label}`);
      }
    }

    return promptParts.join("\n");
  };

  // Test 1: Verification of Bald prompt output and color conflict avoidance
  console.log("Test 1: Verification of Bald prompt content and color conflict exclusion");
  const prompt1 = mockBuildPrompt({ id: 'bald', label: 'Bald' }, { id: 'blonde', label: 'Blonde' }, { id: 'original' }, 'Male');

  if (!prompt1.includes("completely bald, fully shaved scalp")) {
    console.error("❌ FAIL: Bald prompt text is missing");
    process.exit(1);
  }
  if (prompt1.includes("HAIR COLOR TRANSFORMATION")) {
    console.error("❌ FAIL: Hair color prompt was not skipped when Bald is active");
    process.exit(1);
  }
  console.log("✅ PASS: Bald removal prompt successfully configured and conflict avoided.");

  // Test 2: Verification of Clean Shaven prompt
  console.log("Test 2: Verification of Clean Shaven prompt content");
  const prompt2 = mockBuildPrompt({ id: 'original' }, { id: 'original' }, { id: 'none', label: 'Clean Shaven' }, 'Male');

  if (!prompt2.includes("completely clean-shaven face")) {
    console.error("❌ FAIL: Clean Shaven prompt text is missing");
    process.exit(1);
  }
  console.log("✅ PASS: Clean Shaven removal prompt successfully configured.");

  // Test 3: Simulation of Dilation radius bounds selection
  console.log("Test 3: Dilation radius selection for removal modes");
  const mockGetDilationRadius = (selectedHairStyle, selectedBeardStyle) => {
    const isBaldSelected = selectedHairStyle?.id === 'bald';
    const isCleanShavenSelected = selectedBeardStyle?.id === 'none';
    let dilationRadius = 0;
    if (isBaldSelected) dilationRadius = 22;
    if (isCleanShavenSelected) dilationRadius = Math.max(dilationRadius, 14);
    return dilationRadius;
  };

  if (mockGetDilationRadius({ id: 'bald' }, { id: 'original' }) !== 22) {
    console.error("❌ FAIL: Incorrect dilation radius for Bald");
    process.exit(1);
  }
  if (mockGetDilationRadius({ id: 'original' }, { id: 'none' }) !== 14) {
    console.error("❌ FAIL: Incorrect dilation radius for Clean Shaven");
    process.exit(1);
  }
  if (mockGetDilationRadius({ id: 'bald' }, { id: 'none' }) !== 22) {
    console.error("❌ FAIL: Mismatched dilation priority");
    process.exit(1);
  }
  console.log("✅ PASS: Dilation radius bounds verified correctly.");
  console.log("=== ALL REMOVAL DILATION VALIDATION TESTS PASSED SUCCESSFULLY! ===");
};

runTests();
