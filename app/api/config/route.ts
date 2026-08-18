import { kv } from "@/lib/kv";
import { NextResponse } from "next/server";
import { extractAsin } from "@/lib/asin";

const CONFIG_KEY = "price-alert:config";

export async function GET() {
  const config = await kv.get(CONFIG_KEY);
  return NextResponse.json(config || {});
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.amazonUrl !== "string" || typeof body.email !== "string") {
    return NextResponse.json({ error: "amazonUrl and email are required" }, { status: 400 });
  }

  const amazonUrl = body.amazonUrl.trim();
  const email = body.email.trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const asin = extractAsin(amazonUrl);
  if (!asin) {
    return NextResponse.json(
      { error: "Couldn't find a product ASIN in that URL. Use a standard amazon.in/dp/... link." },
      { status: 400 }
    );
  }

  const config = { amazonUrl, email, asin };
  await kv.set(CONFIG_KEY, config);

  return NextResponse.json(config);
}
