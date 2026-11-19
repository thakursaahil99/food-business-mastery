import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif, Noto_Sans_Devanagari } from "next/font/google";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ContentGuard } from "@/components/security/content-guard";
import { ACCENT_BOOT_SCRIPT } from "@/components/theme/accents";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Redbean Academy · CGR Food Contract Mastery Program",
    template: "%s · Redbean Academy",
  },
  description:
    "Learn to build a profitable contract food business with Bobby Singh. The 4-month CGR Mastery Program covers corporate, hospital, institutional and industrial catering.",
  openGraph: { type: "website", siteName: "Redbean Academy", locale: "en_IN" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfbf8" },
    { media: "(prefers-color-scheme: dark)", color: "#07070a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the boot script may add data-accent to <html> before React hydrates.
    <html lang="en-IN" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} ${instrument.variable} ${deva.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCENT_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <MotionProvider>{children}</MotionProvider>
        <ContentGuard />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
