"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";

const dict = {
  en: {
    dir: "ltr", langBtn: "العربية",
    brandname: "Human", brandsub: "Men's Wear",
    title: "Checkout",
    contactInfo: "Contact Information",
    name: "Full Name", phone: "Phone Number", email: "Email (optional)",
    shippingInfo: "Shipping Address",
    address: "Street Address", city: "City",
    paymentInfo: "Payment Method",
    cod: "Cash on Delivery", codDesc: "Pay in cash when your order arrives.",
    cardSoon: "Card Payment (coming soon)",
    placeOrder: "Place Order",
    placing: "Placing order…",
    orderSummary: "Order Summary",
    subtotal: "Subtotal", shipping: "Shipping", free: "Free", total: "Total",
    emptyMsg: "Your bag is empty.", emptyBtn: "Continue Shopping",
    required: "Please fill in all required fields.",
    successTitle: "Order Placed!",
    successMsg: "Thank you for your order. We'll contact you shortly to confirm delivery details.",
    orderNumber: "Order Number",
    backHome: "Back to Home",
    priceFmt: (n: number) => `${n.toLocaleString("en-US")} EGP`,
  },
  ar: {
    dir: "rtl", langBtn: "English",
    brandname: "هيومن", brandsub: "ملابس رجالي",
    title: "إتمام الشراء",
    contactInfo: "بيانات التواصل",
    name: "الاسم الكامل", phone: "رقم الهاتف", email: "البريد الإلكتروني (اختياري)",
    shippingInfo: "عنوان التوصيل",
    address: "العنوان بالتفصيل", city: "المدينة",
    paymentInfo: "طريقة الدفع",
    cod: "الدفع عند الاستلام", codDesc: "ادفع نقدًا عند وصول الطلب.",
    cardSoon: "الدفع بالبطاقة (قريبًا)",
    placeOrder: "تأكيد الطلب",
    placing: "جارٍ تأكيد الطلب…",
    orderSummary: "ملخص الطلب",
    subtotal: "المجموع الفرعي", shipping: "التوصيل", free: "مجاني", total: "الإجمالي",
    emptyMsg: "حقيبتك فارغة.", emptyBtn: "واصل التسوق",
    required: "الرجاء ملء كل الحقول المطلوبة.",
    successTitle: "تم تأكيد الطلب!",
    successMsg: "شكرًا لطلبك. سنتواصل معك قريبًا لتأكيد تفاصيل التوصيل.",
    orderNumber: "رقم الطلب",
    backHome: "العودة للرئيسية",
    priceFmt: (n: number) => `${n.toLocaleString("ar-EG")} ج.م`,
  },
};

export default function CheckoutPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "Cairo",
  });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const d = dict[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.address) {
      setError(d.required);
      return;
    }

    setPlacing(true);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: form.name,
        customer_phone: form.phone,
        customer_email: form.email || null,
        shipping_address: form.address,
        city: form.city,
        payment_method: "cash_on_delivery",
        payment_status: "pending",
        order_status: "processing",
        subtotal: totalPrice,
        total: totalPrice,
      })
      .select()
      .single();

    if (orderError || !order) {
      setError(orderError?.message || "Failed to place order.");
      setPlacing(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_variant_id: item.variantId,
      product_name_en: item.nameEn,
      product_name_ar: item.nameAr,
      size: item.size,
      color_name_en: item.colorNameEn,
      unit_price: item.price,
      quantity: item.qty,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    setPlacing(false);

    if (itemsError) {
      setError(itemsError.message);
      return;
    }

    setOrderNumber(order.id.slice(0, 8).toUpperCase());
    clearCart();
  }

  if (orderNumber) {
    return (
      <div dir={d.dir} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 40 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginBottom: 16 }}>
            {d.successTitle}
          </div>
          <p style={{ color: "#8a8580", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{d.successMsg}</p>
          <div style={{ fontSize: 13, marginBottom: 32 }}>
            {d.orderNumber}: <strong>{orderNumber}</strong>
          </div>
          <Link href="/" className="btn-primary" style={{ display: "inline-block" }}>
            {d.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div dir={d.dir}>
      <div className="topbar">
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} style={{ background: "none", border: "none", color: "inherit", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer" }}>
          {d.langBtn}
        </button>
      </div>

      <header>
        <div className="nav" style={{ justifyContent: "center" }}>
          <Link href="/" className="logo-mark">
            <span className="full">{d.brandname}</span>
            <span className="sub">{d.brandsub}</span>
          </Link>
        </div>
      </header>

      <div className="cart-header">
        <h1>{d.title}</h1>
      </div>

      <div className="cart-main">
        <div>
          {items.length === 0 ? (
            <div className="empty-cart">
              <p>{d.emptyMsg}</p>
              <Link href="/shop" className="btn-primary" style={{ display: "inline-block", width: "auto" }}>
                {d.emptyBtn}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16 }}>
                  {d.contactInfo}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input
                    placeholder={d.name}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ border: "1px solid rgba(10,10,10,0.15)", padding: "13px 14px", fontSize: 14, fontFamily: "inherit" }}
                  />
                  <input
                    placeholder={d.phone}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    style={{ border: "1px solid rgba(10,10,10,0.15)", padding: "13px 14px", fontSize: 14, fontFamily: "inherit" }}
                  />
                  <input
                    placeholder={d.email}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{ border: "1px solid rgba(10,10,10,0.15)", padding: "13px 14px", fontSize: 14, fontFamily: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16 }}>
                  {d.shippingInfo}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input
                    placeholder={d.address}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    style={{ border: "1px solid rgba(10,10,10,0.15)", padding: "13px 14px", fontSize: 14, fontFamily: "inherit" }}
                  />
                  <input
                    placeholder={d.city}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={{ border: "1px solid rgba(10,10,10,0.15)", padding: "13px 14px", fontSize: 14, fontFamily: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16 }}>
                  {d.paymentInfo}
                </h3>
                <div style={{ border: "1px solid var(--black)", padding: 16, fontSize: 13, marginBottom: 10 }}>
                  <strong>{d.cod}</strong>
                  <div style={{ color: "#8a8580", fontSize: 12, marginTop: 4 }}>{d.codDesc}</div>
                </div>
                <div style={{ border: "1px solid rgba(10,10,10,0.1)", padding: 16, fontSize: 13, color: "#c9c5bd" }}>
                  {d.cardSoon}
                </div>
              </div>

              {error && <div style={{ fontSize: 13, color: "#b33" }}>{error}</div>}

              <button type="submit" className="btn-primary" disabled={placing} style={{ border: "none" }}>
                {placing ? d.placing : d.placeOrder}
              </button>
            </form>
          )}
        </div>

        {items.length > 0 && (
          <div className="summary">
            <h3>{d.orderSummary}</h3>
            <div className="summary-row"><span>{d.subtotal}</span><span>{d.priceFmt(totalPrice)}</span></div>
            <div className="summary-row"><span>{d.shipping}</span><span>{d.free}</span></div>
            <div className="summary-row total"><span>{d.total}</span><span>{d.priceFmt(totalPrice)}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
