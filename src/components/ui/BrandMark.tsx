import type { SVGProps } from "react";

export function AvcHaberSoftMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" {...props}>
      <rect x="1" y="1" width="22" height="22" rx="4" fill="currentColor" />
      <path d="M12 5.5 18 18H15.2L13.9 15H10.1L8.8 18H6L12 5.5ZM12 9.6 10.6 12.7h2.8L12 9.6Z" fill="white" />
    </svg>
  );
}

export function AvcHaberSoftBrand({ size = "sm" }: { size?: "sm" | "lg" }) {
  const markSize = size === "lg" ? 40 : 20;
  const textClass = size === "lg" ? "text-headline-l" : "text-caption";
  return (
    <span className="inline-flex items-center gap-2 text-ink-secondary dark:text-ink-dark-secondary">
      <AvcHaberSoftMark width={markSize} height={markSize} className="shrink-0 text-brand-red" />
      <span className={`font-serif font-semibold ${textClass}`}>AvcHaberSoft</span>
    </span>
  );
}
