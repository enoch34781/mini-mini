"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/components/store-provider";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, addToCart } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const product = products.find((entry) => entry.slug === slug);

  if (!product) return <main className="wrap loading-copy">Finding that little favorite...</main>;

  const handleAdd = () => {
    addToCart(product.id, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return <main className="wrap product-detail"><div className="detail-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 760px) 100vw, 50vw" unoptimized priority /></div><div className="detail-copy"><Link className="text-link" href="/shop"><ArrowLeft size={15} /> Back to shop</Link><span className="eyebrow" style={{ display: "flex", marginTop: 34 }}>{product.category.toUpperCase()} · SMALL BATCH</span><h1>{product.name}</h1><p>{product.description}</p><strong className="detail-price">${product.price.toFixed(2)}</strong><span className="quantity-control"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={15} /></button><input aria-label="Quantity" type="number" min="1" max={product.stock} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(product.stock, Number(event.target.value))))} /><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}><Plus size={15} /></button></span><div className="detail-actions"><button className="button button-dark" type="button" disabled={product.stock < 1} onClick={handleAdd}>{added ? "Added to bag" : "Add to Cart"} {added && <Check size={17} />}</button></div><small className="detail-stock">{product.stock > 0 ? `${product.stock} available · Ships fresh from our kitchen` : "Currently sold out"}</small></div></main>;
}