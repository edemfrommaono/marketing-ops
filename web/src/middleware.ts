// Next.js middleware — delegates to NextAuth's authorized() callback in auth.ts
// Route protection logic lives in authConfig.callbacks.authorized
export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimization)
     *  - favicon.ico
     *  - public assets (png, jpg, svg…)
     *  - /api routes (protected individually in route handlers)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
