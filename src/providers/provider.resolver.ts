import type { ComputeProvider } from "./provider";
import { MockProvider } from "./mock.provider";
import { Bindings } from "../lib/config";

export const SUPPORTED_PROVIDERS = [
  { slug: "mock", name: "Mock Cloud Provider" },
];

export function getSupportedProviders() {
  return SUPPORTED_PROVIDERS;
}

export function isProviderSupported(slug: string): boolean {
  return SUPPORTED_PROVIDERS.some((p) => p.slug === slug);
}

export function resolveProvider(slug: string, _env: Bindings): ComputeProvider {
  switch (slug) {
    case "mock":
      return new MockProvider();

    default:
      throw new Error(`Unsupported provider: ${slug}`);
  }
}
