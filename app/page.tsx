"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  is_new: boolean;
  product_images: { image_url: string; position: number }[];
};

type Category = {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
};

const dict = {
  en: {
    dir: "ltr", langBtn: "العربية",
    navlinks: ["T-Shirts", "Shirts", "Pants", "Jackets"],
    topbar: "FREE DELIVERY IN CAIRO ON ORDERS OVER 1500 EGP",
    brandname: "Human", brandsub: "Men's Wear",
    herotag: "Crafted For Every Day",
    herotitle: ["Wear Good,", "Feel Good."],
    herotext: "Considered menswear, made to last. Clean lines, honest fabrics, built for everyday life.",
    heroCta: "Shop The Collection",
    shopby: "Shop by Category", viewall: "View All",
    cat1: "T-Shirts", cat2: "Shirts", cat3: "Pants", cat4: "Jackets",
    newarrivals: "New Arrivals",
    storyeyebrow: "El Rehab Mall 2, Cairo",
    storytitle: "A men's wear label built on quiet confidence.",
    storytext: "Human began as a single rail at El Rehab Mall 2 with one idea: clothes that let you feel put together without trying too hard. Every piece is chosen for fabric, fit, and how it wears after the tenth washing — not just the first.",
    foottagline: "For men's wear. Wear good, feel Good. Based at El Rehab Mall 2, Cairo, Egypt.",
    fc1: "Shop", fc1items: ["T-Shirts", "Shirts", "Pants", "Jackets"],
    fc2: "Help", fc2items: ["Delivery", "Returns", "Size Guide", "Contact Us"],
    fc3: "Human", fc3items: ["Our Story", "Instagram", "WhatsApp"],
    copy: "© 2026 Human — Men's Wear. El Rehab Mall 2, Cairo, Egypt.",
    currency: "EGP — Egyptian Pound",
    search: "Search", account: "Account", bag: "Bag",
  },
  ar: {
    dir: "rtl", langBtn: "English",
    navlinks: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات"],
    topbar: "توصيل مجاني داخل القاهرة للطلبات فوق ١٥٠٠ جنيه",
    brandname: "هيومن", brandsub: "ملابس رجالي",
    herotag: "مصمم لكل يوم",
    herotitle: ["البس كويس،", "حس بالراحة."],
    herotext: "ملابس رجالي مدروسة تدوم طويلاً. خطوط نظيفة وأقمشة صادقة، مصممة لحياتك اليومية.",
    heroCta: "تسوق التشكيلة",
    shopby: "تسوق حسب الفئة", viewall: "عرض الكل",
    cat1: "تيشيرتات", cat2: "قمصان", cat3: "بناطيل", cat4: "جاكيتات",
    newarrivals: "وصل حديثًا",
    storyeyebrow: "مول الرحاب 2، القاهرة",
    storytitle: "علامة ملابس رجالية بثقة هادئة.",
    storytext: "بدأت Human كرف واحد في مول الرحاب 2 بفكرة بسيطة: ملابس تخليك حاسس إنك مرتب من غير مجهود زايد. كل قطعة بنختارها على أساس القماش والمقاس، وإزاي هتبقى شكلها بعد الغسلة العاشرة — مش بس الأولى.",
    foottagline: "لملابس الرجال. البس كويس، حس بالراحة. مقرنا في مول الرحاب 2، القاهرة.",
    fc1: "تسوق", fc1items: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات"],
    fc2: "مساعدة", fc2items: ["التوصيل", "الاسترجاع", "دليل المقاسات", "اتصل بنا"],
    fc3: "Human", fc3items: ["قصتنا", "انستجرام", "واتساب"],
    copy: "© ٢٠٢٦ Human — لملابس الرجال. مول الرحاب 2، القاهرة، مصر.",
    currency: "جنيه مصري",
    search: "بحث", account: "حسابي", bag: "الحقيبة",
  },
};

const grads = [
  "linear-gradient(150deg,#1a1a1a,#3a3a3a)",
  "linear-gradient(150deg,#d6cfc0,#a89d86)",
  "linear-gradient(150deg,#26241f,#0a0a0a)",
  "linear-gradient(150deg,#c2b8a3,#8f8570)",
];

export default function HomePage() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const { totalQty } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const d = dict[lang];

  useEffect(() => {
    async function loadProducts() {
      const { data } = await supabase
        .from("products")
        .select("id, name_en, name_ar, price, is_new, product_images(image_url, position)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      setProducts(data || []);
    }
    loadProducts();

    async function loadCategories() {
      const { data } = await supabase.from("categories").select("id, name_en, name_ar, slug");
      setCategories(data || []);
    }
    loadCategories();
  }, []);

  return (
    <div dir={d.dir}>
      <div className="topbar">{d.topbar}</div>

      <header>
        <div className="nav">
          <div className="logo-mark">
            <span className="full">{d.brandname}</span>
            <span className="sub">{d.brandsub}</span>
          </div>
          <nav className="nav-links">
            {categories.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`}>
                {lang === "en" ? c.name_en : c.name_ar}
              </Link>
            ))}
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

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">{d.herotag}</div>
          <h1>
            {d.herotitle[0]}<br />{d.herotitle[1]}
          </h1>
          <p>{d.herotext}</p>
          <Link href="/shop" className="btn-primary">{d.heroCta}</Link>
        </div>
      </section>

      <section className="cat-strip">
        <div className="section-head">
          <h2>{d.shopby}</h2>
          <Link href="/shop">{d.viewall}</Link>
        </div>
        <div className="cat-grid">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="cat-card">
              <div className="ph-bg"></div>
              <div className="cat-label">{lang === "en" ? c.name_en : c.name_ar}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="products">
        <div className="section-head">
          <h2>{d.newarrivals}</h2>
          <Link href="/shop">{d.viewall}</Link>
        </div>
        <div className="product-grid">
          {products.map((p, i) => {
            const name = lang === "en" ? p.name_en : p.name_ar;
            const sortedImages = [...(p.product_images || [])].sort((a, b) => a.position - b.position);
            const mainImage = sortedImages[0]?.image_url;
            return (
              <Link href={`/product/${p.id}`} className="product-card" key={p.id}>
                <div
                  className="product-img"
                  style={mainImage ? { backgroundImage: `url(${mainImage})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: grads[i % grads.length] }}
                >
                  {p.is_new && <div className="tag-new">{lang === "en" ? "NEW" : "جديد"}</div>}
                </div>
                <div className="product-name">{name}</div>
                <div className="product-price">
                  {lang === "en" ? `${p.price.toLocaleString("en-US")} EGP` : `${p.price.toLocaleString("ar-EG")} ج.م`}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="story">
        <div className="story-inner">
          <div className="story-visual"><span>HU</span></div>
          <div className="story-text">
            <div className="eyebrow">{d.storyeyebrow}</div>
            <h3>{d.storytitle}</h3>
            <p>{d.storytext}</p>
          </div>
        </div>
      </section>

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
