import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { FeedbackWidget } from "@/components/shared/FeedbackWidget";
import { Toaster } from "sonner";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tanbopp.cloud"),
  title: {
    default: "PageLabs — Clean, Modern PDF Tools",
    template: "%s | PageLabs",
  },
  description: "Every PDF tool in one place. Fast, private, and minimal. Merge, split, compress, convert, edit, and secure PDF files online 100% free.",
  applicationName: "PageLabs",
  authors: [{ name: "PageLabs", url: "https://tanbopp.cloud" }],
  generator: "Next.js",
  keywords: [
    "PDF tools",
    "free PDF editor",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "PDF to Word",
    "Word to PDF",
    "PDF converter",
    "online PDF tools",
    "sign PDF",
    "tanbopp.cloud",
    "clean modern PDF tools",
  ],
  referrer: "origin-when-cross-origin",
  creator: "PageLabs",
  publisher: "PageLabs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tanbopp.cloud",
    siteName: "PageLabs",
    title: "PageLabs — Clean, Modern PDF Tools",
    description: "Every PDF tool in one place. Fast, private, and minimal. Merge, split, compress, convert, and edit PDFs online.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PageLabs — Clean, Modern PDF Tools",
    description: "Every PDF tool in one place. Fast, private, and minimal.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://tanbopp.cloud/#website",
        "url": "https://tanbopp.cloud",
        "name": "PageLabs",
        "description": "Every PDF tool in one place. Fast, private, and minimal.",
        "publisher": {
          "@type": "Organization",
          "name": "PageLabs",
          "url": "https://tanbopp.cloud"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://tanbopp.cloud/#application",
        "name": "PageLabs PDF Tools",
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "url": "https://tanbopp.cloud",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning className={manrope.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <FeedbackWidget />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className:
                "!rounded-full !bg-foreground !text-background !px-5 !py-2.5 !text-sm !font-semibold !border-0 !shadow-none",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
