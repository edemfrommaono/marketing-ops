import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

// ── Route protection rules ──────────────────────────────────────────────────
const PUBLIC_PATHS     = ["/auth/", "/client/"];
const ADMIN_PATHS      = ["/admin"];
const ONBOARDING_PATHS = ["/onboarding"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}
function isAdmin(pathname: string) {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p));
}
function isOnboarding(pathname: string) {
  return ONBOARDING_PATHS.some((p) => pathname.startsWith(p));
}
function isApi(pathname: string) {
  return pathname.startsWith("/api/");
}

// ── Auth config ─────────────────────────────────────────────────────────────
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/login",
    error:  "/auth/error",
  },

  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id:                  true,
              email:               true,
              name:                true,
              image:               true,
              role:                true,
              hashedPassword:      true,
              onboardingCompleted: true,
            },
          });

          if (!user?.hashedPassword) return null;

          const isValid = await bcrypt.compare(password, user.hashedPassword);
          if (!isValid) return null;

          return {
            id:                  user.id,
            email:               user.email ?? "",
            name:                user.name  ?? "",
            image:               user.image ?? null,
            role:                user.role,
            onboardingCompleted: user.onboardingCompleted,
          };
        } catch (err) {
          console.error("[auth] DB error during authorize:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // ── Edge: protège les routes ─────────────────────────────────────────────
    authorized({ auth: session, request: { nextUrl } }) {
      const pathname    = nextUrl.pathname;
      const isLoggedIn  = !!session?.user;

      // Routes publiques : auth pages + portail client + API
      if (isPublic(pathname) || isApi(pathname)) return true;

      // Non connecté → login
      if (!isLoggedIn) return false;

      // Routes admin : ADMIN uniquement
      if (isAdmin(pathname)) {
        return session!.user.role === UserRole.ADMIN;
      }

      // Onboarding non complété → redirige vers /onboarding
      // (sauf si on est déjà sur /onboarding)
      const onboardingDone = (session!.user as { onboardingCompleted?: boolean }).onboardingCompleted;
      if (onboardingDone === false && !isOnboarding(pathname)) {
        return Response.redirect(new URL("/onboarding", nextUrl));
      }

      return true;
    },

    // ── Server: injecte id + role + onboardingCompleted dans le JWT ──────────
    jwt({ token, user }) {
      if (user) {
        token.id                  = user.id as string;
        token.role                = (user as { role: UserRole }).role;
        token.onboardingCompleted = (user as { onboardingCompleted: boolean }).onboardingCompleted;
      }
      return token;
    },

    // ── Server: expose id + role + onboardingCompleted sur la session ─────────
    session({ session, token }) {
      session.user.id                  = token.id   as string;
      session.user.role                = token.role as UserRole;
      (session.user as { onboardingCompleted?: boolean }).onboardingCompleted = token.onboardingCompleted as boolean;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
