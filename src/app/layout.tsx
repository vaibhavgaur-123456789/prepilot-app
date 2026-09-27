import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/config/brand";
import { getCurrentUser } from "@/server/auth/guards";
import { ServiceWorker } from "@/components/ServiceWorker";
import { I18nProvider } from "@/i18n/client";
import { getLang } from "@/i18n/server";

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
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
      <body className="min-h-dvh">
        <I18nProvider lang={lang}>{children}</I18nProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
