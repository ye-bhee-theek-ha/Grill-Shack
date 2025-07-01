// // src/lib/firebase/firebaseAdmin.ts - Enhanced DEBUGGING for firebase deploy build
// import admin from "firebase-admin";
// import { App, initializeApp } from "firebase-admin/app"; // Correct import for initializeApp

// //console.log(`[firebaseAdmin-BUILD-DEBUG] Module loading. SDK Version: ${admin.SDK_VERSION}. Initial admin.apps.length: ${admin.apps.length > 0 ? admin.apps.map(a=>a?.name).join(',') : '0'}`);

// let app: App | undefined = undefined;
// // Use a dynamic app name suffix to truly ensure it's unique per execution if module is re-evaluated
// const appSuffix = Date.now() + "-" + Math.random().toString(36).substring(2, 7);
// const ADMIN_APP_NAME = `my-fb-deploy-app-${appSuffix}`;

// try {
//   //console.log(`[firebaseAdmin-BUILD-DEBUG] Attempting to initialize app: ${ADMIN_APP_NAME}`);
//   const serviceAccountEnvJson = process.env.GRILL_SHACK_ADMIN_SDK_JSON;

//   if (
//     !serviceAccountEnvJson ||
//     serviceAccountEnvJson.trim() === "" ||
//     serviceAccountEnvJson.trim() === "{}"
//   ) {
//     console.error(
//       `[firebaseAdmin-BUILD-DEBUG] CRITICAL for ${ADMIN_APP_NAME}: GRILL_SHACK_ADMIN_SDK_JSON is not set or is empty.`
//     );
//     throw new Error(
//       `GRILL_SHACK_ADMIN_SDK_JSON is required for ${ADMIN_APP_NAME}.`
//     );
//   }

//   const serviceAccount = JSON.parse(serviceAccountEnvJson);

//   const appConfig = {
//     credential: admin.credential.cert(serviceAccount),
//   };
//   app = initializeApp(appConfig, ADMIN_APP_NAME);

//   //console.log(`[firebaseAdmin-BUILD-DEBUG] App ${app.name} initialized.`);
//   //console.log(`[firebaseAdmin-BUILD-DEBUG] App ${app.name} options:`, JSON.stringify(app.options, null, 2));
//   //console.log(`[firebaseAdmin-BUILD-DEBUG] App ${app.name} object keys: ${Object.keys(app).join(', ')}`);
//   //console.log(`[firebaseAdmin-BUILD-DEBUG] admin.apps.length after init for ${app.name}: ${admin.apps.length}. Apps: ${admin.apps.map(a=>a?.name).join(',')}`);
//   const foundApp = admin.apps.find((a) => a?.name === ADMIN_APP_NAME);
//   //console.log(`[firebaseAdmin-BUILD-DEBUG] Is ${app.name} in admin.apps by find? ${!!foundApp}. Is it the same object? ${foundApp === app}`);

//   //console.log(`[firebaseAdmin-BUILD-DEBUG] For ${app.name}, attempting to get Firestore service using admin.firestore(app)...`);
//   const _adminDb = admin.firestore(app);
//   //console.log(`[firebaseAdmin-BUILD-DEBUG] Firestore service obtained for ${app.name}.`);

//   //console.log(`[firebaseAdmin-BUILD-DEBUG] For ${app.name}, attempting to get Auth service using admin.auth(app)...`);
//   const _adminAuth = admin.auth(app);
//   //console.log(`[firebaseAdmin-BUILD-DEBUG] Auth service obtained for ${app.name}.`);

//   // Make services available for export
//   (global as any)[`${ADMIN_APP_NAME}_db`] = _adminDb;
//   (global as any)[`${ADMIN_APP_NAME}_auth`] = _adminAuth;
// } catch (e: any) {
//   console.error(
//     `[firebaseAdmin-BUILD-DEBUG] CRITICAL ERROR for ${ADMIN_APP_NAME}:`,
//     e.constructor.name,
//     e.message
//   );
//   if (typeof app !== "undefined" && app && app.name) {
//     console.error(
//       `[firebaseAdmin-BUILD-DEBUG] App object state at error for <span class="math-inline">\{ADMIN\_APP\_NAME\}\: name\=</span>{app.name}`
//     );
//   } else {
//     console.error(
//       `[firebaseAdmin-BUILD-DEBUG] App object for ${ADMIN_APP_NAME} was not successfully initialized or available at point of error.`
//     );
//   }
//   console.error(
//     `[firebaseAdmin-BUILD-DEBUG] For ${ADMIN_APP_NAME}, typeof admin.firestore: ${typeof admin.firestore}`
//   );
//   console.error(
//     `[firebaseAdmin-BUILD-DEBUG] For ${ADMIN_APP_NAME}, typeof admin.auth: ${typeof admin.auth}`
//   );
//   console.error(
//     `[firebaseAdmin-BUILD-DEBUG] Error Stack for ${ADMIN_APP_NAME}:`,
//     e.stack
//   );
//   throw e;
// }

// // Adjust exports if this module is imported multiple times and relied upon for singleton services.
// // This current export method will be problematic with dynamic app names if trying to get a specific instance later.
// // For debugging, this is okay. For production, you need a deterministic way to get your services.
// export const adminDb = (global as any)[`${ADMIN_APP_NAME}_db`];
// export const adminAuth = (global as admin)[`${ADMIN_APP_NAME}_auth`];
// export default admin;

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
