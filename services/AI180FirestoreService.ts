import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { AI180Scan, AI180GeneratedStyle } from "../types";

// Local storage keys for guest/local fallback mode
const LOCAL_SCANS_KEY = "stylevision_ai180_scans";
const LOCAL_STYLES_KEY = "stylevision_ai180_styles";

// Helper to compress base64 frames to tiny previews (~5KB each) before saving to LocalStorage
const compressLocalFrame = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64 || !base64.startsWith("data:")) {
      resolve(base64);
      return;
    }
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 480; // Sharp enough for fallback previews but safe for local storage limits
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.5)); // 50% quality JPEG compression
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
  });
};

const compressFramesForLocalStorage = async (frames: string[]): Promise<string[]> => {
  try {
    const promises = frames.map(frame => compressLocalFrame(frame));
    return await Promise.all(promises);
  } catch (e) {
    console.error("Frame compression failed:", e);
    return frames;
  }
};

export const saveAI180Scan = async (uid: string, scan: Omit<AI180Scan, 'id'>): Promise<string> => {
  const containsBase64 = scan.sourceFrames.some(url => url && url.startsWith('data:'));
  
  if (uid === "guest_user_local" || !uid || containsBase64) {
    const id = `scan_${Date.now()}`;
    const compressedFrames = await compressFramesForLocalStorage(scan.sourceFrames);
    const newScan: AI180Scan = { id, ...scan, sourceFrames: compressedFrames };
    
    try {
      const localScans = JSON.parse(localStorage.getItem(LOCAL_SCANS_KEY) || "[]");
      localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify([newScan, ...localScans]));
    } catch (e) {
      console.warn("[LOCAL STORAGE] Failed to write scan, clearing older local cache:", e);
      try {
        // Clear old local cache if still full
        localStorage.removeItem(LOCAL_SCANS_KEY);
        localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify([newScan]));
      } catch (inner) {
        console.error("[LOCAL STORAGE] Hard save failure:", inner);
      }
    }
    return id;
  }

  try {
    const scansRef = collection(db, "users", uid, "ai180_scans");
    const docRef = await addDoc(scansRef, {
      ...scan,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.warn("[FIRESTORE] Failed to save scan to Firebase, falling back to LocalStorage:", err);
    const id = `scan_${Date.now()}`;
    const compressedFrames = await compressFramesForLocalStorage(scan.sourceFrames);
    const newScan: AI180Scan = { id, ...scan, sourceFrames: compressedFrames };
    
    try {
      const localScans = JSON.parse(localStorage.getItem(LOCAL_SCANS_KEY) || "[]");
      localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify([newScan, ...localScans]));
    } catch (e) {
      console.error("[LOCAL STORAGE] Fallback write failed:", e);
    }
    return id;
  }
};

export const getAI180Scans = async (uid: string): Promise<AI180Scan[]> => {
  const localScans = JSON.parse(localStorage.getItem(LOCAL_SCANS_KEY) || "[]");
  if (uid === "guest_user_local" || !uid) {
    return localScans;
  }

  try {
    const scansRef = collection(db, "users", uid, "ai180_scans");
    const q = query(scansRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const dbScans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AI180Scan));
    return [...dbScans, ...localScans];
  } catch (err) {
    console.warn("[FIRESTORE] Failed to fetch scans, returning local scans:", err);
    return localScans;
  }
};

export const saveAI180Style = async (
  uid: string,
  style: Omit<AI180GeneratedStyle, 'id'>
): Promise<string> => {
  const containsBase64 = style.generatedFrames.some(url => url && url.startsWith('data:'));

  if (uid === "guest_user_local" || !uid || containsBase64) {
    const id = `style_${Date.now()}`;
    const compressedFrames = await compressFramesForLocalStorage(style.generatedFrames);
    const newStyle: AI180GeneratedStyle = { id, ...style, generatedFrames: compressedFrames };
    
    try {
      const localStyles = JSON.parse(localStorage.getItem(LOCAL_STYLES_KEY) || "[]");
      localStorage.setItem(LOCAL_STYLES_KEY, JSON.stringify([newStyle, ...localStyles]));
    } catch (e) {
      console.warn("[LOCAL STORAGE] Failed to write style, clearing older local cache:", e);
      try {
        localStorage.removeItem(LOCAL_STYLES_KEY);
        localStorage.setItem(LOCAL_STYLES_KEY, JSON.stringify([newStyle]));
      } catch (inner) {
        console.error("[LOCAL STORAGE] Hard save style failure:", inner);
      }
    }
    return id;
  }

  try {
    const stylesRef = collection(db, "users", uid, "ai180_styles");
    const docRef = await addDoc(stylesRef, {
      ...style,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.warn("[FIRESTORE] Failed to save style, falling back to LocalStorage:", err);
    const id = `style_${Date.now()}`;
    const compressedFrames = await compressFramesForLocalStorage(style.generatedFrames);
    const newStyle: AI180GeneratedStyle = { id, ...style, generatedFrames: compressedFrames };
    
    try {
      const localStyles = JSON.parse(localStorage.getItem(LOCAL_STYLES_KEY) || "[]");
      localStorage.setItem(LOCAL_STYLES_KEY, JSON.stringify([newStyle, ...localStyles]));
    } catch (e) {
      console.error("[LOCAL STORAGE] Fallback write style failed:", e);
    }
    return id;
  }
};

export const getAI180StylesForScan = async (
  uid: string,
  scanId: string
): Promise<AI180GeneratedStyle[]> => {
  const localStyles: AI180GeneratedStyle[] = JSON.parse(localStorage.getItem(LOCAL_STYLES_KEY) || "[]");
  const filteredLocal = localStyles.filter(s => s && s.scanId === scanId);

  if (uid === "guest_user_local" || !uid) {
    return filteredLocal;
  }

  try {
    const stylesRef = collection(db, "users", uid, "ai180_styles");
    const q = query(stylesRef, where("scanId", "==", scanId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const dbStyles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AI180GeneratedStyle));
    return [...dbStyles, ...filteredLocal];
  } catch (err) {
    console.warn("[FIRESTORE] Failed to fetch styles, returning local styles:", err);
    return filteredLocal;
  }
};
