// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATy8JKaqtIWBA_VELdjAIIIp_7lhnodyU",
  authDomain: "expense-tracker-84b7a.firebaseapp.com",
  projectId: "expense-tracker-84b7a",
  storageBucket: "expense-tracker-84b7a.firebasestorage.app",
  messagingSenderId: "1079413770908",
  appId: "1:1079413770908:web:86df4b7867787281a13b59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const firestore = getFirestore(app);