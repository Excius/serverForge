import { describe, it, expect } from "vitest";
import { EncryptionService } from "../../../src/services/encryption.service";

describe("EncryptionService", () => {
  const secretKey = "test-master-encryption-key-for-unit-testing";
  const service = new EncryptionService(secretKey);

  it("should encrypt and decrypt plaintext accurately", async () => {
    const plaintext = JSON.stringify({
      PALWORLD_API_URL: "http://10.0.0.10:8212",
      PALWORLD_API_USERNAME: "admin",
      PALWORLD_API_PASSWORD: "super-secret-pass",
    });

    const encrypted = await service.encrypt(plaintext);

    expect(encrypted.version).toBe(1);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.ciphertext).not.toBe(plaintext);

    const decrypted = await service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should generate a fresh random IV for every encryption call", async () => {
    const text = "constant-secret-payload";
    const enc1 = await service.encrypt(text);
    const enc2 = await service.encrypt(text);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  it("should reject tampered or corrupted ciphertext", async () => {
    const encrypted = await service.encrypt("sample-secret");
    encrypted.ciphertext = "corrupted-ciphertext-base64==";

    await expect(service.decrypt(encrypted)).rejects.toThrow();
  });

  it("should reject unsupported version numbers", async () => {
    const encrypted = await service.encrypt("sample-secret");
    (encrypted as any).version = 99;

    await expect(service.decrypt(encrypted)).rejects.toThrow(
      "Unsupported encryption format or version: 99",
    );
  });
});
