// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { provideAuth, getAuth } from "@angular/fire/auth";
import { provideFirestore, getFirestore } from "@angular/fire/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
/*const firebaseConfig = {
  apiKey: "AIzaSyC84q1kd2BrLtm9buqdS7GORrnhKSI5h0Y",
  authDomain: "easy-freelance-ionic.firebaseapp.com",
  projectId: "easy-freelance-ionic",
    storageBucket: "easy-freelance-ionic.appspot.com", // ✅ corrige l'URL
  messagingSenderId: "332393219455",
  appId: "1:332393219455:web:c04093268ddb1b61b7c64a",
  measurementId: "G-YLVES67B6B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const environment = {
  production: false,
  firebaseConfig 
};*/
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyC84q1kd2BrLtm9buqdS7GORrnhKSI5h0Y",
    authDomain: "easy-freelance-ionic.firebaseapp.com",
    projectId: "easy-freelance-ionic",
    storageBucket: "easy-freelance-ionic.appspot.com",
    messagingSenderId: "332393219455",
    appId: "1:332393219455:web:c04093268ddb1b61b7c64a",
    measurementId: "G-YLVES67B6B"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
