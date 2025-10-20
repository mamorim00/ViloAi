import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
