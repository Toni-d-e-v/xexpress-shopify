import { render } from "preact";
import { useEffect } from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { data, close } = shopify;

  // Order data je u "data.selected"
  const orderId = data?.selected?.[0]?.id;

  function openXExpress() {
    // otvara tvoju React Router rutu
    window.open(`/app/xexpress/create?order=${orderId}`, "_self");
  }

  return (
    <s-admin-action>
      <s-stack direction="block">
        <s-text type="strong">X-Express Shipping</s-text>

        {orderId ? (
          <s-text>Creating shipment for order: {orderId}</s-text>
        ) : (
          <s-text>No order found.</s-text>
        )}
      </s-stack>

      <s-button slot="primary-action" onClick={openXExpress}>
        Create Shipment
      </s-button>

      <s-button slot="secondary-actions" onClick={close}>
        Close
      </s-button>
    </s-admin-action>
  );
}
