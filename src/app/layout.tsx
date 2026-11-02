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
    default: "MailHub - 邮件调度中心",
    template: "%s | MailHub",
  },
  description:
    "MailHub（邮件调度中心）—— 通过 API Key 极速发送邮件的开发者友好邮件网关。",
  keywords: ["MailHub", "邮件API", "邮件调度", "Resend", "Transactional Email"],
  authors: [{ name: "MailHub" }],
  openGraph: {
    title: "MailHub - 邮件调度中心",
    description: "通过 API Key 极速发送邮件",
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
