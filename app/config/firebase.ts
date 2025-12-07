// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMLx8ANCI6nztx3KKxbXvOUO9gaJE0X38",
  authDomain: "cancerdet-50115.firebaseapp.com",
  projectId: "cancerdet-50115",
  storageBucket: "cancerdet-50115.firebasestorage.app",
  messagingSenderId: "390219918764",
  appId: "1:390219918764:web:f0c6e9daef7c364a531e09",
  measurementId: "G-TFLG06QXGJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);
// const analytics = getAnalytics(app);