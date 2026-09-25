import { describe, it, expect } from "vitest";
import {
  ProviderRegistry,
  createProviderRegistry,
  getSupportedProviders,
  isProviderSupported,
  resolveProvider,
} from "../../../src/providers/provider.registry";
import { MockProvider } from "../../../src/providers/mock/mock.provider";
import { AwsProvider } from "../../../src/providers/aws/aws.provider";

describe("ProviderRegistry & ProviderResolver", () => {
  it("should register and retrieve a provider by slug", () => {
    const registry = new ProviderRegistry();
    const mockProvider = new MockProvider();

    registry.registerProvider("mock", mockProvider);

    expect(registry.hasProvider("mock")).toBe(true);
    expect(registry.getProvider("mock")).toBe(mockProvider);
  });

  it("should throw a meaningful error if no provider exists for a slug", () => {
    const registry = new ProviderRegistry();

    expect(() => registry.getProvider("unknown-provider")).toThrow(
      "No provider registered for: unknown-provider",
    );
  });

  it("should create a provider registry containing AWS and Mock providers", () => {
    const registry = createProviderRegistry();

    expect(registry.getProvider("mock")).toBeInstanceOf(MockProvider);
    expect(registry.getProvider("aws")).toBeInstanceOf(AwsProvider);
  });

  it("should resolve providers dynamically via resolveProvider", async () => {
    const mock = await resolveProvider("mock");
    expect(mock).toBeInstanceOf(MockProvider);

    const aws = await resolveProvider("aws");
    expect(aws).toBeInstanceOf(AwsProvider);
  });

  it("should report supported providers correctly", () => {
    expect(getSupportedProviders()).toEqual([
      { slug: "mock", name: "Mock Cloud Provider" },
      { slug: "aws", name: "Amazon Web Services (AWS)" },
    ]);
    expect(isProviderSupported("mock")).toBe(true);
    expect(isProviderSupported("aws")).toBe(true);
    expect(isProviderSupported("gcp")).toBe(false);
  });
});
