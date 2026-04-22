import { UserRole } from "@/types/api";

// Mock version for frontend-only demo
export const auth = async () => ({
  user: {
    id: "mock-user-id",
    name: "Demo User",
    email: "demo@maono.co",
    role: UserRole.ADMIN,
    onboardingCompleted: true,
  },
});

export const handlers = {
  GET: async () => new Response("OK"),
  POST: async () => new Response("OK"),
};

export const signIn = async () => {};
export const signOut = async () => {};
