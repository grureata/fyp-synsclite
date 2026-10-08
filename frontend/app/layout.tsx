import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignSync Lite — Communication Prototype",
  description: "A SignSync Lite prototype for account-backed sessions and accessible communication workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
