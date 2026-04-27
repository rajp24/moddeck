import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModDeck — Twitch Mod Dashboard",
  description: "The ultimate Twitch mod dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
