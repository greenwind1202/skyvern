import { apiBaseUrl, artifactApiBaseUrl } from "@/util/env";
import axios from "axios";

const apiV1BaseUrl = apiBaseUrl;
const apiV2BaseUrl = apiBaseUrl.replace("v1", "v2");

const client = axios.create({
  baseURL: apiV1BaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const v2Client = axios.create({
  baseURL: apiV2BaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const artifactApiClient = axios.create({
  baseURL: artifactApiBaseUrl,
});

export function setApiKeyHeader(apiKey: string) {
  client.defaults.headers.common["x-api-key"] = apiKey;
  v2Client.defaults.headers.common["x-api-key"] = apiKey;
  artifactApiClient.defaults.headers.common["x-api-key"] = apiKey;
}

export function removeApiKeyHeader() {
  delete client.defaults.headers.common["x-api-key"];
  delete v2Client.defaults.headers.common["x-api-key"];
  delete artifactApiClient.defaults.headers.common["x-api-key"];
}

async function getClient(
  credentialGetter: CredentialGetter | null,
  version: string = "v1",
) {
  // Clear any existing headers first
  removeApiKeyHeader();

  const apiKey = localStorage.getItem("apiKey");
  if (apiKey) {
    setApiKeyHeader(apiKey);
  } else if (credentialGetter) {
    const credential = await credentialGetter();
    if (credential) {
      setApiKeyHeader(credential);
    }
  }

  return version === "v1" ? client : v2Client;
}

export type CredentialGetter = () => Promise<string | null>;

export { getClient, client as defaultClient, artifactApiClient };
