import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

import prisma from "../db.server";
import shopify from "../shopify.server";

// Loader – učita konfiguraciju
export async function loader({ request }: LoaderFunctionArgs) {
  const [{ default: prisma }, { default: shopify }] = await Promise.all([
    import("../db.server"),
    import("../shopify.server"),
  ]);

  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const config = await prisma.shopConfig.findUnique({
    where: { shop },
  });

  return { shop, config };
}

// Action – spremi konfiguraciju
export async function action({ request }: ActionFunctionArgs) {
  const [{ default: prisma }, { default: shopify }] = await Promise.all([
    import("../db.server"),
    import("../shopify.server"),
  ]);

  const { session } = await shopify.authenticate.admin(request);
  const shop = session.shop;

  const form = await request.formData();

  const data = {
    xUsername: (form.get("xUsername") as string) || "",
    xPassword: (form.get("xPassword") as string) || "",
    environment: (form.get("environment") as string) || "test",
    senderName: (form.get("senderName") as string) || "",
    senderAddress: (form.get("senderAddress") as string) || "",
    senderPostal: (form.get("senderPostal") as string) || "",
    senderPhone: (form.get("senderPhone") as string) || "",
    senderContact: (form.get("senderContact") as string) || "",
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
  const shopify = useAppBridge();

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

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.state, fetcher.data, shopify]);

  const handleChange = (field: string) => (event: any) => {
    const value = event?.target?.value ?? "";
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <s-page heading="X-Express Settings">
      <s-section heading="API credentials">
        <fetcher.Form method="post">
          <s-stack spacing="base">
            <s-text-field
              name="xUsername"
              label="Username"
              value={formState.xUsername}
              onInput={handleChange("xUsername")}
              required
            />
            <s-text-field
              name="xPassword"
              type="password"
              label="Password"
              value={formState.xPassword}
              onInput={handleChange("xPassword")}
              required
            />
            <input type="hidden" name="environment" value={formState.environment} />
            <s-stack spacing="extraTight">
              <s-text variant="bodyMd" fontWeight="semibold">Environment</s-text>
              <s-choice-list
                value={formState.environment}
                onChange={(event: any) => {
                  const value = event?.detail?.value?.[0] || "test";
                  setFormState((prev) => ({ ...prev, environment: value }));
                }}
              >
                <s-choice value="test" checked={formState.environment === "test"}>
                  Test
                </s-choice>
                <s-choice value="prod" checked={formState.environment === "prod"}>
                  Production
                </s-choice>
              </s-choice-list>
            </s-stack>
          </s-stack>

          <s-divider spacing="base" />

          <s-stack spacing="base">
            <s-text-field
              name="senderName"
              label="Sender name"
              value={formState.senderName}
              onInput={handleChange("senderName")}
            />
            <s-text-field
              name="senderAddress"
              label="Sender address"
              value={formState.senderAddress}
              onInput={handleChange("senderAddress")}
            />
            <s-text-field
              name="senderPostal"
              label="Sender postal code"
              value={formState.senderPostal}
              onInput={handleChange("senderPostal")}
            />
            <s-text-field
              name="senderPhone"
              label="Sender phone"
              value={formState.senderPhone}
              onInput={handleChange("senderPhone")}
            />
            <s-text-field
              name="senderContact"
              label="Sender contact"
              value={formState.senderContact}
              onInput={handleChange("senderContact")}
            />
          </s-stack>

          <s-inline-stack alignment="end" spacing="base" style={{ marginTop: "16px" }}>
            <s-button
              variant="primary"
              submit
              {...(fetcher.state === "submitting" ? { loading: true } : {})}
            >
              Save
            </s-button>
          </s-inline-stack>
        </fetcher.Form>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => boundary.headers(headersArgs);
