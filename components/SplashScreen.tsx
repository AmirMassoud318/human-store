"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"loading" | "reveal" | "lifting" | "done">("loading");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 2200);
    const t2 = setTimeout(() => setPhase("lifting"), 3000);
    const t3 = setTimeout(() => {
      setPhase("done");
      onDone();
    }, 3700);
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
        <svg
          width="150"
          height="190"
          viewBox="0 0 150 190"
          fill="none"
          style={{
            opacity: phase === "loading" ? 1 : 1,
            animation: "hangerFadeIn 0.6s ease-out both",
          }}
        >
          {/* gancio */}
          <g
            style={{
              transformOrigin: "75px 22px",
              animation: "hangerSway 3.4s ease-in-out infinite 0.6s",
            }}
          >
            <circle cx="75" cy="14" r="7" stroke="#c9bfae" strokeWidth="2" fill="none" />
            <path
              d="M75 21 L75 32 L28 62 Q20 67 24 75 L126 75 Q130 67 122 62 L75 32"
              stroke="#c9bfae"
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>

          {/* maglietta */}
          <g
            style={{
              opacity: 0,
              animation: "shirtDrop 0.7s ease-out 0.55s both",
            }}
          >
            <path
              d="M50 78
                 L50 68
                 Q50 60 60 58
                 L62 57
                 Q75 66 88 57
                 L90 58
                 Q100 60 100 68
                 L100 78
                 L112 84
                 L104 100
                 L100 96
                 L100 168
                 Q100 172 96 172
                 L54 172
                 Q50 172 50 168
                 L50 96
                 L46 100
                 L38 84
                 Z"
              stroke="#fafafa"
              strokeWidth="2"
              fill="#0a0a0a"
              strokeLinejoin="round"
            />
            <text
              x="75"
              y="118"
              textAnchor="middle"
              fill="#fafafa"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 19,
                letterSpacing: "0.02em",
              }}
            >
              Human
            </text>
          </g>
        </svg>

        <div
          style={{
            marginTop: 18,
            fontSize: 10,
            letterSpacing: "0.32em",
            color: "#8a8580",
            textTransform: "uppercase",
            opacity: 0,
            animation: "textFadeIn 0.6s ease-out 1.3s both",
          }}
        >
          Men's Wear
        </div>
      </div>

      <style>{`
        @keyframes hangerFadeIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hangerSway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes shirtDrop {
          from { opacity: 0; transform: translateY(-14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes textFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
