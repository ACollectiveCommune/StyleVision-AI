import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithCredential,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  deleteUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Check if Firebase keys are provided
export const isFirebaseEnabled = !!firebaseConfig.apiKey;

let app: any = null;
export let auth: any = null;
export let db: any = null;
export let storage: any = null;

// Mock local database state when Firebase is not configured
let mockCurrentUser: any = null;
const mockAuthListeners: Array<(user: any) => void> = [];

if (isFirebaseEnabled) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.error("Firebase failed to initialize:", err);
  }
} else {
  console.warn("StyleVision AI: Firebase credentials missing. Running in Local Demo Mode (using localStorage).");
}

// Active auth listeners
const activeAuthListeners: Array<(user: any) => void> = [];

// Authentication Listeners Wrapper
export const onAuthStateChanged = (authInstance: any, callback: (user: any) => void) => {
  activeAuthListeners.push(callback);
  
  // Trigger immediately with current user state
  callback(mockCurrentUser);

  let unsubscribeFirebase: any = null;
  if (isFirebaseEnabled && authInstance) {
    try {
      unsubscribeFirebase = firebaseOnAuthStateChanged(authInstance, (firebaseUser) => {
        // If there's an actual Firebase user, or if Firebase user is null and we are not in guest mode
        if (firebaseUser || !mockCurrentUser || !mockCurrentUser.isAnonymous) {
          mockCurrentUser = firebaseUser;
          callback(firebaseUser);
        }
      });
    } catch (e) {
      console.error("firebaseOnAuthStateChanged failed:", e);
    }
  }

  return () => {
    const idx = activeAuthListeners.indexOf(callback);
    if (idx > -1) activeAuthListeners.splice(idx, 1);
    if (unsubscribeFirebase) unsubscribeFirebase();
  };
};

const notifyAuthChange = (user: any) => {
  mockCurrentUser = user;
  activeAuthListeners.forEach(listener => listener(user));
};

// Login methods
export const signInAnonymously = async (authInstance: any) => {
  // Always use local guest mode (instant login, avoids console config issues)
  const guestUser = {
    uid: "guest_user_local",
    email: "guest@stylevision.ai",
    displayName: "Guest User",
    isAnonymous: true
  };
  notifyAuthChange(guestUser);
  return { user: guestUser };
};

export const loginWithGoogle = async () => {
  if (isFirebaseEnabled) {
    if (Capacitor.isNativePlatform()) {
      try {
        // Clear any stale native session from keychain to prevent "ID Token expired" issues
        await FirebaseAuthentication.signOut();
      } catch (e) {}
      const result = await FirebaseAuthentication.signInWithGoogle({});
      if (result.credential) {
        const credential = GoogleAuthProvider.credential(
          result.credential.idToken,
          result.credential.accessToken
        );
        return await signInWithCredential(auth, credential);
      }
      throw new Error("Native Google Sign In failed.");
    } else {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    }
  } else {
    // Mock Google User
    const googleUser = {
      uid: "google_mock_user",
      email: "google.user@gmail.com",
      displayName: "Google User",
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100",
      isAnonymous: false
    };
    notifyAuthChange(googleUser);
    return { user: googleUser };
  }
};

export const loginWithApple = async () => {
  if (isFirebaseEnabled) {
    if (Capacitor.isNativePlatform()) {
      try {
        // Clear any stale native session from keychain
        await FirebaseAuthentication.signOut();
      } catch (e) {}
      const result = await FirebaseAuthentication.signInWithApple({});
      if (result.credential) {
        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({
          idToken: result.credential.idToken,
          rawNonce: result.credential.nonce
        });
        return await signInWithCredential(auth, credential);
      }
      throw new Error("Native Apple Sign In failed.");
    } else {
      const provider = new OAuthProvider('apple.com');
      return await signInWithPopup(auth, provider);
    }
  } else {
    // Mock Apple User
    const appleUser = {
      uid: "apple_mock_user",
      email: "apple.user@icloud.com",
      displayName: "Apple User",
      isAnonymous: false
    };
    notifyAuthChange(appleUser);
    return { user: appleUser };
  }
};

export const logout = async () => {
  if (isFirebaseEnabled) {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      }
      await signOut(auth);
    } catch (e) {
      console.error("Firebase signOut failed:", e);
    }
  }
  notifyAuthChange(null);
};

/**
 * Deletes the currently authenticated user's profile, favorites, and auth credential.
 */
