// app/routes/app.xexpress.create.tsx
import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import shopify from "../shopify.server";
import { createXExpressClient } from "../utils/xexpress.client";

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const body = await request.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;

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

  // 1. Učitaj order iz Shopify Admin API
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

  // 2. Konfiguracija klijenta prema env
  const client = createXExpressClient({
    username: config.xUsername,
    password: config.xPassword,
    env:
      (config.environment as "prod" | "test") === "prod"
        ? "prod"
        : "test",
  });

  // 3. PosiljkaDto – minimalna mapa
  const sifraExt = order.name; // npr #1001

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

  // 4. Poziv X-Express /najava/v2
  const apiRes = await client.post("/najava/v2", [shipmentDto], {
    params: { rezervacija: false },
  });

  const payload = apiRes.data?.[0];
  const detail = payload?.PosiljkeDetaljno?.[0];
  const sifra = detail?.sifra as string | undefined;

  // 5. Spremi u Shipment tabelu
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

export default null;
