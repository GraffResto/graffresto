import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

// The committed fallbacks belong to an old project whose API key is no longer
// valid, so real values must come from .env.local (see .env.example).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAzUvKqGcwnvCv0_41SbPjjY51mLAXrVdU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "restuarant-14839.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "restuarant-14839",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "restuarant-14839.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "515577537730",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:515577537730:web:f1eb717ac14e5c4b1e075b",
};

export const isUsingFallbackFirebaseConfig = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (isUsingFallbackFirebaseConfig && typeof window !== "undefined") {
  console.warn(
    "[DineFlow] NEXT_PUBLIC_FIREBASE_API_KEY is not set, so the built-in fallback " +
      "config is being used. That project's key is no longer valid, so sign-in and " +
      "registration will fail. Copy .env.example to .env.local and fill in your own " +
      "Firebase web config."
  );
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  db,
  googleProvider,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
};

export function formatAuthError(error: any, fallbackMessage: string = "Operation failed"): string {
  const code = error?.code;
  if (code === "auth/email-already-in-use") {
    return "This email is already registered. Please sign in instead.";
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Incorrect email or password. Please check your credentials.";
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in popup was closed before completion.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection and try again.";
  }
  if (code === "auth/requires-recent-login") {
    return "For security, please sign in again before changing this.";
  }
  // Configuration problems, not user mistakes — say so plainly instead of
  // letting them read as "wrong password".
  if (typeof code === "string" && code.startsWith("auth/api-key-not-valid")) {
    return "This app is not connected to Firebase yet. Add your Firebase web config to .env.local (see .env.example).";
  }
  if (code === "auth/configuration-not-found" || code === "auth/invalid-api-key") {
    return "Firebase is misconfigured for this site. Check the API key and Authorized domains in the Firebase console.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain is not in the Firebase Authentication authorized domains list.";
  }
  if (code === "auth/popup-blocked") {
    return "Your browser blocked the Google sign-in popup. Allow popups for this site and try again.";
  }
  if (code === "auth/operation-not-allowed") {
    return "This sign-in method is disabled. Enable it in Firebase Authentication settings.";
  }

  // Strip Firebase's prefix and the internal error code it appends in brackets
  const message = error?.message
    ?.replace(/^Firebase:\s*/, "")
    ?.replace(/\s*\(auth\/[^)]+\)\.?$/, "");

  return message || fallbackMessage;
}

export type UserRole = "customer" | "partner" | "admin";
export type PartnerStatus = "pending" | "approved" | "rejected";

export type UserProfile = {
  uid: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  partner_status?: PartnerStatus;
  created_at?: string | number;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, "profiles", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function createUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const profileRef = doc(db, "profiles", uid);
  const role = data.role || "customer";

  const profileData: UserProfile = {
    uid,
    email: data.email || "",
    full_name: data.full_name || "User",
    phone: data.phone || "",
    role,
    created_at: new Date().toISOString(),
  };

  if (role === "partner") {
    profileData.partner_status = data.partner_status || "pending";
  } else if (data.partner_status) {
    profileData.partner_status = data.partner_status;
  }

  await setDoc(profileRef, profileData, { merge: true });
  return profileData;
}
