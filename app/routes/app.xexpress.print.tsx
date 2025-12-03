// app/routes/app.xexpress.print.tsx
import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import shopify from "../shopify.server";
import { createXExpressClient } from "../utils/xexpress.client";

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const body = await request.json().catch(() => null);
  const sifra = body?.sifra as string | undefined;

  if (!sifra) {
    return Response.json({ error: "sifra missing" }, { status: 400 });
  }

  const config = await prisma.shopConfig.findUnique({ where: { shop } });
  if (!config || !config.xUsername || !config.xPassword) {
    return Response.json({ error: "X-Express not configured" }, { status: 400 });
  }

  const client = createXExpressClient({
    username: config.xUsername,
    password: config.xPassword,
    env:
      (config.environment as "prod" | "test") === "prod"
        ? "prod"
        : "test",
  });

  const res = await client.post(
    "/print",
    {
      sifre: [sifra],
      referentniBrojevi: [],
    },
    {
      params: { tip: "Thermal_102" }, // promijeni ako želiš drugi format
      responseType: "arraybuffer",
    }
  );

  return new Response(res.data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="xexpress-label-${sifra}.pdf"`,
    },
  });
}

export default null;
