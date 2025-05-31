import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {
  SquareClient,
  SquareEnvironment,
  WebhooksHelper,
  Square,
} from "square";

// Initialize Firebase Admin SDK (if not already initialized elsewhere)
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- Configuration - Set these in Firebase Function Environment Variables ---
// firebase functions:config:set square.signature_key="YOUR_SQUARE_WEBHOOK_SIGNATURE_KEY"
// firebase functions:config:set square.access_token="YOUR_SQUARE_ACCESS_TOKEN" // Needed to fetch order details
// firebase functions:config:set square.environment="sandbox_or_production"
// firebase functions:config:set webhook.url="YOUR_DEPLOYED_FUNCTION_URL" // For signature verification

export const handleSquareWebhook = functions.https.onRequest(
  async (req, res) => {
    const signatureKey = process.env.SQUARE_SIGNATURE_KEY;
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT;
    const notificationUrl = process.env.WEBHOOK_URL;

    const squareClient = new SquareClient({
      environment:
        squareEnvironment === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
      token: accessToken,
    });

    if (req.method !== "POST") {
      functions.logger.warn(
        "Webhook received with non-POST method",
        req.method
      );
      res.status(405).send("Method Not Allowed");
      return;
    }

    // 1. Verify Webhook Signature
    const signature = req.headers["x-square-signature"] as string;
    const rawBody = req.rawBody
      ? req.rawBody.toString()
      : JSON.stringify(req.body);

    if (!signatureKey || !notificationUrl) {
      functions.logger.error(
        "CRITICAL: Square webhook signature key or function URL is not configured in Firebase environment.",
        {
          hasSignatureKey: !!signatureKey,
          hasWebhookUrl: !!notificationUrl,
        }
      );
      res.status(500).send("Webhook configuration error.");
      return;
    }

    try {
      const isValid = WebhooksHelper.verifySignature({
        requestBody: rawBody,
        signatureHeader: signature,
        signatureKey: signatureKey,
        notificationUrl: notificationUrl,
      });

      if (!isValid) {
        functions.logger.warn("Webhook signature validation failed.", {
          signatureReceived: signature,
          expectedUrl: notificationUrl,
        });
        res.status(403).send("Forbidden: Invalid signature.");
        return;
      }
      functions.logger.info("Webhook signature validated successfully.");
    } catch (e: any) {
      functions.logger.error(
        "Error during webhook signature validation process:",
        e.message,
        e
      );
      res.status(400).send("Webhook signature validation error.");
      return;
    }

    // 2. Process the Event
    const event = req.body;
    functions.logger.info(`Received Square event: ${event.type}`, {
      eventId: event.event_id,
      data: event.data,
    });

    try {
      let squareOrderId: string | undefined;
      let paymentDetailsFromWebhook: any | undefined;
      let isConsideredPaid = false;

      if (event.type === "payment.updated") {
        paymentDetailsFromWebhook = event.data.object.payment as Square.Payment;

        squareOrderId = paymentDetailsFromWebhook?.order_id;
        functions.logger.info(
          `Event type: payment.updated. Order ID: ${squareOrderId}, Payment ID: ${paymentDetailsFromWebhook?.id}, Status: ${paymentDetailsFromWebhook?.status}`
        );
        if (paymentDetailsFromWebhook?.status === "COMPLETED") {
          isConsideredPaid = true;
        }
      } else if (event.type === "order.updated") {
        const orderFromWebhook = event.data.object.order as Square.Order;
        squareOrderId = orderFromWebhook.id;
        functions.logger.info(
          `Event type: order.updated. Order ID: ${squareOrderId}, State: ${orderFromWebhook.state}`
        );
        if (
          orderFromWebhook.state === "COMPLETED" &&
          orderFromWebhook.tenders?.some(
            (tender) => (tender.amountMoney?.amount ?? BigInt(0)) > BigInt(0)
          )
        ) {
          isConsideredPaid = true;
        }
      } else {
        functions.logger.info(
          `Unhandled event type: ${event.type}. Acknowledging.`
        );
        res
          .status(200)
          .send(`Event type ${event.type} received and acknowledged.`);
        return;
      }

      if (!isConsideredPaid) {
        functions.logger.info(
          `Event for order ${squareOrderId} (Event ID: ${event.event_id}) does not signify a completed payment. No Firestore action taken.`
        );
        res
          .status(200)
          .send("Event received, payment not completed or not relevant.");
        return;
      }

      if (!squareOrderId) {
        functions.logger.error(
          "Could not extract a valid Square Order ID from the webhook event.",
          { eventData: event.data }
        );
        res.status(400).send("Missing Square Order ID in event data.");
        return;
      }

      const existingOrderQuery = db
        .collectionGroup("orders")
        .where("squareOrderId", "==", squareOrderId)
        .where("status", "==", "paid")
        .limit(1);
      const existingOrderSnap = await existingOrderQuery.get();

      if (!existingOrderSnap.empty) {
        functions.logger.info(
          `Order ${squareOrderId} (event ID: ${event.event_id}) has already been processed and marked as 'paid'. Skipping.`
        );
        res
          .status(200)
          .send("Event for already processed 'paid' order received.");
        return;
      }

      // --- Fetch full order details from Square to get metadata ---
      // The SquareClient is initialized with the token. If the token was missing/invalid,
      // the following API call will fail and be caught by the try...catch block.
      // The explicit check `if (!squareClient.config.token)` was removed as it's incorrect.
      let squareOrderDataFromAPI: Square.Order;
      try {
        functions.logger.info(
          `Fetching full order details for Square Order ID: ${squareOrderId} from Square API.`
        );
        // Ensure squareConfig.access_token was available when squareClient was initialized.
        // If not, this call will likely fail.
        if (!accessToken) {
          functions.logger.error(
            "Square Access Token was not available from Firebase config when client was initialized. Cannot fetch order metadata."
          );
          // This indicates a setup issue with Firebase function configuration.
          res
            .status(500)
            .send(
              "Internal configuration error: Square client token missing at initialization."
            );
          return;
        }
        const orderResponse = await squareClient.orders.get({
          orderId: squareOrderId,
        });
        squareOrderDataFromAPI = orderResponse.order!;
        if (!squareOrderDataFromAPI) {
          throw new Error(
            `Order ${squareOrderId} not found via Square API or result.order was undefined.`
          );
        }
        functions.logger.info(
          `Successfully fetched order details for ${squareOrderId}.`
        );
      } catch (apiError: any) {
        functions.logger.error(
          `Failed to retrieve order ${squareOrderId} from Square API:`,
          apiError
        );
        res.status(500).send("Failed to retrieve order details from Square.");
        return;
      }

      const metadata = squareOrderDataFromAPI.metadata;
      if (!metadata) {
        functions.logger.error(
          `Metadata missing for Square Order ID: ${squareOrderId} when fetched from API.`
        );
        res
          .status(400)
          .send("Order metadata missing from Square API response.");
        return;
      }

      const userId = metadata.userId;
      const restaurantId = metadata.restaurantId;
      const deliveryAddressString = metadata.deliveryAddress;
      const cartItemsString = metadata.cartItems;

      if (
        !userId ||
        !restaurantId ||
        !deliveryAddressString ||
        !cartItemsString
      ) {
        functions.logger.error(
          `Essential metadata (userId, restaurantId, deliveryAddress, cartItems) missing in fetched Square Order: ${squareOrderId}`,
          { metadataReceived: metadata }
        );
        res
          .status(400)
          .send("Essential order metadata missing in fetched order.");
        return;
      }

      let deliveryAddress, cartItemsFromMeta;
      try {
        deliveryAddress = JSON.parse(deliveryAddressString);
        cartItemsFromMeta = JSON.parse(cartItemsString);
      } catch (parseError: any) {
        functions.logger.error(
          `Failed to parse metadata JSON for order ${squareOrderId}:`,
          parseError.message
        );
        res.status(500).send("Error processing order metadata.");
        return;
      }

      const firestoreOrderPath = `Restaurants/${restaurantId}/orders/${squareOrderId}`;
      const firestoreOrderRef = db.doc(firestoreOrderPath);

      const orderDataForFirestore = {
        squareOrderId: squareOrderId,
        userId: userId,
        restaurantId: restaurantId,
        cartItems: cartItemsFromMeta,
        deliveryAddress: deliveryAddress,
        status: "paid",
        totalAmount:
          Number(squareOrderDataFromAPI.totalMoney?.amount ?? BigInt(0)) / 100,
        currency: squareOrderDataFromAPI.totalMoney?.currency || "USD",
        paymentProvider: "square",
        paymentDetails: paymentDetailsFromWebhook
          ? {
              id: paymentDetailsFromWebhook.id ?? null,
              status: paymentDetailsFromWebhook.status ?? null,
              cardBrand:
                paymentDetailsFromWebhook.cardDetails?.card?.cardBrand ?? null,
              last4: paymentDetailsFromWebhook.cardDetails?.card?.last4 ?? null,
              sourceType: paymentDetailsFromWebhook.sourceType ?? null,
            }
          : null,
        squareDataSnapshot: {
          id: squareOrderDataFromAPI.id,
          state: squareOrderDataFromAPI.state,
          version: squareOrderDataFromAPI.version,
          netAmountDueMoney: squareOrderDataFromAPI.netAmountDueMoney,
          totalTaxMoney: squareOrderDataFromAPI.totalTaxMoney,
          totalDiscountMoney: squareOrderDataFromAPI.totalDiscountMoney,
          tenders: squareOrderDataFromAPI.tenders,
          source: squareOrderDataFromAPI.source?.name,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        webhookEventId: event.event_id,
        webhookEventType: event.type,
      };

      await firestoreOrderRef.set(orderDataForFirestore, { merge: true });

      functions.logger.info(
        `Order ${squareOrderId} (Event ID: ${event.event_id}) processed. Firestore doc: ${firestoreOrderPath}`
      );

      res.status(200).send("Webhook processed successfully and order stored.");
    } catch (error: any) {
      functions.logger.error(
        `Unhandled error processing webhook event (Event ID: ${event.event_id}):`,
        error.message,
        error.stack
      );
      res.status(500).send("Internal Server Error while processing event.");
    }
  }
);
