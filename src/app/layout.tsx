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
const canonicalUrl = process.env.NEXTAUTH_URL || "https://mail.lynli.me";

export const metadata: Metadata = {
  metadataBase: new URL(canonicalUrl),
  title: {
    default: "MailHub - 邮件配置管理中心",
    template: "%s | MailHub",
  },
  description:
    "MailHub 邮件配置管理中心：管理员登录、自建发件服务器、API Key、域名配置与发件记录。",
  keywords: ["MailHub", "邮件API", "邮件配置", "自建邮件服务器", "Transactional Email"],
  authors: [{ name: "MailHub" }],
  robots: { index: false, follow: false, noarchive: true },
  alternates: { canonical: "/" },
  openGraph: {
    title: "MailHub - 邮件配置管理中心",
    description: "管理自建邮件发送服务与 API Key",
    type: "website",
    locale: "zh_CN",
    url: canonicalUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={[geistSans.variable, geistMono.variable, "h-full antialiased"].join(" ")}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}