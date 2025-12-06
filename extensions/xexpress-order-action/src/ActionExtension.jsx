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
      try {
        shopify.toast.show("No order selected", { isError: true });
      } catch (e) {
        console.error("[DEBUG] Toast error:", e);
      }
      return;
    }

    console.log("[DEBUG] Starting shipment creation");

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Request failed" }));
        console.error("[DEBUG] Error response:", errorData);

        try {
          shopify.toast.show(errorData.error || `HTTP ${response.status}`, {
            isError: true,
            duration: 5000
          });
        } catch (e) {
          console.error("[DEBUG] Toast error:", e);
        }
        return;
      }

      const result = await response.json();
      console.log("[DEBUG] Success result:", result);

      if (result.ok) {
        try {
          shopify.toast.show(`Shipment created: ${result.shipmentCode}`, { duration: 5000 });
        } catch (e) {
          console.error("[DEBUG] Toast error:", e);
        }
        shopify.close();
      } else {
        try {
          shopify.toast.show(result.error || "Failed to create shipment", {
            isError: true,
            duration: 5000
          });
        } catch (e) {
          console.error("[DEBUG] Toast error:", e);
        }
      }
    } catch (error) {
      console.error("[DEBUG] Catch block:", error);
      try {
        shopify.toast.show(error.message || "Error creating shipment", {
          isError: true,
          duration: 5000,
        });
      } catch (e) {
        console.error("[DEBUG] Toast error:", e);
      }
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
