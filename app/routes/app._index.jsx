import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  await authenticate.admin(request);

  return { ok: true };
};

export default function XExpressHome() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("Test successful");
    }
  }, [fetcher.data, shopify]);

  const runTest = () => fetcher.submit({}, { method: "POST" });

  return (
    <s-page heading="X-Express Shipping">
      <s-section heading="Welcome to X-Express Integration">
        <s-paragraph>
          This app allows you to generate X-Express shipping labels directly from Shopify.
        </s-paragraph>

        <s-paragraph>
          Configure your API credentials, sender info, and generate shipments directly from orders.
        </s-paragraph>

        <s-stack direction="inline" gap="base">
          <s-link href="/app/xexpress/settings">
            <s-button>Settings</s-button>
          </s-link>

          <s-link href="/app/xexpress/create">
            <s-button>Create Shipment</s-button>
          </s-link>

          <s-button onClick={runTest} variant="tertiary" {...(fetcher.state === "submitting" ? { loading: true } : {})}>
            Run test
          </s-button>
        </s-stack>
      </s-section>

      <s-section heading="How it works">
        <s-paragraph>
          • Sync order details → send to X-Express API
        </s-paragraph>
        <s-paragraph>
          • Generate and print labels inside Shopify
        </s-paragraph>
        <s-paragraph>
          • Store tracking numbers on the order
        </s-paragraph>
        <s-paragraph>
          • Auto-notify customers via X-Express
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Quick Links">
        <s-unordered-list>
          <s-list-item>
            <s-link href="/app/xexpress/settings">
              API Settings
            </s-link>
          </s-list-item>
          <s-list-item>
            <s-link href="/app/xexpress/create">
              Create Shipment
            </s-link>
          </s-list-item>
          <s-list-item>
            <s-link
              target="_blank"
              href="https://xexpress.ba"
            >
              X-Express Website
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
