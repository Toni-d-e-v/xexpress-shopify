// app/routes/app.xexpress.track.tsx
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { Page, Card, Layout, ResourceList, Text } from "@shopify/polaris";

import prisma from "../db.server";
import shopify from "../shopify.server";
import { createXExpressClient } from "../utils/xexpress.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    return Response.json({ error: "orderId missing" }, { status: 400 });
  }

  const config = await prisma.shopConfig.findUnique({ where: { shop } });
  if (!config || !config.xUsername || !config.xPassword) {
    return Response.json({ error: "X-Express not configured" }, { status: 400 });
  }

  const shipment = await prisma.shipment.findFirst({
    where: { shop, orderId: String(orderId) },
  });

  if (!shipment?.sifra) {
    return Response.json({ error: "No shipment found for this order" }, { status: 404 });
  }

  const client = createXExpressClient({
    username: config.xUsername,
    password: config.xPassword,
    env:
      (config.environment as "prod" | "test") === "prod"
        ? "prod"
        : "test",
  });

  const apiRes = await client.get("/posiljkaTrack", {
    params: { sifra: shipment.sifra },
  });

  return Response.json({
    shipment,
    tracking: apiRes.data,
  });
}

export default function XExpressTrackPage() {
  const data = useLoaderData() as any;
  const shipment = data?.shipment;
  const events = (data?.tracking || []) as Array<{
    datum: string;
    sifra: number;
    naziv: string;
  }>;

  return (
    <Page title={`X-Express Tracking: ${shipment?.sifra ?? ""}`}>
      <Layout>
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text as="h2" variant="bodyLg">
                Order: {shipment?.orderName ?? shipment?.orderId}
              </Text>
              <Text as="p" variant="bodyMd">
                Shipment code: {shipment?.sifra}
              </Text>
            </Card.Section>
            <Card.Section title="Events">
              {events.length === 0 ? (
                <Text as="p">No tracking events yet.</Text>
              ) : (
                <ResourceList
                  resourceName={{ singular: "event", plural: "events" }}
                  items={events}
                  renderItem={(item) => {
                    const { datum, sifra, naziv } = item;
                    return (
                      <ResourceList.Item id={datum + sifra}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <Text as="span" variant="bodySm">
                            {new Date(datum).toLocaleString()}
                          </Text>
                          <Text as="span" variant="bodySm">
                            [{sifra}]
                          </Text>
                          <Text as="span" variant="bodyMd">
                            {naziv}
                          </Text>
                        </div>
                      </ResourceList.Item>
                    );
                  }}
                />
              )}
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
