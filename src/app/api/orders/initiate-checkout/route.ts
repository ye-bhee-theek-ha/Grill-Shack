// src/app/api/orders/initiate-checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { withLoginRequired } from "@/utils/withAuth";
import type { MenuItem, CartItem, Address } from "@/constants/types";
import type { DecodedIdToken } from "firebase-admin/auth";
import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";

// --- Initialize Square Client ---
const squareClient = new SquareClient({
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

// --- Type for Request Body
interface InitiateCheckoutRequestBody {
  cartItems: CartItem[];
  deliveryAddress: Address;
  restaurantId: string;
}

// --- Helper: Secure Price Calculation (Backend) ---
const calculateBackendPriceForItem = async (
  restaurantId: string,
  cartItem: CartItem
): Promise<number> => {
  const menuItemRef = adminDb.doc(
    `Restaurants/${restaurantId}/menu/${cartItem.id}`
  );
  const menuItemSnap = await menuItemRef.get();

  if (!menuItemSnap.exists) {
    console.error(
      `MenuItem with ID ${cartItem.id} not found in DB for restaurant ${restaurantId}.`
    );
    throw new Error(`Menu item ${cartItem.name} not found.`);
  }
  const baseMenuItem = menuItemSnap.data() as MenuItem;

  let calculatedPrice = parseFloat(baseMenuItem.price || "0") || 0;

  const normalizedOptionsDefinition = !baseMenuItem.options
    ? []
    : Array.isArray(baseMenuItem.options)
    ? baseMenuItem.options
    : [baseMenuItem.options];

  const selectedOptions = cartItem.selectedOptions || {};
  for (const question in selectedOptions) {
    const selectedChoiceNames = selectedOptions[question];
    const choiceNamesArray = Array.isArray(selectedChoiceNames)
      ? selectedChoiceNames
      : [selectedChoiceNames];

    const optionDefinition = normalizedOptionsDefinition.find(
      (opt) => opt.Question === question
    );

    if (optionDefinition) {
      for (const choiceName of choiceNamesArray) {
        const choiceDefinition = optionDefinition.choices.find(
          (choice) => choice.name === choiceName
        );
        if (choiceDefinition && typeof choiceDefinition.price === "number") {
          calculatedPrice += choiceDefinition.price;
        }
      }
    } else {
      console.warn(
        `Option definition for question "${question}" not found for item ${cartItem.id}. Skipping price calculation for this option.`
      );
    }
  }

  return Math.max(0, calculatedPrice);
};

// --- API Handler ---
const handler = async (
  req: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> },
  user: DecodedIdToken
): Promise<
  NextResponse<
    | { checkoutUrl: string; orderId: string; message: string }
    | { message: string; error?: any }
  >
> => {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 }
    );
  }

  const userId = user.uid;

  try {
    const body = (await req.json()) as InitiateCheckoutRequestBody;
    const { cartItems, deliveryAddress, restaurantId } = body;

    // --- Validation ---
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: "Cart is empty." }, { status: 400 });
    }
    if (!deliveryAddress || !deliveryAddress.address) {
      return NextResponse.json(
        { message: "Delivery address is required." },
        { status: 400 }
      );
    }
    if (!restaurantId) {
      return NextResponse.json(
        { message: "Restaurant ID is required." },
        { status: 400 }
      );
    }

    const squareLocationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    if (!squareLocationId) {
      console.error(
        "Square Location ID (NEXT_PUBLIC_SQUARE_LOCATION_ID) is not configured."
      );
      return NextResponse.json(
        { message: "Payment system configuration error (Location ID)." },
        { status: 500 }
      );
    }
    if (!process.env.SQUARE_ENVIRONMENT) {
      console.error(
        "Square Environment (SQUARE_ENVIRONMENT) is not configured for the backend."
      );
      return NextResponse.json(
        { message: "Payment system server configuration error (Environment)." },
        { status: 500 }
      );
    }
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.error(
        "Square Access Token (SQUARE_ACCESS_TOKEN) is not configured for the backend."
      );
      return NextResponse.json(
        {
          message: "Payment system server configuration error (Access Token).",
        },
        { status: 500 }
      );
    }

    console.log(
      `Initiating Square checkout for user: ${userId}, restaurant: ${restaurantId}`
    );

    // --- Prepare line items using backend price calculation ---
    const orderLineItems: any[] = [];

    for (const item of cartItems) {
      try {
        const unitAmountDollars = await calculateBackendPriceForItem(
          restaurantId,
          item
        );
        const unitAmountCents = Math.round(unitAmountDollars * 100);

        let note = "";
        const optionsDesc = Object.entries(item.selectedOptions || {})
          .map(([key, value]) => {
            if (key.startsWith("_")) return null;
            const valStr = Array.isArray(value)
              ? value.join(", ")
              : String(value);
            return valStr ? `${key}: ${valStr}` : null;
          })
          .filter(Boolean)
          .join("; ");
        if (optionsDesc) {
          note = optionsDesc;
        }

        orderLineItems.push({
          name: item.name,
          quantity: String(item.quantity),
          basePriceMoney: {
            amount: BigInt(unitAmountCents),
            currency: "USD",
          },
          note: note.substring(0, 500),
        });
      } catch (priceError: any) {
        console.error(
          `Error calculating price for item ${item.id} (${item.name}): ${priceError.message}`
        );
        return NextResponse.json(
          {
            message: `Error processing item: ${item.name}. ${priceError.message}`,
          },
          { status: 400 }
        );
      }
    }

    // --- Define Redirect URLs ---
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;
    if (!appBaseUrl) {
      console.error(
        "Application Base URL (NEXT_PUBLIC_APP_BASE_URL) is not configured."
      );
      return NextResponse.json(
        { message: "Application configuration error." },
        { status: 500 }
      );
    }
    const redirect_url = `${appBaseUrl}/checkout/success`;

    // --- Create Payment Link and Order in a Single Request ---
    console.log("Creating Square Payment Link and Order...");
    const paymentLinkIdempotencyKey = randomUUID(); // This idempotency key applies to the payment link creation.
    // Square will generate an idempotency key for the order if not provided within the order object.

    const paymentLinkPayload = {
      idempotencyKey: paymentLinkIdempotencyKey,
      order: {
        // Define the order directly here
        locationId: squareLocationId,
        lineItems: orderLineItems,
        metadata: {
          // Metadata is crucial for your webhook
          userId: userId,
          restaurantId: restaurantId,
          deliveryAddress: JSON.stringify(deliveryAddress),
          cartItems: JSON.stringify(
            cartItems.map((i) => ({
              itemId: i.id,
              name: i.name,
              quantity: i.quantity,
              options: i.selectedOptions,
            }))
          ),
        },
        // If you need a specific idempotency key for the order itself,
        // you can add it inside this order object:
        // idempotency_key: randomUUID(),
      },
      checkoutOptions: {
        allowTipping: false,
        redirectUrl: redirect_url,
        askForShippingAddress: false,
      },
      prePopulateBuyerEmail: user.email || undefined,
    };

    console.log(
      "Payment Link and Order payload being sent to Square:",
      JSON.stringify(
        paymentLinkPayload,
        (key, value) => (typeof value === "bigint" ? value.toString() : value), // Replacer for BigInt in logging
        2
      )
    );

    const paymentLinkResponse = await squareClient.checkout.paymentLinks.create(
      paymentLinkPayload
    );

    // Adjust destructuring based on your Square SDK version's response structure
    const paymentLinkObject =
      paymentLinkResponse.paymentLink || paymentLinkResponse.paymentLink;
    const createdOrderObject =
      paymentLinkResponse.relatedResources?.orders?.[0];

    if (
      !paymentLinkObject ||
      !paymentLinkObject.url ||
      !paymentLinkObject.orderId
    ) {
      console.error(
        "Square payment link creation failed or did not return expected fields. Full response:",
        paymentLinkResponse
      );
      // Try to log the order ID from the created order object if available
      if (createdOrderObject && createdOrderObject.id) {
        console.error(
          "However, an order might have been created with ID:",
          createdOrderObject.id
        );
      }
      throw new Error(
        "Square payment link creation failed (details in server log)."
      );
    }

    const squareOrderId = paymentLinkObject.orderId; // This is the ID of the order created with the payment link

    console.log(`Square Payment Link created: ${paymentLinkObject.url}`);
    console.log(
      `Associated Square Order ID (from payment link): ${squareOrderId}`
    );

    if (
      createdOrderObject &&
      createdOrderObject.id &&
      createdOrderObject.id !== squareOrderId
    ) {
      console.warn(
        `Order ID mismatch! PaymentLink.orderId: ${squareOrderId}, RelatedResources.Order.id: ${createdOrderObject.id}. Using PaymentLink.orderId.`
      );
    } else if (createdOrderObject && createdOrderObject.id) {
      console.log(
        `Confirmed Order ID (from related resources): ${createdOrderObject.id}`
      );
    }

    return NextResponse.json(
      {
        checkoutUrl: paymentLinkObject.url,
        orderId: squareOrderId, // Use the orderId from the payment link response
        message: "Checkout and order created successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error /api/orders/initiate-checkout (Square):", error);
    const squareErrors =
      error.errors || error.body?.errors || error.result?.errors;
    if (squareErrors && Array.isArray(squareErrors)) {
      console.error("Square API Errors:", squareErrors);
      const messages = squareErrors
        .map(
          (e: any) =>
            `[${e.category}/${e.code}]: ${e.detail}${
              e.field ? ` (field: ${e.field})` : ""
            }`
        )
        .join("; ");
      return NextResponse.json(
        { message: "Failed to initiate payment with Square.", error: messages },
        { status: error.statusCode || 500 }
      );
    }
    return NextResponse.json(
      {
        message: "Failed to initiate payment.",
        error: error.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
};

export const POST = withLoginRequired(handler);
