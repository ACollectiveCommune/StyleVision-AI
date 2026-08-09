import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { AI180Scan, AI180GeneratedStyle } from "../types";

// Local storage keys for guest/local fallback mode
const LOCAL_SCANS_KEY = "stylevision_ai180_scans";
const LOCAL_STYLES_KEY = "stylevision_ai180_styles";

export const saveAI180Scan = async (uid: string, scan: Omit<AI180Scan, 'id'>): Promise<string> => {
  const containsBase64 = scan.sourceFrames.some(url => url.startsWith('data:'));
  
  if (uid === "guest_user_local" || !uid || containsBase64) {
    const id = `scan_${Date.now()}`;
    const newScan: AI180Scan = { id, ...scan };
    const localScans = JSON.parse(localStorage.getItem(LOCAL_SCANS_KEY) || "[]");
    localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify([newScan, ...localScans]));
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
    const newScan: AI180Scan = { id, ...scan };
    const localScans = JSON.parse(localStorage.getItem(LOCAL_SCANS_KEY) || "[]");
    localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify([newScan, ...localScans]));
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
    // Merge database scans with local ones
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
  const containsBase64 = style.generatedFrames.some(url => url.startsWith('data:'));

  if (uid === "guest_user_local" || !uid || containsBase64) {
    const id = `style_${Date.now()}`;
    const newStyle: AI180GeneratedStyle = { id, ...style };
    const localStyles = JSON.parse(localStorage.getItem(LOCAL_STYLES_KEY) || "[]");
    localStorage.setItem(LOCAL_STYLES_KEY, JSON.stringify([newStyle, ...localStyles]));
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
    const newStyle: AI180GeneratedStyle = { id, ...style };
    const localStyles = JSON.parse(localStorage.getItem(LOCAL_STYLES_KEY) || "[]");
    localStorage.setItem(LOCAL_STYLES_KEY, JSON.stringify([newStyle, ...localStyles]));
    return id;
  }
};

export const getAI180StylesForScan = async (
  uid: string,
  scanId: string
): Promise<AI180GeneratedStyle[]> => {
  const localStyles: AI180GeneratedStyle[] = JSON.parse(localStorage.getItem(LOCAL_STYLES_KEY) || "[]");
  const filteredLocal = localStyles.filter(s => s.scanId === scanId);

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
