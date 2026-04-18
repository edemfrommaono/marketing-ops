import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

// ── Route protection rules ──────────────────────────────────────────────────
const PUBLIC_PATHS = ["/auth/", "/client/"];
const ADMIN_PATHS  = ["/admin"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}
function isAdmin(pathname: string) {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p));
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
              id:             true,
              email:          true,
              name:           true,
              image:          true,
              role:           true,
              hashedPassword: true,
            },
          });

          if (!user?.hashedPassword) return null;

          const isValid = await bcrypt.compare(password, user.hashedPassword);
          if (!isValid) return null;

          return {
            id:    user.id,
            email: user.email ?? "",
            name:  user.name  ?? "",
            image: user.image ?? null,
            role:  user.role,
          };
        } catch (err) {
          // DB unavailable — ne pas laisser passer
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

      // Routes publiques : auth pages + portail client
      if (isPublic(pathname)) return true;

      // Routes admin : ADMIN uniquement
      if (isAdmin(pathname)) {
        return isLoggedIn && session!.user.role === UserRole.ADMIN;
      }

      // Toutes les autres routes : connexion requise
      return isLoggedIn;
    },

    // ── Server: injecte id + role dans le JWT ────────────────────────────────
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id as string;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },

    // ── Server: expose id + role sur la session ──────────────────────────────
    session({ session, token }) {
      session.user.id   = token.id   as string;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
