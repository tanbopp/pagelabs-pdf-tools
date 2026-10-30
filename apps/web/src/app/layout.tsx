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
  metadataBase: new URL("https://pagelabs.tanbopp.cloud"),
  title: {
    default: "PageLabs — Clean, Modern PDF Tools",
    template: "%s | PageLabs",
  },
  description: "Every PDF tool in one place. Fast, private, and minimal. Merge, split, compress, convert, edit, and secure PDF files online 100% free.",
  applicationName: "PageLabs",
  authors: [{ name: "PageLabs", url: "https://pagelabs.tanbopp.cloud" }],
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
    url: "https://pagelabs.tanbopp.cloud",
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
  verification: {
    google: "9CpDH6o7zHE2SJm-J5pP3zORQ8vmfv67XeOEZQZ_PP0",
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
        "@id": "https://pagelabs.tanbopp.cloud/#website",
        "url": "https://pagelabs.tanbopp.cloud",
        "name": "PageLabs",
        "description": "Every PDF tool in one place. Fast, private, and minimal.",
        "publisher": {
          "@type": "Organization",
          "name": "PageLabs",
          "url": "https://pagelabs.tanbopp.cloud"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://pagelabs.tanbopp.cloud/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://pagelabs.tanbopp.cloud/#application",
        "name": "PageLabs PDF Tools",
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "url": "https://pagelabs.tanbopp.cloud",
        "description": "Complete suite of 30+ free online PDF utilities: merge, split, compress, edit, convert, and sign PDF documents privately.",
        "featureList": [
          "Merge PDF",
          "Split PDF",
          "Compress PDF",
          "Edit & Annotate PDF",
          "Add Page Numbers",
          "Sign PDF",
          "Convert PDF to Office and Images"
        ],
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://pagelabs.tanbopp.cloud/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is PageLabs free to use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, PageLabs is 100% free with no registration, no advertisements, and no hidden subscriptions."
            }
          },
          {
            "@type": "Question",
            "name": "Are my files secure and private on PageLabs?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, documents are processed in sandboxed environments and client-side web engines. All files are automatically and irreversibly shredded within 2 hours."
            }
          },
          {
            "@type": "Question",
            "name": "How can I edit, merge, or annotate PDF documents online?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Simply choose a tool on PageLabs (such as Edit PDF, Merge PDF, or Add Page Numbers), drop your document, customize your changes, and download the resulting file instantly."
            }
          }
        ]
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
