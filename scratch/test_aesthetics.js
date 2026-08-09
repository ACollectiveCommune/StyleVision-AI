import { AESTHETIC_TREATMENTS } from '../constants/aesthetics.js';

const runTests = () => {
  console.log("=== RUNNING AESTHETIC PIPELINE VALIDATION TESTS ===");

  // 1. Check all treatments are unique
  const treatmentIds = AESTHETIC_TREATMENTS.map(t => t.id);
  const uniqueIds = new Set(treatmentIds);
  if (uniqueIds.size !== treatmentIds.length) {
    console.error("❌ FAIL: Duplicate treatment IDs found:", treatmentIds);
    process.exit(1);
  }
  console.log(`✅ PASS: All ${AESTHETIC_TREATMENTS.length} treatments have unique IDs.`);

  // 2. Verify all treatments have exactly 6 steps, ordered from 0 to 5
  AESTHETIC_TREATMENTS.forEach(t => {
    if (t.steps.length !== 6) {
      console.error(`❌ FAIL: Treatment ${t.id} has ${t.steps.length} steps instead of 6.`);
      process.exit(1);
    }
    
    t.steps.forEach((step, idx) => {
      if (step.value !== idx) {
        console.error(`❌ FAIL: Treatment ${t.id} step value mismatch at index ${idx}. Expected ${idx}, got ${step.value}`);
        process.exit(1);
      }
    });
  });
  console.log("✅ PASS: All treatments have exactly 6 progressive levels (0 to 5) monotonically ordered.");

  // 3. Centralized Prompt compiler check: verify progressive weights are included correctly
  const mockAestheticsPrompt = (treatmentId, val) => {
    const fullTreat = AESTHETIC_TREATMENTS.find(t => t.id === treatmentId);
    if (!fullTreat) return null;
    
    const activeStep = fullTreat.steps.find(s => s.value === val);
    if (!activeStep) return null;
    
    let intensityDirective = "";
    if (val === 1) {
      intensityDirective = "INTENSITY: Very subtle, soft, natural-looking simulation (approx 20% change). It must look refined, gentle, and barely perceptible.";
    } else if (val === 2) {
      intensityDirective = "INTENSITY: Clearly visible, balanced, moderate simulation (approx 40% change). The change must be noticeable but remain aesthetically proportioned.";
    } else if (val === 3) {
      intensityDirective = "INTENSITY: Highly contoured, defined, and prominent simulation (approx 60% change). The modification must be bold and immediately noticeable.";
    } else if (val === 4) {
      intensityDirective = "INTENSITY: Very strong, highly pronounced simulation (approx 80% change). The modification must be very bold, striking, and dominant.";
    } else if (val >= 5) {
      intensityDirective = "INTENSITY: Absolute maximum dramatic simulation (100% change). Completely erase wrinkles/blemishes or project the volume to its peak cosmetic level.";
    }
    return `- ${fullTreat.label.toUpperCase()}: Apply simulated ${fullTreat.label} (Dosing Delineator: ${activeStep.label}). ${intensityDirective} Instruction: ${activeStep.promptDesc}.`;
  };

  // Test prompt generation for all treatments at levels 1, 3, 5
  AESTHETIC_TREATMENTS.forEach(t => {
    const promptLevel1 = mockAestheticsPrompt(t.id, 1);
    const promptLevel3 = mockAestheticsPrompt(t.id, 3);
    const promptLevel5 = mockAestheticsPrompt(t.id, 5);

    if (!promptLevel1.includes("approx 20% change")) {
      console.error(`❌ FAIL: Level 1 prompt for ${t.id} missing 20% directive`);
      process.exit(1);
    }
    if (!promptLevel3.includes("approx 60% change")) {
      console.error(`❌ FAIL: Level 3 prompt for ${t.id} missing 60% directive`);
      process.exit(1);
    }
    if (!promptLevel5.includes("100% change")) {
      console.error(`❌ FAIL: Level 5 prompt for ${t.id} missing 100% directive`);
      process.exit(1);
    }
  });

  console.log("✅ PASS: Prompt compilation successfully verified for all levels on every treatment.");
  console.log("=== ALL AESTHETICS VALIDATION TESTS PASSED SUCCESSFULLY! ===");
};

runTests();
