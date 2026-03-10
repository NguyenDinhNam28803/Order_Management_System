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

import Sidebar from "./components/Sidebar";

import { ProcurementProvider } from "./context/ProcurementContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-slate-50 text-slate-900 font-sans min-h-screen`}
      >
        <ProcurementProvider>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen">
              {children}
            </div>
          </div>
        </ProcurementProvider>
      </body>
    </html>
  );
}
