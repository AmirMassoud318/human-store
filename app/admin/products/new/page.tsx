"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Category = { id: string; name_en: string };

type VariantRow = {
  size: string;
  colorNameEn: string;
  colorNameAr: string;
  colorHex: string;
  stock: string;
};

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

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
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

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([
    { size: "M", colorNameEn: "", colorNameAr: "", colorHex: "#0a0a0a", stock: "10" },
  ]);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from("categories").select("id, name_en").order("name_en");
      setCategories(data || []);
      if (data && data.length > 0) {
        setForm((f) => ({ ...f, category_id: data[0].id }));
      }
    }
    loadCategories();
  }, []);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, { size: "M", colorNameEn: "", colorNameAr: "", colorHex: "#0a0a0a", stock: "10" }]);
  }

  function removeVariantRow(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariantRow(index: number, field: keyof VariantRow, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name_en || !form.name_ar || !form.price || !form.category_id) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert({
        name_en: form.name_en,
        name_ar: form.name_ar,
        description_en: form.description_en || null,
        description_ar: form.description_ar || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        category_id: form.category_id,
        is_new: form.is_new,
        is_active: true,
      })
      .select()
      .single();

    if (insertError || !newProduct) {
      setError(insertError?.message || "Failed to create product.");
      setSaving(false);
      return;
    }

    // carichiamo tutte le foto scelte, in ordine
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split(".").pop();
      const filePath = `${newProduct.id}-${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        await supabase.from("product_images").insert({
          product_id: newProduct.id,
          image_url: publicUrlData.publicUrl,
          position: i,
        });
      }
    }

    // salviamo le taglie/colori disponibili per questo prodotto
    const validVariants = variants.filter((v) => v.colorNameEn.trim() !== "");
    for (const v of validVariants) {
      await supabase.from("product_variants").insert({
        product_id: newProduct.id,
        size: v.size,
        color_name_en: v.colorNameEn,
        color_name_ar: v.colorNameAr || v.colorNameEn,
        color_hex: v.colorHex,
        stock: parseInt(v.stock) || 0,
        sku: `${newProduct.id}-${v.size}-${v.colorHex}`,
      });
    }

    setSaving(false);
    router.push("/admin");
  }

  return (
    <div style={{ padding: 40, fontFamily: "'Inter', sans-serif", maxWidth: 640, margin: "0 auto" }}>
      <Link href="/admin" style={{ fontSize: 12, color: "#8a8580", textDecoration: "underline" }}>
        ← Back to Products
      </Link>

      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, margin: "16px 0 32px" }}>
        Add New Product
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={labelStyle}>Product Photos</label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ fontSize: 13 }} />
          {imagePreviews.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              {imagePreviews.map((src, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    style={{ width: 100, aspectRatio: "3/4", objectFit: "cover", border: "1px solid rgba(10,10,10,0.1)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "#0a0a0a",
                      color: "#fafafa",
                      border: "none",
                      width: 20,
                      height: 20,
                      fontSize: 12,
                      cursor: "pointer",
                      lineHeight: "20px",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                  {i === 0 && (
                    <div style={{ fontSize: 9, color: "#8a8580", marginTop: 4, textAlign: "center" }}>Main</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Name (English) *</label>
          <input
            style={inputStyle}
            value={form.name_en}
            onChange={(e) => setForm({ ...form, name_en: e.target.value })}
          />
        </div>

        <div>
          <label style={labelStyle}>Name (Arabic) *</label>
          <input
            style={{ ...inputStyle, direction: "rtl" }}
            value={form.name_ar}
            onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
          />
        </div>

        <div>
          <label style={labelStyle}>Description (English)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            value={form.description_en}
            onChange={(e) => setForm({ ...form, description_en: e.target.value })}
          />
        </div>

        <div>
          <label style={labelStyle}>Description (Arabic)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: "vertical", direction: "rtl" }}
            value={form.description_ar}
            onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Price (EGP) *</label>
            <input
              type="number"
              style={inputStyle}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Compare-at Price (optional)</label>
            <input
              type="number"
              style={inputStyle}
              placeholder="For sale items"
              value={form.compare_at_price}
              onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Category *</label>
          <select
            style={inputStyle}
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={form.is_new}
            onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
          />
          Mark as "New"
        </label>

        <div>
          <label style={labelStyle}>Sizes & Colors Available</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {variants.map((v, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 50px 70px 28px", gap: 8, alignItems: "center" }}>
                <select
                  value={v.size}
                  onChange={(e) => updateVariantRow(i, "size", e.target.value)}
                  style={{ ...inputStyle, padding: "10px 8px", fontSize: 13 }}
                >
                  {commonSizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  placeholder="Color (English)"
                  value={v.colorNameEn}
                  onChange={(e) => updateVariantRow(i, "colorNameEn", e.target.value)}
                  style={{ ...inputStyle, padding: "10px 8px", fontSize: 13 }}
                />
                <input
                  placeholder="Color (Arabic)"
                  value={v.colorNameAr}
                  onChange={(e) => updateVariantRow(i, "colorNameAr", e.target.value)}
                  style={{ ...inputStyle, padding: "10px 8px", fontSize: 13, direction: "rtl" }}
                />
                <input
                  type="color"
                  value={v.colorHex}
                  onChange={(e) => updateVariantRow(i, "colorHex", e.target.value)}
                  style={{ width: 40, height: 38, border: "1px solid rgba(10,10,10,0.15)", padding: 2, cursor: "pointer" }}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => updateVariantRow(i, "stock", e.target.value)}
                  style={{ ...inputStyle, padding: "10px 8px", fontSize: 13 }}
                />
                <button
                  type="button"
                  onClick={() => removeVariantRow(i)}
                  style={{ background: "none", border: "none", color: "#b33", fontSize: 18, cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addVariantRow}
            style={{
              marginTop: 10,
              background: "none",
              border: "1px dashed rgba(10,10,10,0.25)",
              padding: "8px 16px",
              fontSize: 12,
              cursor: "pointer",
              color: "#8a8580",
            }}
          >
            + Add another size/color
          </button>
        </div>

        {error && <div style={{ fontSize: 13, color: "#b33" }}>{error}</div>}

        <button
          type="submit"
          disabled={saving}
          style={{
            background: "#0a0a0a",
            color: "#fafafa",
            padding: "15px 0",
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save Product"}
        </button>
      </form>
    </div>
  );
}
