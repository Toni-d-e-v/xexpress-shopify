import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  AppProvider as AppBridgeProvider,
} from "@shopify/shopify-app-react-router/react";

export const loader = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppBridgeProvider apiKey={apiKey} isEmbeddedApp>
      <s-page>
        <s-section>
          <s-stack direction="inline" gap="base" alignment="center">
            <s-text variant="headingLg">X-Express</s-text>
            <s-spacer></s-spacer>
            <s-inline-stack gap="tight" alignment="end">
              <s-button
                variant="plain"
                onClick={() =>
                  window?.shopify?.redirect?.to
                    ? window.shopify.redirect.to({ url: "/app" })
                    : (window.location.href = "/app")
                }
              >
                Home
              </s-button>
              <s-button
                variant="plain"
                onClick={() =>
                  window?.shopify?.redirect?.to
                    ? window.shopify.redirect.to({ url: "/app/xexpress/settings" })
                    : (window.location.href = "/app/xexpress/settings")
                }
              >
                Settings
              </s-button>
            </s-inline-stack>
          </s-stack>
        </s-section>
        <Outlet />
      </s-page>
    </AppBridgeProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
export async function documentHeaderTemplate(...args) {
  const { addDocumentResponseHeaders } = await import("../shopify.server");
  return addDocumentResponseHeaders(...args);
}
