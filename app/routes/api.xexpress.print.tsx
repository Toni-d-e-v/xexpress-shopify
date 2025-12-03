import { json } from "@remix-run/server-runtime";import prisma from "../db.server";
import { createXExpressClient } from "../utils/xexpress.client";

export async function action({ request }: any) {
  const { sifra } = await request.json();

  const shop = await prisma.shop.findFirst();
  if (!shop) return new Response("Shop not configured", { status: 400 });

  const client = createXExpressClient({
    username: shop.xUsername!,
    password: shop.xPassword!,
    env: (shop.xEnvironment as "test" | "prod") ?? "test",
  });

  const res = await client.post(
    "/print",
    { sifre: [sifra], referentniBrojevi: [] },
    { params: { tip: "Thermal_102" }, responseType: "arraybuffer" }
  );

  return new Response(res.data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="label-${sifra}.pdf"`,
    },
  });
}
