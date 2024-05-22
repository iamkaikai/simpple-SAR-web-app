// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, GeoPoint } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_authDomain,
  projectId: process.env.REACT_APP_FIREBASE_projectId,
  storageBucket: process.env.REACT_APP_FIREBASE_storageBucket,
  messagingSenderId: process.env.REACT_APP_FIREBASE_messagingSenderId,
  appId: process.env.REACT_APP_FIREBASE_appId,
  measurementId: process.env.REACT_APP_FIREBASE_measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const firestore = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export { firestore, GeoPoint, auth, googleProvider };