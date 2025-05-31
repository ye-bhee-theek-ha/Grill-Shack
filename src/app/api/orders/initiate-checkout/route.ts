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
    // Handle this error appropriately - maybe skip item or throw error
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
  NextResponse<{ sessionId: string } | { message: string; error?: any }>
> => {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 }
    );
  }

  const userId = user.uid; // Get userId from authenticated user

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

    if (!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
      console.error("Square Location ID is not configured.");
      return NextResponse.json(
        { message: "Payment system configuration error." },
        { status: 500 }
      );
    }

    console.log(
      `Initiating Square checkout for user: ${userId}, restaurant: ${restaurantId}`
    );

    // --- Prepare line items using backend price calculation ---
    const orderLineItems: any[] = [];
    let totalAmount = 0;

    for (const item of cartItems) {
      try {
        const unitAmountDollars = await calculateBackendPriceForItem(
          restaurantId,
          item
        );
        const unitAmountCents = Math.round(unitAmountDollars * 100);
        totalAmount += unitAmountCents * item.quantity;

        // Format options for description/note
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
          quantity: String(item.quantity), // Square expects quantity as string
          basePriceMoney: {
            amount: BigInt(unitAmountCents), // Price in cents
            currency: "USD", // Or your currency
          },
          note: note.substring(0, 500), // Max 500 chars for note
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
    // Square doesn't use {CHECKOUT_SESSION_ID} in redirect_url like Stripe.
    // You'll get the order ID from the response and can use it in webhooks.
    // For the success URL, you might want to append your internal order ID or the Square order ID
    // if you need to fetch details on the success page, but webhooks are more reliable for fulfillment.
    const redirect_url = `${appBaseUrl}/checkout/success`; // User is redirected here after payment

    // --- Create Square Order and Checkout ---
    console.log("Creating Square Order and Checkout...");
    const idempotencyKey = randomUUID(); // Generate a unique key for each request

    const orderPayload = {
      idempotencyKey: idempotencyKey, // Important for retries
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID, // Your Square Location ID
        lineItems: orderLineItems,
        // You can add customerId if you manage customers in Square
        // customerId: squareCustomerId,
        // Add metadata for your reference (available in webhooks and API)
        metadata: {
          userId: userId,
          restaurantId: restaurantId,
          deliveryAddress: JSON.stringify(deliveryAddress), // Store delivery address
          cartItems: JSON.stringify(
            cartItems.map((i) => ({
              // Store simplified cart for webhook
              itemId: i.id,
              name: i.name,
              quantity: i.quantity,
              options: i.selectedOptions,
              // unitPrice: calculated per item (already done for lineItems)
            }))
          ),
        },
      },
    };

    // You can create just an order first, then a payment link for that order,
    // or use the Checkout API which can create an order implicitly or take an existing one.
    // Using Checkout API with an explicit order:

    const createOrderResponse = await squareClient.orders.create(orderPayload);
    const createdOrder = createOrderResponse.order;

    console.log("orderPayload =>", orderPayload);

    if (!createdOrder || !createdOrder.id) {
      throw new Error("Square order creation failed.");
    }
    const squareOrderId = createdOrder.id;

    // Now create a payment link (checkout) for this order
    const checkoutPayload = {
      idempotencyKey: randomUUID(), // New idempotency key for this API call
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
        lineItems: orderLineItems,
        metadata: orderPayload.order.metadata,
      },
      checkoutOptions: {
        allowTipping: false,
        redirectUrl: redirect_url,
        // merchantSupportEmail: "support@example.com",
        askForShippingAddress: false, //TODO
      },
      // Pre-populate buyer email if available
      prePopulateBuyerEmail: user.email,
    };

    // If you want to create a checkout for an existing order ID:
    // This is often preferred to ensure atomicity and use the order created above.
    const paymentLinkPayload = {
      idempotencyKey: randomUUID(),
      orderId: squareOrderId,
      checkoutOptions: {
        allowTipping: false,
        redirectUrl: redirect_url,
        merchantSupportEmail: "support@example.com",
        askForShippingAddress: false, // You already have the address
      },

      // prePopulateBuyerEmail: user.email,
    };

    // Using createPaymentLink API:
    const { paymentLink, relatedResources } =
      await squareClient.checkout.paymentLinks.create(checkoutPayload);

    // The 'paymentLink' object contains 'url' and 'orderId' (which should match squareOrderId)

    if (!paymentLink || !paymentLink.url || !paymentLink.orderId) {
      throw new Error("Square payment link creation failed.");
    }

    console.log(
      "Square Payment Link created:",
      paymentLink.url,
      "Order ID:",
      paymentLink.orderId
    );

    return NextResponse.json(
      {
        checkoutUrl: paymentLink.url,
        orderId: paymentLink.orderId,
        message: "Checkout created successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Error /api/orders/initiate-checkout (Square):", error);
    // Check for Square specific errors if possible
    if (error.errors) {
      // Square API errors often come in an array
      console.error("Square API Errors:", error.errors);
      const messages = error.errors
        .map((e: any) => `${e.category} - ${e.code}: ${e.detail}`)
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
