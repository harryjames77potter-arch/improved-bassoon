"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [amazonUrl, setAmazonUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data?.amazonUrl) setAmazonUrl(data.amazonUrl);
        if (data?.email) setEmail(data.email);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amazonUrl, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(`❌ ${data.error || "Something went wrong"}`);
      } else {
        setStatus("✅ Saved. You'll get price alerts at 10 AM and 6 PM IST daily.");
      }
    } catch {
      setStatus("❌ Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "80px auto",
        padding: "0 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>🛒 Amazon Price Alert</h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 24 }}>
        Set this once. You'll get an email at 10 AM &amp; 6 PM IST every day
        with the current price.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ fontSize: 14 }}>
          Amazon product URL
          <input
            type="url"
            required
            value={amazonUrl}
            onChange={(e) => setAmazonUrl(e.target.value)}
            placeholder="https://www.amazon.in/dp/B0XXXXXXX"
            style={inputStyle}
          />
        </label>

        <label style={{ fontSize: 14 }}>
          Your email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {loading ? "Saving…" : "Save"}
        </button>

        {status && <p style={{ fontSize: 14 }}>{status}</p>}
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};
