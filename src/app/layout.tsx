import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/config/brand";
import { getCurrentUser } from "@/server/auth/guards";
import { ServiceWorker } from "@/components/ServiceWorker";
import { I18nProvider } from "@/i18n/client";
import { getLang } from "@/i18n/server";

const SITE_URL = process.env.APP_URL || "https://prepilot-app.vercel.app";
const SEO_TITLE = `${BRAND.name}: Free study planner, timer & attendance for SSC, Railway, Banking and board exams`;
const SEO_DESC =
  "Free exam preparation app in Hindi and English. Daily study plan, focus timer, attendance calendar, study alarms, spaced revision, mock tests and progress tracking for SSC, Railway, Banking, state exams, school boards or your own syllabus.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SEO_TITLE, template: `%s · ${BRAND.name}` },
  description: SEO_DESC,
  applicationName: BRAND.name,
  keywords: [
    "study planner", "exam preparation app", "SSC CGL preparation", "RRB NTPC preparation", "IBPS PO preparation", "study timer", "pomodoro timer",
    "attendance tracker for students", "revision planner", "mock test", "Hindi study app", "padhai ka time table", "पढ़ाई का टाइम टेबल", "प्रतियोगी परीक्षा तैयारी",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: SEO_TITLE,
    description: SEO_DESC,
    url: "/",
    locale: "en_IN",
    alternateLocale: ["hi_IN"],
  },
  twitter: { card: "summary_large_image", title: SEO_TITLE, description: SEO_DESC },
  robots: { index: true, follow: true },
  category: "education",
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icons/192" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1220" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  const theme = user?.theme && user.theme !== "system" ? user.theme : undefined;
  const lang = await getLang();
  return (
    <html lang={lang} data-theme={theme} suppressHydrationWarning>
      <head>
        {/* Capture the browser's install prompt before React loads; it fires only once, very early. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__ppInstall=e;window.dispatchEvent(new Event('pp-installable'))});" +
              "window.addEventListener('appinstalled',function(){window.__ppInstall=null;window.dispatchEvent(new Event('pp-installable'))});" +
              "if('serviceWorker' in navigator&&location.hostname!=='localhost'){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}",
          }}
        />
      </head>
      <body className="min-h-dvh">
        <I18nProvider lang={lang}>{children}</I18nProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
