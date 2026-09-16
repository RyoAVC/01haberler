import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

async function main() {
  const email = arg("email");
  const password = arg("password");
  const name = arg("name") ?? "Yönetici";
  const role = (arg("role") ?? "SUPER_ADMIN").toUpperCase();

  if (!email || !password) {
    console.error(
      "Kullanim: npm run admin:create -- --email=admin@01haberler.com --password=GucluBirParola123! --name=\"Ad Soyad\" --role=SUPER_ADMIN"
    );
    process.exit(1);
  }

  if (!["SUPER_ADMIN", "EDITOR", "AUTHOR"].includes(role)) {
    console.error("Gecersiz rol. SUPER_ADMIN, EDITOR veya AUTHOR kullanin.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Parola en az 8 karakter olmalidir.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, role: role as "SUPER_ADMIN" | "EDITOR" | "AUTHOR" },
    create: { email, passwordHash, name, role: role as "SUPER_ADMIN" | "EDITOR" | "AUTHOR" },
  });

  console.log(`Kullanici hazir: ${user.email} (${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
