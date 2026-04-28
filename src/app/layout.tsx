import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import type React from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "FLC Task Organizer",
  description: "Team-first platform to coordinate complex workflows."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
        style={{
          fontFamily: "var(--font-body)"
        }}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
