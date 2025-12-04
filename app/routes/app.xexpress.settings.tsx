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
      <s-section>
        <fetcher.Form method="post">
          <s-stack spacing="extraLarge">
            {/* API Credentials Group */}
            <s-stack spacing="large">
              <s-stack spacing="tight">
                <s-text variant="headingLg">API Credentials</s-text>
                <s-text variant="bodySm" tone="subdued">
                  Configure your X-Express API access
                </s-text>
              </s-stack>

              <s-stack spacing="base">
                <s-text-field
                  name="xUsername"
                  label="Username"
                  value={formState.xUsername}
                  onInput={handleChange("xUsername")}
                  required
                  helpText="Your X-Express API username"
                />
                <s-text-field
                  name="xPassword"
                  type="password"
                  label="Password"
                  value={formState.xPassword}
                  onInput={handleChange("xPassword")}
                  required
                  helpText="Your X-Express API password"
                />
              </s-stack>
            </s-stack>

            {/* Environment Selection Group */}
            <s-stack spacing="large">
              <s-stack spacing="tight">
                <s-text variant="headingLg">Environment</s-text>
                <s-text variant="bodySm" tone="subdued">
                  Choose which X-Express environment to use for shipments
                </s-text>
              </s-stack>

              <s-box padding="500" background="bg-surface-secondary" borderRadius="300">
                <s-stack spacing="large">
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                      padding: "16px",
                      borderRadius: "8px",
                      backgroundColor: formState.environment === "test" ? "rgba(0, 128, 96, 0.12)" : "transparent",
                      border: formState.environment === "test" ? "2px solid rgba(0, 128, 96, 0.3)" : "2px solid transparent",
                      transition: "all 0.2s ease"
                    }}>
                      <input
                        type="radio"
                        name="environment"
                        value="test"
                        checked={formState.environment === "test"}
                        onChange={handleEnvironmentChange}
                        style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#008060" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "15px", fontWeight: formState.environment === "test" ? "600" : "400", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "20px" }}>🧪</span>
                          Test Environment
                        </span>
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>
                          Use for testing shipments without real transactions
                        </span>
                      </div>
                    </label>

                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                      padding: "16px",
                      borderRadius: "8px",
                      backgroundColor: formState.environment === "prod" ? "rgba(142, 31, 11, 0.12)" : "transparent",
                      border: formState.environment === "prod" ? "2px solid rgba(142, 31, 11, 0.3)" : "2px solid transparent",
                      transition: "all 0.2s ease"
                    }}>
                      <input
                        type="radio"
                        name="environment"
                        value="prod"
                        checked={formState.environment === "prod"}
                        onChange={handleEnvironmentChange}
                        style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#8E1F0B" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "15px", fontWeight: formState.environment === "prod" ? "600" : "400", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "20px" }}>🚀</span>
                          Production Environment
                        </span>
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>
                          Use for real shipments with actual transactions
                        </span>
                      </div>
                    </label>
                  </div>

                  <s-banner tone={formState.environment === "prod" ? "warning" : "info"}>
                    <s-text variant="bodyMd" fontWeight="semibold">
                      Currently selected: {formState.environment === "prod" ? "Production" : "Test"}
                    </s-text>
                  </s-banner>
                </s-stack>
              </s-box>
            </s-stack>

          <s-divider spacing="extraLarge" />

          {/* Sender Information Group */}
          <s-stack spacing="large">
            <s-stack spacing="tight">
              <s-text variant="headingLg">Sender Information</s-text>
              <s-text variant="bodySm" tone="subdued">
                Default sender details that will be used for all X-Express shipments
              </s-text>
            </s-stack>

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
            <s-box
              padding="500"
              borderWidth="025"
              borderColor="border"
              borderRadius="300"
              background="bg-surface"
            >
              <s-inline-stack alignment="space-between" blockAlignment="center" gap="large">
                <s-stack spacing="tight">
                  <s-text variant="bodyLg" fontWeight="semibold">
                    Ready to save?
                  </s-text>
                  <s-text variant="bodySm" tone="subdued">
                    All changes will be applied immediately
                  </s-text>
                </s-stack>
                <s-button
                  type="submit"
                  variant="primary"
                  size="large"
                  {...(fetcher.state === "submitting" ? { loading: true } : {})}
                >
                  {fetcher.state === "submitting" ? "Saving..." : "Save Settings"}
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
