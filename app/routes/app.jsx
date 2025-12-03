import { Link, Outlet, useLoaderData, useRouteError } from "react-router";
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
  const { apiKey, host } = useLoaderData();

  const goTo = (event, url) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    const absoluteUrl = new URL(url, window.location.origin);
    if (host) {
      absoluteUrl.searchParams.set("host", host);
    }

    if (window?.shopify?.redirect?.to) {
      window.shopify.redirect.to({ url: absoluteUrl.toString() });
      return;
    }

    window.location.assign(absoluteUrl.toString());
  };

  return (
    <AppBridgeProvider apiKey={apiKey} host={host} isEmbeddedApp>
      <ui-nav-menu>
        <Link
          prefetch="intent"
          to={`/app${host ? `?host=${host}` : ""}`}
          onClick={(event) => goTo(event, "/app")}
        >
          Home
        </Link>
        <Link
          prefetch="intent"
          to={`/app/xexpress/settings${host ? `?host=${host}` : ""}`}
          onClick={(event) => goTo(event, "/app/xexpress/settings")}
        >
          Settings
        </Link>
        <Link
          prefetch="intent"
          to={`/app/xexpress/create${host ? `?host=${host}` : ""}`}
          onClick={(event) => goTo(event, "/app/xexpress/create")}
        >
          Create shipment
        </Link>
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
