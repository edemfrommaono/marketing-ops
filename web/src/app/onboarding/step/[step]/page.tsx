import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  onboardingCreateClient,
  onboardingCreateCampaign,
  completeOnboarding,
} from "@/lib/actions/onboarding";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const TOTAL_STEPS = 5;

const STEPS = [
  { title: "Bienvenue",           subtitle: "Configurez votre agence"      },
  { title: "Premier client",      subtitle: "Ajoutez votre premier client"  },
  { title: "Première campagne",   subtitle: "Créez une campagne de départ"  },
  { title: "Équipe",              subtitle: "Invitez vos collaborateurs"     },
  { title: "C'est parti !",       subtitle: "Votre espace est prêt"         },
];

interface PageProps {
  params:      { step: string };
  searchParams?: { error?: string };
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Tous les champs obligatoires (*) doivent être remplis.",
  db_error:       "Erreur lors de l'enregistrement. Veuillez réessayer.",
  no_client:      "Aucun client trouvé. Veuillez compléter l'étape précédente.",
};

export default async function OnboardingStepPage({ params, searchParams }: PageProps) {
  const stepNum = parseInt(params.step, 10);
  if (isNaN(stepNum) || stepNum < 1 || stepNum > TOTAL_STEPS) notFound();

  const stepInfo = STEPS[stepNum - 1];
  const errorMsg = searchParams?.error ? ERROR_MESSAGES[searchParams.error] : null;
  const pct      = Math.round((stepNum / TOTAL_STEPS) * 100);

  // Fetch data needed for specific steps
  const session = await auth();
  const clientCount = await prisma.client.count().catch(() => 0);

  return (
    <div className="w-full max-w-xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Étape {stepNum} sur {TOTAL_STEPS}</span>
          <span className="text-xs font-semibold text-editorial">{pct}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="h-2 bg-editorial rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mt-3">
          {STEPS.map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold transition-all ${
                i + 1 < stepNum
                  ? "bg-editorial text-white"
                  : i + 1 === stepNum
                  ? "bg-editorial text-white ring-4 ring-editorial/20"
                  : "bg-slate-200 text-slate-400"
              }`}>
                {i + 1 < stepNum ? (
                  <span className="material-symbols-outlined text-[14px]">check</span>
                ) : (
                  i + 1
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-anthracite">{stepInfo.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{stepInfo.subtitle}</p>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="mx-8 mt-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <span className="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
            {errorMsg}
          </div>
        )}

        {/* Step content */}
        <div className="px-8 py-6">
          {stepNum === 1 && <Step1 userName={session?.user?.name} />}
          {stepNum === 2 && <Step2 />}
          {stepNum === 3 && <Step3 clientCount={clientCount} />}
          {stepNum === 4 && <Step4 />}
          {stepNum === 5 && <Step5 />}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────
function Step1({ userName }: { userName?: string | null }) {
  return (
    <div className="text-center py-4">
      <div className="w-20 h-20 rounded-2xl bg-editorial/10 flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-editorial text-[40px]">waving_hand</span>
      </div>
      <h2 className="text-lg font-bold text-anthracite mb-2">
        Bienvenue{userName ? `, ${userName}` : ""} !
      </h2>
      <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
        Cet assistant vous guidera pour configurer Maono Ops en quelques minutes.
        Vous pourrez créer votre premier client, lancer une campagne et inviter votre équipe.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8 text-left">
        {[
          { icon: "business",      label: "Clients",    desc: "Gérez vos comptes"    },
          { icon: "campaign",      label: "Campagnes",  desc: "Planifiez le contenu" },
          { icon: "group",         label: "Équipe",     desc: "Collaborez en temps réel" },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4 text-center">
            <span className="material-symbols-outlined text-editorial text-[24px] mb-2 block">{icon}</span>
            <p className="text-xs font-bold text-anthracite">{label}</p>
            <p className="text-2xs text-slate-400 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      <Link
        href="/onboarding/step/2"
        className="inline-flex items-center gap-2 px-6 py-3 bg-editorial text-white rounded-xl text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
      >
        Commencer
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </div>
  );
}

// ── Step 2: First client ──────────────────────────────────────────────────────
function Step2() {
  return (
    <form action={onboardingCreateClient} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-anthracite mb-1.5">Nom du client *</label>
        <input
          type="text"
          name="name"
          placeholder="ex. Odoo SA"
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-anthracite mb-1.5">Société *</label>
        <input
          type="text"
          name="company"
          placeholder="ex. Odoo SA"
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-anthracite mb-1.5">Email de contact *</label>
        <input
          type="email"
          name="email"
          placeholder="contact@client.com"
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
        />
      </div>
      <StepActions nextLabel="Créer le client" />
    </form>
  );
}

// ── Step 3: First campaign ────────────────────────────────────────────────────
function Step3({ clientCount }: { clientCount: number }) {
  const PLATFORMS = [
    { value: "INSTAGRAM", label: "Instagram",   icon: "photo_camera"    },
    { value: "FACEBOOK",  label: "Facebook",    icon: "thumb_up"        },
    { value: "LINKEDIN",  label: "LinkedIn",    icon: "business_center" },
    { value: "TIKTOK",    label: "TikTok",      icon: "music_video"     },
    { value: "YOUTUBE",   label: "YouTube",     icon: "play_circle"     },
    { value: "X",         label: "X",           icon: "tag"             },
  ];

  if (clientCount === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-slate-400 text-sm mb-4">Aucun client trouvé. Veuillez d'abord créer un client à l'étape précédente.</p>
        <Link href="/onboarding/step/2" className="text-editorial text-sm font-semibold hover:underline">
          ← Retour à l'étape 2
        </Link>
      </div>
    );
  }

  return (
    <form action={onboardingCreateCampaign} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-anthracite mb-1.5">Nom de la campagne *</label>
        <input
          type="text"
          name="name"
          placeholder="ex. Lancement produit Q4"
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-anthracite mb-1.5">Objectif *</label>
        <textarea
          name="objective"
          rows={2}
          placeholder="Décrivez l'objectif de cette campagne..."
          required
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial focus:ring-1 focus:ring-editorial/20 outline-none resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-anthracite mb-1.5">Début *</label>
          <input type="date" name="startDate" required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-anthracite mb-1.5">Fin *</label>
          <input type="date" name="endDate" required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-editorial outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-anthracite mb-2">Plateformes</label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map(p => (
            <label key={p.value} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:border-editorial/40 hover:bg-editorial/5 transition-all has-[:checked]:border-editorial has-[:checked]:bg-editorial/10">
              <input type="checkbox" name="platforms" value={p.value} className="sr-only" />
              <span className="material-symbols-outlined text-slate-400 text-[16px]">{p.icon}</span>
              <span className="text-xs font-medium text-anthracite">{p.label}</span>
            </label>
          ))}
        </div>
      </div>
      <StepActions nextLabel="Créer la campagne" skipHref="/onboarding/step/4" skipLabel="Passer cette étape" />
    </form>
  );
}

// ── Step 4: Team ──────────────────────────────────────────────────────────────
function Step4() {
  return (
    <div className="space-y-5">
      <div className="bg-pastel-blue rounded-xl border border-editorial/20 p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-editorial text-[20px] flex-shrink-0 mt-0.5">info</span>
        <p className="text-xs text-slate-600">
          L'invitation par email sera disponible prochainement.
          Votre équipe pourra rejoindre la plateforme via un lien d'invitation sécurisé.
        </p>
      </div>

      <div className="space-y-3 opacity-50 pointer-events-none">
        <div>
          <label className="block text-sm font-medium text-anthracite mb-1.5">Email du collaborateur</label>
          <input
            type="email"
            placeholder="colleague@company.com"
            disabled
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-anthracite mb-1.5">Rôle</label>
          <select disabled className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none bg-slate-50">
            <option>Designer</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Link href="/onboarding/step/3" className="text-sm text-slate-500 hover:text-anthracite transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Retour
        </Link>
        <Link
          href="/onboarding/step/5"
          className="flex items-center gap-2 px-5 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
        >
          Passer cette étape
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

// ── Step 5: Done ──────────────────────────────────────────────────────────────
function Step5() {
  return (
    <div className="text-center py-4">
      <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-emerald-500 text-[40px]">check_circle</span>
      </div>
      <h2 className="text-lg font-bold text-anthracite mb-2">Configuration terminée !</h2>
      <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
        Votre espace Maono Ops est prêt. Vous pouvez maintenant créer du contenu,
        planifier vos publications et collaborer avec votre équipe.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8 text-left">
        {[
          { href: "/calendar",   icon: "calendar_month", label: "Calendrier éditorial" },
          { href: "/campaigns",  icon: "campaign",       label: "Campagnes"            },
          { href: "/contents",   icon: "description",    label: "File de production"   },
          { href: "/analytics",  icon: "analytics",      label: "Analytics"            },
        ].map(({ href, icon, label }) => (
          <a key={href} href={href} className="flex items-center gap-3 bg-slate-50 hover:bg-editorial/5 rounded-xl p-3 transition-colors group">
            <span className="material-symbols-outlined text-slate-400 group-hover:text-editorial text-[20px] transition-colors">{icon}</span>
            <span className="text-xs font-semibold text-anthracite">{label}</span>
          </a>
        ))}
      </div>

      <form action={completeOnboarding}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-editorial text-white rounded-xl text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
          Accéder au tableau de bord
        </button>
      </form>
    </div>
  );
}

// ── Shared step actions ───────────────────────────────────────────────────────
function StepActions({
  nextLabel,
  skipHref,
  skipLabel = "Passer",
}: {
  nextLabel:  string;
  skipHref?:  string;
  skipLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <div className="flex items-center gap-3">
        {skipHref && (
          <Link href={skipHref} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            {skipLabel} →
          </Link>
        )}
      </div>
      <button
        type="submit"
        className="flex items-center gap-2 px-5 py-2.5 bg-editorial text-white rounded-lg text-sm font-semibold hover:bg-editorial/90 transition-colors shadow-sm"
      >
        {nextLabel}
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>
  );
}
