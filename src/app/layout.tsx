import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { AuthModalProvider } from "@/components/auth/auth-modal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "EngineeringExpert — Your Success, Our Mission",
    template: "%s · EngineeringExpert",
  },
  description:
    "India's outcome-focused learning platform for engineering — live classes, structured courses and doubt support across GATE, core engineering, placements and PSUs.",
  keywords: [
    "engineering courses",
    "GATE preparation",
    "placement prep",
    "live classes",
    "DSA",
    "EngineeringExpert",
  ],
  authors: [{ name: "EngineeringExpert" }],
  openGraph: {
    title: "EngineeringExpert — Your Success, Our Mission",
    description:
      "Live classes, structured courses and doubt support for engineering students.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#6c5ce7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen font-sans">
        <AuthProvider>
          <AuthModalProvider>{children}</AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
