import type { Metadata } from "next";
import { Inter, Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "RankGhost",
  description: "SaaS SERP and AI citation tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${syne.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#050505] text-slate-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
