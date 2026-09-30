export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  featured: boolean;
};

export const sampleProducts: Product[] = [
  {
    id: "mini-chinchin",
    slug: "mini-mini-chinchin",
    name: "Mini Mini Chinchin",
    description: "Golden, gently sweet, and impossibly crunchy. Our signature bite-sized chinchin is made for passing around.",
    price: 25,
    stock: 48,
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1100&q=85",
    category: "Chinchin",
    featured: true,
  },
  {
    id: "honey-cornflakes",
    slug: "honey-cornflake-crunch",
    name: "Honey Cornflake Crunch",
    description: "Crisp cornflakes folded into a light honey glaze for a sweet, sunny crunch in every handful.",
    price: 26,
    stock: 36,
    image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=1100&q=85",
    category: "Cornflakes",
    featured: true,
  },
];