export const deleteUserAccount = async (): Promise<void> => {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user found.");
  }
  
  const uid = currentUser.uid;

  // 1. Delete user profile record in Firestore
  if (db) {
    try {
      await deleteDoc(doc(db, "users", uid));
      console.log(`[FIREBASE] Wiped user profile document for: ${uid}`);
    } catch (e) {
      console.error("[FIREBASE] Error deleting user profile doc:", e);
    }

    // 2. Delete user's saved favorites
    try {
      const favoritesRef = collection(db, "favorites");
      const q = query(favoritesRef, where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`[FIREBASE] Wiped ${deletePromises.length} favorites for user: ${uid}`);
    } catch (e) {
      console.error("[FIREBASE] Error deleting user favorites:", e);
    }
  }

  // 3. Delete user credentials from Firebase Auth
  await deleteUser(currentUser);
  console.log("[FIREBASE] Authentication record successfully deleted.");
  notifyAuthChange(null);
};

// Storage Helpers (Uploader)
export const uploadImageToStorage = async (
  uid: string, 
  base64DataUrl: string, 
  type: 'original' | 'generated'
): Promise<string> => {
  if (isFirebaseEnabled) {
    const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid image format for upload");
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `users/${uid}/images/${Date.now()}_${type}.${extension}`;
    const storageRef = ref(storage, filename);
    await uploadString(storageRef, base64Data, 'base64', { contentType: mimeType });
    return await getDownloadURL(storageRef);
  } else {
    // Return the base64 URL directly in local mode (stored in LocalStorage)
    return base64DataUrl;
  }
};

// LocalStorage helpers for local mode
const getLocalHistory = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('stylevision_history') || '[]');
  } catch {
    return [];
  }
};

const saveLocalHistory = (history: any[]) => {
  localStorage.setItem('stylevision_history', JSON.stringify(history));
};

export interface SavedGeneration {
  id?: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  hairStyle: string;
  hairColor: string;
  beardStyle: string;
  beardColor: string;
  gender: string;
  timestamp?: any;
  isFavorite: boolean;
}

// Database Helpers
export const saveGeneration = async (
  uid: string, 
  generation: Omit<SavedGeneration, 'id' | 'timestamp'>
): Promise<string> => {
  if (isFirebaseEnabled) {
    const historyRef = collection(db, 'users', uid, 'history');
    const docRef = await addDoc(historyRef, {
      ...generation,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } else {
    const id = `local_gen_${Date.now()}`;
    const newGen: SavedGeneration = {
      ...generation,
      id,
      timestamp: new Date().toISOString()
    };
    const history = getLocalHistory();
    history.unshift(newGen);
    saveLocalHistory(history);
    return id;
  }
};

export const toggleFavorite = async (
  uid: string, 
  docId: string, 
  isFavorite: boolean
): Promise<void> => {
  if (isFirebaseEnabled) {
    const docRef = doc(db, 'users', uid, 'history', docId);
    await updateDoc(docRef, { isFavorite });
  } else {
    const history = getLocalHistory();
    const item = history.find(i => i.id === docId);
    if (item) {
      item.isFavorite = isFavorite;
      saveLocalHistory(history);
    }
  }
};

export const deleteGeneration = async (
  uid: string, 
  docId: string
): Promise<void> => {
  if (isFirebaseEnabled) {
    const docRef = doc(db, 'users', uid, 'history', docId);
    await deleteDoc(docRef);
  } else {
    let history = getLocalHistory();
    history = history.filter(i => i.id !== docId);
    saveLocalHistory(history);
  }
};

export const fetchUserHistory = async (uid: string): Promise<SavedGeneration[]> => {
  if (isFirebaseEnabled) {
    const historyRef = collection(db, 'users', uid, 'history');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    const results: SavedGeneration[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        originalImageUrl: data.originalImageUrl,
        generatedImageUrl: data.generatedImageUrl,
        hairStyle: data.hairStyle,
        hairColor: data.hairColor,
        beardStyle: data.beardStyle,
        beardColor: data.beardColor,
        gender: data.gender,
        timestamp: data.timestamp,
        isFavorite: !!data.isFavorite
      });
    });
    return results;
  } else {
    return getLocalHistory();
  }
};

export const fetchUserFavorites = async (uid: string): Promise<SavedGeneration[]> => {
  if (isFirebaseEnabled) {
    const historyRef = collection(db, 'users', uid, 'history');
    const q = query(historyRef, where('isFavorite', '==', true), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    const results: SavedGeneration[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        originalImageUrl: data.originalImageUrl,
        generatedImageUrl: data.generatedImageUrl,
        hairStyle: data.hairStyle,
        hairColor: data.hairColor,
        beardStyle: data.beardStyle,
        beardColor: data.beardColor,
        gender: data.gender,
        timestamp: data.timestamp,
        isFavorite: true
      });
    });
    return results;
  } else {
    return getLocalHistory().filter(i => i.isFavorite);
  }
};
