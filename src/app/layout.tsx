import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { cn } from "@/lib/utils";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "CleanOPS",
    template: "%s | CleanOPS",
  },
  description:
    "Operations platform for cleaning teams: scheduling, checklists, approvals, and payroll exports.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport = {
  themeColor: "#0a789b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={cn(
          "min-h-full bg-app-gradient antialiased",
          bodyFont.variable,
          displayFont.variable,
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
