import { Link, Outlet, useLoaderData, useRouteError } from "react-router";
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
      <ui-nav-menu>
        <Link to="/app">Home</Link>
        <Link to="/app/xexpress/settings">Settings</Link>
        <Link to="/app/xexpress/create">Create shipment</Link>
      </ui-nav-menu>
      <Outlet />
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
