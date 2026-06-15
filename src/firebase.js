import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSYujFpGeSIIr3C4qdNxwDfTWQccHP354",
  authDomain: "yonuncanunca-d7b70.firebaseapp.com",
  projectId: "yonuncanunca-d7b70",
  storageBucket: "yonuncanunca-d7b70.firebasestorage.app",
  messagingSenderId: "254556611828",
  appId: "1:254556611828:web:983e9218f5634c4ddaeaa1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
