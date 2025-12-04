import { render } from "preact";
import { useState } from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { data, close } = shopify;
  const [loading, setLoading] = useState(false);

  // Order ID from selected order
  const orderId = data?.selected?.[0]?.id;

  async function createShipment() {
    if (!orderId) {
      shopify.toast.show("No order selected", { isError: true });
      return;
    }

    try {
      setLoading(true);

      const response = await shopify.authenticatedFetch("/api/xexpress/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}` };
        }
        throw new Error(errorData.error || `Request failed`);
      }

      const result = await response.json();

      if (result.ok) {
        shopify.toast.show(
          `Shipment created: ${result.shipmentCode || "Success"}`,
          { duration: 5000 }
        );
        close();
      } else {
        throw new Error(result.error || "Failed to create shipment");
      }
    } catch (err) {
      const errorMessage = err.message || "Error creating shipment";
      shopify.toast.show(errorMessage, { isError: true, duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <s-admin-action>
      <s-stack direction="block">
        <s-text variant="headingMd">X-Express Shipping</s-text>

        {orderId ? (
          <s-text>Create X-Express shipment for this order?</s-text>
        ) : (
          <s-text tone="critical">No order selected</s-text>
        )}

        {orderId && (
          <s-text tone="subdued" variant="bodySm">
            Order: {orderId.split("/").pop()}
          </s-text>
        )}
      </s-stack>

      <s-button
        slot="primary-action"
        onClick={createShipment}
        disabled={!orderId || loading}
      >
        {loading ? "Creating..." : "Create Shipment"}
      </s-button>

      <s-button slot="secondary-actions" onClick={close}>
        Cancel
      </s-button>
    </s-admin-action>
  );
}
