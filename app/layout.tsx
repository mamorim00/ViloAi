import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "ViloAi - AI Social Assistant for Finnish Businesses",
  description: "AI-powered Instagram assistant for small Finnish businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body className="antialiased">
        <LanguageProvider>
          {children}
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
