"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";

const minimumOrder = 50;

export default function CartPage() {
  const { cartItems, cartTotal, setQuantity, removeFromCart } = useStore();
  const qualifies = cartTotal >= minimumOrder;

  if (cartItems.length === 0) return <main className="wrap empty-state"><ShoppingBag size={35} /><h1>Your bag is taking a little nap.</h1><p>Fill it with something crunchy and lovely.</p><Link className="button button-dark" href="/shop">Shop the snacks</Link></main>;

  return <main className="wrap"><div className="page-intro"><span className="eyebrow">YOUR LITTLE HAUL</span><h1 className="page-title">The good stuff.</h1><p>{cartItems.length} kind{cartItems.length === 1 ? "" : "s"} of crunch, ready to go.</p></div><div className="cart-layout"><div className="cart-lines">{cartItems.map(({ product, quantity }) => <article className="cart-line" key={product.id}><Link href={`/products/${product.slug}`} className="cart-line-image"><Image src={product.image} alt={product.name} fill sizes="110px" unoptimized /></Link><div className="cart-line-copy"><Link href={`/products/${product.slug}`}><h2>{product.name}</h2></Link><p>${product.price.toFixed(2)} each</p><button className="remove-button" onClick={() => removeFromCart(product.id)}><Trash2 size={13} /> Remove</button></div><div className="cart-line-total"><span className="quantity-control"><button aria-label={`Decrease ${product.name}`} onClick={() => setQuantity(product.id, quantity - 1)}><Minus size={13} /></button><input aria-label={`${product.name} quantity`} value={quantity} readOnly /><button aria-label={`Increase ${product.name}`} onClick={() => setQuantity(product.id, quantity + 1)}><Plus size={13} /></button></span><strong>${(product.price * quantity).toFixed(2)}</strong></div></article>)}</div><aside className="cart-summary"><h2>Order summary</h2><div className="summary-row"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div><div className="summary-row"><span>Shipping</span><span>Calculated next</span></div><div className="summary-row total"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>{!qualifies && <p className="minimum-note">Minimum order amount is $50. Add ${(minimumOrder - cartTotal).toFixed(2)} more to checkout.</p>}<Link className={`button button-dark${!qualifies ? " disabled-link" : ""}`} aria-disabled={!qualifies} tabIndex={qualifies ? 0 : -1} href={qualifies ? "/checkout" : "/cart"}>Continue to checkout</Link><Link className="continue-link" href="/shop">Keep browsing</Link></aside></div></main>;
}