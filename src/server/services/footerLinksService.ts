import { prisma } from "@/lib/db";

export interface FooterLink {
  label: string;
  href: string;
}

export const FOOTER_LINKS_KEY = "footer_links";

export const DEFAULT_FOOTER_LINKS: FooterLink[] = [
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
  { label: "Gizlilik Politikası", href: "/gizlilik" },
  { label: "Çerez Politikası", href: "/cerez-politikasi" },
  { label: "KVKK Aydınlatma Metni", href: "/kvkk" },
];

function isFooterLinkArray(value: unknown): value is FooterLink[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as FooterLink).label === "string" &&
        typeof (item as FooterLink).href === "string"
    )
  );
}

export async function getFooterLinks(): Promise<FooterLink[]> {
  const setting = await prisma.siteSetting.findUnique({ where: { key: FOOTER_LINKS_KEY } });
  if (setting && isFooterLinkArray(setting.value)) return setting.value;
  return DEFAULT_FOOTER_LINKS;
}
