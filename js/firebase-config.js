// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDtyJOEYKBfOHfIVuJVlZcONg4kn56EK7E",
    authDomain: "deliveryweb-9b674.firebaseapp.com",
    databaseURL: "https://deliveryweb-9b674-default-rtdb.firebaseio.com",
    projectId: "deliveryweb-9b674",
    storageBucket: "deliveryweb-9b674.firebasestorage.app",
    messagingSenderId: "207216653138",
    appId: "1:207216653138:web:272fe92f54eab2329c408b",
    measurementId: "G-5MT4FQY0YT"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
