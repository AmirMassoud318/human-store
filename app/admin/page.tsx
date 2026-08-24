"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name_en: string;
  name_ar: string;
  price: number;
  is_active: boolean;
  is_new: boolean;
  categories: { name_en: string } | null;
};

type Variant = {
  id: string;
  size: string;
  color_name_en: string;
  color_hex: string;
  stock: number;
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, Variant[]>>({});
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  async function toggleStock(productId: string) {
    if (expandedId === productId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(productId);

    if (!variantsByProduct[productId]) {
      const { data } = await supabase
        .from("product_variants")
        .select("id, size, color_name_en, color_hex, stock")
        .eq("product_id", productId);
      setVariantsByProduct((prev) => ({ ...prev, [productId]: data || [] }));
    }
  }

  async function updateStock(productId: string, variantId: string, newStock: number) {
    setVariantsByProduct((prev) => ({
      ...prev,
      [productId]: prev[productId].map((v) => (v.id === variantId ? { ...v, stock: newStock } : v)),
    }));
  }

  async function saveStock(variantId: string) {
    const productVariants = Object.values(variantsByProduct).flat();
    const variant = productVariants.find((v) => v.id === variantId);
    if (!variant) return;

    await supabase.from("product_variants").update({ stock: variant.stock }).eq("id", variantId);
    setSavedFlash(variantId);
    setTimeout(() => setSavedFlash(null), 1000);
  }

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name_en, name_ar, price, is_active, is_new, categories(name_en)")
      .order("created_at", { ascending: false });

    setProducts((data as unknown as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await supabase.from("products").update({ is_active: !current }).eq("id", id);
    loadProducts();
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  }

  return (
    <div style={{ padding: 40, fontFamily: "'Inter', sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32 }}>Products</h1>
          <p style={{ color: "#8a8580", fontSize: 13, marginTop: 4 }}>{products.length} products total</p>
        </div>
        <Link
          href="/admin/products/new"
          style={{
            background: "#0a0a0a",
            color: "#fafafa",
            padding: "13px 28px",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          + Add Product
        </Link>
      </div>

      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid rgba(10,10,10,0.1)", marginBottom: 32, paddingBottom: 12 }}>
        <span style={{ fontSize: 13, borderBottom: "2px solid #0a0a0a", paddingBottom: 12, marginBottom: -13 }}>Products</span>
        <Link href="/admin/orders" style={{ fontSize: 13, color: "#8a8580" }}>Orders</Link>
      </div>

      {loading ? (
        <p style={{ color: "#8a8580" }}>Loading…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #0a0a0a", textAlign: "left" }}>
              <th style={{ padding: "10px 8px" }}>Name</th>
              <th style={{ padding: "10px 8px" }}>Category</th>
              <th style={{ padding: "10px 8px" }}>Price</th>
              <th style={{ padding: "10px 8px" }}>Status</th>
              <th style={{ padding: "10px 8px" }}></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <React.Fragment key={p.id}>
              <tr style={{ borderBottom: "1px solid rgba(10,10,10,0.1)" }}>
                <td style={{ padding: "14px 8px" }}>
                  {p.name_en} {p.is_new && <span style={{ fontSize: 10, color: "#8a8580" }}>(NEW)</span>}
                </td>
                <td style={{ padding: "14px 8px", color: "#8a8580" }}>
                  {p.categories?.name_en || "—"}
                </td>
                <td style={{ padding: "14px 8px" }}>{p.price} EGP</td>
                <td style={{ padding: "14px 8px" }}>
                  <button
                    onClick={() => toggleActive(p.id, p.is_active)}
                    style={{
                      border: "1px solid rgba(10,10,10,0.15)",
                      background: p.is_active ? "#0a0a0a" : "none",
                      color: p.is_active ? "#fafafa" : "#0a0a0a",
                      padding: "5px 12px",
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {p.is_active ? "Active" : "Hidden"}
                  </button>
                </td>
                <td style={{ padding: "14px 8px", textAlign: "right" }}>
                  <button
                    onClick={() => toggleStock(p.id)}
                    style={{ fontSize: 12, marginInlineEnd: 16, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "#0a0a0a" }}
                  >
                    Stock
                  </button>
                  <Link href={`/admin/products/${p.id}`} style={{ fontSize: 12, marginInlineEnd: 16, textDecoration: "underline" }}>
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteProduct(p.id, p.name_en)}
                    style={{ fontSize: 12, color: "#b33", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
              {expandedId === p.id && (
                <tr>
                  <td colSpan={5} style={{ padding: "0 8px 20px", background: "#faf9f7" }}>
                    {!variantsByProduct[p.id] ? (
                      <div style={{ padding: 16, fontSize: 13, color: "#8a8580" }}>Loading…</div>
                    ) : variantsByProduct[p.id].length === 0 ? (
                      <div style={{ padding: 16, fontSize: 13, color: "#8a8580" }}>No size/color options yet.</div>
                    ) : (
                      <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                        {variantsByProduct[p.id].map((v) => (
                          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: v.color_hex, border: "1px solid rgba(10,10,10,0.15)" }}></div>
                            <span style={{ width: 100 }}>{v.color_name_en} / {v.size}</span>
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) => updateStock(p.id, v.id, parseInt(e.target.value) || 0)}
                              onBlur={() => saveStock(v.id)}
                              style={{ width: 70, border: "1px solid rgba(10,10,10,0.15)", padding: "6px 8px", fontSize: 13, fontFamily: "inherit" }}
                            />
                            {savedFlash === v.id && <span style={{ fontSize: 11, color: "#5b6a5a" }}>Saved ✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
              </React.Fragment>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

