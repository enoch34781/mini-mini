"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { useStore } from "@/components/store-provider";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product.id);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className={`product-card card-${index % 2}`}>
      <Link href={`/products/${product.slug}`} className="product-image-link" aria-label={`View ${product.name}`}>
        <div className="product-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 90vw, 45vw" unoptimized /></div>
        {product.stock < 1 && <span className="stock-ribbon">Sold out</span>}
        <span className="product-category">{product.category}</span>
      </Link>
      <div className="product-info"><div><Link href={`/products/${product.slug}`} className="product-name">{product.name}</Link><p>{product.description}</p></div><div className="product-purchase"><strong>${product.price.toFixed(2)}</strong><button className="add-icon" onClick={handleAdd} disabled={product.stock < 1} aria-label={`Add ${product.name} to cart`} title="Add to cart">{added ? <Check size={19} /> : <Plus size={19} />}</button></div></div>
    </article>
  );
}

export function SiteHeader() {
  const { cartCount } = useStore();
  return <>
    <div className="topline">A LITTLE CRUNCH GOES A LONG WAY <span>•</span> FREE DELIVERY ON ORDERS OVER $100</div>
    <header className="site-header wrap">
      <Link className="wordmark" href="/" aria-label="Mini Mini Chinchin home"><span className="wordmark-sun">✳</span><span>mini mini<small>CHINCHIN & CORNFLAKES</small></span></Link>
      <nav className="main-nav" aria-label="Main navigation"><Link href="/shop">Shop</Link><Link href="/#favorites">Our favorites</Link><Link href="/#story">Our story</Link></nav>
      <Link href="/cart" className="cart-link" aria-label={`Shopping bag, ${cartCount} items`}><ShoppingBag size={20} /><span>Bag</span><b>{cartCount}</b></Link>
    </header>
  </>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="wrap footer-inner"><Link className="wordmark footer-mark" href="/"><span className="wordmark-sun">✳</span><span>mini mini<small>CHINCHIN & CORNFLAKES</small></span></Link><p>Little bites. Big joy. Made for sharing.</p><div className="footer-links"><Link href="/shop">Shop snacks</Link><Link href="/cart">Your bag</Link><Link href="/admin">Store owner</Link></div><div className="footer-contact"><a href="tel:+2349067903829">0906 790 3829</a><a href="mailto:peratenoch@gmail.com">peratenoch@gmail.com</a></div><small>© {new Date().getFullYear()} Mini Mini Chinchin</small></div></footer>;
}