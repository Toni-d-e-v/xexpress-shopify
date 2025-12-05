import { render } from "preact";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const orderId = shopify.data?.selected?.[0]?.id;

  async function createShipment() {
    console.log("[DEBUG] createShipment called");
    console.log("[DEBUG] orderId:", orderId);

    if (!orderId) {
      shopify.toast.show("No order selected", { isError: true });
      return;
    }

    const loadingToast = shopify.toast.show("Creating shipment...");
    console.log("[DEBUG] Loading toast shown");

    try {
      console.log("[DEBUG] About to fetch /api/xexpress/create");

      // Use regular fetch() - NOT shopify.authenticatedFetch()
      // Admin UI extensions automatically add auth headers
      const response = await fetch("/api/xexpress/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      console.log("[DEBUG] Response received:", response.status, response.statusText);
      console.log("[DEBUG] Response headers:", response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Request failed" }));
        console.error("[DEBUG] Error response:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("[DEBUG] Success result:", result);

      if (result.ok) {
        loadingToast.hide();
        shopify.toast.show(`Shipment created: ${result.shipmentCode}`, { duration: 5000 });
        shopify.close();
      } else {
        throw new Error(result.error || "Failed to create shipment");
      }
    } catch (error) {
      console.error("[DEBUG] Catch block:", error);
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
