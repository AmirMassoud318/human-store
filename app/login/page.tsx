"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const dict = {
  en: {
    dir: "ltr", langBtn: "العربية",
    brandname: "Human", brandsub: "Men's Wear",
    signInTitle: "Sign In", signUpTitle: "Create Account",
    name: "Full Name", email: "Email", password: "Password",
    signInBtn: "Sign In", signUpBtn: "Create Account",
    googleBtn: "Continue with Google", orDivider: "or",
    noAccount: "Don't have an account?", haveAccount: "Already have an account?",
    signUpLink: "Sign up", signInLink: "Sign in",
    loading: "Please wait…",
  },
  ar: {
    dir: "rtl", langBtn: "English",
    brandname: "هيومن", brandsub: "ملابس رجالي",
    signInTitle: "تسجيل الدخول", signUpTitle: "إنشاء حساب",
    name: "الاسم الكامل", email: "البريد الإلكتروني", password: "كلمة المرور",
    signInBtn: "تسجيل الدخول", signUpBtn: "إنشاء حساب",
    googleBtn: "المتابعة باستخدام جوجل", orDivider: "أو",
    noAccount: "ليس لديك حساب؟", haveAccount: "لديك حساب بالفعل؟",
    signUpLink: "أنشئ حساب", signInLink: "سجّل الدخول",
    loading: "لحظة من فضلك…",
  },
};

export default function LoginPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const d = dict[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password, name);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/account");
  }

  return (
    <div dir={d.dir} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--white)" }}>
      <div style={{ width: 360, padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Link href="/" className="logo-mark" style={{ display: "inline-flex" }}>
            <span className="full">{d.brandname}</span>
            <span className="sub">{d.brandsub}</span>
          </Link>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 28, textAlign: "center" }}>
          {mode === "signin" ? d.signInTitle : d.signUpTitle}
        </h1>

        <button
          type="button"
          onClick={() => signInWithGoogle()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            border: "1px solid rgba(10,10,10,0.15)",
            background: "none",
            padding: "13px 0",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.71c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71V4.95H.96C.35 6.17 0 7.55 0 9s.35 2.83.96 4.05l3.01-2.34z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          {d.googleBtn}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(10,10,10,0.12)" }}></div>
          <span style={{ fontSize: 11, color: "#8a8580", textTransform: "uppercase" }}>{d.orDivider}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(10,10,10,0.12)" }}></div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <input
              placeholder={d.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ border: "1px solid rgba(10,10,10,0.15)", padding: "13px 14px", fontSize: 14, fontFamily: "inherit" }}
            />
          )}
          <input
            type="email"
            placeholder={d.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ border: "1px solid rgba(10,10,10,0.15)", padding: "13px 14px", fontSize: 14, fontFamily: "inherit" }}
          />
          <input
            type="password"
            placeholder={d.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ border: "1px solid rgba(10,10,10,0.15)", padding: "13px 14px", fontSize: 14, fontFamily: "inherit" }}
          />

          {error && <div style={{ fontSize: 13, color: "#b33" }}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ border: "none", marginTop: 10 }}
          >
            {loading ? d.loading : mode === "signin" ? d.signInBtn : d.signUpBtn}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#8a8580" }}>
          {mode === "signin" ? (
            <>
              {d.noAccount}{" "}
              <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "var(--black)", textDecoration: "underline", cursor: "pointer", fontSize: 13 }}>
                {d.signUpLink}
              </button>
            </>
          ) : (
            <>
              {d.haveAccount}{" "}
              <button onClick={() => setMode("signin")} style={{ background: "none", border: "none", color: "var(--black)", textDecoration: "underline", cursor: "pointer", fontSize: 13 }}>
                {d.signInLink}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="lang-toggle">
            {d.langBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
