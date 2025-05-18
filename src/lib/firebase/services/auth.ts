//src/lib/firebase/services/auth.ts


import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  linkWithCredential,
  User,
  deleteUser,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../ClientApp';
import { doc, setDoc, getDoc, arrayUnion, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../ClientApp';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

// Create a new user with email and password
export const createUser = async (email: string, password: string, displayName: string, phoneNumber: string) => {
  console.log("Creating user with email:", email, "and displayName:", displayName);
  try {
    // Check if phone number already exists
    const isPhoneUsed = await isPhoneNumberInUse(phoneNumber);
    if (isPhoneUsed) {
      throw new Error("This phone number is already registered with another account");
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    // Store initial user data
    await updateUserProfile(userCredential.user.uid, { 
      email, 
      displayName, 
      phoneNumber,
      phoneVerified: false, // Initially not verified
      createdAt: new Date(),
      loyaltyPoints: 0,
      role: 'customer',
      addresses: []
    });
    
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Check if phone number is already in use
export const isPhoneNumberInUse = async (phoneNumber: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber), where("phoneVerified", "==", true));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking if phone number is in use:", error);
    throw error;
  }
};


let lastKnownVerifier: RecaptchaVerifier | null = null;
let lastKnownWidgetId: number | null = null; // To store the widget ID for grecaptcha.reset

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container'; // Define static ID

/**
 * Clears any existing reCAPTCHA verifier instance and resets the reCAPTCHA widget.
 * Also clears the HTML content of the reCAPTCHA container.
 */
export const cleanupRecaptchaResources = () => {
  console.log("cleanupRecaptchaResources: Attempting to clear global reCAPTCHA state...");

  if (lastKnownVerifier) {
      try {
          lastKnownVerifier.clear();
          console.log("cleanupRecaptchaResources: Last known RecaptchaVerifier instance cleared.");
      } catch (e) {
          console.error("cleanupRecaptchaResources: Error clearing last known RecaptchaVerifier instance:", e);
      }
      lastKnownVerifier = null;
  }

  // Attempt to reset the reCAPTCHA widget using grecaptcha if its API is available and a widget ID was stored
  if (typeof grecaptcha !== 'undefined' && grecaptcha && grecaptcha.reset && lastKnownWidgetId !== null) {
      try {
          grecaptcha.reset(lastKnownWidgetId);
          console.log("cleanupRecaptchaResources: Last known grecaptcha widget reset.");
      } catch (e) {
          console.error("cleanupRecaptchaResources: Error resetting last known grecaptcha widget:", e);
      }
      lastKnownWidgetId = null;
  }

  const recaptchaContainer = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (recaptchaContainer) {
      recaptchaContainer.innerHTML = ''; // Clear the container's HTML content
      console.log(`cleanupRecaptchaResources: Container '${RECAPTCHA_CONTAINER_ID}' HTML cleared.`);
  }
};

export const sendVerificationCode = async (phoneNumber: string): Promise<ConfirmationResult> => {
  console.log("sendVerificationCode: Attempting for phone number:", phoneNumber);

  // ** Call comprehensive cleanup at the very beginning of each attempt **
  // This ensures that any state from previous attempts (including those from StrictMode or HMR)
  // is thoroughly cleared before trying to initialize a new reCAPTCHA.
  cleanupRecaptchaResources();

  const recaptchaContainer = document.getElementById(RECAPTCHA_CONTAINER_ID);
  if (!recaptchaContainer) {
      const errorMessage = `HTML element with ID '${RECAPTCHA_CONTAINER_ID}' not found. Please add <div id="${RECAPTCHA_CONTAINER_ID}"></div> to your component.`;
      console.error(`sendVerificationCode: ${errorMessage}`);
      throw new Error(errorMessage);
  }
  // At this point, cleanupRecaptchaResources should have already cleared innerHTML,
  // but an explicit clear here ensures it if cleanupRecaptchaResources had issues.
  recaptchaContainer.innerHTML = '';
  console.log(`sendVerificationCode: Container '${RECAPTCHA_CONTAINER_ID}' HTML re-cleared for new attempt.`);


  // Create and manage RecaptchaVerifier instance locally for this specific attempt.
  let localRecaptchaVerifier: RecaptchaVerifier | null = null;
  let localRecaptchaWidgetId: number | null = null;

  try {
      console.log(`sendVerificationCode: Initializing new RecaptchaVerifier (local instance) on element ID: '${RECAPTCHA_CONTAINER_ID}'`);
      localRecaptchaVerifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
          'size': 'invisible',
          'callback': (response: string) => {
              console.log("sendVerificationCode: reCAPTCHA solved (local instance callback). Token:", response ? "obtained" : "not obtained");
          },
          'expired-callback': () => {
              console.warn("sendVerificationCode: reCAPTCHA (local instance) response expired. User may need to try again.");
              if (localRecaptchaVerifier) {
                  localRecaptchaVerifier.clear(); // Clear the specific instance
              }
              if (recaptchaContainer) {
                  recaptchaContainer.innerHTML = '';
              }
              // If this expired instance was also the last known global one, clear global state fully.
              if (localRecaptchaVerifier === lastKnownVerifier) {
                  cleanupRecaptchaResources(); // Call full cleanup
              }
          }
      });

      localRecaptchaWidgetId = await localRecaptchaVerifier.render();
      console.log("sendVerificationCode: reCAPTCHA (local instance) rendered successfully. Widget ID:", localRecaptchaWidgetId);

      // Update module-level trackers *after* successful render.
      lastKnownVerifier = localRecaptchaVerifier;
      lastKnownWidgetId = localRecaptchaWidgetId;

      console.log("sendVerificationCode: Calling signInWithPhoneNumber with the localRecaptchaVerifier...");
      const confirmationResult = await signInWithPhoneNumber(auth, "+923234232402", localRecaptchaVerifier);
      console.log("sendVerificationCode: signInWithPhoneNumber call successful. Verification code sent to:", phoneNumber);

      return confirmationResult;

  } catch (error: any) {
      console.error("sendVerificationCode: Error during the process.", error);
      if (error.code) {
          console.error("sendVerificationCode: Firebase Error Code:", error.code);
      }

      // --- Cleanup on error ---
      if (localRecaptchaVerifier) {
          try {
              localRecaptchaVerifier.clear();
              console.log("sendVerificationCode: Local reCAPTCHA instance cleared on error.");
          } catch (e) {
              console.error("sendVerificationCode: Error clearing local reCAPTCHA instance on error:", e);
          }
      }
      if (typeof grecaptcha !== 'undefined' && grecaptcha && grecaptcha.reset && localRecaptchaWidgetId !== null) {
          try {
              grecaptcha.reset(localRecaptchaWidgetId);
              console.log("sendVerificationCode: Local grecaptcha widget reset on error for widget ID:", localRecaptchaWidgetId);
          } catch (e) {
              console.error("sendVerificationCode: Error resetting local grecaptcha widget on error:", e);
          }
      }
      if (recaptchaContainer) {
          recaptchaContainer.innerHTML = '';
      }
      if (lastKnownVerifier === localRecaptchaVerifier) { // If this failed instance was being tracked globally
          lastKnownVerifier = null;
      }
      if (lastKnownWidgetId === localRecaptchaWidgetId) { // If this failed instance's widget ID was being tracked globally
          lastKnownWidgetId = null;
      }
      // --- End Cleanup on error ---

      let userMessage = `Failed to send verification code. ${error.message || "An unknown error occurred."}`;
      if (error.code === 'auth/too-many-requests') {
          userMessage = "Too many attempts have been made with this phone number. Please try again later.";
      } else if (error.code === 'auth/invalid-phone-number') {
          userMessage = "The phone number is not valid. Please check and try again.";
      } else if (error.message && (error.message.includes("Error code: 39") || (error.code && error.code.includes("-39")) ) ) {
          userMessage = "Could not send verification code due to a configuration issue. Please try again later. (Error code: 39)";
      } else if (error.message && error.message.includes("reCAPTCHA has already been rendered")) {
          userMessage = "Could not initialize verification. Please try again. (reCAPTCHA render issue)";
      }
      throw new Error(userMessage);
  }
};

