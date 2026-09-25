export type AdapterConfigFieldType =
  | "string"
  | "number"
  | "boolean"
  | "url"
  | "secret";

export interface AdapterConfigField {
  key: string;
  label: string;
  description?: string;
  type: AdapterConfigFieldType;
  required: boolean;
  sensitive: boolean;
}

export interface GameAdapterDefinition {
  slug: string;
  name: string;
  config: AdapterConfigField[];
}

export interface ProviderAdapterDefinition {
  slug: string;
  name: string;
  config: AdapterConfigField[];
}

export interface ConfigFieldResponse extends AdapterConfigField {
  value?: any;
  configured?: boolean;
}

export interface EncryptedConfigData {
  version: number;
  iv: string;
  ciphertext: string;
}
