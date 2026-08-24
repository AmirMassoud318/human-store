"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";

type Product = {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  compare_at_price: number | null;
  is_new: boolean;
  category_id: string;
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
    bcHome: "Home", bcCurrent: "All Products",
    catTitle: "All Products", catDesc: "Every piece, cut clean and made to last.",
    filterAll: "All", filterNew: "New", filterSale: "Sale",
    sortFeatured: "Featured", sortLow: "Price: Low to High", sortHigh: "Price: High to Low",
    itemsLabel: "items", newTag: "NEW", saleTag: "SALE",
    foottagline: "For men's wear. Wear good, feel Good. Based in Rehab City, Cairo.",
    fc1: "Shop", fc1items: ["T-Shirts", "Shirts", "Pants", "Jackets"],
    fc2: "Help", fc2items: ["Delivery", "Returns", "Size Guide", "Contact Us"],
    fc3: "Human", fc3items: ["Our Story", "Instagram", "WhatsApp"],
    copy: "© 2026 Human — Men's Wear. Rehab City, Cairo, Egypt.",
    currency: "EGP — Egyptian Pound",
    search: "Search", account: "Account", bag: "Bag",
    loading: "Loading products…", empty: "No products found.",
    priceFmt: (n: number) => `${n.toLocaleString("en-US")} EGP`,
  },
  ar: {
    dir: "rtl", langBtn: "English",
    navlinks: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات"],
    topbar: "توصيل مجاني داخل القاهرة للطلبات فوق ١٥٠٠ جنيه",
    brandname: "هيومن", brandsub: "ملابس رجالي",
    bcHome: "الرئيسية", bcCurrent: "كل المنتجات",
    catTitle: "كل المنتجات", catDesc: "كل قطعة، قصة نظيفة تدوم طويلاً.",
    filterAll: "الكل", filterNew: "جديد", filterSale: "تخفيضات",
    sortFeatured: "مميز", sortLow: "السعر: من الأقل", sortHigh: "السعر: من الأعلى",
    itemsLabel: "قطعة", newTag: "جديد", saleTag: "تخفيض",
    foottagline: "لملابس الرجال. البس كويس، حس بالراحة. مقرنا في ريحاب سيتي، القاهرة.",
    fc1: "تسوق", fc1items: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات"],
    fc2: "مساعدة", fc2items: ["التوصيل", "الاسترجاع", "دليل المقاسات", "اتصل بنا"],
    fc3: "Human", fc3items: ["قصتنا", "انستجرام", "واتساب"],
    copy: "© ٢٠٢٦ Human — لملابس الرجال. ريحاب سيتي، القاهرة، مصر.",
    currency: "جنيه مصري",
    search: "بحث", account: "حسابي", bag: "الحقيبة",
    loading: "جارٍ تحميل المنتجات…", empty: "لا توجد منتجات.",
    priceFmt: (n: number) => `${n.toLocaleString("ar-EG")} ج.م`,
  },
};

// gradienti placeholder finché non carichiamo foto vere
const grads = [
  "linear-gradient(150deg,#d6cfc0,#a89d86)",
  "linear-gradient(150deg,#1a1a1a,#3a3a3a)",
  "linear-gradient(150deg,#26241f,#0a0a0a)",
  "linear-gradient(150deg,#c2b8a3,#8f8570)",
  "linear-gradient(150deg,#e0d9c9,#b9ae98)",
  "linear-gradient(150deg,#5a6b7c,#3a4757)",
];

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageContent />
    </Suspense>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [lang, setLang] = useState<"en" | "ar">("en");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "sale">("all");
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");
  const { totalQty } = useCart();

  const d = dict[lang];
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from("categories").select("id, name_en, name_ar, slug");
      setCategories(data || []);
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name_en, name_ar, price, compare_at_price, is_new, category_id, product_images(image_url, position)")
        .eq("is_active", true);

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  let displayed = products.filter((p) => {
    if (activeCategory && p.category_id !== activeCategory.id) return false;
    if (filter === "new") return p.is_new;
    if (filter === "sale") return p.compare_at_price !== null;
    return true;
  });

  if (sort === "low") displayed = [...displayed].sort((a, b) => a.price - b.price);
  if (sort === "high") displayed = [...displayed].sort((a, b) => b.price - a.price);

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

      <div className="breadcrumb">
        <Link href="/">{d.bcHome}</Link><span className="sep">/</span>
        <span>{d.bcCurrent}</span>
      </div>

      <div className="cat-header">
        <h1>{activeCategory ? (lang === "en" ? activeCategory.name_en : activeCategory.name_ar) : d.catTitle}</h1>
        <p>{d.catDesc}</p>
      </div>

      <div className="toolbar">
        <div className="filter-pills">
          <button className={`filter-pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>{d.filterAll}</button>
          <button className={`filter-pill ${filter === "new" ? "active" : ""}`} onClick={() => setFilter("new")}>{d.filterNew}</button>
          <button className={`filter-pill ${filter === "sale" ? "active" : ""}`} onClick={() => setFilter("sale")}>{d.filterSale}</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span className="result-count">{displayed.length} {d.itemsLabel}</span>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as "featured" | "low" | "high")}>
            <option value="featured">{d.sortFeatured}</option>
            <option value="low">{d.sortLow}</option>
            <option value="high">{d.sortHigh}</option>
          </select>
        </div>
      </div>

      <div className="cat-body">
        {loading ? (
          <div className="empty-state">{d.loading}</div>
        ) : displayed.length === 0 ? (
          <div className="empty-state">{d.empty}</div>
        ) : (
          <div className="product-grid">
            {displayed.map((p, i) => {
              const name = lang === "en" ? p.name_en : p.name_ar;
              const onSale = p.compare_at_price !== null;
              const sortedImages = [...(p.product_images || [])].sort((a, b) => a.position - b.position);
              const mainImage = sortedImages[0]?.image_url;
              return (
                <Link href={`/product/${p.id}`} className="product-card" key={p.id}>
                  <div
                    className="product-img"
                    style={mainImage ? { backgroundImage: `url(${mainImage})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: grads[i % grads.length] }}
                  >
                    {p.is_new && <div className="tag-new">{d.newTag}</div>}
                    {onSale && <div className="tag-sale">{d.saleTag}</div>}
                  </div>
                  <div className="product-name">{name}</div>
                  <div className="product-price">
                    {onSale ? (
                      <>
                        <span className="old">{d.priceFmt(p.compare_at_price!)}</span>
                        <span className="now">{d.priceFmt(p.price)}</span>
                      </>
                    ) : (
                      d.priceFmt(p.price)
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
