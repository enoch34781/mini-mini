import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { sampleProducts, type Product } from "@/lib/products";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  stock: number;
  image: string;
  category: string;
  featured: number;
};

type OrderLineInput = { productId: string; quantity: number };
type CustomerInput = { fullName: string; email: string; phone: string; address: string; city: string; country: string };
type ReservedLine = { id: string; name: string; description: string; priceCents: number; quantity: number };

const globalForDb = globalThis as typeof globalThis & { mmcDatabase?: Database.Database };

export function getDb() {
  if (globalForDb.mmcDatabase) return globalForDb.mmcDatabase;
  const filePath = process.env.DATABASE_PATH || path.join(process.cwd(), ".data", "mini-mini.sqlite");
  mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new Database(filePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK(price_cents > 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      image TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Snacks',
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      fulfillment_status TEXT NOT NULL DEFAULT 'pending',
      stripe_session_id TEXT UNIQUE,
      inventory_reserved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0)
    );
  `);

  const productCount = (database.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number }).count;
  if (productCount === 0) {
    const insert = database.prepare(`INSERT INTO products (id, slug, name, description, price_cents, stock, image, category, featured, created_at)
      VALUES (@id, @slug, @name, @description, @price_cents, @stock, @image, @category, @featured, @created_at)`);
    const insertSamples = database.transaction(() => {
      for (const product of sampleProducts) {
        insert.run({ ...product, price_cents: Math.round(product.price * 100), featured: Number(product.featured), created_at: new Date().toISOString() });
      }
    });
    insertSamples();
  }
  globalForDb.mmcDatabase = database;
  return database;
}

function toProduct(row: ProductRow): Product {
  return { id: row.id, slug: row.slug, name: row.name, description: row.description, price: row.price_cents / 100, stock: row.stock, image: row.image, category: row.category, featured: Boolean(row.featured) };
}

export function listProducts() {
  return (getDb().prepare("SELECT * FROM products ORDER BY featured DESC, created_at ASC").all() as ProductRow[]).map(toProduct);
}

export function getProduct(id: string) {
  const row = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  return row ? toProduct(row) : null;
}

export function insertProduct(input: Omit<Product, "id" | "slug">) {
  const database = getDb();
  const id = randomUUID();
  const baseSlug = input.name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "snack";
  const slug = `${baseSlug}-${randomBytes(3).toString("hex")}`;
  database.prepare(`INSERT INTO products (id, slug, name, description, price_cents, stock, image, category, featured, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, slug, input.name, input.description, Math.round(input.price * 100), input.stock, input.image, input.category || "Snacks", Number(input.featured), new Date().toISOString());
  return getProduct(id);
}

export function updateProduct(id: string, input: Partial<Omit<Product, "id" | "slug">>) {
  const current = getProduct(id);
  if (!current) return null;
  const product = { ...current, ...input };
  getDb().prepare(`UPDATE products SET name = ?, description = ?, price_cents = ?, stock = ?, image = ?, category = ?, featured = ? WHERE id = ?`)
    .run(product.name, product.description, Math.round(product.price * 100), product.stock, product.image, product.category, Number(product.featured), id);
  return getProduct(id);
}

export function deleteProduct(id: string) {
  return getDb().prepare("DELETE FROM products WHERE id = ?").run(id).changes > 0;
}

export function reserveOrder(customer: CustomerInput, requested: OrderLineInput[], minimumTotalCents: number) {
  const database = getDb();
  const id = randomUUID();
  const orderNumber = `MMC-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
  const lines: ReservedLine[] = [];
  const now = new Date().toISOString();
  const reserve = database.transaction(() => {
    let totalCents = 0;
    const updateStock = database.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
    const getRow = database.prepare("SELECT id, name, description, price_cents FROM products WHERE id = ?");
    for (const line of requested) {
      const row = getRow.get(line.productId) as { id: string; name: string; description: string; price_cents: number } | undefined;
      if (!row) throw new Error("A product in your bag is no longer available.");
      if (updateStock.run(line.quantity, line.productId, line.quantity).changes !== 1) throw new Error(`${row.name} does not have enough stock for that quantity.`);
      lines.push({ id: row.id, name: row.name, description: row.description, priceCents: row.price_cents, quantity: line.quantity });
      totalCents += row.price_cents * line.quantity;
    }
    if (totalCents < minimumTotalCents) throw new Error("Minimum order amount is $50.");
    database.prepare(`INSERT INTO orders (id, order_number, customer_name, email, phone, address, city, country, total_cents, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, orderNumber, customer.fullName, customer.email, customer.phone, customer.address, customer.city, customer.country, totalCents, now);
    const addItem = database.prepare("INSERT INTO order_items (order_id, product_id, product_name, unit_price_cents, quantity) VALUES (?, ?, ?, ?, ?)");
    for (const line of lines) addItem.run(id, line.id, line.name, line.priceCents, line.quantity);
    return totalCents;
  });
  const totalCents = reserve();
  return { id, orderNumber, totalCents, lines };
}

