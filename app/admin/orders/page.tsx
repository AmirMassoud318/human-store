"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  product_name_en: string;
  size: string;
  color_name_en: string;
  unit_price: number;
  quantity: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  city: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

const statusOptions = ["processing", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  processing: "#8a8580",
  shipped: "#5b6a5a",
  delivered: "#0a0a0a",
  cancelled: "#b33",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    setOrders((data as unknown as Order[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(orderId: string, newStatus: string) {
    await supabase.from("orders").update({ order_status: newStatus }).eq("id", orderId);
    loadOrders();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div style={{ padding: 40, fontFamily: "'Inter', sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32 }}>Orders</h1>
        <p style={{ color: "#8a8580", fontSize: 13, marginTop: 4 }}>{orders.length} orders total</p>
      </div>

      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid rgba(10,10,10,0.1)", marginBottom: 32, paddingBottom: 12 }}>
        <Link href="/admin" style={{ fontSize: 13, color: "#8a8580" }}>Products</Link>
        <span style={{ fontSize: 13, borderBottom: "2px solid #0a0a0a", paddingBottom: 12, marginBottom: -13 }}>Orders</span>
      </div>

      {loading ? (
        <p style={{ color: "#8a8580" }}>Loading…</p>
      ) : orders.length === 0 ? (
        <p style={{ color: "#8a8580" }}>No orders yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {orders.map((order) => (
            <div key={order.id} style={{ border: "1px solid rgba(10,10,10,0.12)", padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a8580", marginTop: 2 }}>
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <select
                  value={order.order_status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  style={{
                    border: `1px solid ${statusColors[order.order_status]}`,
                    color: statusColors[order.order_status],
                    background: "none",
                    padding: "6px 12px",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontFamily: "inherit",
                  }}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16, fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8a8580", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    Customer
                  </div>
                  <div>{order.customer_name}</div>
                  <div style={{ color: "#8a8580" }}>{order.customer_phone}</div>
                  {order.customer_email && <div style={{ color: "#8a8580" }}>{order.customer_email}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8a8580", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    Delivery
                  </div>
                  <div>{order.shipping_address}</div>
                  <div style={{ color: "#8a8580" }}>{order.city}</div>
                  <div style={{ color: "#8a8580", marginTop: 4 }}>
                    {order.payment_method === "cash_on_delivery" ? "Cash on Delivery" : order.payment_method}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(10,10,10,0.08)", paddingTop: 14 }}>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span>
                      {item.product_name_en} — {item.color_name_en} / {item.size} × {item.quantity}
                    </span>
                    <span>{(item.unit_price * item.quantity).toLocaleString("en-US")} EGP</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(10,10,10,0.08)" }}>
                  <span>Total</span>
                  <span>{order.total.toLocaleString("en-US")} EGP</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
