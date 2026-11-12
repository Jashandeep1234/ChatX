import type { Metadata, Viewport } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ChatX — Realtime messaging that keeps up",
  description:
    "ChatX is a fast, delightful real-time chat experience with DMs, groups, typing, presence and file sharing.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-svh antialiased font-sans")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
