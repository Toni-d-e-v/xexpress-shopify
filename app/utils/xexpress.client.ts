import axios from "axios";

export interface XExpressClientConfig {
  username: string;
  password: string;
  env?: "test" | "prod";
}

export function createXExpressClient({ username, password, env = "test" }: XExpressClientConfig) {
  const baseURL =
    env === "prod"
      ? "https://api.x-express.ba/v1"
      : "https://api.x-express.ba/test";

  const token = Buffer.from(`${username}:${password}`).toString("base64");

  return axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
    },
  });
}
