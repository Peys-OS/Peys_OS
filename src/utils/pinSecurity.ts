const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const DIGEST = "SHA-256";

function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const aBuffer = new TextEncoder().encode(a);
  const bBuffer = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aBuffer.length; i++) {
    result |= aBuffer[i] ^ bBuffer[i];
  }
  return result === 0;
}

async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

async function hashPin(pin: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    pinData,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    keyMaterial,
    KEY_LENGTH
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  try {
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, SALT_LENGTH);
    const newHash = await hashPin(pin, salt);
    return timingSafeCompare(newHash, storedHash);
  } catch {
    return false;
  }
}

export async function setSecurePinHash(pin: string): Promise<void> {
  const salt = await generateSalt();
  const hash = await hashPin(pin, salt);
  localStorage.setItem("peys_pin_hash", hash);
}

export async function verifySecurePin(pin: string): Promise<boolean> {
  const storedHash = localStorage.getItem("peys_pin_hash");
  if (!storedHash) return false;
  return verifyPin(pin, storedHash);
}

export function clearPinHash(): void {
  localStorage.removeItem("peys_pin_hash");
}

export function hasPinHash(): boolean {
  return localStorage.getItem("peys_pin_hash") !== null;
}
