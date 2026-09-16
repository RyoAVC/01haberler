import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function CloudIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5-1.5A4 4 0 0 0 7 18Z" />
    </svg>
  );
}

export function CloudRainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 15h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5-1.5A4 4 0 0 0 7 15Z" />
      <path d="M8 19v1M12 19v1M16 19v1" />
    </svg>
  );
}

export function CloudSnowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M7 15h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.5-1.5A4 4 0 0 0 7 15Z" />
      <path d="M8 19h.01M12 19h.01M16 19h.01M8 21h.01M12 21h.01M16 21h.01" strokeWidth={2.25} />
    </svg>
  );
}

export function TrendUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 16l6-6 4 4 6-8" />
      <path d="M14 6h6v6" />
    </svg>
  );
}

export function TrendDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 8l6 6 4-4 6 8" />
      <path d="M14 18h6v-6" />
    </svg>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function PrinterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 9V3h12v6M6 18h12v4H6zM4 9h16v7H4z" />
    </svg>
  );
}

export function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M9 15 15 9M10 6l1.5-1.5a3.54 3.54 0 0 1 5 5L15 11M14 18l-1.5 1.5a3.54 3.54 0 0 1-5-5L9 13" />
    </svg>
  );
}
