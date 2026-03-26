import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PayZar – Withdraw PayPal to ZAR in South Africa",
  description:
    "Convert your PayPal funds to South African Rand and receive money straight to your local bank account. Fast, safe, and transparent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-white dark:bg-gray-950`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
