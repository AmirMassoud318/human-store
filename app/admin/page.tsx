"use client";

import { useEffect, useState } from "react";
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

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
              <tr key={p.id} style={{ borderBottom: "1px solid rgba(10,10,10,0.1)" }}>
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

