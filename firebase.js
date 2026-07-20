// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";


// Firebase Authentication
import { 
    getAuth,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


// Firebase Firestore Database
import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";



// Firebase Configuration

const firebaseConfig = {

    apiKey: "AIzaSyCjh59PQ4z4tfZNBiSSl3e6YftSaxeFWEE",

    authDomain: "part-entry.firebaseapp.com",

    projectId: "part-entry",

    storageBucket: "part-entry.firebasestorage.app",

    messagingSenderId: "29337296790",

    appId: "1:29337296790:web:8f54ecdf96fd86936807b7"

};




// Initialize Firebase

const app = initializeApp(firebaseConfig);



// Export Services

export const auth = getAuth(app);


export const provider = new GoogleAuthProvider();


export const db = getFirestore(app);



// Google Account Select করলে আগের Account সমস্যা কম হবে

provider.setCustomParameters({

    prompt: "select_account"

});