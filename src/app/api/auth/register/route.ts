// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/firebaseAdmin";
import { cookies } from "next/headers";

// Session expiration for auto-login after registration
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(req: NextRequest) {
  console.log("Registering user...");
  try {
    const body = await req.json();
    const { email, password, displayName, phoneNumber } = body;

    // Basic validation
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { message: "Missing required fields (email, password, displayName)" },
        { status: 400 }
      );
    }

    //Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: email,
      emailVerified: false,
      password: password,
      displayName: displayName,

      phoneNumber: phoneNumber,
      disabled: false,
    });

    // Optionally set custom claims (e.g., default role)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: "customer" });

    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: "customer",
      createdAt: new Date().toISOString(),
      loyaltyPoints: 0,
      phoneNumber: phoneNumber,
      phoneVerified: false,
      restaurantId: process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID,
    };
    await adminDb.collection("users").doc(userRecord.uid).set(userProfile);

    await adminDb
      .collection(
        `Restaurants/${process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID}/users`
      )
      .doc(userRecord.uid)
      .set({ role: "customer" });

    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return NextResponse.json(
      {
        message: "User registered successfully",
        uid: userRecord.uid,
        customToken,
      },
      { status: 201 } // 201 Created
    );
  } catch (error: any) {
    console.error("Registration Error:", error);

    // --- Firebase Auth Specific Errors ---
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { message: "This email address is already in use by another account." },
        { status: 409 } // 409 Conflict
      );
    }

    if (error.code === "auth/phone-number-already-exists") {
      return NextResponse.json(
        {
          message:
            "This phone number is already registered with another account.",
        },
        { status: 409 } // 409 Conflict
      );
    }

    if (error.code === "auth/invalid-email") {
      return NextResponse.json(
        {
          message:
            "The email address is not valid. Please enter a valid email.",
        },
        { status: 400 } // 400 Bad Request
      );
    }

    if (error.code === "auth/invalid-phone-number") {
      return NextResponse.json(
        { message: "The phone number is not valid. Please check the format." },
        { status: 400 } // 400 Bad Request
      );
    }

    if (error.code === "auth/invalid-password") {
      return NextResponse.json(
        {
          message:
            "The password is not valid. It must be at least 6 characters long.",
        },
        { status: 400 } // 400 Bad Request
      );
    }

    // --- Default Fallback for Unknown Errors ---
    const errorMessage =
      error.message || "An unexpected error occurred during registration.";
    const errorCode = error.code || "UNKNOWN_ERROR";

    console.error(
      `Unhandled registration error. Code: ${errorCode}, Message: ${errorMessage}`
    );

    return NextResponse.json(
      { message: "An internal server error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
