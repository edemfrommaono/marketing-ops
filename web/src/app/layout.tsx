import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Maono Ops",
    template: "%s | Maono Ops",
  },
  description: "Plateforme de gestion éditoriale et marketing",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bg-light antialiased">{children}</body>
    </html>
  );
}
