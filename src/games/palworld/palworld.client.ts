import {
  PalworldPlayerResponse,
  PalworldServerInfoResponse,
} from "./palworld.types";

export class PalworldClient {
  constructor(
    private readonly baseUrl: string,
    private readonly username: string,
    private readonly password: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Palworld API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json<T>();
  }

  async getServerInfo(): Promise<PalworldServerInfoResponse> {
    return this.request<PalworldServerInfoResponse>("/v1/api/info");
  }

  async getPlayers(): Promise<PalworldPlayerResponse> {
    return this.request<PalworldPlayerResponse>("/v1/api/players");
  }
}
