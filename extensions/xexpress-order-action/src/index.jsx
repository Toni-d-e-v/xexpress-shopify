import { render } from "preact";
import { useState } from "preact/hooks";

export default async () => {
  console.log("[Extension] Step 1: Initializing");

  try {
    console.log("[Extension] Step 2: About to render");
    const result = render(<Extension />, document.body);
    console.log("[Extension] Step 3: Render returned:", result);
  } catch (err) {
    console.error("[Extension] Step 3 ERROR:", err);
  }
};

function Extension() {
  console.log("[Extension] Step 4: Component function called");

  const [loading, setLoading] = useState(false);

  console.log("[Extension] Step 5: State initialized");

  const orderId = shopify?.data?.selected?.[0]?.id || "";
  const orderNum = orderId.split("/").pop() || "Unknown";

  console.log("[Extension] Step 6: Order ID:", orderId);

  const handleClick = async () => {
    console.log("[Extension] Button clicked");

    if (!orderId) {
      shopify.toast.show("No order selected", { isError: true });
      return;
    }

    try {
      setLoading(true);
      console.log("[Extension] Fetching...");

      const res = await shopify.authenticatedFetch("/api/xexpress/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      console.log("[Extension] Response:", res.status);

      if (!res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: `HTTP ${res.status}` };
        }
        throw new Error(data.error || "Failed");
      }

      const result = await res.json();
      console.log("[Extension] Result:", result);

      if (result.ok) {
        shopify.toast.show(`Shipment: ${result.shipmentCode}`);
        shopify.close();
      } else {
        throw new Error(result.error || "Failed");
      }
    } catch (err) {
      console.error("[Extension] Error:", err);
      shopify.toast.show(err.message, { isError: true });
    } finally {
      setLoading(false);
    }
  };

  console.log("[Extension] Step 7: About to return JSX");

  return (
    <s-admin-action>
      <s-stack direction="block">
        <s-text variant="headingMd">X-Express Shipping</s-text>
        <s-text>Create shipment for order {orderNum}?</s-text>
      </s-stack>
      <s-button slot="primary-action" onClick={handleClick} disabled={loading}>
        {loading ? "Creating..." : "Create Shipment"}
      </s-button>
      <s-button slot="secondary-actions" onClick={() => shopify.close()}>
        Cancel
      </s-button>
    </s-admin-action>
  );
}
