import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mysupportinfo.com"),
  applicationName: "MySupportInfo",
  title: {
    default: "What Is My Browser? Free Device, IP & Bufferbloat Test",
    template: "%s | MySupportInfo",
  },
  description:
    "Check what browser, OS & public IP you're using in 1 click. Free device info, WebRTC leak & bufferbloat latency test. Private, fast, zero tracking.",
  keywords: [
    "what is my browser",
    "what browser am I using",
    "check my browser version",
    "what is my support details",
    "mysupportdetails",
    "my support info",
    "bufferbloat test",
    "bufferbloat latency test",
    "internet latency under load",
    "router bufferbloat fix",
    "gaming lag test",
    "what is my IP address",
    "IP address lookup",
    "what is my operating system",
    "browser version checker",
    "device info checker",
    "WebRTC leak test",
    "browser privacy test",
    "browser fingerprint checker",
    "what is my screen resolution",
    "GPU detection online",
    "RAM detection",
    "network quality checker",
    "what is my ISP",
    "VPN detection",
    "browser security test",
    "sqm cake fq_codel",
    "wifi latency test",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "MySupportInfo",
    title: "What Is My Browser? Free Device, IP & Bufferbloat Test",
    description:
      "Check what browser, OS & public IP you're using in 1 click. Free device info, WebRTC leak & bufferbloat latency test. Private, fast, zero tracking.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MySupportInfo – Browser, IP, Device Info & Bufferbloat Test" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is My Browser? Free Device, IP & Bufferbloat Test",
    description:
      "Check what browser, OS & public IP you're using in 1 click. Free device info, WebRTC leak & bufferbloat latency test. Private, fast, zero tracking.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "B7H7GZ20y6PWupHm-XlOYB424BmOH0FJhB9RDLgauts",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml", sizes: "180x180" },
    ],
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link rel="preconnect" href="https://ipapi.co" />
        <link rel="dns-prefetch" href="https://ipapi.co" />
        <link rel="preconnect" href="https://api64.ipify.org" />
        <link rel="dns-prefetch" href="https://api64.ipify.org" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MySupportInfo",
              alternateName: [
                "What Is My Browser",
                "My Support Details",
                "Device Info Checker",
                "Bufferbloat Latency Test",
                "IP Address Checker",
                "Browser Privacy Checker"
              ],
              url: "https://mysupportinfo.com/",
              description:
                "What is my browser? Free IP, device info, and bufferbloat latency checker — instantly detect browser version, OS, IP address, GPU, RAM, screen size, WebRTC leaks, and network quality with zero tracking.",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "MySupportInfo — What Is My Browser, IP, Device & Bufferbloat Checker",
              url: "https://mysupportinfo.com",
              description:
                "Free browser, IP address, device info, and bufferbloat latency checker. Instantly inspect what browser and OS you're using, your public IP address, GPU, RAM, screen resolution, WebRTC leaks, and test network latency under load. Privacy-first — zero tracking, runs entirely in your browser.",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires a modern browser with JavaScript enabled",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              featureList: [
                "What is my browser — browser version & rendering engine detection",
                "What is my IP address — public IPv4 & IPv6 lookup with ISP and ASN",
                "Operating system & hardware platform detection (Windows, macOS, Linux, iOS, Android)",
                "Bufferbloat latency diagnostic — test latency under download and upload load with letter grading (A to F)",
                "Hardware profiling — logical CPU cores, RAM estimate, WebGL GPU renderer",
                "Display specifications — screen resolution, viewport size, DPR scaling, color depth",
                "WebRTC leak detection & privacy posture auditing",
                "Client-side downloadable PNG screenshot card for technical support tickets",
                "GDPR and CCPA compliant, zero data logging or tracking cookies",
              ],
              publisher: {
                "@type": "Organization",
                name: "MySupportInfo",
                url: "https://mysupportinfo.com/",
              },
              creator: {
                "@type": "Organization",
                name: "MySupportInfo",
                url: "https://mysupportinfo.com",
              },
            }),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${cormorant.variable} antialiased bg-background font-sans text-foreground selection:bg-primary/40 flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
