"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/store-ui";
import { useStore } from "@/components/store-provider";

export default function ShopPage() {
  const { products } = useStore();
  return <main className="wrap"><div className="page-intro"><span className="eyebrow">THE MINI MINI SHOP</span><h1 className="page-title">Your crunch<br />is calling.</h1><p>Small-batch favorites for snack drawers, shared tables, and every little in-between.</p></div><div className="product-grid shop-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div><p className="loading-copy">Looking for something special? <Link href="/cart" className="text-link">See your bag <ArrowRight size={14} /></Link></p></main>;
}