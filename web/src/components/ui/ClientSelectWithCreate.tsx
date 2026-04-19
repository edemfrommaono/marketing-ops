"use client";

import { useState, useTransition } from "react";
import { SlidePanel } from "@/components/ui/SlidePanel";
import { createClient } from "@/lib/actions/clients";

interface ClientOption {
  id:   string;
  name: string;
}

interface ClientSelectWithCreateProps {
  clients:  ClientOption[];
  name?:    string;
  required?: boolean;
  defaultValue?: string;
}

export function ClientSelectWithCreate({
  clients: initialClients,
  name = "clientId",
  required,
  defaultValue = "",
}: ClientSelectWithCreateProps) {
  const [clients, setClients]     = useState<ClientOption[]>(initialClients);
  const [selected, setSelected]   = useState(defaultValue);
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "__new__") {
      setPanelOpen(true);
      // Don't set "__new__" as the actual value
      setSelected(selected); // keep current selection
    } else {
      setSelected(val);
    }
  }

  async function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createClient(formData);
      if (result.success) {
        setClients(prev => [...prev, result.client]);
        setSelected(result.client.id);
        setPanelOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {/* Hidden input carries the actual selected value for the form */}
      <input type="hidden" name={name} value={selected} />

      <div className="relative">
        <select
          value={selected}
          onChange={handleChange}
          required={required}
          className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none bg-white"
        >
          <option value="">Sélectionner un client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          {clients.length === 0 && (
            <option disabled value="">Aucun client disponible</option>
          )}
          <option value="__new__" className="font-semibold text-editorial">
            ➕ Créer un nouveau client…
          </option>
        </select>
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
      </div>

      {/* Slide-in panel for creating a new client */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Nouveau client" width="max-w-md">
        <form action={handleCreate} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">error</span>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-anthracite mb-1.5">
              Nom du client *
            </label>
            <input
              type="text"
              name="name"
              placeholder="ex. Odoo SA"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite mb-1.5">
              Société *
            </label>
            <input
              type="text"
              name="company"
              placeholder="ex. Odoo SA"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-anthracite mb-1.5">
              Email de contact *
            </label>
            <input
              type="email"
              name="email"
              placeholder="contact@client.com"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setPanelOpen(false); setError(null); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  Création…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Créer le client
                </>
              )}
            </button>
          </div>
        </form>
      </SlidePanel>
    </>
  );
}
