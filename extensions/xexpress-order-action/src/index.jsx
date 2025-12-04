import { render } from "preact";
import { useState } from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { data, close } = shopify;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Order ID from selected order
  const orderId = data?.selected?.[0]?.id;

  async function createShipment() {
    if (!orderId) {
      shopify.toast.show("No order selected", { isError: true });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use authenticatedFetch for proper Shopify session handling
      const response = await shopify.authenticatedFetch("/api.xexpress.create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.ok) {
        shopify.toast.show(
          `✓ Shipment created: ${result.shipmentCode || "Success"}`,
          { duration: 5000 }
        );
        close();
      } else {
        throw new Error(result.error || "Failed to create shipment");
      }
    } catch (err) {
      console.error("Error creating shipment:", err);
      const errorMessage = err.message || "Error creating shipment";
      setError(errorMessage);
      shopify.toast.show(errorMessage, { isError: true, duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <s-admin-action>
      <s-stack direction="block" spacing="base">
        <s-text variant="headingMd">X-Express Shipping</s-text>

        {orderId ? (
          <>
            <s-text>Create X-Express shipment for this order?</s-text>
            <s-text tone="subdued" variant="bodySm">
              Order ID: {orderId.split("/").pop()}
            </s-text>
          </>
        ) : (
          <s-text tone="critical">No order selected</s-text>
        )}

        {error && (
          <s-banner tone="critical" onDismiss={() => setError(null)}>
            <s-text>{error}</s-text>
          </s-banner>
        )}
      </s-stack>

      <s-button
        slot="primary-action"
        onClick={createShipment}
        disabled={!orderId || loading}
        {...(loading ? { loading: true } : {})}
      >
        {loading ? "Creating..." : "Create Shipment"}
      </s-button>

      <s-button slot="secondary-actions" onClick={close}>
        Cancel
      </s-button>
    </s-admin-action>
  );
}
