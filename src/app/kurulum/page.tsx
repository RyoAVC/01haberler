import { redirect } from "next/navigation";
import { isInstalled } from "@/server/services/installStatusService";
import { InstallWizard } from "@/components/install/InstallWizard";

export default async function InstallPage() {
  if (await isInstalled()) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16">
      <InstallWizard />
    </main>
  );
}
