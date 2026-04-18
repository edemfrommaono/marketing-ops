"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/strategy",   label: "Stratégie"   },
  { href: "/calendar",   label: "Calendrier"  },
  { href: "/campaigns",  label: "Campagnes"   },
  { href: "/contents",   label: "Contenus"    },
  { href: "/approvals",  label: "Approbations"},
  { href: "/publishing", label: "Publication" },
  { href: "/analytics",  label: "Analytics"   },
];

export function AppHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-slate-100 bg-white px-8 py-4 sticky top-0 z-50">
      {/* Left — logo + nav */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-editorial">edit_calendar</span>
          <h1 className="text-anthracite text-xl font-semibold tracking-tight">
            Odoo <span className="font-normal text-slate-400">Editorial</span>
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? "nav-link-active" : "nav-link"}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right — search + actions */}
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search strategy..."
            className="bg-pastel-grey border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-editorial/30 outline-none w-60"
          />
        </div>

        <button className="relative text-slate-400 hover:text-anthracite transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="h-8 w-8 rounded-full bg-editorial/10 border border-editorial/20 flex items-center justify-center hover:bg-editorial/20 transition-colors"
          >
            <span className="material-symbols-outlined text-editorial text-xl">person</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                Admin Console
              </Link>
              <Link
                href="/admin/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                Mon profil
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
