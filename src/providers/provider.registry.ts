import type {
  AdapterConfigField,
  ProviderAdapterDefinition,
} from "../types/config-definition";
import { AwsProvider, type AwsProviderConfig } from "./aws/aws.provider";
import { MockProvider } from "./mock/mock.provider";
import type { ComputeProvider } from "./provider";
import { ConfigurationService } from "../services/configuration.service";

export const awsConfigDefinition: AdapterConfigField[] = [
  {
    key: "AWS_ACCESS_KEY_ID",
    label: "Access Key ID",
    description: "AWS IAM user Access Key ID",
    type: "string",
    required: true,
    sensitive: true,
  },
  {
    key: "AWS_SECRET_ACCESS_KEY",
    label: "Secret Access Key",
    description: "AWS IAM user Secret Access Key",
    type: "secret",
    required: true,
    sensitive: true,
  },
  {
    key: "AWS_REGION",
    label: "Region",
    description: "AWS default datacenter region (e.g. us-east-1)",
    type: "string",
    required: true,
    sensitive: false,
  },
];

export const awsProviderDefinition: ProviderAdapterDefinition = {
  slug: "aws",
  name: "Amazon Web Services (AWS)",
  config: awsConfigDefinition,
};

export const mockProviderConfigDefinition: AdapterConfigField[] = [];

export const mockProviderDefinition: ProviderAdapterDefinition = {
  slug: "mock",
  name: "Mock Cloud Provider",
  config: mockProviderConfigDefinition,
};

export const PROVIDER_ADAPTER_DEFINITIONS = new Map<
  string,
  ProviderAdapterDefinition
>([
  ["mock", mockProviderDefinition],
  ["aws", awsProviderDefinition],
]);

export const SUPPORTED_PROVIDERS = Array.from(
  PROVIDER_ADAPTER_DEFINITIONS.values(),
).map((def) => ({ slug: def.slug, name: def.name }));

export function getSupportedProviders() {
  return SUPPORTED_PROVIDERS;
}

export function isProviderSupported(slug: string): boolean {
  return PROVIDER_ADAPTER_DEFINITIONS.has(slug);
}

export class ProviderRegistry {
  private readonly providers = new Map<string, ComputeProvider>();

  registerProvider(slug: string, provider: ComputeProvider): void {
    this.providers.set(slug, provider);
  }

  getProvider(slug: string): ComputeProvider {
    const provider = this.providers.get(slug);
    if (!provider) {
      throw new Error(`No provider registered for: ${slug}`);
    }
    return provider;
  }

  hasProvider(slug: string): boolean {
    return this.providers.has(slug);
  }
}

export function createProviderRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();

  const awsProvider = new AwsProvider();
  const mockProvider = new MockProvider();

  registry.registerProvider("aws", awsProvider);
  registry.registerProvider("mock", mockProvider);

  return registry;
}

export async function resolveProvider(
  slug: string,
  arg2?: ConfigurationService | string,
  arg3?: ConfigurationService | string,
): Promise<ComputeProvider> {
  const configService =
    arg2 instanceof ConfigurationService
      ? arg2
      : arg3 instanceof ConfigurationService
        ? arg3
        : undefined;

  const providerId =
    typeof arg2 === "string"
      ? arg2
      : typeof arg3 === "string"
        ? arg3
        : undefined;

  switch (slug) {
    case "mock":
      return new MockProvider();

    case "aws": {
      let region = "us-east-1";
      let accessKeyId = "";
      let secretAccessKey = "";

      if (configService && providerId) {
        const plain = (await configService.resolveConfig(
          "provider",
          providerId,
        )) as Partial<AwsProviderConfig>;

        region = plain.AWS_REGION ?? "us-east-1";
        accessKeyId = plain.AWS_ACCESS_KEY_ID ?? "";
        secretAccessKey = plain.AWS_SECRET_ACCESS_KEY ?? "";
      }

      return new AwsProvider({
        region,
        accessKeyId,
        secretAccessKey,
      });
    }

    default:
      throw new Error(`Unsupported provider: ${slug}`);
  }
}

export const resolveProviderAdapter = resolveProvider;

