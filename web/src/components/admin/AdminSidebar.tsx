"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href:"/admin",               label:"Dashboard",       icon:"dashboard"    },
  { href:"/admin/users",         label:"Utilisateurs",    icon:"group"        },
  { href:"/admin/clients",       label:"Clients",         icon:"business"     },
  { href:"/admin/integrations",  label:"Intégrations",    icon:"electrical_services"},
  { href:"/admin/monitor",       label:"Systems Monitor", icon:"monitoring"   },
  { href:"/admin/settings",      label:"Paramètres",      icon:"settings"     },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-slate-200 bg-white p-6 h-screen sticky top-0 flex-shrink-0">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <span className="material-symbols-outlined">hub</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Maono Ops</h1>
            <p className="text-xs font-medium text-slate-500">Admin Console</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${active
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-primary"}`}
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase text-slate-500">Status</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
          <p className="text-xs text-slate-600">All systems operational. Last check: 1 min ago.</p>
        </div>
        <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-2xs font-bold text-slate-600">
            AU
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Admin User</p>
            <p className="text-xs text-slate-500">View Profile</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
