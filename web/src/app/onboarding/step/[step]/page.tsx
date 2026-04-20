import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  onboardingCreateClient,
  onboardingCreateCampaign,
  onboardingInviteCollaborator,
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
  user_exists:    "Un utilisateur avec cet email existe déjà.",
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
          <span className="text-xs font-semibold text-sand">Étape {stepNum} sur {TOTAL_STEPS}</span>
          <span className="text-xs font-semibold text-tertiary">{pct}%</span>
        </div>
        <div className="w-full bg-block h-2 rounded-full overflow-hidden">
          <div
            className="h-2 bg-tertiary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mt-3">
          {STEPS.map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold transition-all ${
                i + 1 < stepNum
                  ? "bg-tertiary text-white"
                  : i + 1 === stepNum
                  ? "bg-tertiary text-white ring-4 ring-tertiary/20"
                  : "bg-block text-sand"
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
      <div className="card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-secondary/10">
          <h1 className="text-xl font-bold text-foreground">{stepInfo.title}</h1>
          <p className="text-sand text-sm mt-1">{stepInfo.subtitle}</p>
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
      <div className="w-20 h-20 rounded-2xl bg-tertiary/10 flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-tertiary text-[40px]">waving_hand</span>
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">
        Bienvenue{userName ? `, ${userName}` : ""} !
      </h2>
      <p className="text-sand text-sm mb-8 max-w-sm mx-auto">
        Cet assistant vous guidera pour configurer Maono Ops en quelques minutes.
        Vous pourrez créer votre premier client, lancer une campagne et inviter votre équipe.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8 text-left">
        {[
          { icon: "business",      label: "Clients",    desc: "Gérez vos comptes"    },
          { icon: "campaign",      label: "Campagnes",  desc: "Planifiez le contenu" },
          { icon: "group",         label: "Équipe",     desc: "Collaborez en temps réel" },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="bg-block-light rounded-xl p-4 text-center">
            <span className="material-symbols-outlined text-tertiary text-[24px] mb-2 block">{icon}</span>
            <p className="text-xs font-bold text-foreground">{label}</p>
            <p className="text-2xs text-sand mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      <Link
        href="/onboarding/step/2"
        className="btn-cta inline-flex items-center gap-2"
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
        <label className="label-base mb-1.5">Nom du client *</label>
        <input
          type="text"
          name="name"
          placeholder="ex. Odoo SA"
          required
          className="input-base"
        />
      </div>
      <div>
        <label className="label-base mb-1.5">Société *</label>
        <input
          type="text"
          name="company"
          placeholder="ex. Odoo SA"
          required
          className="input-base"
        />
      </div>
      <div>
        <label className="label-base mb-1.5">Email de contact *</label>
        <input
          type="email"
          name="email"
          placeholder="contact@client.com"
          required
          className="input-base"
        />
      </div>
      <StepActions nextLabel="Créer le client" backHref="/onboarding/step/1" skipHref="/onboarding/step/3" skipLabel="Passer (pas de client)" />
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
        <p className="text-sand text-sm mb-4">Aucun client trouvé. Veuillez d'abord créer un client à l'étape précédente.</p>
        <Link href="/onboarding/step/2" className="text-secondary text-sm font-semibold hover:underline">
          ← Retour à l'étape 2
        </Link>
      </div>
    );
  }

  return (
    <form action={onboardingCreateCampaign} className="space-y-5">
      <div>
        <label className="label-base mb-1.5">Nom de la campagne *</label>
        <input
          type="text"
          name="name"
          placeholder="ex. Lancement produit Q4"
          required
          className="input-base"
        />
      </div>
      <div>
        <label className="label-base mb-1.5">Objectif *</label>
        <textarea
          name="objective"
          rows={2}
          placeholder="Décrivez l'objectif de cette campagne..."
          required
          className="input-base resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base mb-1.5">Début *</label>
          <input type="date" name="startDate" required className="input-base" />
        </div>
        <div>
          <label className="label-base mb-1.5">Fin *</label>
          <input type="date" name="endDate" required className="input-base" />
        </div>
      </div>
      <div>
        <label className="label-base mb-2">Plateformes</label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map(p => (
            <label key={p.value} className="flex items-center gap-2 p-2.5 rounded-lg border border-secondary/10 cursor-pointer hover:border-secondary/40 hover:bg-secondary/5 transition-all has-[:checked]:border-secondary has-[:checked]:bg-secondary/10">
              <input type="checkbox" name="platforms" value={p.value} className="sr-only" />
              <span className="material-symbols-outlined text-sand text-[16px]">{p.icon}</span>
              <span className="text-xs font-medium text-foreground">{p.label}</span>
            </label>
          ))}
        </div>
      </div>
      <StepActions nextLabel="Créer la campagne" backHref="/onboarding/step/2" skipHref="/onboarding/step/4" skipLabel="Passer cette étape" />
    </form>
  );
}

