import { ComputeProvider, ProviderServerStatus } from "../provider";

type MockServer = {
  id: string;
  status: ProviderServerStatus;
  ip: string;
};

export class MockProvider implements ComputeProvider {
  private readonly servers = new Map<string, MockServer>();

  constructor() {
    this.servers.set("mock-server-1", {
      id: "mock-server-1",
      status: "running",
      ip: "127.0.0.1",
    });
  }

  async getServerStatus(
    providerServerId: string,
  ): Promise<ProviderServerStatus> {
    const server = this.servers.get(providerServerId);

    if (!server) {
      return "error";
    }

    return server.status;
  }

  async getServerIp(providerServerId: string): Promise<string | null> {
    const server = this.servers.get(providerServerId);

    if (!server) {
      return null;
    }

    return server.ip;
  }

  async startServer(providerServerId: string): Promise<void> {
    const server = this.servers.get(providerServerId);

    if (!server) {
      throw new Error(`Mock server ${providerServerId} not found`);
    }

    if (server.status === "running") {
      return;
    }

    console.log(`[MockProvider] Starting ${providerServerId}`);

    server.status = "running";
  }

  async stopServer(providerServerId: string): Promise<void> {
    const server = this.servers.get(providerServerId);

    if (!server) {
      throw new Error(`Mock server ${providerServerId} not found`);
    }

    if (server.status === "stopped") {
      return;
    }

    console.log(`[MockProvider] Stopping ${providerServerId}`);

    server.status = "stopped";
  }

  setStatus(providerServerId: string, status: ProviderServerStatus) {
    const server = this.servers.get(providerServerId);

    if (!server) {
      throw new Error(`Mock server ${providerServerId} not found`);
    }

    server.status = status;
  }

  addServer(server: MockServer) {
    this.servers.set(server.id, server);
  }

  getServer(providerServerId: string) {
    return this.servers.get(providerServerId);
  }
}
