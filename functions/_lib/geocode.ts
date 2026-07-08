/// <reference types="@cloudflare/workers-types" />
import type { Env } from "../types";

interface GeocodeResult {
  lat: number;
  lng: number;
}

// NCP Maps Geocoding. Tries the new Maps host first, then the legacy host,
// so it works regardless of which console the key was issued from.
const HOSTS = [
  "https://maps.apigw.ntruss.com/map-geocode/v2/geocode",
  "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode",
];

export function geocodeEnabled(env: Env): boolean {
  return Boolean(env.NAVER_MAP_CLIENT_ID && env.NAVER_MAP_CLIENT_SECRET);
}

export async function geocodeAddress(
  env: Env,
  address: string,
): Promise<GeocodeResult | null> {
  if (!geocodeEnabled(env) || !address.trim()) return null;

  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}?query=${encodeURIComponent(address)}`, {
        headers: {
          "x-ncp-apigw-api-key-id": env.NAVER_MAP_CLIENT_ID as string,
          "x-ncp-apigw-api-key": env.NAVER_MAP_CLIENT_SECRET as string,
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        addresses?: { x: string; y: string }[];
      };
      const first = data.addresses?.[0];
      if (first) {
        const lng = Number(first.x);
        const lat = Number(first.y);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
      return null; // valid response, no match
    } catch {
      // try next host
    }
  }
  return null;
}
