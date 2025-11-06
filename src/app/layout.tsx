import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const CURRENT_YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: "ImZenx - AI-Powered Trending News",
  description: "Where AI meets trending news. Human-reviewed content covering technology, gaming, entertainment, and world news. AI-assisted, transparency-first journalism.",
  keywords: "AI news, trending topics, technology, gaming, entertainment, Valorant, AI journalism, ImZenx",
  authors: [{ name: "ImZenx" }],
  creator: "ImZenx",
  publisher: "ImZenx",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://imzenx.in",
    siteName: "ImZenx",
    title: "ImZenx - Where AI Meets Trending News",
    description: "AI-powered content, human-reviewed quality. Covering tech, gaming, entertainment, and world news.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ImZenx - AI Meets Trending News",
    description: "AI-powered content, human-reviewed quality. Transparent journalism for the modern age.",
  },
  verification: {
    google: "google9ebd5e923de1c478", // Your Google verification code
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2681687429819093"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="ga-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </head>
      <body className={`antialiased bg-gray-50 ${geistSans.className} m-0 p-0`}>
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            <main className="min-h-screen mt-0">
              {children}
            </main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
