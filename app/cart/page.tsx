"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

const dict = {
  en: {
    dir: "ltr", langBtn: "العربية",
    navlinks: ["T-Shirts", "Shirts", "Pants", "Jackets"],
    topbar: "FREE DELIVERY IN CAIRO ON ORDERS OVER 1500 EGP",
    brandname: "Human", brandsub: "Men's Wear",
    cartTitle: "Your Bag",
    summaryTitle: "Order Summary", subtotal: "Subtotal", shipping: "Shipping", free: "Free", total: "Total",
    checkout: "Checkout", summaryNote: "Cash on delivery and card payment available at checkout.",
    remove: "Remove",
    emptyMsg: "Your bag is empty.", emptyBtn: "Continue Shopping",
    foottagline: "For men's wear. Wear good, feel Good. Based at El Rehab Mall 2, Cairo, Egypt.",
    fc1: "Shop", fc1items: ["T-Shirts", "Shirts", "Pants", "Jackets"],
    fc2: "Help", fc2items: ["Delivery", "Returns", "Size Guide", "Contact Us"],
    fc3: "Human", fc3items: ["Our Story", "Instagram", "WhatsApp"],
    copy: "© 2026 Human — Men's Wear. El Rehab Mall 2, Cairo, Egypt.",
    currency: "EGP — Egyptian Pound",
    search: "Search", account: "Account", bag: "Bag",
    priceFmt: (n: number) => `${n.toLocaleString("en-US")} EGP`,
  },
  ar: {
    dir: "rtl", langBtn: "English",
    navlinks: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات"],
    topbar: "توصيل مجاني داخل القاهرة للطلبات فوق ١٥٠٠ جنيه",
    brandname: "هيومن", brandsub: "ملابس رجالي",
    cartTitle: "حقيبتك",
    summaryTitle: "ملخص الطلب", subtotal: "المجموع الفرعي", shipping: "التوصيل", free: "مجاني", total: "الإجمالي",
    checkout: "إتمام الشراء", summaryNote: "الدفع عند الاستلام أو بالبطاقة متاح عند إتمام الطلب.",
    remove: "إزالة",
    emptyMsg: "حقيبتك فارغة.", emptyBtn: "واصل التسوق",
    foottagline: "لملابس الرجال. البس كويس، حس بالراحة. مقرنا في مول الرحاب 2، القاهرة.",
    fc1: "تسوق", fc1items: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات"],
    fc2: "مساعدة", fc2items: ["التوصيل", "الاسترجاع", "دليل المقاسات", "اتصل بنا"],
    fc3: "Human", fc3items: ["قصتنا", "انستجرام", "واتساب"],
    copy: "© ٢٠٢٦ Human — لملابس الرجال. مول الرحاب 2، القاهرة، مصر.",
    currency: "جنيه مصري",
    search: "بحث", account: "حسابي", bag: "الحقيبة",
    priceFmt: (n: number) => `${n.toLocaleString("ar-EG")} ج.م`,
  },
};

export default function CartPage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const { items, removeItem, updateQty, totalQty, totalPrice } = useCart();

  const d = dict[lang];

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
            <Link href="/shop">{d.navlinks[0]}</Link>
            <Link href="/shop">{d.navlinks[1]}</Link>
            <Link href="/shop">{d.navlinks[2]}</Link>
            <Link href="/shop">{d.navlinks[3]}</Link>
          </nav>
          <div className="nav-right">
            <button className="lang-toggle" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
              {d.langBtn}
            </button>
            <button className="icon-btn">{d.search}</button>
            <button className="icon-btn">{d.account}</button>
            <Link href="/cart" className="icon-btn">{d.bag} ({totalQty})</Link>
          </div>
        </div>
      </header>

      <div className="cart-header">
        <h1>{d.cartTitle}</h1>
      </div>

      <div className="cart-main">
        <div>
          <div className="cart-list">
            {items.length === 0 ? (
              <div className="empty-cart">
                <p>{d.emptyMsg}</p>
                <Link href="/shop" className="btn-primary" style={{ display: "inline-block", width: "auto" }}>
                  {d.emptyBtn}
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const name = lang === "en" ? item.nameEn : item.nameAr;
                const colorName = lang === "en" ? item.colorNameEn : item.colorNameAr;
                return (
                  <div className="cart-item" key={item.variantId}>
                    <div className="cart-item-img" style={{ background: item.colorHex }}></div>
                    <div className="cart-item-info">
                      <div className="name">{name}</div>
                      <div className="variant">{colorName} / {item.size}</div>
                      <div className="price">{d.priceFmt(item.price)}</div>
                    </div>
                    <div className="cart-item-actions">
                      <button className="remove-link" onClick={() => removeItem(item.variantId)}>{d.remove}</button>
                      <div className="qty-control">
                        <button onClick={() => updateQty(item.variantId, item.qty - 1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => updateQty(item.variantId, item.qty + 1)}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="summary">
          <h3>{d.summaryTitle}</h3>
          <div className="summary-row"><span>{d.subtotal}</span><span>{d.priceFmt(totalPrice)}</span></div>
          <div className="summary-row"><span>{d.shipping}</span><span>{d.free}</span></div>
          <div className="summary-row total"><span>{d.total}</span><span>{d.priceFmt(totalPrice)}</span></div>

          <Link href="/checkout" className="btn-primary" style={{ display: "block", textAlign: "center", pointerEvents: items.length === 0 ? "none" : "auto", opacity: items.length === 0 ? 0.4 : 1 }}>
            {d.checkout}
          </Link>
          <p className="summary-note">{d.summaryNote}</p>
        </div>
      </div>

      <footer>
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">
              <div className="footer-logo">{d.brandname}</div>
              <div className="footer-logo-sub">{d.brandsub}</div>
            </div>
            <p className="footer-tagline">{d.foottagline}</p>
          </div>
          <div className="footer-col">
            <h4>{d.fc1}</h4>
            {d.fc1items.map((item, i) => <a href="#" key={i}>{item}</a>)}
          </div>
          <div className="footer-col">
            <h4>{d.fc2}</h4>
            {d.fc2items.map((item, i) => <a href="#" key={i}>{item}</a>)}
          </div>
          <div className="footer-col">
            <h4>{d.fc3}</h4>
            {d.fc3items.map((item, i) => <a href="#" key={i}>{item}</a>)}
          </div>
        </div>
        <div className="footer-bottom">
          <div>{d.copy}</div>
          <div>{d.currency}</div>
        </div>
      </footer>
    </div>
  );
}
