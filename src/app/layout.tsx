import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import ScrollToTop from "@/components/ScrollToTop";
import { MobileNav, MOBILE_NAV_HEIGHT } from "@/components/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Transparent Charity DAO - Blockchain-Powered Transparency",
  description: "Revolutionizing charitable giving through blockchain technology, DAO governance, and AI-powered fraud detection for complete transparency.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen overflow-x-hidden`}>
        <ContextProvider cookies={cookies}>
          <ScrollToTop />
          <Header />
          <main className="pb-20 md:pb-0">{children}</main>
          <MobileNav />
        </ContextProvider>
      </body>
    </html>
  );
}
