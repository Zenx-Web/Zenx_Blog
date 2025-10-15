import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import Navbar from '@/components/Navbar'
import { AuthProvider } from '@/lib/auth-context'

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
  title: "Zenx Blog - Hot Topics & Trending News",
  description: "Stay updated with the latest trending topics, hot news, and viral content. AI-powered blog covering technology, entertainment, business, and more.",
  keywords: "trending topics, hot news, viral content, technology, entertainment, business, lifestyle",
  authors: [{ name: "Zenx Blog" }],
  creator: "Zenx Blog",
  publisher: "Zenx Blog",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://imzenx.in",
    siteName: "Zenx Blog",
    title: "Zenx Blog - Hot Topics & Trending News",
    description: "Stay updated with the latest trending topics, hot news, and viral content.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenx Blog - Hot Topics & Trending News",
    description: "Stay updated with the latest trending topics, hot news, and viral content.",
  },
  verification: {
    google: "your-google-site-verification-code", // Add your Google verification code
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
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-your-adsense-id"
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
      <body className={`antialiased bg-gray-50 ${geistSans.className}`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-2xl font-bold text-blue-600 mb-4">Zenx Blog</h3>
                <p className="text-gray-600 mb-4">
                  Your source for the latest trending topics, hot news, and viral content. 
                  Stay informed with AI-powered content covering technology, entertainment, business, and lifestyle.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-blue-600">Facebook</a>
                  <a href="#" className="text-gray-400 hover:text-blue-600">Twitter</a>
                  <a href="#" className="text-gray-400 hover:text-blue-600">Instagram</a>
                  <a href="#" className="text-gray-400 hover:text-blue-600">LinkedIn</a>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Categories</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><Link href="/?category=technology" className="hover:text-blue-600">Technology</Link></li>
                  <li><Link href="/?category=entertainment" className="hover:text-blue-600">Entertainment</Link></li>
                  <li><Link href="/?category=business" className="hover:text-blue-600">Business</Link></li>
                  <li><Link href="/?category=lifestyle" className="hover:text-blue-600">Lifestyle</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Links</h4>
                <ul className="space-y-2 text-gray-600">
                  <li><a href="/about" className="hover:text-blue-600">About</a></li>
                  <li><a href="/contact" className="hover:text-blue-600">Contact</a></li>
                  <li><a href="/privacy" className="hover:text-blue-600">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-blue-600">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
              <p>&copy; {CURRENT_YEAR} Zenx Blog. All rights reserved.</p>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
