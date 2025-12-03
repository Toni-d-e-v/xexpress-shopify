import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  AppProvider as AppBridgeProvider,
} from "@shopify/shopify-app-react-router/react";

import { addDocumentResponseHeaders, authenticate } from "../shopify.server";

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
            <Link to="/app/xexpress/settings">Settings</Link>
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
export const documentHeaderTemplate = addDocumentResponseHeaders;
