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

  // Debug: log what we received
  console.log("Form data received:");
  console.log("  xUsername:", form.get("xUsername"));
  console.log("  environment:", form.get("environment"));

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

  console.log("Saving to database:", data);

  await prisma.shopConfig.upsert({
    where: { shop },
    create: { shop, ...data },
    update: data,
  });

  console.log("Saved successfully");

  return Response.json({ success: true, config: data });
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

  // Sync formState with config when it changes
  useEffect(() => {
    if (config) {
      setFormState({
        xUsername: config.xUsername ?? "",
        xPassword: config.xPassword ?? "",
        environment: config.environment ?? "test",
        senderName: config.senderName ?? "",
        senderAddress: config.senderAddress ?? "",
        senderPostal: config.senderPostal ?? "",
        senderPhone: config.senderPhone ?? "",
        senderContact: config.senderContact ?? "",
      });
    }
  }, [config]);

  // Show toast when saved
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.state, fetcher.data, shopify]);

  const handleChange = (field: string) => (event: any) => {
    const value = event?.target?.value ?? "";
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleEnvironmentChange = (event: any) => {
    const value = event.target.value;
    console.log("Environment changed to:", value);
    setFormState((prev) => {
      const newState = { ...prev, environment: value };
      console.log("New formState:", newState);
      return newState;
    });
  };

  return (
    <s-page heading="X-Express Settings">
      <s-section heading="API credentials">
        <fetcher.Form method="post">
          <s-stack spacing="large">
            {/* API Credentials Group */}
            <s-stack spacing="base">
              <s-text variant="headingSm">API Credentials</s-text>
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
            </s-stack>

            {/* Environment Selection Group */}
            <s-stack spacing="base">
              <s-text variant="headingSm">Environment</s-text>
              <s-box padding="400" background="bg-surface-secondary" borderRadius="200">
                <s-stack spacing="base">
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "8px", borderRadius: "4px", backgroundColor: formState.environment === "test" ? "rgba(0, 128, 96, 0.1)" : "transparent" }}>
                      <input
                        type="radio"
                        name="environment"
                        value="test"
                        checked={formState.environment === "test"}
                        onChange={handleEnvironmentChange}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px", fontWeight: formState.environment === "test" ? "600" : "400" }}>
                        🧪 Test Environment
                      </span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "8px", borderRadius: "4px", backgroundColor: formState.environment === "prod" ? "rgba(142, 31, 11, 0.1)" : "transparent" }}>
                      <input
                        type="radio"
                        name="environment"
                        value="prod"
                        checked={formState.environment === "prod"}
                        onChange={handleEnvironmentChange}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <span style={{ fontSize: "14px", fontWeight: formState.environment === "prod" ? "600" : "400" }}>
                        🚀 Production Environment
                      </span>
                    </label>
                  </div>

                  <s-banner tone={formState.environment === "prod" ? "warning" : "info"}>
                    <s-text variant="bodySm" fontWeight="semibold">
                      Currently selected: {formState.environment === "prod" ? "Production" : "Test"}
                    </s-text>
                  </s-banner>
                </s-stack>
              </s-box>
            </s-stack>
          </s-stack>

          <s-divider spacing="large" />

          {/* Sender Information Group */}
          <s-stack spacing="large">
            <s-stack spacing="base">
              <s-text variant="headingSm">Sender Information</s-text>
              <s-text variant="bodySm" tone="subdued">
                Default sender details for X-Express shipments
              </s-text>

              <s-stack spacing="base">
                <s-text-field
                  name="senderName"
                  label="Sender name"
                  value={formState.senderName}
                  onInput={handleChange("senderName")}
                  helpText="Your company or personal name"
                />
                <s-text-field
                  name="senderAddress"
                  label="Sender address"
                  value={formState.senderAddress}
                  onInput={handleChange("senderAddress")}
                  helpText="Full street address"
                />
                <s-text-field
                  name="senderPostal"
                  label="Sender postal code"
                  value={formState.senderPostal}
                  onInput={handleChange("senderPostal")}
                  helpText="ZIP or postal code"
                />
                <s-text-field
                  name="senderPhone"
                  label="Sender phone"
                  value={formState.senderPhone}
                  onInput={handleChange("senderPhone")}
                  helpText="Contact phone number"
                />
                <s-text-field
                  name="senderContact"
                  label="Sender contact person"
                  value={formState.senderContact}
                  onInput={handleChange("senderContact")}
                  helpText="Name of contact person"
                />
              </s-stack>
            </s-stack>

            {/* Save Button */}
            <s-box padding="400" borderWidth="025" borderColor="border" borderRadius="200">
              <s-inline-stack alignment="space-between" blockAlignment="center">
                <s-text variant="bodyMd" tone="subdued">
                  Save changes to apply new settings
                </s-text>
                <s-button
                  type="submit"
                  variant="primary"
                  size="large"
                  {...(fetcher.state === "submitting" ? { loading: true } : {})}
                >
                  Save Settings
                </s-button>
              </s-inline-stack>
            </s-box>
          </s-stack>
        </fetcher.Form>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs: any) => boundary.headers(headersArgs);
