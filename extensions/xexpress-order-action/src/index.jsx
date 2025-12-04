import { render } from "preact";
import { useState } from "preact/hooks";

export default async () => {
  try {
    console.log("[Extension] Starting to render");
    render(<Extension />, document.body);
    console.log("[Extension] Render complete");
  } catch (error) {
    console.error("[Extension] Failed to render:", error);
  }
};

function Extension() {
  try {
    console.log("[Extension] Extension component mounting");

    const { data, close } = shopify;
    const [loading, setLoading] = useState(false);

    const orderId = data?.selected?.[0]?.id || "";
    const orderNumber = orderId ? String(orderId).split("/").pop() : "Unknown";

    console.log("[Extension] Order ID:", orderId);
    console.log("[Extension] Order Number:", orderNumber);

    async function createShipment() {
      console.log("[Extension] Button clicked");

      if (!orderId) {
        shopify.toast.show("No order selected", { isError: true });
        return;
      }

      try {
        setLoading(true);
        console.log("[Extension] Making API call");

        const response = await shopify.authenticatedFetch("/api/xexpress/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        console.log("[Extension] Response:", response.status, response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Extension] Error:", errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}` };
          }
          throw new Error(errorData.error || "Request failed");
        }

        const result = await response.json();
        console.log("[Extension] Result:", result);

        if (result.ok) {
          shopify.toast.show(`Shipment: ${result.shipmentCode}`, { duration: 5000 });
          close();
        } else {
          throw new Error(result.error || "Failed");
        }
      } catch (err) {
        console.error("[Extension] Catch error:", err);
        shopify.toast.show(err.message || "Error", { isError: true, duration: 5000 });
      } finally {
        setLoading(false);
      }
    }

    return (
      <s-admin-action>
        <s-stack direction="block">
          <s-text variant="headingMd">X-Express Shipping</s-text>
          <s-text>Create shipment for order {orderNumber}?</s-text>
        </s-stack>

        <s-button slot="primary-action" onClick={createShipment} disabled={loading}>
          {loading ? "Creating..." : "Create Shipment"}
        </s-button>

        <s-button slot="secondary-actions" onClick={close}>
          Cancel
        </s-button>
      </s-admin-action>
    );
  } catch (error) {
    console.error("[Extension] Component error:", error);
    return (
      <s-admin-action>
        <s-text>Error loading extension. Check console.</s-text>
        <s-button slot="secondary-actions" onClick={() => shopify.close()}>
          Close
        </s-button>
      </s-admin-action>
    );
  }
}
