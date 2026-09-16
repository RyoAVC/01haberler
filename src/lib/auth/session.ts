import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import type { User } from "@prisma/client";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 gun

function hashToken(token: string): string {
  return createHash("sha256").update(token).update(env.SESSION_SECRET).digest("hex");
}

export async function createSession(
  user: Pick<User, "id">,
  userAgent: string | null
): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      userAgent: userAgent?.slice(0, 255),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  return session.user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  cookieStore.delete(env.COOKIE_NAME);
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
