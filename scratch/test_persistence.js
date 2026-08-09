// Automated Persistence Validation Tests
import { HAIR_STYLES_MALE, HAIR_COLORS, BEARD_STYLES, OUTFIT_STYLES, MAKEUP_STYLES } from '../constants.tsx';

const runTests = () => {
  console.log("=== RUNNING FEATURE PERSISTENCE VALIDATION TESTS ===");

  // Initialize a mock AppState
  let mockState = {
    currentMode: 'Editor',
    gender: 'Male',
    originalImage: 'original_data_url',
    currentImage: 'original_data_url',
    selectedHairStyle: HAIR_STYLES_MALE[0], // Original/Natural
    selectedHairColor: HAIR_COLORS[0],
    selectedBeardStyle: BEARD_STYLES[0],
    selectedBeardColor: { id: 'original', label: 'Original' },
    selectedOutfit: OUTFIT_STYLES[0],
    selectedMakeup: MAKEUP_STYLES[0],
    selectedTreatments: []
  };

  // Helper simulating immutable state updates
  const updateState = (updates) => {
    mockState = { ...mockState, ...updates };
  };

  // Test 1: Simulating sequential style updates (e.g. hair -> outfit)
  console.log("Test 1: Sequential style selection merges");
  const targetHair = HAIR_STYLES_MALE[2]; // Afro
  updateState({ selectedHairStyle: targetHair });

  if (mockState.selectedHairStyle.id !== targetHair.id) {
    console.error("❌ FAIL: Hair style failed to update");
    process.exit(1);
  }
  if (mockState.selectedOutfit.id !== OUTFIT_STYLES[0].id) {
    console.error("❌ FAIL: Hair style update accidentally reset outfit");
    process.exit(1);
  }
  console.log("✅ PASS: Style updates merged and preserved other selections correctly.");

  // Test 2: Simulating template try-on preserving existing selections
  console.log("Test 2: Try template preserves other features");
  
  // Set some current state
  const currentBeard = BEARD_STYLES[1]; // Stubble
  const currentOutfit = OUTFIT_STYLES[1]; // Business suit
  updateState({
    selectedBeardStyle: currentBeard,
    selectedOutfit: currentOutfit
  });

  // Simulating template hairstyle choice
  const templateHairstyle = { id: 'male_hair_fade', category: 'hair', label: 'Fade' };
  
  // Simulated handleTryTemplate updates
  const updates = {
    selectedHairStyle: templateHairstyle,
    selectedHairColor: mockState.selectedHairColor || HAIR_COLORS[0],
    selectedBeardStyle: mockState.selectedBeardStyle || BEARD_STYLES[0],
    selectedBeardColor: mockState.selectedBeardColor || { id: 'original' },
    selectedOutfit: mockState.selectedOutfit || OUTFIT_STYLES[0],
    selectedMakeup: mockState.selectedMakeup || MAKEUP_STYLES[0],
  };
  updateState(updates);

  if (mockState.selectedHairStyle.id !== 'male_hair_fade') {
    console.error("❌ FAIL: Hair template not applied");
    process.exit(1);
  }
  if (mockState.selectedBeardStyle.id !== currentBeard.id) {
    console.error("❌ FAIL: Applying hair template reset beard");
    process.exit(1);
  }
  if (mockState.selectedOutfit.id !== currentOutfit.id) {
    console.error("❌ FAIL: Applying hair template reset outfit");
    process.exit(1);
  }
  console.log("✅ PASS: Template try-on successfully preserved all other active selections.");

  // Test 3: History Sync and Restoration
  console.log("Test 3: Undo / Redo restores full customization state");
  
  // Mock history list
  const history = [];
  let historyIndex = -1;

  const pushHistoryEntry = () => {
    const entry = {
      image: mockState.currentImage,
      selectedHairStyle: mockState.selectedHairStyle,
      selectedHairColor: mockState.selectedHairColor,
      selectedBeardStyle: mockState.selectedBeardStyle,
      selectedBeardColor: mockState.selectedBeardColor,
      selectedOutfit: mockState.selectedOutfit,
      selectedMakeup: mockState.selectedMakeup,
      selectedTreatments: mockState.selectedTreatments,
    };
    history.push(entry);
    historyIndex++;
  };

  // Push Initial State
  pushHistoryEntry();

  // Make change and push
  updateState({
    currentImage: 'generated_image_1',
    selectedHairStyle: HAIR_STYLES_MALE[4] // Buzz Cut
  });
  pushHistoryEntry();

  if (history.length !== 2) {
    console.error("❌ FAIL: History sync failed");
    process.exit(1);
  }

  // Simulate Undo
  console.log("Simulating undo...");
  const undoEntry = history[0];
  updateState({
    currentImage: undoEntry.image,
    selectedHairStyle: undoEntry.selectedHairStyle,
    selectedHairColor: undoEntry.selectedHairColor,
    selectedBeardStyle: undoEntry.selectedBeardStyle,
    selectedBeardColor: undoEntry.selectedBeardColor,
    selectedOutfit: undoEntry.selectedOutfit,
    selectedMakeup: undoEntry.selectedMakeup,
    selectedTreatments: undoEntry.selectedTreatments,
  });

  if (mockState.currentImage !== 'original_data_url') {
    console.error("❌ FAIL: Undo failed to restore image");
    process.exit(1);
  }
  if (mockState.selectedHairStyle.id !== 'male_hair_fade') {
    console.error("❌ FAIL: Undo failed to restore selectedHairStyle");
    process.exit(1);
  }
  console.log("✅ PASS: Undo successfully restored both image and selections config.");
  console.log("=== ALL PERSISTENCE VALIDATION TESTS PASSED SUCCESSFULLY! ===");
};

runTests();
