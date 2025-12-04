import { Outlet, useLoaderData, useRouteError, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  AppProvider as AppBridgeProvider,
} from "@shopify/shopify-app-react-router/react";

export const loader = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  await authenticate.admin(request);

  const url = new URL(request.url);
  const host = url.searchParams.get("host") || "";

  return { apiKey: process.env.SHOPIFY_API_KEY || "", host };
};

export default function App() {
  const { apiKey } = useLoaderData();
  const navigate = useNavigate();

  return (
    <AppBridgeProvider apiKey={apiKey} isEmbeddedApp>
      <s-page>
        <s-section>
          <s-stack direction="inline" gap="base" alignment="center">
            <s-text variant="headingLg">X-Express</s-text>
            <s-spacer></s-spacer>
            <s-button variant="plain" onClick={() => navigate("/app/xexpress/settings")}>
              Settings
            </s-button>
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
