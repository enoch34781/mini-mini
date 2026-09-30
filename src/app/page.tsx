"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, Sparkles } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/store-ui";

export default function Home() {
  const { products } = useStore();
  const featured = products.filter((product) => product.featured).slice(0, 2);

  return (
    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> SMALL-BATCH, BIG JOY</span>
          <h1>Welcome to <span>Mini Mini</span> Chinchin</h1>
          <p>Crunchy little moments, made to be shared. Meet your new favorite snack-time ritual.</p>
          <Link className="button button-dark" href="/shop">Shop Now <ArrowRight size={18} /></Link>
          <div className="hero-note"><span className="note-dot" /> Freshly packed with love, every time</div>
        </div>
        <div className="hero-art" aria-label="A table full of golden crunchy snacks">
          <div className="hero-photo" />
          <div className="hero-sticker"><span>GOOD</span><strong>to the<br />last crunch</strong><ArrowDownRight size={22} /></div>
          <span className="hero-scribble">snack happy</span>
        </div>
        <div className="hero-bottom"><span>MADE FOR THE MIDDLE OF EVERYTHING</span><span>01 / 02</span></div>
      </section>

      <section className="promise-band">
        <div className="wrap promise-inner"><span>Made in small batches</span><span aria-hidden="true">✳</span><span>Big on crunch</span><span aria-hidden="true">✳</span><span>Better when shared</span><span aria-hidden="true">✳</span><span>Made in small batches</span></div>
      </section>

      <section className="section wrap" id="favorites">
        <div className="section-heading"><div><span className="eyebrow">THE CROWD PLEASERS</span><h2>Little bites.<br /><em>Big favorites.</em></h2></div><Link className="text-link" href="/shop">Shop all snacks <ArrowRight size={16} /></Link></div>
        <div className="product-grid">{featured.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
      </section>

      <section className="share-section" id="story">
        <div className="wrap share-inner"><div className="share-art"><div className="share-photo" /><span className="share-burst">crunch<br />o&apos;clock!</span></div><div className="share-copy"><span className="eyebrow">A LITTLE SOMETHING FOR EVERYONE</span><h2>Pass the bowl.<br /><em>Keep the good going.</em></h2><p>Movie night, road trip, or just because. Our crunchy classics are happiest in the middle of the table.</p><Link className="button button-light" href="/shop">Find your crunch <ArrowRight size={18} /></Link></div></div>
      </section>
    </main>
  );
}
