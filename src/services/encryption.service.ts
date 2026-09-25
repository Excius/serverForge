import { EncryptedConfigData } from "../types/config-definition";

export class EncryptionService {
  constructor(private readonly secretKey?: string) {}

  private async getCryptoKey(): Promise<CryptoKey> {
    const rawKey = this.secretKey;

    const keyBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(rawKey),
    );

    return crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"],
    );
  }

  async encrypt(plaintext: string): Promise<EncryptedConfigData> {
    const key = await this.getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded,
    );

    return {
      version: 1,
      iv: this.uint8ArrayToBase64(iv),
      ciphertext: this.uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
    };
  }

  async decrypt(data: EncryptedConfigData): Promise<string> {
    if (!data || data.version !== 1) {
      throw new Error(
        `Unsupported encryption format or version: ${data?.version}`,
      );
    }

    const key = await this.getCryptoKey();
    const iv = this.base64ToUint8Array(data.iv);
    const ciphertext = this.base64ToUint8Array(data.ciphertext);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(decryptedBuffer);
  }

  private uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < arr.byteLength; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
