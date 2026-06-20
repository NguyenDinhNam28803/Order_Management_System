import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/* Kept as fallback variables so any inline var(--font-jakarta) references still work */
const jakartaFallback = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMonoFallback = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProcurePro ERP | Hệ thống Mua sắm Doanh nghiệp",
  description: "Giải pháp ERP hiện đại cho quản lý mua sắm doanh nghiệp - Refined Corporate Dark",
};

import { ProcurementProvider } from "./context/ProcurementContext";
import Providers from "./components/Providers";
import AppContent from "./components/AppContent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakartaFallback.variable} ${jetbrainsMonoFallback.variable} antialiased bg-[#F8FAFC] text-[#0F172A] font-sans min-h-screen`}
        suppressHydrationWarning
      >
        <Providers>
          <ProcurementProvider>
            <AppContent>
              {children}
            </AppContent>
          </ProcurementProvider>
        </Providers>
      </body>
    </html>
  );
}

