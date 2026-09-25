import { describe, it, expect, beforeEach, vi } from "vitest";
import { AwsProvider } from "../../../src/providers/aws/aws.provider";
import { resolveProviderAdapter } from "../../../src/providers/provider.registry";
import { ConfigurationService } from "../../../src/services/configuration.service";
import { clearDatabase, testDb } from "../../setup/db";
import { providerTable } from "../../../src/db/schema";

describe("AwsProvider Dynamic Configuration", () => {
  let providerId = "";
  let configService: ConfigurationService;

  beforeEach(async () => {
    await clearDatabase();
    configService = new ConfigurationService(testDb, "test-secret-key");

    const [provider] = await testDb
      .insert(providerTable)
      .values({
        name: "AWS Cloud Node",
        slug: "aws",
      })
      .returning();
    providerId = provider.id;
  });

  it("should resolve dynamic credentials from ConfigurationService via resolveProviderAdapter", async () => {
    await configService.saveConfig("provider", providerId, "aws", {
      AWS_ACCESS_KEY_ID: "DYNAMIC_KEY_ID",
      AWS_SECRET_ACCESS_KEY: "DYNAMIC_SECRET_KEY",
      AWS_REGION: "us-west-2",
    });

    const providerAdapter = await resolveProviderAdapter("aws", providerId, configService);
    expect(providerAdapter).toBeInstanceOf(AwsProvider);
  });

  it("should use mock EC2 client when passed into constructor", async () => {
    const mockEC2Client = {
      send: vi.fn().mockResolvedValue({
        Reservations: [
          {
            Instances: [
              {
                State: { Name: "running" },
                PublicIpAddress: "54.210.10.1",
              },
            ],
          },
        ],
      }),
    };

    const awsProvider = new AwsProvider(undefined, mockEC2Client as any);

    const status = await awsProvider.getServerStatus("inst-999");
    expect(status).toBe("running");

    const ip = await awsProvider.getServerIp("inst-999");
    expect(ip).toBe("54.210.10.1");
  });
});
