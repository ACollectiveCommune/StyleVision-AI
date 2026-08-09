import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { AI180Scan, AI180GeneratedStyle } from "../types";

// Local storage keys for guest/local fallback mode
const LOCAL_SCANS_KEY = "stylevision_ai180_scans";
const LOCAL_STYLES_KEY = "stylevision_ai180_styles";

export const saveAI180Scan = async (uid: string, scan: Omit<AI180Scan, 'id'>): Promise<string> => {
  if (uid === "guest_user_local" || !uid) {
    const id = `scan_${Date.now()}`;
    const newScan: AI180Scan = { id, ...scan };
    const localScans = JSON.parse(localStorage.getItem(LOCAL_SCANS_KEY) || "[]");
    localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify([newScan, ...localScans]));
    return id;
  }

  const scansRef = collection(db, "users", uid, "ai180_scans");
  const docRef = await addDoc(scansRef, {
    ...scan,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getAI180Scans = async (uid: string): Promise<AI180Scan[]> => {
  if (uid === "guest_user_local" || !uid) {
    return JSON.parse(localStorage.getItem(LOCAL_SCANS_KEY) || "[]");
  }

  const scansRef = collection(db, "users", uid, "ai180_scans");
  const q = query(scansRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AI180Scan));
};

export const saveAI180Style = async (
  uid: string,
  style: Omit<AI180GeneratedStyle, 'id'>
): Promise<string> => {
  if (uid === "guest_user_local" || !uid) {
    const id = `style_${Date.now()}`;
    const newStyle: AI180GeneratedStyle = { id, ...style };
    const localStyles = JSON.parse(localStorage.getItem(LOCAL_STYLES_KEY) || "[]");
    localStorage.setItem(LOCAL_STYLES_KEY, JSON.stringify([newStyle, ...localStyles]));
    return id;
  }

  const stylesRef = collection(db, "users", uid, "ai180_styles");
  const docRef = await addDoc(stylesRef, {
    ...style,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getAI180StylesForScan = async (
  uid: string,
  scanId: string
): Promise<AI180GeneratedStyle[]> => {
  if (uid === "guest_user_local" || !uid) {
    const localStyles: AI180GeneratedStyle[] = JSON.parse(localStorage.getItem(LOCAL_STYLES_KEY) || "[]");
    return localStyles.filter(s => s.scanId === scanId);
  }

  const stylesRef = collection(db, "users", uid, "ai180_styles");
  const q = query(stylesRef, where("scanId", "==", scanId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AI180GeneratedStyle));
};
