import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

// ── Route protection rules ──────────────────────────────────────────────────
const PUBLIC_PATHS  = ["/auth/", "/client/"];
const ADMIN_PATHS   = ["/admin"];

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
        } catch {
          // DB unavailable (dev / no migration applied yet)
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // ── Edge: runs inside middleware ─────────────────────────────────────────
    authorized({ auth: session, request: { nextUrl } }) {
      // Dev bypass — set DEV_AUTH_BYPASS=true in .env to skip auth
      if (process.env.DEV_AUTH_BYPASS === "true") return true;

      const pathname = nextUrl.pathname;

      // Root → always redirect to /strategy
      if (pathname === "/") {
        return Response.redirect(new URL("/strategy", nextUrl));
      }

      // Public routes: auth pages + client portal
      if (isPublic(pathname)) return true;

      const isLoggedIn = !!session?.user;

      // Admin routes require ADMIN role
      if (isAdmin(pathname)) {
        return isLoggedIn && session.user.role === UserRole.ADMIN;
      }

      // All other routes require login
      return isLoggedIn;
    },

    // ── Server: embed id + role into the JWT ─────────────────────────────────
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id as string;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },

    // ── Server: expose id + role on the session object ───────────────────────
    session({ session, token }) {
      session.user.id   = token.id   as string;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
