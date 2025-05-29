// src/app/api/admin/restaurants/[restaurantId]/info/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';
import { withStaffAuth } from '@/utils/withAuth';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { RestaurantInfo } from '@/constants/types';

type UpdateInfoRequest = Partial<{
    address: string; 
    logoUrl: string; 
    coverImageUrl: string; 
    info: Partial<RestaurantInfo['info']>; 
    siteContent: Partial<RestaurantInfo['siteContent']>; 
}>;


// Define the structure for the response
interface UpdateInfoResponse {
    success: boolean;
    message: string;
}

// --- PUT Handler to Update Restaurant Info ---
export const PUT = withStaffAuth<UpdateInfoResponse>(
    async (request, context, user) => {
        const params = await context.params;
        const { restaurantId } = params as { restaurantId: string };
        const staffUserId = user.uid;

        // --- Input Validation ---
        if (!restaurantId) {
            return NextResponse.json({ success: false, message: 'Missing Restaurant ID.' }, { status: 400 });
        }

        let body: UpdateInfoRequest;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
        }

        if (typeof body !== 'object' || body === null || Object.keys(body).length === 0) {
             return NextResponse.json({ success: false, message: 'Request body cannot be empty.' }, { status: 400 });
        }

        console.log(`PUT /info: Staff ${staffUserId} updating info/content for restaurant ${restaurantId}`);

        try {
            const restaurantRef = adminDb.doc(`Restaurants/${restaurantId}`);

            // --- Prepare Update Data (Filter out empty/null/undefined values) ---
            // Use dot notation for nested fields in Firestore update
            const updateData: { [key: string]: any } = {};

            // --- Handle Top-Level Fields ---
            // Only update if the field exists and has a non-empty trimmed value
            if (typeof body.address === 'string' && body.address.trim()) updateData.address = body.address.trim();
            if (typeof body.logoUrl === 'string' && body.logoUrl.trim()) updateData.logoUrl = body.logoUrl.trim();
            if (typeof body.coverImageUrl === 'string' && body.coverImageUrl.trim()) updateData.coverImageUrl = body.coverImageUrl.trim();
            // If you want to allow clearing these fields with an empty string, change the check to:
            // if (typeof body.address === 'string') updateData.address = body.address.trim(); // etc.


            // --- Handle Nested 'info' Object ---
            if (body.info && typeof body.info === 'object') {
                const info = body.info;
                // Only update non-empty strings for required fields like name
                if (typeof info.name === 'string' && info.name.trim()) updateData['info.name'] = info.name.trim();
                // Allow empty strings for optional fields like description, location
                if (typeof info.description === 'string') updateData['info.description'] = info.description;
                if (typeof info.location === 'string') updateData['info.location'] = info.location.trim(); // Trim URLs
                if (typeof info.OpeningTime === 'string') updateData['info.OpeningTime'] = info.OpeningTime;

                // Contact sub-object: only update if fields are present and non-empty
                if (info.contact && typeof info.contact === 'object') {
                    if (typeof info.contact.email === 'string' && info.contact.email.trim()) updateData['info.contact.email'] = info.contact.email.trim();
                    if (typeof info.contact.phone === 'string' && info.contact.phone.trim()) updateData['info.contact.phone'] = info.contact.phone.trim();
                }
                // Opening Hours array: Overwrite only if a valid array is provided
                if (Array.isArray(info.openingHours)) {
                    const validHours = info.openingHours.filter(h => h && typeof h.day === 'string' && h.day.trim() !== '' && typeof h.timing === 'string' && h.timing.trim() !== '');
                    updateData['info.openingHours'] = validHours; // Allows saving empty array to clear
                }
                // Social object: Overwrite only if a valid object is provided
                if (info.social && typeof info.social === 'object' && !Array.isArray(info.social)) {
                     const socialUpdate: { [key: string]: string } = {};
                     if (typeof info.social.facebook === 'string') socialUpdate.facebook = info.social.facebook.trim();
                     if (typeof info.social.instagram === 'string') socialUpdate.instagram = info.social.instagram.trim();
                     // Add other platforms if needed
                     updateData['info.social'] = socialUpdate; // Save the object (can be empty)
                }
            }

            // --- Handle Nested 'siteContent' Object ---
             if (body.siteContent && typeof body.siteContent === 'object') {
                 const content = body.siteContent;
                 // Allow empty strings for text content
                 if (typeof content.heroText === 'string') updateData['siteContent.heroText'] = content.heroText;
                 if (typeof content.heroSubtext === 'string') updateData['siteContent.heroSubtext'] = content.heroSubtext;
                 if (typeof content.menuText === 'string') updateData['siteContent.menuText'] = content.menuText;
                 if (typeof content.menuSubtext === 'string') updateData['siteContent.menuSubtext'] = content.menuSubtext;

                 // Featuring array: Overwrite only if a valid array is provided
                 if (Array.isArray(content.featuring)) {
                     const validFeatures = content.featuring
                         .filter(f => f && (f.title?.trim() || f.description?.trim() || f.imageUrl?.trim())) // Keep if any field has value
                         .map(f => ({ // Ensure only expected fields are saved, trim values
                             title: f.title?.trim() || '',
                             description: f.description?.trim() || '',
                             imageUrl: f.imageUrl?.trim() || '',
                         }));
                     updateData['siteContent.featuring'] = validFeatures; // Allows saving empty array
                 }
             }


            // --- Check if any updates are actually being made ---
            if (Object.keys(updateData).length === 0) {
                 return NextResponse.json({ success: true, message: 'No valid changes detected to save.' }, { status: 200 });
            }

            // Always update the main document's updatedAt timestamp
            updateData['updatedAt'] = FieldValue.serverTimestamp();

            // --- Database Update ---
            console.log("Applying updates to Firestore:", updateData);
            // Check if restaurant exists before updating
            const restaurantSnap = await restaurantRef.get();
            if (!restaurantSnap.exists) {
                 throw new Error("Restaurant not found.");
            }
            await restaurantRef.update(updateData);

            console.log(`Info/Content updated successfully for restaurant ${restaurantId}.`);

            // --- Success Response ---
            return NextResponse.json({
                success: true,
                message: 'Restaurant information and site content updated successfully.',
            }, { status: 200 });

        } catch (error: any) {
            console.error(`PUT /info: Error updating info/content for restaurant ${restaurantId}:`, error);
             if (error.code === 5 || error.message === "Restaurant not found.") {
                 return NextResponse.json({ success: false, message: 'Restaurant not found.' }, { status: 404 });
            }
            return NextResponse.json({ success: false, message: 'Failed to update restaurant information.', error: error.message }, { status: 500 });
        }
    }
);
