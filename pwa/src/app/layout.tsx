import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "Cookie APP",
  description: "Cookie PWA Web Application",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover",
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
