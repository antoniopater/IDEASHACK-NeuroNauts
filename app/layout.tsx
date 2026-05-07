import type { Metadata } from "next";
import localFont from "next/font/local";
import { Nav } from "@/components/shared/nav";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Nexdoc — R&D dla nauki i biznesu",
  description: "Nexdoc łączy firmy szukające wsparcia R&D z doktorantami i młodymi badaczami. AI dopasowuje profile, briefy tworzy się w minuty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
