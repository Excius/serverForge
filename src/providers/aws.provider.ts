import {
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";

import type { ComputeProvider, ProviderServerStatus } from "./provider";

export class AwsProvider implements ComputeProvider {
  private readonly client: EC2Client;

  constructor(config: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.client = new EC2Client({
      region: config.region,

      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async startServer(providerServerId: string): Promise<void> {
    await this.client.send(
      new StartInstancesCommand({
        InstanceIds: [providerServerId],
      }),
    );
  }

  async stopServer(providerServerId: string): Promise<void> {
    await this.client.send(
      new StopInstancesCommand({
        InstanceIds: [providerServerId],
      }),
    );
  }

  async getServerStatus(
    providerServerId: string,
  ): Promise<ProviderServerStatus> {
    const result = await this.client.send(
      new DescribeInstancesCommand({
        InstanceIds: [providerServerId],
      }),
    );

    const state = result.Reservations?.[0]?.Instances?.[0]?.State?.Name;

    switch (state) {
      case "pending":
        return "starting";

      case "running":
        return "running";

      case "stopping":
        return "stopping";

      case "stopped":
        return "stopped";

      case "shutting-down":
      case "terminated":
        return "stopped";

      default:
        return "unknown";
    }
  }

  async getServerIp(providerServerId: string): Promise<string | null> {
    const result = await this.client.send(
      new DescribeInstancesCommand({
        InstanceIds: [providerServerId],
      }),
    );

    return result.Reservations?.[0]?.Instances?.[0]?.PublicIpAddress ?? null;
  }
}
