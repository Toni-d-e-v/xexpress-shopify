import {
  reactExtension,
  useApi,
  useOrder,
  AdminAction,
  Button,
} from "@shopify/ui-extensions-react/admin";
import { useState } from "react";

export default reactExtension(
  "admin.order-details.action.render",
  () => <XExpressButton />
);

function XExpressButton() {
  const api = useApi();
  const order = useOrder();
  const [loading, setLoading] = useState(false);

  const createShipment = async () => {
    try {
      setLoading(true);
      const response = await api.fetch("/api.xexpress.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await response.json();

      if (data.ok) {
        api.toast.show("X-Express shipment created successfully", {
          isError: false,
        });
      } else {
        api.toast.show(data.error || "Failed to create shipment", {
          isError: true,
        });
      }
    } catch (error) {
      api.toast.show("Error creating shipment", { isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAction
      primaryAction={
        <Button onPress={createShipment} loading={loading}>
          Create X-Express Shipment
        </Button>
      }
    />
  );
}
