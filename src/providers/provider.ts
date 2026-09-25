export type ProviderServerStatus =
  "starting" | "running" | "stopping" | "stopped" | "error" | "unknown";

export interface ComputeProvider {
  getServerStatus(providerServerId: string): Promise<ProviderServerStatus>;

  getServerIp(providerServerId: string): Promise<string | null>;

  startServer(providerServerId: string): Promise<void>;

  stopServer(providerServerId: string): Promise<void>;
}
