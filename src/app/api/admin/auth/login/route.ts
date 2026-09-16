import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, resetSeconds } = await rateLimit(`login:${ip}`, 8, 300);
  if (!allowed) {
    return NextResponse.json(
      { error: `Çok fazla deneme yapıldı. ${resetSeconds} saniye sonra tekrar deneyin.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz giriş bilgisi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const genericError = NextResponse.json({ error: "E-posta veya parola hatalı" }, { status: 401 });

  if (!user || !user.isActive) {
    // Kullanici bulunamasa bile hash dogrulama suresine yakin gecikme
    // uygulayarak kullanici varligi bilgisinin zamanlamadan sizmasini onler.
    await verifyPassword("$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", parsed.data.password);
    return genericError;
  }

  const validPassword = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!validPassword) return genericError;

  await createSession(user, request.headers.get("user-agent"));
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id },
  });

  return NextResponse.json({ ok: true });
}
