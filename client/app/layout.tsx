import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProcurePro ERP | Hệ thống Mua sắm Doanh nghiệp Quốc tế",
  description: "Giải pháp ERP hiện đại cho quản lý mua sắm doanh nghiệp",
};

import { ProcurementProvider } from "./context/ProcurementContext";
import AppContent from "./components/AppContent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-slate-50 text-slate-900 font-sans min-h-screen`}
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
