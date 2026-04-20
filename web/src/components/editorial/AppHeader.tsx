"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { NotificationBell } from "@/components/editorial/NotificationBell";

const NAV_LINKS = [
  { href: "/strategy",   label: "Stratégie"    },
  { href: "/calendar",   label: "Calendrier"   },
  { href: "/campaigns",  label: "Campagnes"    },
  { href: "/contents",   label: "Contenus"     },
  { href: "/my-tasks",   label: "Mes Tâches"   },
  { href: "/approvals",  label: "Approbations" },
  { href: "/publishing", label: "Publication"  },
  { href: "/analytics",  label: "Analytics"    },
];

export function AppHeader() {
  const pathname          = usePathname();
  const router            = useRouter();
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 sticky top-0 z-50">
        {/* Left — logo + nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-editorial">edit_calendar</span>
            <h1 className="text-anthracite text-xl font-semibold tracking-tight">
              Odoo <span className="font-normal text-slate-400">Editorial</span>
            </h1>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={active ? "nav-link-active" : "nav-link"}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right — search + actions */}
        <div className="flex items-center gap-3">
          {/* Search — hidden on small screens */}
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-editorial/30 focus:border-editorial/30 outline-none w-52 transition-all"
            />
          </form>

          <NotificationBell />

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="h-8 w-8 rounded-full bg-editorial/10 border border-editorial/20 flex items-center justify-center hover:bg-editorial/20 transition-colors"
            >
              <span className="material-symbols-outlined text-editorial text-xl">person</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                  Mon profil
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  Admin Console
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

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <nav className="relative ml-auto w-72 h-full bg-white shadow-2xl flex flex-col overflow-y-auto">
            <div className="px-5 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-2xl text-editorial">edit_calendar</span>
                <span className="text-anthracite font-semibold">Maono Ops</span>
              </div>
              {/* Mobile search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-editorial/30"
                  />
                </div>
              </form>
            </div>

            <div className="flex-1 px-3 py-4 space-y-1">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-editorial/10 text-editorial"
                        : "text-slate-600 hover:bg-slate-50 hover:text-anthracite"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="px-3 py-4 border-t border-slate-100 space-y-1">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                Mon profil
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                Admin Console
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Se déconnecter
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
