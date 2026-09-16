import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDateTr(date: Date | string): string {
  return format(new Date(date), "d MMMM yyyy HH:mm", { locale: tr });
}

export function formatRelativeTr(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { locale: tr, addSuffix: true });
}
