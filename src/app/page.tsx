import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="晴天支付"
          width={64}
          height={64}
          className="h-16 w-16 rounded-xl shadow-md object-contain mb-4"
          priority
        />
        <h1 className="text-4xl font-bold text-slate-900">晴天支付</h1>
        <p className="mt-3 max-w-md text-lg text-slate-600">
          清爽可靠的现代化支付 API 接口服务平台
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="btn-primary px-8 py-3"
          >
            立即开始
          </Link>
        </div>
      </div>
    </div>
  );
}
