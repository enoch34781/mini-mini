import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
import { SiteFooter, SiteHeader } from "@/components/store-ui";

export const metadata: Metadata = {
  title: "Mini Mini Chinchin | Little bites, big joy",
  description: "Small-batch Mini Mini Chinchin and honey cornflake crunch, made to be shared.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <StoreProvider><SiteHeader />{children}<SiteFooter /></StoreProvider>
      </body>
    </html>
  );
}
