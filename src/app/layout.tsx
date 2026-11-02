import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "晴天支付 - 现代化 API 支付接口服务平台",
    template: "%s | 晴天支付",
  },
  description:
    "晴天支付（Qingtian Pay）—— 清爽、可靠、开发者友好的支付 API 接口服务平台。提供安全的 API Key 管理、实时交易处理与完善的开发者工具。",
  keywords: [
    "晴天支付",
    "Qingtian Pay",
    "支付API",
    "支付接口",
    "API支付",
    "开发者支付平台",
  ],
  authors: [{ name: "晴天支付" }],
  openGraph: {
    title: "晴天支付 - 现代化 API 支付接口服务平台",
    description: "清爽、可靠、开发者友好的支付 API 接口服务平台",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
