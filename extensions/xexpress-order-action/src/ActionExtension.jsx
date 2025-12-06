import { render } from "preact";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const orderId = shopify.data?.selected?.[0]?.id;

  async function createShipment() {
    console.log("[DEBUG] createShipment called");
    console.log("[DEBUG] orderId:", orderId);
    console.log("[DEBUG] window.location.href:", window.location.href);
    console.log("[DEBUG] window.location.origin:", window.location.origin);
    console.log("[DEBUG] window.location.pathname:", window.location.pathname);
    console.log("[DEBUG] shopify object:", shopify);
    console.log("[DEBUG] shopify keys:", Object.keys(shopify));

    // Try to find any config or environment data
    if (shopify.config) console.log("[DEBUG] shopify.config:", shopify.config);
    if (shopify.environment) console.log("[DEBUG] shopify.environment:", shopify.environment);
    if (shopify.metadata) console.log("[DEBUG] shopify.metadata:", shopify.metadata);
    if (shopify.auth) console.log("[DEBUG] shopify.auth:", shopify.auth);

    // Try to get session token
    let sessionToken = null;
    try {
      if (shopify.auth && typeof shopify.auth.getSessionToken === 'function') {
        sessionToken = await shopify.auth.getSessionToken();
        console.log("[DEBUG] Got session token:", sessionToken ? "yes" : "no");
      }
    } catch (e) {
      console.error("[DEBUG] Failed to get session token:", e);
    }

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
      // First, test if we can reach the server at all with a simple endpoint
      console.log("[DEBUG] Testing connectivity with GET /api/test-ping");
      try {
        const testGet = await fetch("/api/test-ping");
        const testGetText = await testGet.text();
        console.log("[DEBUG] Test GET response:", testGet.status, testGetText);
      } catch (e) {
        console.error("[DEBUG] Test GET failed:", e);
      }

      console.log("[DEBUG] Testing connectivity with POST /api/test-ping");
      try {
        const testPost = await fetch("/api/test-ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: "data", orderId })
        });
        const testPostText = await testPost.text();
        console.log("[DEBUG] Test POST response:", testPost.status, testPostText);
      } catch (e) {
        console.error("[DEBUG] Test POST failed:", e);
      }

      // Test if the actual endpoint is reachable with GET
      console.log("[DEBUG] Testing GET /api/xexpress/create");
      try {
        const testActual = await fetch("/api/xexpress/create");
        const testActualText = await testActual.text();
        console.log("[DEBUG] GET /api/xexpress/create response:", testActual.status, testActualText);
      } catch (e) {
        console.error("[DEBUG] GET /api/xexpress/create failed:", e);
      }

      // Now try the actual endpoint with POST
      console.log("[DEBUG] About to fetch /api/xexpress/create");

      const headers = {
        "Content-Type": "application/json",
      };

      // Add session token if available
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
        console.log("[DEBUG] Adding Authorization header with session token");
      }

      const response = await fetch("/api/xexpress/create", {
        method: "POST",
        headers,
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
