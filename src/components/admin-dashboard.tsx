"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ImagePlus, LogOut, PackagePlus, RefreshCw, ShoppingBag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/products";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  total: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
};
type Summary = { totalOrders: number; totalSales: number; pendingOrders: number };
type DraftProduct = { name: string; description: string; price: string; stock: string; category: string; image: string; featured: boolean };
const emptyDraft: DraftProduct = { name: "", description: "", price: "", stock: "", category: "Snacks", image: "", featured: false };

export default function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalOrders: 0, totalSales: 0, pendingOrders: 0 });
  const [draft, setDraft] = useState(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"orders" | "products">("orders");

  const load = useCallback(async () => {
    const [productResponse, orderResponse] = await Promise.all([fetch("/api/products", { cache: "no-store" }), fetch("/api/admin/orders", { cache: "no-store" })]);
    if (orderResponse.status === 401) {
      router.replace("/admin/login");
      return;
    }
    if (!productResponse.ok || !orderResponse.ok) throw new Error("Could not load the store dashboard.");
    const productData = await productResponse.json() as Product[];
    const orderData = await orderResponse.json() as { orders: Order[]; summary: Summary };
    setProducts(productData);
    setOrders(orderData.orders);
    setSummary(orderData.summary);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Dashboard could not be loaded."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const uploadImage = async (file: File) => {
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Image upload failed.");
    return data.url as string;
  };

  const createProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!draft.image.trim()) throw new Error("Add a product image URL before saving.");
      const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, price: Number(draft.price), stock: Number(draft.stock) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Product could not be added.");
      setDraft(emptyDraft);
      await load();
      setMessage("Product added to the shop.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product could not be added.");
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async (product: Product) => {
    const response = await fetch(`/api/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(product) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Product could not be saved.");
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name} from the shop?`)) return;
    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Product could not be deleted.");
    else await load();
  };

  const updateOrder = async (id: string, status: string) => {
    const response = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Order status could not be updated.");
    else await load();
  };

  const signOut = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  };

  return <main className="admin-page"><div className="admin-wrap"><div className="admin-heading"><div><span className="eyebrow">MINI MINI · STORE DESK</span><h1>Good morning.</h1><p>Here is the latest from your little corner of crunch.</p></div><div className="admin-actions"><Link href="/shop" target="_blank" className="admin-quiet-button">View shop <ArrowUpRight size={15} /></Link><button className="admin-quiet-button" onClick={signOut}><LogOut size={15} /> Sign out</button></div></div>
    {message && <div className="admin-alert" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage("")}>×</button></div>}
    <section className="stats-grid"><article className="stat-block"><span>PAID SALES</span><strong>${summary.totalSales.toFixed(2)}</strong><small>USD · lifetime</small></article><article className="stat-block"><span>PAID ORDERS</span><strong>{summary.totalOrders}</strong><small>Completed checkouts</small></article><article className="stat-block"><span>AWAITING PAYMENT</span><strong>{summary.pendingOrders}</strong><small>Open checkout sessions</small></article></section>
    <div className="admin-tabs" role="tablist"><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Orders <span>{orders.length}</span></button><button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Products <span>{products.length}</span></button><button className="admin-refresh" onClick={() => load().catch((error: unknown) => setMessage(String(error)))} aria-label="Refresh dashboard" title="Refresh"><RefreshCw size={16} /></button></div>
    {tab === "orders" ? <section className="admin-table-wrap"><div className="admin-section-heading"><div><h2>Customer orders</h2><p>Payment and delivery at a glance.</p></div><ShoppingBag size={20} /></div>{orders.length === 0 ? <p className="admin-empty">New orders will show up here after checkout.</p> : <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}><div className="order-topline"><div><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleString()}</small></div><div className="order-badges"><span className={`payment-pill ${order.paymentStatus}`}>{order.paymentStatus}</span><span className={`status-pill ${order.status}`}>{order.status}</span></div></div><div className="order-detail-grid"><div><b>Customer</b><span>{order.customerName}</span><span>{order.email}</span><span>{order.phone}</span></div><div><b>Delivery</b><span>{order.address}</span><span>{order.city}, {order.country}</span></div><div><b>Items</b>{order.items.map((item, index) => <span key={`${item.name}-${index}`}>{item.name} × {item.quantity}</span>)}</div><div className="order-total"><b>Total paid</b><strong>${order.total.toFixed(2)}</strong></div></div>{order.paymentStatus === "paid" && <label className="status-select-label">Fulfillment status<select value={order.status} onChange={(event) => updateOrder(order.id, event.target.value)}><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></label>}</article>)}</div>}</section> : <section className="product-admin"><div className="admin-section-heading"><div><h2>Shop products</h2><p>Changes publish directly to the customer shop.</p></div><PackagePlus size={20} /></div><form className="new-product-form" onSubmit={createProduct}><h3>Add a product</h3><div className="admin-form-grid"><label className="field">Product name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label className="field">Category<input required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label><label className="field">Price (USD)<input required type="number" min="0.01" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></label><label className="field">Available stock<input required type="number" min="0" step="1" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} /></label><label className="field admin-wide">Short description<textarea required value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><label className="field admin-wide">Image URL<input required type="url" placeholder="https://... or /uploads/..." value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} /></label><label className="admin-featured"><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} /> Feature on home page</label></div><button className="button button-dark" disabled={busy}>{busy ? "Adding..." : "Add product"}</button></form><div className="managed-products">{products.map((product) => <article className="managed-product" key={product.id}><div className="managed-image"><Image src={product.image} alt="" fill sizes="80px" unoptimized /></div><div className="managed-fields"><input aria-label={`${product.name} name`} value={product.name} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, name: event.target.value } : item))} /><textarea aria-label={`${product.name} description`} value={product.description} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, description: event.target.value } : item))} /><div className="managed-small-fields"><label>Price $<input type="number" min="0.01" step="0.01" value={product.price} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, price: Number(event.target.value) } : item))} /></label><label>Stock<input type="number" min="0" step="1" value={product.stock} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: Number(event.target.value) } : item))} /></label><label>Category<input value={product.category} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, category: event.target.value } : item))} /></label></div><label className="managed-image-change"><ImagePlus size={15} /> Upload new picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const image = await uploadImage(file); setProducts((current) => current.map((item) => item.id === product.id ? { ...item, image } : item)); } catch (error) { setMessage(error instanceof Error ? error.message : "Image upload failed."); } }} /></label><label className="managed-featured"><input type="checkbox" checked={product.featured} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, featured: event.target.checked } : item))} /> Featured</label></div><div className="managed-actions"><button className="button button-dark" onClick={() => saveProduct(product).then(() => load()).catch((error: unknown) => setMessage(String(error)))}>Save</button><button className="delete-icon" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`} title="Delete product"><Trash2 size={16} /></button></div></article>)}</div></section>}</div></main>;
}