// This function is effectively replaced by clearExistingRecaptcha,
// or can be an alias if you prefer the name for external calls (e.g., on component unmount).
export const clearRecaptchaVerifier = () => {
    cleanupRecaptchaResources();
};

// Your verifyPhoneNumber function (assuming it's largely correct for its purpose of linking)
// Minor type additions for clarity.
// You'll need to import isPhoneNumberInUse, updateUserProfile, addUserToRestaurant or define them.
// For this example, I'll comment them out if they are not standard Firebase imports.

/*
// Assuming these are custom functions you have defined elsewhere:
declare function isPhoneNumberInUse(phoneNumber: string): Promise<boolean>;
declare function updateUserProfile(uid: string, data: any): Promise<void>;
declare function addUserToRestaurant(uid: string): Promise<void>;
*/

export const verifyPhoneNumberAndLink = async (
  verificationId: string,
  verificationCode: string,
  user: User // Ensure this is a valid, authenticated Firebase User object
): Promise<User | null> => {
  console.log("verifyPhoneNumberAndLink: Verifying with ID:", verificationId, "Code:", verificationCode, "User:", user.uid);
  try {
      // Application-specific check: if the number is already in use by another account.
      // This typically involves a backend check.
      // const newPhoneNumber = ...; // You might need to get the number associated with verificationId if not directly available
      // if (newPhoneNumber && await isPhoneNumberInUse(newPhoneNumber)) {
      //     throw { code: 'app/phone-in-use', message: "This phone number is already registered with another account." };
      // }

      const phoneCredential = PhoneAuthProvider.credential(verificationId, verificationCode);

      await linkWithCredential(user, phoneCredential);
      console.log("verifyPhoneNumberAndLink: Phone credential linked successfully to user:", user.uid);

      // After linking, the 'user' object on the client-side might not immediately reflect
      // the new phone number or verified status.
      // Consider calling user.reload() or user.getIdToken(true) to refresh the user's profile.
      // For example: await user.reload();

      // Application-specific updates after successful linking (e.g., updating a Firestore profile)
      // const linkedPhoneNumber = user.phoneNumber; // After reload, this should be the new number
      // await updateUserProfile(user.uid, {
      //   phoneVerified: true,
      //   phoneNumber: linkedPhoneNumber
      // });
      // await addUserToRestaurant(user.uid);

      return user; // Return the user object.

  } catch (error: any) {
      console.error("verifyPhoneNumberAndLink: Error verifying code or linking credential.", error);
      if (error.code === 'auth/invalid-verification-code') {
          throw new Error("The verification code is invalid. Please check the code and try again.");
      } else if (error.code === 'auth/credential-already-in-use') {
          // This error means the phone number (credential) is already linked to *another* Firebase account,
          // not necessarily the current user.
          throw new Error("This phone number is already associated with another account.");
      } else if (error.code === 'auth/provider-already-linked') {
          // This error means the *current* user already has a phone credential from this provider.
          // This might be okay or indicate a redundant operation.
          console.warn("verifyPhoneNumberAndLink: This user already has a phone credential linked.");
          // Potentially, you could just return the user here if this is not an error condition for your app.
          // throw new Error("This phone number is already linked to your account.");
           return user; // Or handle as an error depending on desired UX
      } else if (error.code === 'app/phone-in-use') { // Custom error from your check
          throw new Error(error.message);
      }
      throw new Error(`Failed to verify phone number: ${error.message || "Unknown error"}`);
  }
};


