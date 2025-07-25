// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/firebaseAdmin";
import { withAuth, withLoginRequired } from "@/utils/withAuth";

async function meHandler(
  req: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> },
  user: import("firebase-admin/auth").DecodedIdToken
): Promise<
  NextResponse<
    | { message: string }
    | {
        user: {
          uid: string;
          email: string | undefined;
          displayName: string;
          role: string;
          loyaltyPoints: number;
          photoURL: string | null;
          phoneNumber: string | null;
        };
        customToken: string;
      }
  >
> {
  try {
    // Fetch additional profile data from Firestore
    const userRef = adminDb.collection("users").doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(
        `Firestore profile not found for authenticated user: ${user.uid}`
      );
      return NextResponse.json(
        { message: "User profile not found" },
        { status: 404 }
      );
    }

    const customToken = await adminAuth.createCustomToken(user.uid);

    const profileData = userDoc.data();

    // Return combined auth claims and profile data
    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: profileData?.displayName || user.name || "",
        role: profileData?.role || "customer",
        loyaltyPoints: profileData?.loyaltyPoints || 0,
        photoURL: profileData?.photoURL || user.picture || null,
        phoneNumber: profileData?.phoneNumber || null,
      },
      customToken: customToken,
    });
  } catch (error) {
    console.error("Error fetching user profile in /api/auth/me:", error);
    return NextResponse.json(
      { message: "Failed to fetch user profile data" },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with authentication
export const GET = withLoginRequired(meHandler);
