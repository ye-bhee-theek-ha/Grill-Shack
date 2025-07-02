// src/lib/firebase/firebaseAdmin.ts

import admin from "firebase-admin";
import { App, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountJson = process.env.GRILL_SHACK_ADMIN_SDK_JSON;

if (!serviceAccountJson) {
  throw new Error(
    "CRITICAL: The GRILL_SHACK_ADMIN_SDK_JSON environment variable is not set."
  );
}

// try {
//   console.log(
//     "DEBUG INFO =======================<><><><>===================== \n",
//     JSON.parse(serviceAccountJson)
//   );
// } catch (error: any) {
//   throw new Error(
//     `Failed to parse GRILL_SHACK_ADMIN_SDK_JSON: ${error.message}`
//   );
// }

// Check if the default app is already initialized
const app: App = getApps().length
  ? getApp()
  : initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    });

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
export default admin;

export { app, adminDb, adminAuth };
