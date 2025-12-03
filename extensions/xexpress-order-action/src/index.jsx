import {
  reactExtension,
  useApi,
  useOrder,
} from "@shopify/ui-extensions-react/admin";

export default reactExtension(
  "admin.order-details.action.render",
  () => <XExpressButton />
);

function XExpressButton() {
  const api = useApi();
  const order = useOrder();

  const createShipment = async () => {
    await api.fetch("/apps/xexpress/api.xexpress.create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });

    api.toast.show("X-Express shipment created");
  };

  return (
    <button
      onClick={createShipment}
      style={{
        padding: "8px 12px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        background: "#2563eb",
        color: "white",
        fontSize: "14px",
      }}
    >
      Create X-Express shipment
    </button>
  );
}
