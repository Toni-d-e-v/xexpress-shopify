// app/routes/app.xexpress.create.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import prisma from "../db.server";
import shopify from "../shopify.server";
import { createXExpressClient } from "../utils/xexpress.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const config = await prisma.shopConfig.findUnique({ where: { shop } });

  return { hasConfig: Boolean(config?.xUsername && config?.xPassword) };
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { admin, session } = await shopify.authenticate.admin(request);
    const shop = session.shop;

    let orderId: string | undefined;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null);
      orderId = body?.orderId as string | undefined;
    } else {
      const form = await request.formData();
      orderId = (form.get("orderId") as string) || undefined;
    }

    if (!orderId) {
      return Response.json({ error: "orderId missing" }, { status: 400 });
    }

    // Extract numeric ID from GraphQL GID format
    // e.g., "gid://shopify/Order/123456789" -> "123456789"
    if (orderId.includes("gid://shopify/Order/")) {
      orderId = orderId.split("/").pop();
    }

    const config = await prisma.shopConfig.findUnique({ where: { shop } });
    if (!config || !config.xUsername || !config.xPassword) {
      return Response.json(
        { error: "X-Express not configured for this shop" },
        { status: 400 }
      );
    }

    // Fetch order from Shopify
    let orderRes;
    try {
      orderRes = await admin.rest.get({
        path: `orders/${orderId}`,
      });
    } catch (err) {
      console.error("Failed to fetch order from Shopify:", err);
      return Response.json(
        { error: `Order not found or inaccessible: ${orderId}` },
        { status: 404 }
      );
    }

    // @ts-ignore – Shopify SDK response typing
    const order = orderRes.body.order;

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate shipping address
    const shipping = order.shipping_address;
    if (!shipping || !shipping.address1 || !shipping.zip) {
      return Response.json(
        { error: "Order is missing required shipping address information" },
        { status: 400 }
      );
    }

    const client = createXExpressClient({
      username: config.xUsername,
      password: config.xPassword,
      env:
        (config.environment as "prod" | "test") === "prod"
          ? "prod"
          : "test",
    });

    const sifraExt = order.name || `Order-${order.id}`;

    const shipmentDto = {
      sifraExt,
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

      nazivPos: config.senderName || shop,
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
      return Response.json({ error: errorMsg }, { status: 500 });
    }

    const payload = xexpressResponse.data?.[0];
    const sifra = payload?.PosiljkeDetaljno?.[0]?.sifra as string | undefined;

    if (!sifra) {
      console.error("No shipment code returned:", payload);
      return Response.json(
        {
          error: "X-Express did not return a shipment code. Please check your configuration.",
          xexpress: payload,
        },
        { status: 500 }
      );
    }

    // Save to database
    try {
      await prisma.shipment.create({
        data: {
          shop,
          orderId: String(order.id),
          orderName: order.name || String(order.id),
          sifraExt,
          sifra: sifra,
          status: payload?.Status || null,
          trackingRaw: payload || {},
        } as any,
      });
    } catch (dbErr) {
      console.error("Database error:", dbErr);
      // Shipment was created but not saved - still return success with warning
      return Response.json({
        ok: true,
        shipmentCode: sifra,
        warning: "Shipment created but database save failed",
        xexpress: payload,
      });
    }

    return Response.json({
      ok: true,
      shipmentCode: sifra,
      xexpress: payload,
    });
  } catch (error: any) {
    console.error("Unexpected error in create shipment:", error);
    return Response.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export default function CreateShipmentPage() {
  const { hasConfig } = useLoaderData() as { hasConfig: boolean };
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.shipmentCode) {
      shopify.toast.show(`Shipment created: ${fetcher.data.shipmentCode}`);
    }
  }, [fetcher.state, fetcher.data, shopify]);

  return (
    <s-page heading="Create X-Express shipment">
      <s-section>
        {!hasConfig && (
          <s-inline-stack spacing="tight" alignment="start">
            <s-text tone="critical">
              Configure your X-Express credentials first.
            </s-text>
            <s-button variant="primary" href="/app/xexpress/settings">
              Go to settings
            </s-button>
          </s-inline-stack>
        )}

        <fetcher.Form method="post">
          <s-stack spacing="base">
            <s-text-field
              name="orderId"
              label="Shopify order ID"
              placeholder="e.g. 1234567890"
              required
            />
            <s-button
              type="submit"
              variant="primary"
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "Creating..." : "Create shipment"}
            </s-button>
            {fetcher.data?.error && (
              <s-text tone="critical">{fetcher.data.error}</s-text>
            )}
            {fetcher.data?.shipmentCode && (
              <s-text tone="success">
                Shipment created with code {fetcher.data.shipmentCode}
              </s-text>
            )}
          </s-stack>
        </fetcher.Form>
      </s-section>
    </s-page>
  );
}
