import type { Metadata } from "next";
import { AppHeader } from "@/components/editorial/AppHeader";

export const metadata: Metadata = {
  title: {
    template: "%s | Maono Ops",
    default: "Editorial",
  },
};

export default function EditorialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg-light">
      <AppHeader />
      {children}
    </div>
  );
}
