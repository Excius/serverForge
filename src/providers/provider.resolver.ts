import type { ComputeProvider } from "./provider";
import { MockProvider } from "./mock.provider";
import { AwsProvider } from "./aws.provider";
import { Bindings } from "../lib/config";

export function resolveProvider(slug: string, env: Bindings): ComputeProvider {
  switch (slug) {
    case "mock":
      return new MockProvider();

    // case "aws":
    //   return new AwsProvider({
    //     region: env.AWS_REGION,
    //     accessKeyId: env.AWS_ACCESS_KEY_ID,
    //     secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    //   });

    default:
      throw new Error(`Unsupported provider: ${slug}`);
  }
}
