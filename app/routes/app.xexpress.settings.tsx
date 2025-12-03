import { useLoaderData, useFetcher } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Page, Card, Layout, TextField, Select, Button } from "@shopify/polaris";
import { useState, useCallback, useEffect } from "react";

import prisma from "../db.server";
import shopify from "../shopify.server";

// Loader – učita konfiguraciju
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const config = await prisma.shopConfig.findUnique({
    where: { shop },
  });

  return { shop, config };
}

// Action – spremi konfiguraciju
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const form = await request.formData();

  const data = {
    xUsername: form.get("xUsername") as string,
    xPassword: form.get("xPassword") as string,
    environment: (form.get("environment") as string) || "test",
    senderName: form.get("senderName") as string,
    senderAddress: form.get("senderAddress") as string,
    senderPostal: form.get("senderPostal") as string,
    senderPhone: form.get("senderPhone") as string,
    senderContact: form.get("senderContact") as string,
  };

  await prisma.shopConfig.upsert({
    where: { shop },
    create: { shop, ...data },
    update: data,
  });

  // Ovo je OK jer fetcher neće izgubiti session
  return Response.json({ success: true });
}

export default function XExpressSettingsPage() {
  const { config } = useLoaderData() as any;
  const fetcher = useFetcher();

  // Controlled Polaris form state
  const [formState, setFormState] = useState({
    xUsername: config?.xUsername ?? "",
    xPassword: config?.xPassword ?? "",
    environment: config?.environment ?? "test",
    senderName: config?.senderName ?? "",
    senderAddress: config?.senderAddress ?? "",
    senderPostal: config?.senderPostal ?? "",
    senderPhone: config?.senderPhone ?? "",
    senderContact: config?.senderContact ?? "",
  });

  const handleChange = useCallback(
    (field: string) => (value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return (
    <Page title="X-Express Settings">
      <Layout>
        <Layout.Section>

          <fetcher.Form method="post">

            <Card title="X-Express API credentials" sectioned>
              <TextField
                label="Username"
                name="xUsername"
                autoComplete="off"
                value={formState.xUsername}
                onChange={handleChange("xUsername")}
              />

              <TextField
                label="Password"
                name="xPassword"
                type="password"
                autoComplete="off"
                value={formState.xPassword}
                onChange={handleChange("xPassword")}
              />

              <Select
                label="Environment"
                name="environment"
                options={[
                  { label: "Test", value: "test" },
                  { label: "Production", value: "prod" },
                ]}
                value={formState.environment}
                onChange={handleChange("environment")}
              />
            </Card>

            <Card title="Default sender info" sectioned>
              <TextField
                label="Sender name"
                name="senderName"
                value={formState.senderName}
                onChange={handleChange("senderName")}
              />

              <TextField
                label="Sender address"
                name="senderAddress"
                value={formState.senderAddress}
                onChange={handleChange("senderAddress")}
              />

              <TextField
                label="Sender postal code"
                name="senderPostal"
                value={formState.senderPostal}
                onChange={handleChange("senderPostal")}
              />

              <TextField
                label="Sender phone"
                name="senderPhone"
                value={formState.senderPhone}
                onChange={handleChange("senderPhone")}
              />

              <TextField
                label="Sender contact person"
                name="senderContact"
                value={formState.senderContact}
                onChange={handleChange("senderContact")}
              />
            </Card>

            <div style={{ marginTop: "1rem" }}>
              <Button submit primary>
                Save
              </Button>
            </div>

          </fetcher.Form>

        </Layout.Section>
      </Layout>
    </Page>
  );
}
