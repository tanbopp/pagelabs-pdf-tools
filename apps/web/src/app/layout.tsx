import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PageLabs — Clean, Modern PDF Tools",
  description: "Every PDF tool in one place. Fast, private, and minimal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={manrope.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
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
