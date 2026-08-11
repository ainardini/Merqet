import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://merqet.vercel.app"),
  title: "Merqet",
  description: "Buy and sell used stuff with people on your own campus.",
  openGraph: {
    title: "Merqet",
    description: "Buy and sell used stuff with people on your own campus.",
    siteName: "Merqet",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavBar user={user} />
        <div className="container">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
