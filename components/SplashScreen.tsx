"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"loading" | "reveal" | "lifting" | "done">("loading");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 2400);
    const t2 = setTimeout(() => setPhase("lifting"), 3200);
    const t3 = setTimeout(() => {
      setPhase("done");
      onDone();
    }, 3950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: phase === "lifting" ? "translateY(-100%)" : "translateY(0)",
        transition: phase === "lifting" ? "transform 0.75s cubic-bezier(0.65, 0, 0.35, 1)" : "none",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ animation: "float 3.2s ease-in-out infinite 1.35s" }}>
          <svg
            width="220"
            height="260"
            viewBox="0 0 220 260"
            fill="none"
            style={{
              opacity: 0,
              overflow: "visible",
              animation: "shirtFall 1.05s cubic-bezier(0.32, 1.5, 0.6, 1) 0.15s both",
            }}
          >
            <path
              d="M92 70
                 Q110 82 128 70
                 L148 79
                 L180 98
                 Q186 102 180 108
                 L154 124
                 L154 222
                 Q154 230 146 230
                 L74 230
                 Q66 230 66 222
                 L66 124
                 L40 108
                 Q34 102 40 98
                 L72 79
                 Z"
              stroke="#fafafa"
              strokeWidth="2"
              fill="#0a0a0a"
              strokeLinejoin="round"
            />
            <text
              x="110"
              y="168"
              textAnchor="middle"
              fill="#fafafa"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 24,
                opacity: 0,
                animation: "textExpand 0.9s ease-out 0.95s both",
              }}
            >
              Human
            </text>
          </svg>
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 10,
            letterSpacing: "0.32em",
            color: "#8a8580",
            textTransform: "uppercase",
            opacity: 0,
            animation: "textFadeIn 0.6s ease-out 1.55s both",
          }}
        >
          Men's Wear
        </div>
      </div>

      <style>{`
        @keyframes shirtFall {
          0% { opacity: 0; transform: translateY(-220px) rotate(-12deg) scale(0.92); }
          55% { opacity: 1; }
          68% { transform: translateY(16px) rotate(4deg) scale(1.02); }
          82% { transform: translateY(-8px) rotate(-1.5deg) scale(1); }
          92% { transform: translateY(3px) rotate(0.5deg); }
          100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes textExpand {
          from { opacity: 0; letter-spacing: 0.35em; }
          to { opacity: 1; letter-spacing: 0.01em; }
        }
        @keyframes textFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
