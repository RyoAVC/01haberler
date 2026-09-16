import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDateTr(date: Date | string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul",
  }).format(new Date(date));
}

export function formatRelativeTr(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { locale: tr, addSuffix: true });
}
