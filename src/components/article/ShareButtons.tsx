"use client";

import { PrinterIcon } from "@/components/ui/Icons";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-headline-s print:hidden" aria-label="Sosyal medyada paylaş">
      <span className="text-meta uppercase tracking-wide text-ink-secondary dark:text-ink-dark-secondary">Paylaş</span>
      {links.map((link) => (
        <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red">
          {link.name}
        </a>
      ))}
      <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 hover:text-brand-red">
        <PrinterIcon width={16} height={16} /> Yazdır
      </button>
    </div>
  );
}
