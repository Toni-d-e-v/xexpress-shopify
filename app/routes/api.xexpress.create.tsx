import { json } from "@remix-run/server-runtime";
import prisma from "../db.server";
import { createXExpressClient } from "../utils/xexpress.client";
import shopify from "../shopify.server";

// Handle OPTIONS preflight for CORS
export async function options() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function action({ request }: any) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  console.log("[SERVER] Received request to /api/xexpress/create");
  console.log("[SERVER] Request method:", request.method);
  console.log("[SERVER] Request headers:", Object.fromEntries(request.headers.entries()));

  try {
    // Authenticate and get CORS helper - REQUIRED for UI extensions
    const authResult = await shopify.authenticate.admin(request);
    console.log("[SERVER] Auth result keys:", Object.keys(authResult));

    const { admin, session, cors } = authResult;
    console.log("[SERVER] cors function available:", typeof cors);

    // Parse request body
    const body = await request.json().catch(() => ({}));
    let { orderId } = body;

    // Validate orderId
    if (!orderId) {
      return json({ error: "Order ID is required" }, { status: 400, headers: corsHeaders });
    }

    // Extract numeric ID from GraphQL GID format
    // e.g., "gid://shopify/Order/123456789" -> "123456789"
    if (orderId.includes("gid://shopify/Order/")) {
      orderId = orderId.split("/").pop();
    }

    const shopDomain = session.shop;

    // Check configuration
    const config = await prisma.shopConfig.findUnique({
      where: { shop: shopDomain },
    });

    if (!config || !config.xUsername || !config.xPassword) {
      return json(
        { error: "X-Express not configured. Please configure in Settings." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch order from Shopify
    let orderRes;
    try {
      orderRes = await admin.rest.get({ path: `orders/${orderId}` });
    } catch (err) {
      console.error("Failed to fetch order from Shopify:", err);
      return json(
        { error: `Order not found or inaccessible: ${orderId}` },
        { status: 404, headers: corsHeaders }
      );
    }

    // @ts-ignore – Shopify SDK response typing
    const order = orderRes.body.order;

    if (!order) {
      return json({ error: "Order not found" }, { status: 404, headers: corsHeaders });
    }

    // Validate shipping address
    const shipping = order.shipping_address;
    if (!shipping || !shipping.address1 || !shipping.zip) {
      return json(
        { error: "Order is missing required shipping address information" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create X-Express client
    const client = createXExpressClient({
      username: config.xUsername,
      password: config.xPassword,
      env: (config.environment as "test" | "prod") === "prod" ? "prod" : "test",
    });

    // Prepare shipment data
    const shipmentDto = {
      sifraExt: order.name || `Order-${order.id}`,
      uslugaSifra: 1,
      opisPosiljke: order.line_items?.length
        ? order.line_items.map((i: any) => i.name).join(", ")
        : "Order items",
      tezina: 2,
      duzina: 20,
      sirina: 20,
      visina: 20,
      obveznikPlacanja: 1,
      nacinPlacanja: 1,
      brojPaketa: 1,
      vrednostPosiljke: Number(order.total_price) || 0,

      nazivPrim: shipping.name || "Customer",
      adresaPrim: shipping.address1,
      pttPrim: shipping.zip,
      telefonPrim: shipping.phone || "000000000",
      kontaktPrim: shipping.name || "Customer",

      nazivPos: config.senderName || shopDomain,
      adresaPos: config.senderAddress || "",
      pttPos: config.senderPostal || "",
      telefonPos: config.senderPhone || "",
      kontaktPos: config.senderContact || "",
    };

    // Create shipment with X-Express
    let xexpressResponse;
    try {
      xexpressResponse = await client.post("/najava/v2", [shipmentDto], {
        params: { rezervacija: false },
      });
    } catch (err: any) {
      console.error("X-Express API error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to create shipment with X-Express";
      return json({ error: errorMsg }, { status: 500, headers: corsHeaders });
    }

    const created = xexpressResponse.data?.[0];
    const shipmentCode = created?.PosiljkeDetaljno?.[0]?.sifra;

    if (!shipmentCode) {
      console.error("No shipment code returned:", created);
      return json(
        {
          error: "X-Express did not return a shipment code. Please check your configuration.",
          xexpress: created,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Save to database
    try {
      await prisma.shipment.create({
        data: {
          shop: shopDomain,
          orderId: String(order.id),
          orderName: order.name || String(order.id),
          sifraExt: shipmentDto.sifraExt,
          sifra: shipmentCode,
          status: created?.Status || null,
          trackingRaw: created || {},
        } as any,
      });
    } catch (dbErr) {
      console.error("Database error:", dbErr);
      // Shipment was created but not saved - still return success with warning
      return json(
        {
          ok: true,
          shipmentCode,
          warning: "Shipment created but database save failed",
          xexpress: created,
        },
        { headers: corsHeaders }
      );
    }

    console.log("[SERVER] Success! Returning shipment code:", shipmentCode);
    return json(
      {
        ok: true,
        shipmentCode,
        xexpress: created,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[SERVER] Unexpected error in create shipment:", error);
    return json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
