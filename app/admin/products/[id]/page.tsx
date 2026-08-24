"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Category = { id: string; name_en: string };

type VariantRow = {
  id?: string;
  size: string;
  colorNameEn: string;
  colorNameAr: string;
  colorHex: string;
  stock: string;
};

type ExistingImage = { id: string; image_url: string };

const commonSizes = ["S", "M", "L", "XL", "XXL"];

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(10,10,10,0.15)",
  padding: "12px 14px",
  fontSize: 14,
  fontFamily: "inherit",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#8a8580",
  marginBottom: 6,
  display: "block",
};

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    price: "",
    compare_at_price: "",
    category_id: "",
    is_new: false,
  });

  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: cats } = await supabase.from("categories").select("id, name_en").order("name_en");
      setCategories(cats || []);

      const { data: product } = await supabase.from("products").select("*").eq("id", productId).single();
      if (product) {
        setForm({
          name_en: product.name_en || "",
          name_ar: product.name_ar || "",
          description_en: product.description_en || "",
          description_ar: product.description_ar || "",
          price: String(product.price ?? ""),
          compare_at_price: product.compare_at_price != null ? String(product.compare_at_price) : "",
          category_id: product.category_id || "",
          is_new: !!product.is_new,
        });
      }

      const { data: vars } = await supabase.from("product_variants").select("*").eq("product_id", productId);
      setVariants(
        (vars || []).map((v) => ({
          id: v.id,
          size: v.size,
          colorNameEn: v.color_name_en,
          colorNameAr: v.color_name_ar,
          colorHex: v.color_hex,
          stock: String(v.stock ?? 0),
        }))
      );

      const { data: imgs } = await supabase
        .from("product_images")
        .select("id, image_url")
        .eq("product_id", productId)
        .order("position");
      setExistingImages(imgs || []);

      setLoading(false);
    }
    if (productId) load();
  }, [productId]);

  function addVariantRow() {
    setVariants((prev) => [...prev, { size: "M", colorNameEn: "", colorNameAr: "", colorHex: "#0a0a0a", stock: "10" }]);
  }

  function removeVariantRow(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariantRow(index: number, field: keyof VariantRow, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function handleNewImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setNewImageFiles((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  }

  function removeNewImage(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function removeExistingImage(image: ExistingImage) {
    if (!confirm("Remove this photo?")) return;
    // ricava il percorso del file dall'URL pubblico per cancellarlo anche dallo storage
    const parts = image.image_url.split("/product-images/");
    const filePath = parts[1];
    if (filePath) {
      await supabase.storage.from("product-images").remove([filePath]);
    }
    await supabase.from("product_images").delete().eq("id", image.id);
    setExistingImages((prev) => prev.filter((img) => img.id !== image.id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name_en || !form.name_ar || !form.price || !form.category_id) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name_en: form.name_en,
        name_ar: form.name_ar,
        description_en: form.description_en || null,
        description_ar: form.description_ar || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        category_id: form.category_id,
        is_new: form.is_new,
      })
      .eq("id", productId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // sincronizza le varianti: aggiorna quelle esistenti, crea le nuove, cancella quelle rimosse
    const { data: currentDbVariants } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);

    const currentIds = (currentDbVariants || []).map((v) => v.id);
    const keptIds = variants.filter((v) => v.id).map((v) => v.id);
    const idsToDelete = currentIds.filter((id) => !keptIds.includes(id));

    for (const id of idsToDelete) {
      await supabase.from("product_variants").delete().eq("id", id);
    }

    for (const v of variants) {
      if (!v.colorNameEn.trim()) continue;
      if (v.id) {
        await supabase
          .from("product_variants")
          .update({
            size: v.size,
            color_name_en: v.colorNameEn,
            color_name_ar: v.colorNameAr || v.colorNameEn,
            color_hex: v.colorHex,
            stock: parseInt(v.stock) || 0,
          })
          .eq("id", v.id);
      } else {
        await supabase.from("product_variants").insert({
          product_id: productId,
          size: v.size,
          color_name_en: v.colorNameEn,
          color_name_ar: v.colorNameAr || v.colorNameEn,
          color_hex: v.colorHex,
          stock: parseInt(v.stock) || 0,
          sku: `${productId}-${v.size}-${v.colorHex}`,
        });
      }
    }

    // carica le eventuali nuove foto aggiunte
    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i];
      const fileExt = file.name.split(".").pop();
      const filePath = `${productId}-${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
        await supabase.from("product_images").insert({
          product_id: productId,
          image_url: publicUrlData.publicUrl,
          position: existingImages.length + i,
        });
      }
    }

    setSaving(false);
    router.push("/admin");
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading…</div>;
  }

  return (
    <div style={{ padding: 40, fontFamily: "'Inter', sans-serif", maxWidth: 640, margin: "0 auto" }}>
      <Link href="/admin" style={{ fontSize: 12, color: "#8a8580", textDecoration: "underline" }}>
        ← Back to Products
      </Link>

      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, margin: "16px 0 32px" }}>
        Edit Product
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={labelStyle}>Existing Photos</label>
          {existingImages.length === 0 ? (
            <p style={{ fontSize: 13, color: "#8a8580" }}>No photos yet.</p>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {existingImages.map((img) => (
                <div key={img.id} style={{ position: "relative" }}>
                  <img src={img.image_url} alt="" style={{ width: 100, aspectRatio: "3/4", objectFit: "cover", border: "1px solid rgba(10,10,10,0.1)" }} />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img)}
                    style={{ position: "absolute", top: 4, right: 4, background: "#0a0a0a", color: "#fafafa", border: "none", width: 20, height: 20, fontSize: 12, cursor: "pointer", lineHeight: "20px", padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Add More Photos</label>
          <input type="file" accept="image/*" multiple onChange={handleNewImageChange} style={{ fontSize: 13 }} />
          {newImagePreviews.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              {newImagePreviews.map((src, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={src} alt="" style={{ width: 100, aspectRatio: "3/4", objectFit: "cover", border: "1px solid rgba(10,10,10,0.1)" }} />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    style={{ position: "absolute", top: 4, right: 4, background: "#0a0a0a", color: "#fafafa", border: "none", width: 20, height: 20, fontSize: 12, cursor: "pointer", lineHeight: "20px", padding: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Name (English) *</label>
          <input style={inputStyle} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>Name (Arabic) *</label>
          <input style={{ ...inputStyle, direction: "rtl" }} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>Description (English)</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>Description (Arabic)</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical", direction: "rtl" }} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Price (EGP) *</label>
            <input type="number" style={inputStyle} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Compare-at Price (optional)</label>
            <input type="number" style={inputStyle} placeholder="For sale items" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Category *</label>
          <select style={inputStyle} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} />
          Mark as "New"
        </label>

        <div>
          <label style={labelStyle}>Sizes & Colors Available</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {variants.map((v, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 50px 70px 28px", gap: 8, alignItems: "center" }}>
                <select value={v.size} onChange={(e) => updateVariantRow(i, "size", e.target.value)} style={{ ...inputStyle, padding: "10px 8px", fontSize: 13 }}>
                  {commonSizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input placeholder="Color (English)" value={v.colorNameEn} onChange={(e) => updateVariantRow(i, "colorNameEn", e.target.value)} style={{ ...inputStyle, padding: "10px 8px", fontSize: 13 }} />
                <input placeholder="Color (Arabic)" value={v.colorNameAr} onChange={(e) => updateVariantRow(i, "colorNameAr", e.target.value)} style={{ ...inputStyle, padding: "10px 8px", fontSize: 13, direction: "rtl" }} />
                <input type="color" value={v.colorHex} onChange={(e) => updateVariantRow(i, "colorHex", e.target.value)} style={{ width: 40, height: 38, border: "1px solid rgba(10,10,10,0.15)", padding: 2, cursor: "pointer" }} />
                <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariantRow(i, "stock", e.target.value)} style={{ ...inputStyle, padding: "10px 8px", fontSize: 13 }} />
                <button type="button" onClick={() => removeVariantRow(i)} style={{ background: "none", border: "none", color: "#b33", fontSize: 18, cursor: "pointer" }}>×</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addVariantRow}
            style={{ marginTop: 10, background: "none", border: "1px dashed rgba(10,10,10,0.25)", padding: "8px 16px", fontSize: 12, cursor: "pointer", color: "#8a8580" }}
          >
            + Add another size/color
          </button>
        </div>

        {error && <div style={{ fontSize: 13, color: "#b33" }}>{error}</div>}

        <button
          type="submit"
          disabled={saving}
          style={{ background: "#0a0a0a", color: "#fafafa", padding: "15px 0", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
