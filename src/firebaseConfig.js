import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyDL1ljl1bx4Ai6Sk5zLyd9NponuB2VGDqM",
  authDomain: "outcode2-8c0de.firebaseapp.com",
  projectId: "outcode2-8c0de",
  storageBucket: "outcode2-8c0de.firebasestorage.app",
  messagingSenderId: "833131010566",
  appId: "1:833131010566:web:2500af8abbdab7d46cc187",
  measurementId: "G-D9DMRL3ZY9"
  //old 
  // apiKey: "AIzaSyBYPt5p_M8iJ_bU4cqx6ZatZayc2jYyQwY",
 // authDomain: "outcode-6f11f.firebaseapp.com",
 // projectId: "outcode-6f11f",
 // storageBucket: "outcode-6f11f.firebasestorage.app",
 // messagingSenderId: "997744893520",
 // appId: "1:997744893520:web:e82adf7a939607c09efb55",
 // measurementId: "G-JCG13V5F0H"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;