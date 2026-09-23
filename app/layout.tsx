import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grind — Blind 75 & NeetCode 150",
  description:
    "Spaced-repetition trainer for the Blind 75 and NeetCode 150 interview problem sets.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d11" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mirrored into a cookie purely so the server can paint the right theme on
  // the first frame. The database row stays the source of truth.
  const theme = (await cookies()).get("theme")?.value;
  const explicit = theme === "dark" || theme === "light" ? theme : undefined;

  return (
    <html lang="en" data-theme={explicit} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
