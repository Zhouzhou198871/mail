import Image from "next/image";
import Link from "next/link";

const LOGO_SRC =
  "https://raw.githubusercontent.com/Zhouzhou198871/pay/main/logo.png";

type BrandLogoProps = {
  href?: string;
  size?: number;
  showText?: boolean;
  subtitle?: string;
};

export function BrandLogo({
  href = "/",
  size = 36,
  showText = true,
  subtitle,
}: BrandLogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Image
        src={LOGO_SRC}
        alt="MailHub"
        width={size}
        height={size}
        className="rounded-lg object-contain"
        priority
      />
      {showText && (
        <div>
          <p className="font-semibold leading-tight tracking-tight text-slate-900">
            MailHub
          </p>
          {subtitle ? (
            <p className="text-[11px] leading-tight text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      )}
    </Link>
  );
}
