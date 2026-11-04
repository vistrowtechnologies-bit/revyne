// AES-GCM encryption for Google tokens at rest.
// Key: GBP_TOKEN_KEY secret = 32 random bytes, base64.
// Stored format: base64(iv) + "." + base64(ciphertext)

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cachedKey: CryptoKey | null = null;

async function key(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const raw = Deno.env.get("GBP_TOKEN_KEY");
  if (!raw) throw new Error("GBP_TOKEN_KEY is not set");
  const bytes = b64decode(raw);
  if (bytes.length !== 32) throw new Error("GBP_TOKEN_KEY must be 32 bytes (base64)");
  cachedKey = await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
  return cachedKey;
}

export async function encrypt(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), new TextEncoder().encode(plain));
  return `${b64encode(iv)}.${b64encode(new Uint8Array(data))}`;
}

export async function decrypt(stored: string): Promise<string> {
  const [iv, data] = stored.split(".");
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64decode(iv) }, await key(), b64decode(data));
  return new TextDecoder().decode(plain);
}
