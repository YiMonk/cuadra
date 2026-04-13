import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "Cookie APP",
  description: "Cookie PWA Web Application",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
