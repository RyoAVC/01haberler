import { ActionForm } from "@/components/admin/ActionForm";
import { updateNewsletterPreference } from "@/server/actions/newsletterActions";
export const metadata = { title: "Bülten tercihi", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function PreferencePage({ searchParams }: { searchParams: Promise<{ key?: string; token?: string; intent?: string }> }) {
  const q = await searchParams;
  return <div className="container-page py-10"><header className="module-heading"><h1>{q.intent === "confirm" ? "Aboneliği doğrula" : "Bülten aboneliğinden çık"}</h1><p>İşlemi tamamlamak için aşağıdaki düğmeyi kullanın.</p></header><ActionForm action={updateNewsletterPreference}><input type="hidden" name="key" value={(q.key ?? "").slice(0, 100)} /><input type="hidden" name="token" value={(q.token ?? "").slice(0, 64)} /><input type="hidden" name="intent" value={(q.intent ?? "").slice(0, 20)} /><button className="module-button">{q.intent === "confirm" ? "Aboneliğimi doğrula" : "Abonelikten çık"}</button></ActionForm></div>;
}
