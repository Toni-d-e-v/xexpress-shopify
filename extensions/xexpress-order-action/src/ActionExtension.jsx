import { render } from "preact";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const orderId = shopify.data?.selected?.[0]?.id;

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
        shopify.close();
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

  function handleCancel() {
    shopify.close();
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

      <s-button slot="secondary-actions" onClick={handleCancel}>
        Cancel
      </s-button>
    </s-admin-action>
  );
}