// ── Step 4: Team ──────────────────────────────────────────────────────────────
function Step4() {
  const ROLES = [
    { value: "STRATEGIST",            label: "Stratégiste"             },
    { value: "CONTENT_PLANNER",       label: "Planificateur contenu"   },
    { value: "DESIGNER",              label: "Designer"                },
    { value: "PHOTOGRAPHER",          label: "Photographe"             },
    { value: "VIDEOGRAPHER",          label: "Vidéographe"             },
    { value: "SOCIAL_MEDIA_MANAGER",  label: "Community Manager"       },
    { value: "CLIENT",                label: "Client"                  },
  ];

  return (
    <form action={onboardingInviteCollaborator} className="space-y-5">
      <div className="bg-block-light rounded-xl border border-secondary/10 p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0 mt-0.5">mail</span>
        <p className="text-xs text-sand">
          Invitez vos collaborateurs à rejoindre votre équipe.
          Ils recevront un email avec un lien sécurisé pour accéder à Maono Ops.
        </p>
      </div>

      <div>
        <label className="label-base mb-1.5">Email du collaborateur *</label>
        <input
          type="email"
          name="email"
          placeholder="colleague@company.com"
          required
          className="input-base"
        />
      </div>

      <div>
        <label className="label-base mb-1.5">Rôle *</label>
        <select
          name="role"
          required
          className="input-base appearance-none bg-block pr-8 cursor-pointer"
        >
          <option value="">Sélectionnez un rôle</option>
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-secondary/10">
        <div className="flex items-center gap-3">
          <Link href="/onboarding/step/3" className="text-sm text-sand hover:text-secondary transition-colors">
            ← Retour
          </Link>
          <Link href="/onboarding/step/5" className="text-sm text-sand hover:text-secondary transition-colors">
            Passer →
          </Link>
        </div>
        <button
          type="submit"
          className="btn-cta flex items-center gap-2"
        >
          Inviter
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </form>
  );
}

// ── Step 5: Done ──────────────────────────────────────────────────────────────
function Step5() {
  return (
    <div className="text-center py-4">
      <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-emerald-400 text-[40px]">check_circle</span>
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">Configuration terminée !</h2>
      <p className="text-sand text-sm mb-8 max-w-sm mx-auto">
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
          <a key={href} href={href} className="flex items-center gap-3 bg-block-light hover:bg-secondary/5 rounded-xl p-3 transition-colors group">
            <span className="material-symbols-outlined text-sand group-hover:text-secondary text-[20px] transition-colors">{icon}</span>
            <span className="text-xs font-semibold text-foreground">{label}</span>
          </a>
        ))}
      </div>

      <form action={completeOnboarding}>
        <button
          type="submit"
          className="btn-cta inline-flex items-center gap-2"
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
  backHref,
  skipHref,
  skipLabel = "Passer",
}: {
  nextLabel:  string;
  backHref?:  string;
  skipHref?:  string;
  skipLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-secondary/10">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref} className="text-sm text-sand hover:text-secondary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Retour
          </Link>
        )}
        {skipHref && (
          <Link href={skipHref} className="text-sm text-sand hover:text-secondary transition-colors">
            {skipLabel} →
          </Link>
        )}
      </div>
      <button
        type="submit"
        className="btn-cta flex items-center gap-2"
      >
        {nextLabel}
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </div>
  );
}
