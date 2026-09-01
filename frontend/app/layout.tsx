import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

// 1. Import our custom premium toaster
import { PremiumToaster } from "@/components/premium-toaster";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FPMS Studio",
  description: "Enterprise Financial Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased bg-white text-zinc-900 selection:bg-zinc-200`}>
        <AuthProvider>
          {children}
          {/* 2. Render the custom PremiumToaster instead of the old Sonner component */}
          <PremiumToaster />
        </AuthProvider>
      </body>
    </html>
  );
}