export const addUserToRestaurant = async (userId: string) => {
  if (!RESTAURANT_ID) {
    console.error("Restaurant ID not found in environment variables");
    throw new Error("Restaurant ID not configured");
  }
  
  try {
    console.log("Adding user to restaurant's users array: ", userId, " for restaurant ID:", RESTAURANT_ID);

    const restaurantUsersRef = collection(db, 'Restaurants', RESTAURANT_ID, 'users');
    const userDocRef = doc(restaurantUsersRef, userId);
    await setDoc(userDocRef, { userId });

    // Also update the user document to reference the restaurant
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      restaurantId: RESTAURANT_ID
    });
    
    console.log(`User ${userId} successfully linked to restaurant ${RESTAURANT_ID}`);
    return true;
  } catch (error) {
    console.error("Error adding user to restaurant:", error);
    throw error;
  }
};

// Check if user belongs to the current restaurant
export const userBelongsToRestaurant = async (userId: string) => {
  if (!RESTAURANT_ID) {
    console.error("Restaurant ID not found in environment variables");
    throw new Error("Restaurant ID not configured");
  }
  
  try {
    const userDocRef = doc(db, 'restaurants', RESTAURANT_ID, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return true;
    }

    // TODO Add proper security rules to protect unauthorized deletions
    
    await deleteDoc(doc(db, 'restaurants', RESTAURANT_ID, 'users', userId));
    await deleteDoc(doc(db, 'users', userId));
    
    return false;
  } catch (error) {
    console.error("Error checking if user belongs to restaurant:", error);
    throw error;
  }
};

// Sign in with email and password with additional restaurant validation
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user profile to check phone verification status
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // If phone is verified, check if user belongs to the restaurant
      if (userData.phoneVerified) {
        const belongsToRestaurant = await userBelongsToRestaurant(user.uid);
        
        if (!belongsToRestaurant) {
          console.log("User not found in restaurant's users list. Deleting user account...");
          await deleteUser(user);
          throw new Error("Your account is not associated with this restaurant. Access denied.");
        }
      }
      // If phone is not verified, allow login regardless of restaurant association
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    throw error;
  }
};

// Update user profile in Firestore
export const updateUserProfile = async (userId: string, data: any) => {
  console.log("Updating user profile in Firestore:", userId, data);
  
  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user document exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await setDoc(userRef, data, { merge: true });
    } else {
      // Create new document
      await setDoc(userRef, {
        ...data,
        createdAt: new Date(),
        loyaltyPoints: 0,
        role: 'customer', // Default role
        addresses: []
      });
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return new Promise<User | null>((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};