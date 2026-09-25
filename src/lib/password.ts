import { argon2id, argon2Verify, setWASMModules } from "argon2-wasm-edge";

import argon2WASM from "argon2-wasm-edge/wasm/argon2.wasm";
import blake2bWASM from "argon2-wasm-edge/wasm/blake2b.wasm";

setWASMModules({
  argon2WASM,
  blake2bWASM,
});

const ARGON2_OPTIONS = {
  parallelism: 1,
  iterations: 3,
  memorySize: 19456,
  hashLength: 32,
  outputType: "encoded" as const,
};

function generateSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

export async function hashPassword(password: string) {
  return argon2id({
    password,
    salt: generateSalt(),
    ...ARGON2_OPTIONS,
  });
}

export async function verifyPassword(password: string, hash: string) {
  return argon2Verify({
    password,
    hash,
  });
}
