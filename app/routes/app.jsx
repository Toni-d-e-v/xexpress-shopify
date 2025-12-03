import { Outlet, useLoaderData, useRouteError, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  AppProvider as AppBridgeProvider,
} from "@shopify/shopify-app-react-router/react";

import { AppProvider as PolarisProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppBridgeProvider apiKey={apiKey} isEmbeddedApp>
      <PolarisProvider i18n={enTranslations}>

        {/* SAFE NAVIGATION BAR */}
        <nav style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
          <Link to="/app/xexpress/settings">Settings</Link>
        </nav>

        <Outlet />
      </PolarisProvider>
    </AppBridgeProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
