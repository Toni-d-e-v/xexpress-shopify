import { json } from "@remix-run/server-runtime";

// Test endpoint - NO AUTHENTICATION
export async function loader() {
  console.log("[TEST-PING] GET request received");
  return json({
    ok: true,
    message: "Test endpoint works!",
    timestamp: new Date().toISOString()
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}

export async function action({ request }: any) {
  console.log("[TEST-PING] POST request received");
  const body = await request.json().catch(() => null);
  console.log("[TEST-PING] Request body:", body);

  return json({
    ok: true,
    message: "Test POST endpoint works!",
    receivedData: body,
    timestamp: new Date().toISOString()
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}

export async function options() {
  console.log("[TEST-PING] OPTIONS request received");
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
