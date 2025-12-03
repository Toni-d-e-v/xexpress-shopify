import { json } from "@remix-run/server-runtime";
import prisma from "../db.server";
import { createXExpressClient } from "../utils/xexpress.client";

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) return json({ error: "orderId missing" }, { status: 400 });

  const shop = await prisma.shop.findFirst();
  if (!shop) return json({ error: "Shop not configured" }, { status: 400 });

  const shipment = await prisma.shipment.findFirst({
    where: { orderId: String(orderId), shopId: shop.id },
  });

  if (!shipment?.sifra) {
    return json({ error: "No shipment found" }, { status: 404 });
  }

  const client = createXExpressClient({
    username: shop.xUsername!,
    password: shop.xPassword!,
    env: (shop.xEnvironment as "test" | "prod") ?? "test",
  });

  const res = await client.get("/posiljkaTrack", {
    params: { sifra: shipment.sifra },
  });

  return json({
    shipment,
    tracking: res.data,
  });
}
