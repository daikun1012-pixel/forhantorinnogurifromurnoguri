/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../types";

// Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID). Verified against the
// RFC 8291 test vectors.

export interface PushSubscription {
  endpoint: string;
  p256dh: string; // base64url
  auth: string; // base64url
}

// ArrayBuffer-backed bytes so values satisfy BufferSource / BodyInit under
// TypeScript's generic TypedArray types.
type Bytes = Uint8Array<ArrayBuffer>;

const te = (s: string): Bytes => new TextEncoder().encode(s) as Bytes;

function b64urlToBytes(s: string): Bytes {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...arrs: Uint8Array[]): Bytes {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

async function hkdf(
  salt: Bytes,
  ikm: Bytes,
  info: Bytes,
  len: number,
): Promise<Bytes> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    len * 8,
  );
  return new Uint8Array(bits);
}

async function encryptPayload(
  sub: PushSubscription,
  payload: Bytes,
): Promise<Bytes> {
  const uaPub = b64urlToBytes(sub.p256dh);
  const auth = b64urlToBytes(sub.auth);

  const serverKeys = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const asPub: Bytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeys.publicKey),
  );
  const uaPubKey = await crypto.subtle.importKey(
    "raw",
    uaPub,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const ecdh: Bytes = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: uaPubKey },
      serverKeys.privateKey,
      256,
    ),
  );

  const ikm = await hkdf(
    auth,
    ecdh,
    concat(te("WebPush: info\0"), uaPub, asPub),
    32,
  );
  const salt: Bytes = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, te("Content-Encoding: nonce\0"), 12);

  const gcmKey = await crypto.subtle.importKey(
    "raw",
    cek,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const ciphertext: Bytes = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      gcmKey,
      concat(payload, new Uint8Array([2])), // record delimiter
    ),
  );

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([asPub.length]), asPub, ciphertext);
}

// Env values can arrive with stray whitespace from copy/paste; normalise them.
const clean = (v: string | undefined): string => (v ?? "").trim();

function vapidSubject(env: Env): string {
  let sub = clean(env.VAPID_SUBJECT);
  if (!sub) return "mailto:admin@example.com";
  if (!/^(mailto:|https?:\/\/)/i.test(sub)) sub = `mailto:${sub}`;
  return sub;
}

async function vapidToken(env: Env, endpoint: string): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = bytesToB64url(te(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const now = Math.floor(Date.now() / 1000);
  const payload = bytesToB64url(
    te(
      JSON.stringify({
        aud,
        exp: now + 12 * 60 * 60,
        iat: now,
        sub: vapidSubject(env),
      }),
    ),
  );
  const signingInput = `${header}.${payload}`;

  const pub = b64urlToBytes(clean(env.VAPID_PUBLIC_KEY));
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    d: clean(env.VAPID_PRIVATE_KEY),
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    ext: true,
  };
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig: Bytes = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      te(signingInput),
    ),
  );
  return `${signingInput}.${bytesToB64url(sig)}`;
}

export function pushConfigured(env: Env): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

/** Diagnose the VAPID config: does the built JWT verify against the public key? */
export async function vapidSelfCheck(env: Env): Promise<{
  signatureValid: boolean;
  subject: string;
  publicKeyLength: number;
  privateKeyLength: number;
}> {
  const token = await vapidToken(env, "https://web.push.apple.com/");
  const [h, p, s] = token.split(".");
  const pub = b64urlToBytes(clean(env.VAPID_PUBLIC_KEY));
  let signatureValid = false;
  try {
    const verifyKey = await crypto.subtle.importKey(
      "raw",
      pub,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    signatureValid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      verifyKey,
      b64urlToBytes(s),
      te(`${h}.${p}`),
    );
  } catch {
    signatureValid = false;
  }
  return {
    signatureValid,
    subject: vapidSubject(env),
    publicKeyLength: clean(env.VAPID_PUBLIC_KEY).length,
    privateKeyLength: clean(env.VAPID_PRIVATE_KEY).length,
  };
}

export interface PushResult {
  ok: boolean;
  status: number;
  gone: boolean; // 404/410 => subscription should be removed
  error?: string;
}

export async function sendPush(
  env: Env,
  sub: PushSubscription,
  data: unknown,
): Promise<PushResult> {
  const body = await encryptPayload(sub, te(JSON.stringify(data)));
  const token = await vapidToken(env, sub.endpoint);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      TTL: "2419200",
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      Authorization: `vapid t=${token}, k=${clean(env.VAPID_PUBLIC_KEY)}`,
    },
    body,
  });
  let error: string | undefined;
  if (!res.ok) {
    error = (await res.text().catch(() => "")).slice(0, 300) || undefined;
  }
  return {
    ok: res.ok,
    status: res.status,
    gone: res.status === 404 || res.status === 410,
    error,
  };
}
