"use client";

import { AppHeader } from "@/components/editorial/AppHeader";

export default function EditorialLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg-light">
      <AppHeader />
      {children}
    </div>
  );
}
