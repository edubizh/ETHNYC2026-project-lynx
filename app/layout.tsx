import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Project-Lynx — AI Sentiment Gap",
  description: "Non-custodial thematic prediction-market index + intelligence dashboard (ETHGlobal NY 2026).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
