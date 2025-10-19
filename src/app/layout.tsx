import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Web3ModalProvider } from "@/providers/Web3ModalProvider";

const openSauce = localFont({
  src: [
    {
      path: "../../public/fonts/OpenSauceOne-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/OpenSauceOne-SemiBold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/OpenSauceOne-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-open-sauce",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiquidityGuard",
  description:
    "LiquidityGuard is an on-chain insurance protocol protecting DeFi users from depeg and liquidity freeze risks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${openSauce.variable} ${spaceMono.variable}`}>
        <Web3ModalProvider>{children}</Web3ModalProvider>
      </body>
    </html>
  );
}
