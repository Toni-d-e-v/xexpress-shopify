import { render } from "preact";
import { useState } from "preact/hooks";

export default async () => {
  console.log("[Extension] Initializing");
  render(<Extension />, document.body);
};

function Extension() {
  console.log("[Extension] Component rendering");

  const [loading, setLoading] = useState(false);
  const orderId = shopify?.data?.selected?.[0]?.id || "";
  const orderNumber = orderId ? String(orderId).split("/").pop() : "";

  console.log("[Extension] Order ID:", orderId);

  async function handleCreate() {
    console.log("[Extension] Button clicked");

    if (!orderId) {
      shopify.toast.show("No order selected", { isError: true });
      return;
    }

    try {
      setLoading(true);
      console.log("[Extension] Calling API");

      const response = await shopify.authenticatedFetch("/api/xexpress/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      console.log("[Extension] Response:", response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error("[Extension] Error:", text);
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: `HTTP ${response.status}` };
        }
        throw new Error(data.error || "Request failed");
      }

      const result = await response.json();
      console.log("[Extension] Success:", result);

      if (result.ok) {
        shopify.toast.show(`Shipment: ${result.shipmentCode}`, { duration: 5000 });
        shopify.close();
      } else {
        throw new Error(result.error || "Failed");
      }
    } catch (err) {
      console.error("[Extension] Error:", err);
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

      <s-button slot="primary-action" onClick={handleCreate} disabled={loading}>
        {loading ? "Creating..." : "Create Shipment"}
      </s-button>

      <s-button slot="secondary-actions" onClick={() => shopify.close()}>
        Cancel
      </s-button>
    </s-admin-action>
  );
}
