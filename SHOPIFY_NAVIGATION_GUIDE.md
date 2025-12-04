# Shopify Embedded App Navigation Guide

This document explains the correct architecture for Shopify embedded apps based on the official template.

## ✅ CORRECT Navigation Patterns

### 1. **Navigation Menu** (app.jsx)

```javascript
<AppProvider embedded apiKey={apiKey}>
  <s-app-nav>
    <s-link href="/app">Home</s-link>
    <s-link href="/app/settings">Settings</s-link>
  </s-app-nav>
  <Outlet />
</AppProvider>
```

### 2. **Navigation Buttons** (use `href` attribute)

```javascript
// ✅ CORRECT
<s-button href="/app/settings">
  Go to Settings
</s-button>

// ❌ WRONG - Don't wrap in s-link
<s-link href="/app/settings">
  <s-button>Settings</s-button>
</s-link>
```

### 3. **Action Buttons** (use `onClick`)

```javascript
// ✅ CORRECT
<s-button onClick={handleSubmit}>
  Save
</s-button>

<s-button onClick={runTest} variant="tertiary">
  Run Test
</s-button>
```

### 4. **Text Links** (in paragraphs or lists)

```javascript
// ✅ CORRECT
<s-link href="/app/settings">
  API Settings
</s-link>

// External links
<s-link href="https://example.com" target="_blank">
  Documentation
</s-link>
```

### 5. **Sidebar** (use `slot="aside"`)

```javascript
<s-section slot="aside" heading="Quick Links">
  <s-unordered-list>
    <s-list-item>
      <s-link href="/app/settings">Settings</s-link>
    </s-list-item>
  </s-unordered-list>
</s-section>
```

## 📁 File Structure

### app/root.jsx

```javascript
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

**Important:**
- ❌ NO `<script src="https://cdn.shopify.com/shopifycloud/app-bridge.js">`
- ❌ NO `import "@shopify/polaris/build/esm/styles.css"`
- App Bridge is loaded automatically by React Router

### app/routes/app.jsx

```javascript
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

export const loader = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
        <s-link href="/app/settings">Settings</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
```

### Page Components (app._index.jsx, etc.)

```javascript
import { useEffect } from "react";
import { useFetcher } from "react-router";
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
  return { success: true };
};

export default function MyPage() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Success!");
    }
  }, [fetcher.data, shopify]);

  const handleAction = () => fetcher.submit({}, { method: "POST" });

  return (
    <s-page heading="My Page">
      <s-section heading="Main Content">
        <s-button href="/app/other-page">
          Navigate
        </s-button>

        <s-button onClick={handleAction}>
          Do Action
        </s-button>
      </s-section>

      <s-section slot="aside" heading="Sidebar">
        <s-link href="/app/settings">Settings</s-link>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
```

## 🔑 Key Principles

1. **`<s-button href="...">`** for navigation buttons
2. **`<s-button onClick={...}>`** for action buttons
3. **`<s-link href="...">`** for text links
4. **`useAppBridge()`** for toast notifications and App Bridge features
5. **`<AppProvider embedded>`** (NOT `isEmbeddedApp`)
6. **`<s-app-nav>`** for top navigation menu
7. **`slot="aside"`** for sidebar sections

## ❌ Common Mistakes

1. Wrapping `<s-button>` in `<s-link>`
2. Using `window.shopify.redirect.to()` or `window.location.href`
3. Using `useNavigate()` from react-router directly
4. Adding App Bridge script to root.jsx
5. Importing Polaris CSS in root.jsx
6. Using `isEmbeddedApp` instead of `embedded`
7. Not using `useAppBridge()` for toast notifications

## 📚 Official Resources

- [Shopify App Template](https://github.com/Shopify/shopify-app-template-react-router)
- [Shopify App React Router Docs](https://shopify.dev/docs/api/shopify-app-react-router/latest)
- [App Bridge React](https://shopify.dev/docs/api/app-bridge-react)

## ✅ Complete Working Example

See the current codebase:
- `/app/root.jsx` - Root layout
- `/app/routes/app.jsx` - App provider and navigation
- `/app/routes/app._index.jsx` - Home page example
- `/app/routes/app.xexpress.settings.tsx` - Settings page example
- `/app/routes/app.xexpress.create.tsx` - Create page example

All navigation is now properly configured to work in embedded Shopify Admin context without authentication loops!
