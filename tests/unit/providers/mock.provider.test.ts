import { describe, it, expect, beforeEach } from "vitest";
import { MockProvider } from "../../../src/providers/mock/mock.provider";

describe("MockProvider", () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  it("should start with mock-server-1 running", async () => {
    const status = await provider.getServerStatus("mock-server-1");
    expect(status).toBe("running");
  });

  it("should start server", async () => {
    provider.addServer({ id: "s1", status: "stopped", ip: "1.2.3.4" });
    await provider.startServer("s1");
    expect(await provider.getServerStatus("s1")).toBe("running");
  });

  it("should stop server", async () => {
    provider.addServer({ id: "s1", status: "running", ip: "1.2.3.4" });
    await provider.stopServer("s1");
    expect(await provider.getServerStatus("s1")).toBe("stopped");
  });

  it("should return error status for unknown server", async () => {
    const status = await provider.getServerStatus("unknown");
    expect(status).toBe("error");
  });

  it("should return ip", async () => {
    provider.addServer({ id: "s1", status: "running", ip: "1.2.3.4" });
    const ip = await provider.getServerIp("s1");
    expect(ip).toBe("1.2.3.4");
  });
});
