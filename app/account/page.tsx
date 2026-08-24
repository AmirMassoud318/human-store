"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  product_name_en: string;
  product_name_ar: string;
  size: string;
  color_name_en: string;
  unit_price: number;
  quantity: number;
};

type Order = {
  id: string;
  total: number;
  order_status: string;
  created_at: string;
  order_items: OrderItem[];
};

const dict = {
  en: {
    dir: "ltr", langBtn: "العربية",
    navlinks: ["T-Shirts", "Shirts", "Pants", "Jackets", "Accessories"],
    topbar: "FREE DELIVERY IN CAIRO ON ORDERS OVER 1500 EGP",
    brandname: "Human", brandsub: "Men's Wear",
    myAccount: "My Account", loggedInAs: "Signed in as",
    signOut: "Sign Out",
    yourCart: "Your Cart", cartEmpty: "Your bag is empty.",
    viewCart: "View Full Bag", proceedCheckout: "Proceed to Checkout",
    orderHistory: "Order History", noOrders: "You haven't placed any orders yet.",
    startShopping: "Start Shopping",
    search: "Search", bag: "Bag",
    priceFmt: (n: number) => `${n.toLocaleString("en-US")} EGP`,
    statusLabel: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  },
  ar: {
    dir: "rtl", langBtn: "English",
    navlinks: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات", "إكسسوارات"],
    topbar: "توصيل مجاني داخل القاهرة للطلبات فوق ١٥٠٠ جنيه",
    brandname: "هيومن", brandsub: "ملابس رجالي",
    myAccount: "حسابي", loggedInAs: "مسجل الدخول باسم",
    signOut: "تسجيل الخروج",
    yourCart: "حقيبتك", cartEmpty: "حقيبتك فارغة.",
    viewCart: "عرض الحقيبة الكاملة", proceedCheckout: "إتمام الشراء",
    orderHistory: "سجل الطلبات", noOrders: "لم تقم بأي طلب حتى الآن.",
    startShopping: "ابدأ التسوق",
    search: "بحث", bag: "الحقيبة",
    priceFmt: (n: number) => `${n.toLocaleString("ar-EG")} ج.م`,
    statusLabel: (s: string) => s,
  },
};

export default function AccountPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const { user, loading: authLoading, signOut } = useAuth();
  const { items, totalPrice } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const d = dict[lang];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function loadOrders() {
      if (!user?.email) return;
      setLoadingOrders(true);
      const { data } = await supabase
        .from("orders")
        .select("id, total, order_status, created_at, order_items(*)")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });
      setOrders((data as unknown as Order[]) || []);
      setLoadingOrders(false);
    }
    if (user) loadOrders();
  }, [user]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div dir={d.dir}>
      <div className="topbar">{d.topbar}</div>

      <header>
        <div className="nav">
          <Link href="/" className="logo-mark">
            <span className="full">{d.brandname}</span>
            <span className="sub">{d.brandsub}</span>
          </Link>
          <nav className="nav-links">
            {d.navlinks.map((label, i) => (
              <Link key={i} href="/shop">{label}</Link>
            ))}
          </nav>
          <div className="nav-right">
            <button className="lang-toggle" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
              {d.langBtn}
            </button>
            <button className="icon-btn">{d.search}</button>
            <Link href="/cart" className="icon-btn">{d.bag}</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 40px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 34 }}>{d.myAccount}</h1>
          <button
            onClick={() => signOut()}
            style={{ border: "1px solid var(--black)", background: "none", padding: "10px 22px", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
          >
            {d.signOut}
          </button>
        </div>
        <p style={{ color: "#8a8580", fontSize: 14, marginBottom: 44 }}>
          {d.loggedInAs} {user.email}
        </p>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24, borderBottom: "1px solid rgba(10,10,10,0.1)", paddingBottom: 16 }}>
          {d.yourCart}
        </h2>

        {items.length === 0 ? (
          <div style={{ padding: "24px 0", color: "#8a8580", fontSize: 14, marginBottom: 44 }}>
            {d.cartEmpty}
          </div>
        ) : (
          <div style={{ marginBottom: 44 }}>
            {items.map((item) => {
              const name = lang === "en" ? item.nameEn : item.nameAr;
              const colorName = lang === "en" ? item.colorNameEn : item.colorNameAr;
              return (
                <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(10,10,10,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 56, background: item.colorHex, flexShrink: 0 }}></div>
                    <div>
                      <div style={{ fontSize: 14 }}>{name}</div>
                      <div style={{ fontSize: 12, color: "#8a8580" }}>
                        {colorName} / {item.size} × {item.qty}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13 }}>{d.priceFmt(item.price * item.qty)}</div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600, padding: "16px 0" }}>
              <span>Total</span>
              <span>{d.priceFmt(totalPrice)}</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Link href="/cart" className="btn-secondary" style={{ flex: 1, textAlign: "center" }}>
                {d.viewCart}
              </Link>
              <Link href="/checkout" className="btn-primary" style={{ flex: 1, textAlign: "center", border: "none" }}>
                {d.proceedCheckout}
              </Link>
            </div>
          </div>
        )}

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24, borderBottom: "1px solid rgba(10,10,10,0.1)", paddingBottom: 16 }}>
          {d.orderHistory}
        </h2>

        {loadingOrders ? null : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a8580" }}>
            <p style={{ marginBottom: 24 }}>{d.noOrders}</p>
            <Link href="/shop" className="btn-primary" style={{ display: "inline-block" }}>
              {d.startShopping}
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {orders.map((order) => (
              <div key={order.id} style={{ border: "1px solid rgba(10,10,10,0.12)", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: "#8a8580" }}>
                      {new Date(order.created_at).toLocaleDateString(lang === "en" ? "en-GB" : "ar-EG", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a8580" }}>
                    {d.statusLabel(order.order_status)}
                  </div>
                </div>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span>
                      {lang === "en" ? item.product_name_en : item.product_name_ar} — {item.color_name_en} / {item.size} × {item.quantity}
                    </span>
                    <span>{d.priceFmt(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(10,10,10,0.08)" }}>
                  <span>Total</span>
                  <span>{d.priceFmt(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
