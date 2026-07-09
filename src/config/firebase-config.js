import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasRequiredConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const firebaseEnabled = hasRequiredConfig;

if (!hasRequiredConfig) {
  console.warn(
    "[Firebase] Firebase configuration is incomplete. " +
    "Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, " +
    "and VITE_FIREBASE_APP_ID in your environment variables."
  );
}

let app = null;
let auth = null;
let firestore = null;
let googleProvider = null;
let analytics = null;

if (hasRequiredConfig) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  firestore = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });

  setPersistence(auth, browserLocalPersistence).catch(() => {});

  function isLocalHost() {
    if (typeof window === "undefined") return true;
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  }

  if (typeof window !== "undefined" && !isLocalHost()) {
    isSupported().then((supported) => {
      if (supported) analytics = getAnalytics(app);
    }).catch(() => {});
  }
} else {
  auth = {
    onAuthStateChanged: () => () => {},
    signOut: () => Promise.resolve(),
    currentUser: null,
  };
}

export { analytics, app, auth, firestore, googleProvider };