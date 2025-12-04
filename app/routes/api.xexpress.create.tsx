import { json } from "@remix-run/server-runtime";import prisma from "../db.server";
import { createXExpressClient } from "../utils/xexpress.client";
import shopify from "../shopify.server";

export async function action({ request }: any) {
  const body = await request.json();
  let { orderId } = body;

  // Extract numeric ID from GraphQL GID format
  // e.g., "gid://shopify/Order/123456789" -> "123456789"
  if (orderId && orderId.includes("gid://shopify/Order/")) {
    orderId = orderId.split("/").pop();
  }

  const shop = await prisma.shop.findFirst();
  if (!shop) return json({ error: "Shop not configured" }, { status: 400 });

  // Fetch Shopify order via Admin API
  const { admin } = await shopify.authenticate.admin(request);
  const orderRes = await admin.rest.get({ path: `orders/${orderId}` });
  // @ts-ignore
  const order = orderRes.body.order;

  const client = createXExpressClient({
    username: shop.xUsername!,
    password: shop.xPassword!,
    env: (shop.xEnvironment as "test" | "prod") ?? "test",
  });

  const shipmentDto = {
    sifraExt: order.name,
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

    nazivPrim: order.shipping_address?.name,
    adresaPrim: order.shipping_address?.address1,
    pttPrim: order.shipping_address?.zip,
    telefonPrim: order.shipping_address?.phone ?? "000000000",
    kontaktPrim: order.shipping_address?.name,

    nazivPos: shop.senderName,
    adresaPos: shop.senderAddress,
    pttPos: shop.senderPostal,
    telefonPos: shop.senderPhone,
    kontaktPos: shop.senderContact,
  };

  const response = await client.post("/najava/v2", [shipmentDto]);
  const created = response.data?.[0];

  await prisma.shipment.create({
    data: {
      shopId: shop.id,
      orderId: String(order.id),
      orderName: order.name,
      sifraExt: shipmentDto.sifraExt,
      sifra: created?.PosiljkeDetaljno?.[0]?.sifra ?? null,
    },
  });

  return json({ ok: true, xexpress: created });
}
