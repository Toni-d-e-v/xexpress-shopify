import { Outlet, useLoaderData, useNavigate, useRouteError } from "react-router";
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
  const navigate = useNavigate();

  const goTo = (event, url) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (window?.shopify?.redirect?.to) {
      window.shopify.redirect.to({ url });
      return;
    }

    navigate(url);
  };

  return (
    <AppBridgeProvider apiKey={apiKey} isEmbeddedApp>
      <ui-nav-menu>
        <a href="/app" onClick={(event) => goTo(event, "/app")}>Home</a>
        <a href="/app/xexpress/settings" onClick={(event) => goTo(event, "/app/xexpress/settings")}>Settings</a>
        <a href="/app/xexpress/create" onClick={(event) => goTo(event, "/app/xexpress/create")}>Create shipment</a>
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
