import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { AI180Scan, AI180GeneratedStyle } from "../types";

export const saveAI180Scan = async (uid: string, scan: Omit<AI180Scan, 'id'>): Promise<string> => {
  const scansRef = collection(db, "users", uid, "ai180_scans");
  const docRef = await addDoc(scansRef, {
    ...scan,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const getAI180Scans = async (uid: string): Promise<AI180Scan[]> => {
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
  const stylesRef = collection(db, "users", uid, "ai180_styles");
  const q = query(stylesRef, where("scanId", "==", scanId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AI180GeneratedStyle));
};
