import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyBYPt5p_M8iJ_bU4cqx6ZatZayc2jYyQwY",
  authDomain: "outcode-6f11f.firebaseapp.com",
  projectId: "outcode-6f11f",
  storageBucket: "outcode-6f11f.firebasestorage.app",
  messagingSenderId: "997744893520",
  appId: "1:997744893520:web:e82adf7a939607c09efb55",
  measurementId: "G-JCG13V5F0H"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;