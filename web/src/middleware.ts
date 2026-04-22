// Next.js middleware — delegates to NextAuth's authorized() callback in auth.ts
// Route protection logic lives in authConfig.callbacks.authorized
// export { auth as middleware } from "@/auth";
export default function middleware() {}
export const config = { matcher: [] };
