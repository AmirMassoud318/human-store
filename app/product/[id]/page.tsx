"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

type Product = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
};

type Variant = {
  id: string;
  size: string;
  color_name_en: string;
  color_name_ar: string;
  color_hex: string;
  stock: number;
};

type ProductImage = {
  id: string;
  image_url: string;
  position: number;
};

const dict = {
  en: {
    dir: "ltr", langBtn: "العربية",
    navlinks: ["T-Shirts", "Shirts", "Pants", "Jackets"],
    topbar: "FREE DELIVERY IN CAIRO ON ORDERS OVER 1500 EGP",
    brandname: "Human", brandsub: "Men's Wear",
    bcHome: "Home", bcShop: "Shop",
    colorlabel: "Color", sizelabel: "Size", qtylabel: "Quantity",
    addtobag: "Add to Bag", wishlist: "Add to Wishlist",
    meta1: "Fabric & Care", meta2: "Delivery & Returns", meta3: "Size & Fit",
    foottagline: "For men's wear. Wear good, feel Good. Based at El Rehab Mall 2, Cairo, Egypt.",
    fc1: "Shop", fc1items: ["T-Shirts", "Shirts", "Pants", "Jackets"],
    fc2: "Help", fc2items: ["Delivery", "Returns", "Size Guide", "Contact Us"],
    fc3: "Human", fc3items: ["Our Story", "Instagram", "WhatsApp"],
    copy: "© 2026 Human — Men's Wear. El Rehab Mall 2, Cairo, Egypt.",
    currency: "EGP — Egyptian Pound",
    search: "Search", account: "Account", bag: "Bag",
    loading: "Loading…", notFound: "Product not found.",
    added: "Added!",
    priceFmt: (n: number) => `${n.toLocaleString("en-US")} EGP`,
  },
  ar: {
    dir: "rtl", langBtn: "English",
    navlinks: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات"],
    topbar: "توصيل مجاني داخل القاهرة للطلبات فوق ١٥٠٠ جنيه",
    brandname: "هيومن", brandsub: "ملابس رجالي",
    bcHome: "الرئيسية", bcShop: "المتجر",
    colorlabel: "اللون", sizelabel: "المقاس", qtylabel: "الكمية",
    addtobag: "أضف إلى الحقيبة", wishlist: "أضف إلى المفضلة",
    meta1: "القماش والعناية", meta2: "التوصيل والاسترجاع", meta3: "المقاس والقصة",
    foottagline: "لملابس الرجال. البس كويس، حس بالراحة. مقرنا في مول الرحاب 2، القاهرة.",
    fc1: "تسوق", fc1items: ["تيشيرتات", "قمصان", "بناطيل", "جاكيتات"],
    fc2: "مساعدة", fc2items: ["التوصيل", "الاسترجاع", "دليل المقاسات", "اتصل بنا"],
    fc3: "Human", fc3items: ["قصتنا", "انستجرام", "واتساب"],
    copy: "© ٢٠٢٦ Human — لملابس الرجال. مول الرحاب 2، القاهرة، مصر.",
    currency: "جنيه مصري",
    search: "بحث", account: "حسابي", bag: "الحقيبة",
    loading: "جارٍ التحميل…", notFound: "المنتج غير موجود.",
    added: "تمت الإضافة!",
    priceFmt: (n: number) => `${n.toLocaleString("ar-EG")} ج.م`,
  },
};

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { addItem, totalQty } = useCart();
  const { user } = useAuth();

  const [lang, setLang] = useState<"en" | "ar">("en");
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const d = dict[lang];

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: prod } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      const { data: vars } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id);

      const { data: imgs } = await supabase
        .from("product_images")
        .select("id, image_url, position")
        .eq("product_id", id)
        .order("position");

      setProduct(prod);
      setVariants(vars || []);
      setImages(imgs || []);
      if (vars && vars.length > 0) {
        setSelectedSize(vars[0].size);
        setSelectedColor(vars[0].color_hex);
      }
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 80, textAlign: "center" }}>{d.loading}</div>;
  }

  if (!product) {
    return <div style={{ padding: 80, textAlign: "center" }}>{d.notFound}</div>;
  }

  const name = lang === "en" ? product.name_en : product.name_ar;
  const description = lang === "en" ? product.description_en : product.description_ar;
  const onSale = product.compare_at_price !== null;

  const uniqueSizes = [...new Set(variants.map((v) => v.size))];
  const uniqueColors = [...new Map(variants.map((v) => [v.color_hex, v])).values()];

  function handleAddToBag() {
    const variant = variants.find(
      (v) => v.size === selectedSize && v.color_hex === selectedColor
    );
    if (!variant || !product) return;

    addItem({
      variantId: variant.id,
      productId: product.id,
      nameEn: product.name_en,
      nameAr: product.name_ar,
      size: variant.size,
      colorNameEn: variant.color_name_en,
      colorNameAr: variant.color_name_ar,
      colorHex: variant.color_hex,
      price: product.price,
      qty,
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
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
            <Link href={user ? "/account" : "/login"} className="icon-btn">{d.account}</Link>
            <Link href="/cart" className="icon-btn">{d.bag} ({totalQty})</Link>
          </div>
        </div>
      </header>

      <div className="breadcrumb">
        <Link href="/">{d.bcHome}</Link><span className="sep">/</span>
        <Link href="/shop">{d.bcShop}</Link><span className="sep">/</span>
        <span>{name}</span>
      </div>

      <main className="product-main">
        <div className="gallery">
          <div
            className="gallery-main"
            style={
              images[activeImage]
                ? { backgroundImage: `url(${images[activeImage].image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: "linear-gradient(150deg,#d6cfc0,#a89d86)" }
            }
          >
            {images.length > 1 && (
              <>
                <button
                  className="gallery-arrow prev"
                  onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  className="gallery-arrow next"
                  onClick={() => setActiveImage((activeImage + 1) % images.length)}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  style={{
                    backgroundImage: `url(${img.image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    outline: activeImage === i ? "2px solid #0a0a0a" : "none",
                    outlineOffset: "-2px",
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <h1 className="pdp-title">{name}</h1>
          <div className="pdp-price">
            {onSale && <span className="old">{d.priceFmt(product.compare_at_price!)}</span>}
            {d.priceFmt(product.price)}
          </div>

          {description && <p className="pdp-desc">{description}</p>}

          {uniqueColors.length > 0 && (
            <div className="option-block">
              <div className="option-label"><span>{d.colorlabel}</span></div>
              <div className="color-grid">
                {uniqueColors.map((c) => (
                  <div
                    key={c.color_hex}
                    className={`color-swatch ${selectedColor === c.color_hex ? "selected" : ""}`}
                    style={{ background: c.color_hex }}
                    onClick={() => setSelectedColor(c.color_hex)}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {uniqueSizes.length > 0 && (
            <div className="option-block">
              <div className="option-label"><span>{d.sizelabel}</span></div>
              <div className="size-grid">
                {uniqueSizes.map((s) => (
                  <button
                    key={s}
                    className={`size-pill ${selectedSize === s ? "selected" : ""}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="qty-row">
            <span className="option-label" style={{ margin: 0 }}>{d.qtylabel}</span>
            <div className="qty-control">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", border: "none", marginBottom: 12 }}
            onClick={handleAddToBag}
            disabled={!selectedSize || !selectedColor}
          >
            {justAdded ? d.added : d.addtobag}
          </button>
          <button className="btn-secondary">{d.wishlist}</button>

          <div className="pdp-meta">
            <div className="meta-row"><span>{d.meta1}</span><span className="plus">+</span></div>
            <div className="meta-row"><span>{d.meta2}</span><span className="plus">+</span></div>
            <div className="meta-row"><span>{d.meta3}</span><span className="plus">+</span></div>
          </div>
        </div>
      </main>

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