export function attachStripeSession(orderId: string, sessionId: string) {
  getDb().prepare("UPDATE orders SET stripe_session_id = ? WHERE id = ? AND payment_status = 'pending'").run(sessionId, orderId);
}

export function releaseOrderReservation(orderId: string) {
  const database = getDb();
  const release = database.transaction(() => {
    const order = database.prepare("SELECT inventory_reserved FROM orders WHERE id = ?").get(orderId) as { inventory_reserved: number } | undefined;
    if (!order || !order.inventory_reserved) return;
    const items = database.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").all(orderId) as { product_id: string; quantity: number }[];
    const restore = database.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    for (const item of items) restore.run(item.quantity, item.product_id);
    database.prepare("UPDATE orders SET inventory_reserved = 0, fulfillment_status = 'cancelled' WHERE id = ?").run(orderId);
  });
  release();
}

export function confirmPaidOrder(orderId: string, sessionId: string) {
  const database = getDb();
  const confirm = database.transaction(() => {
    const order = database.prepare("SELECT id, order_number, customer_name, email, phone, address, city, country, total_cents, payment_status, fulfillment_status, stripe_session_id, created_at FROM orders WHERE id = ?").get(orderId) as Record<string, string | number> | undefined;
    if (!order || order.stripe_session_id !== sessionId) return null;
    if (order.payment_status !== "paid") database.prepare("UPDATE orders SET payment_status = 'paid', fulfillment_status = 'processing', inventory_reserved = 0 WHERE id = ?").run(orderId);
    return order;
  });
  return confirm();
}

export function findOrderBySession(sessionId: string) {
  const database = getDb();
  const order = database.prepare("SELECT * FROM orders WHERE stripe_session_id = ?").get(sessionId) as Record<string, string | number> | undefined;
  if (!order) return null;
  const items = database.prepare("SELECT product_name AS name, quantity FROM order_items WHERE order_id = ?").all(order.id) as { name: string; quantity: number }[];
  return { id: order.id, orderNumber: order.order_number, customerName: order.customer_name, email: order.email, phone: order.phone, address: order.address, city: order.city, country: order.country, total: Number(order.total_cents) / 100, paymentStatus: order.payment_status, status: order.fulfillment_status, createdAt: order.created_at, items };
}

export function listOrders() {
  const database = getDb();
  const orders = database.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as Record<string, string | number>[];
  const itemQuery = database.prepare("SELECT product_name AS name, quantity, unit_price_cents AS unitPriceCents FROM order_items WHERE order_id = ?");
  return orders.map((order) => ({ id: order.id, orderNumber: order.order_number, customerName: order.customer_name, email: order.email, phone: order.phone, address: order.address, city: order.city, country: order.country, total: Number(order.total_cents) / 100, paymentStatus: order.payment_status, status: order.fulfillment_status, createdAt: order.created_at, items: itemQuery.all(order.id) as { name: string; quantity: number; unitPriceCents: number }[] }));
}

export function updateOrderStatus(id: string, status: "processing" | "shipped" | "delivered") {
  const result = getDb().prepare("UPDATE orders SET fulfillment_status = ? WHERE id = ? AND payment_status = 'paid'").run(status, id);
  return result.changes === 1;
}

export function getSalesSummary() {
  const database = getDb();
  const stats = database.prepare("SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents), 0) AS sales FROM orders WHERE payment_status = 'paid'").get() as { orders: number; sales: number };
  const pending = (database.prepare("SELECT COUNT(*) AS count FROM orders WHERE payment_status = 'pending'").get() as { count: number }).count;
  return { totalOrders: stats.orders, totalSales: stats.sales / 100, pendingOrders: pending };
}