import { Redis } from "@upstash/redis";

// Vercel's KV / Marketplace Redis integration injects these env vars automatically.
export const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
