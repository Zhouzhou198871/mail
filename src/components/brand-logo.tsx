import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  size?: number;
  showText?: boolean;
  subtitle?: string;
};

function MailIcon({ size }: { size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={Math.round(size * 0.55)}
        height={Math.round(size * 0.55)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="m5 7 7 5 7-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function BrandLogo({
  href = "/dashboard",
  size = 36,
  showText = true,
  subtitle,
}: BrandLogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <MailIcon size={size} />
      {showText && (
        <div className="min-w-0">
          <p className="font-semibold leading-tight tracking-tight text-slate-900">
            MailHub
          </p>
          {subtitle ? (
            <p className="truncate text-[11px] leading-tight text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      )}
    </Link>
  );
}
