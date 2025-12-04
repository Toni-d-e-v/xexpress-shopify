# Create X-Express Extension - Step by Step

## Step 1: Delete Current Broken Extension

```bash
rm -rf extensions/xexpress-order-action
```

## Step 2: Create New Extension with Shopify CLI

```bash
npm run generate extension
```

When prompted:
- **Type of extension**: Choose `Admin Action - UI Extension`
- **Name**: `xexpress-order-action`
- **Framework**: Choose `Preact`

## Step 3: Replace the Generated ActionExtension.jsx

Navigate to: `extensions/xexpress-order-action/src/ActionExtension.jsx`

Replace the entire file content with:

```jsx
import { render } from "preact";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { data, close } = shopify;
  const orderId = data?.selected?.[0]?.id;

  async function createShipment() {
    if (!orderId) {
      shopify.toast.show("No order selected", { isError: true });
      return;
    }

    const loadingToast = shopify.toast.show("Creating shipment...");

    try {
      const response = await shopify.authenticatedFetch("/api/xexpress/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.ok) {
        loadingToast.hide();
        shopify.toast.show(`Shipment created: ${result.shipmentCode}`, { duration: 5000 });
        close();
      } else {
        throw new Error(result.error || "Failed to create shipment");
      }
    } catch (error) {
      loadingToast.hide();
      shopify.toast.show(error.message || "Error creating shipment", {
        isError: true,
        duration: 5000,
      });
    }
  }

  return (
    <s-admin-action>
      <s-stack direction="block">
        <s-text variant="headingMd">X-Express Shipping</s-text>
        {orderId ? (
          <s-text>Create X-Express shipment for this order?</s-text>
        ) : (
          <s-text>No order found.</s-text>
        )}
      </s-stack>

      <s-button slot="primary-action" onClick={createShipment}>
        Create Shipment
      </s-button>

      <s-button slot="secondary-actions" onClick={close}>
        Cancel
      </s-button>
    </s-admin-action>
  );
}
```

## Step 4: Update Extension Config

Open: `extensions/xexpress-order-action/shopify.extension.toml`

Make sure the target is set to orders (not products):

```toml
api_version = "2025-10"

[[extensions]]
name = "t:name"
handle = "xexpress-order-action"
type = "ui_extension"

[[extensions.targeting]]
module = "./src/ActionExtension.jsx"
target = "admin.order-details.action.render"
```

**Important**: The target MUST be `admin.order-details.action.render` (for order pages), NOT `admin.product-details.action.render`.

## Step 5: Update Locale File (Optional)

Open: `extensions/xexpress-order-action/locales/en.default.json`

```json
{
  "name": "X-Express Shipping"
}
```

## Step 6: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
shopify app dev
```

## Step 7: Test

1. Open Shopify admin
2. Go to any order page
3. Click "More actions" (three dots)
4. Click "X-Express Shipping"
5. The modal should appear instantly with the form

## Troubleshooting

If you still see infinite loading:

1. **Check dev server output** for build errors
2. **Hard refresh browser** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Open browser console** (F12) and look for errors
4. **Verify the extension is listed** by running:
   ```bash
   shopify app info
   ```

## Expected Behavior

✅ Modal appears immediately (no loading spinner)
✅ Shows order information
✅ "Create Shipment" button works
✅ Shows loading toast while creating
✅ Shows success/error message
✅ Closes modal on success
