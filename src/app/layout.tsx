import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Truth or Dare Game",
  description: "A fun Truth or Dare game for parties and gatherings!",
  keywords: ["Truth or Dare", "Game", "Party", "Fun"],
  authors: [{ name: "Truth or Dare Game" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Truth or Dare Game",
    description: "A fun Truth or Dare game for parties and gatherings!",
    url: "https://truth-or-dare-game.com",
    siteName: "Truth or Dare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Truth or Dare Game",
    description: "A fun Truth or Dare game for parties and gatherings!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
