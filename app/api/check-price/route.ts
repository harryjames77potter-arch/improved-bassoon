import { kv } from "@/lib/kv";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const CONFIG_KEY = "price-alert:config";
const KEEPA_DOMAIN = 10; // amazon.in

type Config = {
  amazonUrl: string;
  email: string;
  asin: string;
};

// Keepa prices are integers in the smallest currency unit (paise for INR),
// or -1 if there's no data for that price type.
function centsToRupees(value: number | undefined | null): number | null {
  if (value === undefined || value === null || value < 0) return null;
  return Math.round(value) / 100;
}

export async function GET() {
  try {
    const config = (await kv.get(CONFIG_KEY)) as Config | null;

    if (!config?.asin || !config?.email) {
      console.error("check-price: no config saved yet, skipping");
      return NextResponse.json({ skipped: true, reason: "no config saved" });
    }

    const keepaKey = process.env.KEEPA_API_KEY;
    if (!keepaKey) {
      console.error("check-price: KEEPA_API_KEY is not set");
      return NextResponse.json({ error: "missing KEEPA_API_KEY" }, { status: 500 });
    }

    const keepaRes = await fetch(
      `https://api.keepa.com/product?key=${keepaKey}&domain=${KEEPA_DOMAIN}&asin=${config.asin}&stats=1`
    );

    if (!keepaRes.ok) {
      console.error("check-price: Keepa request failed", keepaRes.status, await keepaRes.text());
      return NextResponse.json({ error: "Keepa request failed" }, { status: 502 });
    }

    const keepaData = await keepaRes.json();
    const product = keepaData?.products?.[0];

    if (!product) {
      console.error("check-price: Keepa returned no product for ASIN", config.asin);
      return NextResponse.json({ error: "no product data from Keepa" }, { status: 502 });
    }

    // stats.current: [Amazon, New, Used, Sales Rank, ListPrice, ...] - -1 means no data
    const current = product?.stats?.current;
    const amazonPrice = centsToRupees(current?.[0]);
    const newPrice = centsToRupees(current?.[1]);
    const price = amazonPrice ?? newPrice;

    if (price === null) {
      console.error("check-price: no valid price available for ASIN", config.asin);
      return NextResponse.json({ skipped: true, reason: "no price data yet" });
    }

    const productName: string = product.title || "Amazon Product";

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("check-price: RESEND_API_KEY is not set");
      return NextResponse.json({ error: "missing RESEND_API_KEY" }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const fromEmail = process.env.NOTIFY_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: config.email,
      subject: `Amazon Price Update — ${productName}`,
      text: `🛒 ${productName}\n💰 Current Price: ₹${price}\n\n🔗 ${config.amazonUrl}`,
    });

    if (error) {
      console.error("check-price: Resend send failed", error);
      return NextResponse.json({ error: "email send failed" }, { status: 502 });
    }

    return NextResponse.json({ sent: true, productName, price });
  } catch (err) {
    console.error("check-price: unexpected error", err);
    return NextResponse.json({ error: "unexpected error" }, { status: 500 });
  }
}
