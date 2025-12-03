// app/routes/app.xexpress.create.tsx
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { createXExpressClient } from "../utils/xexpress.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const [{ default: prisma }, { default: shopify }] = await Promise.all([
    import("../db.server"),
    import("../shopify.server"),
  ]);

  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const config = await prisma.shopConfig.findUnique({ where: { shop } });

  return { hasConfig: Boolean(config?.xUsername && config?.xPassword) };
}

export async function action({ request }: ActionFunctionArgs) {
  const [{ default: prisma }, { default: shopify }] = await Promise.all([
    import("../db.server"),
    import("../shopify.server"),
  ]);

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

  const config = await prisma.shopConfig.findUnique({ where: { shop } });
  if (!config || !config.xUsername || !config.xPassword) {
    return Response.json(
      { error: "X-Express not configured for this shop" },
      { status: 400 }
    );
  }

  const orderRes = await admin.rest.get({
    path: `orders/${orderId}`,
  });

  // @ts-ignore – Shopify SDK response typing
  const order = orderRes.body.order;

  const shipping = order.shipping_address;
  if (!shipping) {
    return Response.json(
      { error: "Order has no shipping address" },
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

  const sifraExt = order.name;

  const shipmentDto = {
    sifraExt,
    uslugaSifra: 1,
    opisPosiljke: order.line_items.map((i: any) => i.name).join(", "),
    tezina: 2,
    duzina: 20,
    sirina: 20,
    visina: 20,
    obveznikPlacanja: 1,
    nacinPlacanja: 1,
    brojPaketa: 1,
    vrednostPosiljke: Number(order.total_price),

    nazivPrim: shipping.name,
    adresaPrim: shipping.address1,
    pttPrim: shipping.zip,
    telefonPrim: shipping.phone ?? "000000000",
    kontaktPrim: shipping.name,

    nazivPos: config.senderName ?? shop,
    adresaPos: config.senderAddress ?? "",
    pttPos: config.senderPostal ?? "",
    telefonPos: config.senderPhone ?? "",
    kontaktPos: config.senderContact ?? "",
  };

  const apiRes = await client.post("/najava/v2", [shipmentDto], {
    params: { rezervacija: false },
  });

  const payload = apiRes.data?.[0];
  const detail = payload?.PosiljkeDetaljno?.[0];
  const sifra = detail?.sifra as string | undefined;

  await prisma.shipment.create({
    data: {
      shop,
      orderId: String(order.id),
      orderName: order.name ?? String(order.id),
      sifraExt,
      sifra: sifra ?? null,
      status: payload?.Status ?? null,
      trackingRaw: payload ?? {},
    } as any,
  });

  return Response.json({
    ok: true,
    shipmentCode: sifra,
    xexpress: payload,
  });
}

export const headers = (headersArgs: any) => boundary.headers(headersArgs);

export default function CreateShipmentPage() {
  const { hasConfig } = useLoaderData() as { hasConfig: boolean };
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.shipmentCode) {
      window?.shopify?.toast?.show?.(
        `Shipment created: ${fetcher.data.shipmentCode}`
      );
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <s-page heading="Create X-Express shipment">
      <s-section>
        {!hasConfig && (
          <s-inline-stack spacing="tight" alignment="start">
            <s-text tone="critical">
              Configure your X-Express credentials first.
            </s-text>
            <s-button
              variant="primary"
              onClick={() =>
                window?.shopify?.redirect?.to
                  ? window.shopify.redirect.to({ url: "/app/xexpress/settings" })
                  : (window.location.href = "/app/xexpress/settings")
              }
            >
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
              variant="primary"
              submit
              {...(fetcher.state === "submitting" ? { loading: true } : {})}
            >
              Create shipment
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
