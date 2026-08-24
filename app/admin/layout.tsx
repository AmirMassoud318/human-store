"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "human-admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved === "true") {
      setAuthorized(true);
    }
    setChecking(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (password === correctPassword) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthorized(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (checking) {
    return null;
  }

  if (!authorized) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fafafa",
            padding: "48px 40px",
            width: 340,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28 }}>Human</div>
            <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "#8a8580", marginTop: 6 }}>
              ADMIN
            </div>
          </div>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{
              border: "1px solid rgba(10,10,10,0.12)",
              padding: "14px 16px",
              fontSize: 14,
              fontFamily: "inherit",
              background: "none",
            }}
          />

          {error && (
            <div style={{ fontSize: 12, color: "#b33", textAlign: "center" }}>
              Wrong password. Try again.
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "#0a0a0a",
              color: "#fafafa",
              padding: "14px 0",
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
            }}
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
