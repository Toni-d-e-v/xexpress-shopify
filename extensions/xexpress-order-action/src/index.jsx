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

      const response = await fetch("/api.xexpress.create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (result.ok) {
        shopify.toast.show("X-Express shipment created successfully");
        close();
      } else {
        shopify.toast.show(result.error || "Failed to create shipment", {
          isError: true
        });
      }
    } catch (error) {
      shopify.toast.show("Error creating shipment", { isError: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <s-admin-action>
      <s-stack direction="block" spacing="base">
        <s-text variant="headingMd">X-Express Shipping</s-text>

        {orderId ? (
          <s-text>Create X-Express shipment for this order?</s-text>
        ) : (
          <s-text tone="critical">No order selected</s-text>
        )}
      </s-stack>

      <s-button
        slot="primary-action"
        onClick={createShipment}
        disabled={!orderId || loading}
        loading={loading}
      >
        Create Shipment
      </s-button>

      <s-button slot="secondary-actions" onClick={close}>
        Cancel
      </s-button>
    </s-admin-action>
  );
}
