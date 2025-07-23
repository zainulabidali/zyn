// firebase.js (save this in your project root)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYSZhyh8blGbMDNOD2BVn2MUCbe8dxD08",
  authDomain: "shuhaib-3d4ce.firebaseapp.com",
  databaseURL: "https://shuhaib-3d4ce-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shuhaib-3d4ce",
  storageBucket: "shuhaib-3d4ce.firebasestorage.app",
  messagingSenderId: "298650864743",
  appId: "1:298650864743:web:8346e9fd976a40812b58c2",
  measurementId: "G-02J9DX3WZD"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, child };
