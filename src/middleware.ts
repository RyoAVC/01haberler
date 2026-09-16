import { NextResponse, type NextRequest } from "next/server";
import { isInstalled } from "@/server/services/installStatusService";
import { getActiveRedirectFor } from "@/server/services/redirectService";
import { isModuleEnabled } from "@/server/services/moduleFlagsService";

// Kurulum tamamlandiktan sonra bir daha DB'ye gitmemek icin islem-icinde onbellek.
let installedCache = false;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kurulum kapisi: DB henuz "installed" olarak isaretlenmediyse /kurulum disinda
  // her sey oraya yonlendirilir. Tek seferlik oldugu icin true olunca hic sorgulanmaz.
  if (!installedCache) {
    installedCache = await isInstalled();
    if (!installedCache && pathname !== "/kurulum") {
      return NextResponse.redirect(new URL("/kurulum", request.url));
    }
  }

  // Bakim modu: admin ve API disindaki tum sayfalari /bakim'e yonlendirir,
  // editorlerin panelden calismaya devam edebilmesi icin admin haric tutulur.
  if (
    process.env.MAINTENANCE_MODE === "true" &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    pathname !== "/bakim"
  ) {
    return NextResponse.rewrite(new URL("/bakim", request.url));
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/giris") {
    const hasSessionCookie = request.cookies.has(process.env.COOKIE_NAME || "01h_session");
    if (!hasSessionCookie) {
      const loginUrl = new URL("/admin/giris", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api") && installedCache) {
    if (await isModuleEnabled("redirects")) {
      const redirect = await getActiveRedirectFor(pathname);
      if (redirect) {
        return NextResponse.redirect(new URL(redirect.toPath, request.url), redirect.statusCode);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|uploads/).*)"],
};
