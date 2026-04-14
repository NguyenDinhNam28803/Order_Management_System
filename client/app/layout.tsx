import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ProcurePro ERP | Hệ thống Mua sắm Doanh nghiệp",
  description: "Giải pháp ERP hiện đại cho quản lý mua sắm doanh nghiệp - Refined Corporate Dark",
};

import { ProcurementProvider } from "./context/ProcurementContext";
import AppContent from "./components/AppContent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} antialiased bg-[#0D1117] text-[#E6EDF3] font-sans min-h-screen`}
        suppressHydrationWarning
      >
        <ProcurementProvider>
          <AppContent>
            {children}
          </AppContent>
        </ProcurementProvider>
      </body>
    </html>
  );
}
