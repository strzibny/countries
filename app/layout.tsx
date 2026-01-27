import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyCountryList - Build your country list",
  description: "Create and share interactive country lists on a 3D globe. Track countries you've visited, want to visit, or organize them any way you like.",
  keywords: ["country list", "travel", "visited countries", "world map", "globe", "travel tracker"],
  authors: [{ name: "Josef", url: "https://x.com/strzibnyj" }],
  openGraph: {
    title: "MyCountryList - Build your country list",
    description: "Create and share interactive country lists on a 3D globe. Track countries you've visited, want to visit, or organize them any way you like.",
    type: "website",
    siteName: "MyCountryList",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyCountryList - Build your country list",
    description: "Create and share interactive country lists on a 3D globe.",
    creator: "@strzibnyj",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
