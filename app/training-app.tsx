"use client";

import {
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock3,
  Cloud,
  Gauge,
  Globe2,
  GraduationCap,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Target,
  Trophy,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import training from "../data/training.json";

type Locale = "fr" | "en";

type Localized = {
  fr: string;
  en: string;
};

type Module = {
  id: string;
  title: Localized;
  summary: Localized;
  keyPoints: Record<Locale, string[]>;
  practice: Localized;
  tips: Record<Locale, string[]>;
};

type Question = {
  id: string;
  question: Localized;
  options: Record<Locale, string[]>;
  answer: number;
  explanation: Localized;
};

type LabStep = {
  id: string;
  title: Localized;
  detail: Localized;
};

type CommandSnippet = {
  id: string;
  label: Localized;
  command: string;
};

type LabPlaybook = {
  title: Localized;
  brief: Localized;
  steps: LabStep[];
  commands: CommandSnippet[];
};

type Level = {
  id: string;
  rank: number;
  duration: Localized;
  name: Localized;
  goal: Localized;
  modules: Module[];
  quiz: Question[];
};

type ProgressSnapshot = {
  answers?: Record<string, number>;
  completedModules?: Record<string, boolean>;
  labChecks?: Record<string, boolean>;
  levelId?: string;
  locale?: Locale;
  submittedLevels?: Record<string, boolean>;
};

const STORAGE_KEY = "cloud-cert-progress-v2";

const content = training as {
  meta: {
    title: Localized;
    subtitle: Localized;
    sourceNote: Localized;
  };
  levels: Level[];
  capstone: {
    title: Localized;
    brief: Localized;
    deliverables: Record<Locale, string[]>;
  };
};

const copy = {
  fr: {
    academy: "Cloud Cert",
    language: "Langue",
    level: "Niveau",
    duration: "Durée",
    modules: "Modules",
    quiz: "Quiz",
    progress: "Progression",
    source: "Base du parcours",
    objective: "Objectif",
    keyPoints: "Points clés",
    practice: "Lab conseillé",
    tips: "Conseils terrain",
    capstone: "Projet final",
    answer: "Valider le quiz",
    reset: "Réinitialiser le quiz",
    resetAll: "Tout réinitialiser",
    score: "Score",
    selected: "Sélectionné",
    chooseLevel: "Niveaux",
    pass: "Validé",
    improve: "À revoir",
    deliverables: "Livrables",
    beginnerPath: "Commencer ici",
    quizIntro: "Valide ta compréhension avant de passer au niveau suivant.",
    readiness: "Indice de préparation",
    moduleDone: "Module terminé",
    moduleOpen: "À traiter",
    markDone: "Marquer comme terminé",
    markUndone: "Marquer à revoir",
    answered: "répondues",
    unanswered: "questions restantes",
    lockedScore: "Réponds à toutes les questions",
    nextFocus: "Prochain focus",
    studyPlan: "Plan d'étude",
    mastery: "Maîtrise",
    completed: "terminés",
    checkpoint: "Checkpoint",
    quizReady: "Prêt à valider",
    quizPending: "Quiz incomplet",
    topology: "Topologie cible",
    emptyFocus: "Tous les modules du niveau sont marqués.",
    current: "En cours",
    complete: "Complet",
    saved: "Progression sauvegardée",
    labCoach: "Coach lab",
    labRunbook: "Runbook pratique",
    labSteps: "Étapes",
    commands: "Commandes utiles",
    copyCommand: "Copier",
    copied: "Copié",
    markStepDone: "Valider l'étape",
    markStepOpen: "Remettre à faire",
    resetLab: "Réinitialiser le lab",
    labComplete: "Lab prêt",
    labInProgress: "Lab en cours"
  },
  en: {
    academy: "Cloud Cert",
    language: "Language",
    level: "Level",
    duration: "Duration",
    modules: "Modules",
    quiz: "Quiz",
    progress: "Progress",
    source: "Path basis",
    objective: "Objective",
    keyPoints: "Key points",
    practice: "Suggested lab",
    tips: "Field tips",
    capstone: "Final project",
    answer: "Submit quiz",
    reset: "Reset quiz",
    resetAll: "Reset all",
    score: "Score",
    selected: "Selected",
    chooseLevel: "Levels",
    pass: "Passed",
    improve: "Review needed",
    deliverables: "Deliverables",
    beginnerPath: "Start here",
    quizIntro: "Validate your understanding before moving to the next level.",
    readiness: "Readiness index",
    moduleDone: "Module done",
    moduleOpen: "To cover",
    markDone: "Mark complete",
    markUndone: "Mark for review",
    answered: "answered",
    unanswered: "questions left",
    lockedScore: "Answer every question",
    nextFocus: "Next focus",
    studyPlan: "Study plan",
    mastery: "Mastery",
    completed: "completed",
    checkpoint: "Checkpoint",
    quizReady: "Ready to submit",
    quizPending: "Quiz incomplete",
    topology: "Target topology",
    emptyFocus: "All modules in this level are marked.",
    current: "In progress",
    complete: "Complete",
    saved: "Progress saved",
    labCoach: "Lab coach",
    labRunbook: "Practical runbook",
    labSteps: "Steps",
    commands: "Useful commands",
    copyCommand: "Copy",
    copied: "Copied",
    markStepDone: "Mark step done",
    markStepOpen: "Mark open",
    resetLab: "Reset lab",
    labComplete: "Lab ready",
    labInProgress: "Lab in progress"
  }
} as const;

const labPlaybooks: Record<string, LabPlaybook> = {
  beginner: {
    title: {
      fr: "VPC auto mode et deux VM",
      en: "Auto mode VPC and two VMs"
    },
    brief: {
      fr: "Reproduis le lab Google Skills sans te perdre: supprimer le réseau default, créer mynetwork, déployer deux VM et vérifier la connectivité.",
      en: "Recreate the Google Skills lab without getting lost: delete the default network, create mynetwork, deploy two VMs, and verify connectivity."
    },
    steps: [
      {
        id: "inspect-default",
        title: { fr: "Explorer default", en: "Inspect default" },
        detail: {
          fr: "Ouvre default, regarde Subnets, Routes et Firewalls avant toute suppression.",
          en: "Open default, review Subnets, Routes, and Firewalls before deleting anything."
        }
      },
      {
        id: "delete-default",
        title: { fr: "Nettoyer default", en: "Clean default" },
        detail: {
          fr: "Supprime les règles default-allow-* puis le réseau default.",
          en: "Delete default-allow-* rules, then delete the default network."
        }
      },
      {
        id: "create-vpc",
        title: { fr: "Créer mynetwork", en: "Create mynetwork" },
        detail: {
          fr: "Mode Automatic, règles allow-custom, allow-icmp, allow-rdp et allow-ssh activées.",
          en: "Automatic mode, with allow-custom, allow-icmp, allow-rdp, and allow-ssh enabled."
        }
      },
      {
        id: "create-vms",
        title: { fr: "Créer les deux VM", en: "Create both VMs" },
        detail: {
          fr: "mynet-us-vm en us-west1-a et mynet-r2-vm en europe-west4-a, toutes les deux en e2-micro.",
          en: "mynet-us-vm in us-west1-a and mynet-r2-vm in europe-west4-a, both using e2-micro."
        }
      },
      {
        id: "test-ping",
        title: { fr: "Tester la connectivité", en: "Test connectivity" },
        detail: {
          fr: "Depuis mynet-us-vm, ping l'IP interne puis l'IP externe de mynet-r2-vm.",
          en: "From mynet-us-vm, ping mynet-r2-vm's internal IP, then its external IP."
        }
      }
    ],
    commands: [
      {
        id: "ping-internal",
        label: { fr: "Ping IP interne", en: "Ping internal IP" },
        command: "ping -c 3 <INTERNAL_IP_OF_MYNET_R2_VM>"
      },
      {
        id: "ping-external",
        label: { fr: "Ping IP externe", en: "Ping external IP" },
        command: "ping -c 3 <EXTERNAL_IP_OF_MYNET_R2_VM>"
      },
      {
        id: "exit-ssh",
        label: { fr: "Fermer SSH", en: "Close SSH" },
        command: "exit"
      }
    ]
  },
  intermediate: {
    title: {
      fr: "Flux applicatif sécurisé",
      en: "Secure application flow"
    },
    brief: {
      fr: "Construis une chaîne réseau complète: firewall, service applicatif, DNS, HTTPS et observation.",
      en: "Build a complete network path: firewall, application service, DNS, HTTPS, and observation."
    },
    steps: [
      {
        id: "draw-flow",
        title: { fr: "Dessiner le flux", en: "Map the flow" },
        detail: {
          fr: "Identifie client, DNS, load balancer, service backend, firewall et journaux.",
          en: "Identify client, DNS, load balancer, backend service, firewall, and logs."
        }
      },
      {
        id: "least-access",
        title: { fr: "Limiter l'accès", en: "Limit access" },
        detail: {
          fr: "Autorise uniquement les ports nécessaires et documente chaque source.",
          en: "Allow only required ports and document every source."
        }
      },
      {
        id: "verify-service",
        title: { fr: "Vérifier le service", en: "Verify service" },
        detail: {
          fr: "Teste HTTP/HTTPS, DNS, health checks et logs avant de valider.",
          en: "Test HTTP/HTTPS, DNS, health checks, and logs before marking the lab complete."
        }
      }
    ],
    commands: [
      {
        id: "curl-head",
        label: { fr: "Test HTTP", en: "HTTP test" },
        command: "curl -I https://<YOUR_DOMAIN_OR_IP>"
      },
      {
        id: "dns-test",
        label: { fr: "Test DNS", en: "DNS test" },
        command: "dig <YOUR_DOMAIN>"
      }
    ]
  },
  advanced: {
    title: {
      fr: "Connectivité hybride",
      en: "Hybrid connectivity"
    },
    brief: {
      fr: "Prépare une architecture réseau hybride avec routage, NAT, VPN ou Interconnect et contrôles de sécurité.",
      en: "Prepare a hybrid network architecture with routing, NAT, VPN or Interconnect, and security controls."
    },
    steps: [
      {
        id: "cidr-plan",
        title: { fr: "Plan CIDR", en: "CIDR plan" },
        detail: {
          fr: "Vérifie les plages sans chevauchement entre VPC, on-prem et environnements futurs.",
          en: "Verify non-overlapping ranges across VPC, on-prem, and future environments."
        }
      },
      {
        id: "route-policy",
        title: { fr: "Routage et priorité", en: "Routing and priority" },
        detail: {
          fr: "Documente routes dynamiques, routes statiques, next hop et priorités.",
          en: "Document dynamic routes, static routes, next hops, and priorities."
        }
      },
      {
        id: "resilience",
        title: { fr: "Résilience", en: "Resilience" },
        detail: {
          fr: "Prévois redondance régionale, health checks et procédure de bascule.",
          en: "Plan regional redundancy, health checks, and failover procedure."
        }
      }
    ],
    commands: [
      {
        id: "trace",
        label: { fr: "Tracer un chemin", en: "Trace a path" },
        command: "traceroute <PRIVATE_OR_PUBLIC_TARGET>"
      },
      {
        id: "ping-mtu",
        label: { fr: "Tester MTU", en: "Test MTU" },
        command: "ping -M do -s 1460 <TARGET_IP>"
      }
    ]
  },
  expert: {
    title: {
      fr: "Design review production",
      en: "Production design review"
    },
    brief: {
      fr: "Passe d'un lab réussi à une conception défendable: sécurité, observabilité, coûts, opérations et reprise.",
      en: "Move from a passed lab to a defensible design: security, observability, cost, operations, and recovery."
    },
    steps: [
      {
        id: "threat-model",
        title: { fr: "Modèle de menace", en: "Threat model" },
        detail: {
          fr: "Liste les entrées publiques, données sensibles, rôles IAM et chemins d'escalade.",
          en: "List public entry points, sensitive data, IAM roles, and escalation paths."
        }
      },
      {
        id: "slo",
        title: { fr: "SLO et alertes", en: "SLOs and alerts" },
        detail: {
          fr: "Définis disponibilité, latence, perte de paquets, journaux utiles et alertes actionnables.",
          en: "Define availability, latency, packet loss, useful logs, and actionable alerts."
        }
      },
      {
        id: "runbook",
        title: { fr: "Runbook incident", en: "Incident runbook" },
        detail: {
          fr: "Écris les vérifications réseau, commandes, décisions de rollback et critères de résolution.",
          en: "Write network checks, commands, rollback decisions, and resolution criteria."
        }
      }
    ],
    commands: [
      {
        id: "tcp-check",
        label: { fr: "Tester un port", en: "Test a port" },
        command: "nc -vz <HOST> <PORT>"
      },
      {
        id: "mtr",
        label: { fr: "Diagnostic réseau", en: "Network diagnostic" },
        command: "mtr -rw <TARGET>"
      }
    ]
  }
};

const frenchTextFixes: Array<[RegExp, string]> = [
  [/Ã©/g, "é"],
  [/Ã¨/g, "è"],
  [/Ãª/g, "ê"],
  [/Ã«/g, "ë"],
  [/Ã /g, "à"],
  [/Ã¢/g, "â"],
  [/Ã§/g, "ç"],
  [/Ã®/g, "î"],
  [/Ã¯/g, "ï"],
  [/Ã´/g, "ô"],
  [/Ã¹/g, "ù"],
  [/Ã»/g, "û"],
  [/\bIngenieur\b/g, "Ingénieur"],
  [/\bReseau\b/g, "Réseau"],
  [/\breseau\b/g, "réseau"],
  [/\breseaux\b/g, "réseaux"],
  [/\bDebutant\b/g, "Débutant"],
  [/\bAvance\b/g, "Avancé"],
  [/\bDuree\b/g, "Durée"],
  [/\bcomprehension\b/g, "compréhension"],
  [/\bsecurise\b/g, "sécurisé"],
  [/\bsecurisee\b/g, "sécurisée"],
  [/\bsecurite\b/g, "sécurité"],
  [/\borganise\b/g, "organisé"],
  [/\bhierarchie\b/g, "hiérarchie"],
  [/\bunite\b/g, "unité"],
  [/\bcreation\b/g, "création"],
  [/\bgenere\b/g, "généré"],
  [/\brepere\b/g, "repère"],
  [/\bCree\b/g, "Crée"],
  [/\bcree\b/g, "crée"],
  [/\bdebutant\b/g, "débutant"],
  [/\bQuel role\b/g, "Quel rôle"],
  [/\bdistribue\b/g, "distribué"],
  [/\bechelle\b/g, "échelle"],
  [/\bstructure\b/g, "structuré"],
  [/\bprives\b/g, "privés"],
  [/\bprivee\b/g, "privée"],
  [/\bprecise\b/g, "précis"],
  [/\bcontrole\b/g, "contrôle"],
  [/\broles\b/g, "rôles"],
  [/\bprecis\b/g, "précis"],
  [/\bprivilege\b/g, "privilège"],
  [/\bnecessaires\b/g, "nécessaires"],
  [/\btolerance\b/g, "tolérance"],
  [/\bregionaux\b/g, "régionaux"],
  [/\bregionale\b/g, "régionale"],
  [/\bregional\b/g, "régional"],
  [/\bregions\b/g, "régions"],
  [/\bregion\b/g, "région"],
  [/\bsysteme\b/g, "système"],
  [/\bmeme\b/g, "même"],
  [/\bcreer\b/g, "créer"],
  [/\bconnectee\b/g, "connectée"],
  [/\bspecifique\b/g, "spécifique"],
  [/\bnomme\b/g, "nommé"],
  [/\bverifie\b/g, "vérifie"],
  [/\bdifference\b/g, "différence"],
  [/\breduit\b/g, "réduit"],
  [/\bcout\b/g, "coût"],
  [/\bdonnees\b/g, "données"],
  [/\bconsultees\b/g, "consultées"],
  [/\badapte\b/g, "adapté"],
  [/\bmanagée\b/g, "managée"],
  [/\bmanagÃ©e\b/g, "managée"],
  [/\bdeclenchee\b/g, "déclenchée"],
  [/\bdeclencheur\b/g, "déclencheur"],
  [/\bevenement\b/g, "événement"],
  [/\bevenementiel\b/g, "événementiel"],
  [/\bconteneurisee\b/g, "conteneurisée"],
  [/\bintegre\b/g, "intègre"],
  [/\bmetriques\b/g, "métriques"],
  [/\bautorises\b/g, "autorisés"],
  [/\bautorisees\b/g, "autorisées"],
  [/\bprotege\b/g, "protège"],
  [/\badaptee\b/g, "adaptée"],
  [/\bregle\b/g, "règle"],
  [/\bregles\b/g, "règles"],
  [/\bgerer\b/g, "gérer"],
  [/\bgeres\b/g, "gérés"],
  [/\bgerée\b/g, "gérée"],
  [/\bpriorite\b/g, "priorité"],
  [/\bpriorites\b/g, "priorités"],
  [/\bhierarchique\b/g, "hiérarchique"],
  [/\bhierarchiques\b/g, "hiérarchiques"],
  [/\bprive\b/g, "privé"],
  [/\bprivees\b/g, "privées"],
  [/\bconnectivite\b/g, "connectivité"],
  [/\bcontrole\b/g, "contrôle"],
  [/\bcontroleur\b/g, "contrôleur"],
  [/\blegitime\b/g, "légitime"],
  [/\boperation\b/g, "opération"],
  [/\boperations\b/g, "opérations"],
  [/\bmetadonnee\b/g, "métadonnée"],
  [/\bmetadata\b/g, "metadata"],
  [/\bdebit\b/g, "débit"],
  [/\bpaquets\b/g, "paquets"],
  [/\bverification\b/g, "vérification"],
  [/\bverifier\b/g, "vérifier"],
  [/\bou le trafic\b/g, "où le trafic"],
  [/\bou il\b/g, "où il"],
  [/\ba 6/g, "à 6"],
  [/\ba 8/g, "à 8"],
  [/\ba 10/g, "à 10"],
  [/\ba 14/g, "à 14"],
  [/\ba une\b/g, "à une"],
  [/\ba un\b/g, "à un"],
  [/\ba des\b/g, "à des"],
  [/\ba Cloud\b/g, "à Cloud"],
  [/\ba la\b/g, "à la"],
  [/\ba l'/g, "à l'"],
  [/\ba partir\b/g, "à partir"],
  [/\ba tres\b/g, "à très"],
  [/\btres\b/g, "très"],
  [/\bpres\b/g, "près"],
  [/\bplutot\b/g, "plutôt"],
  [/\bdefaut\b/g, "défaut"],
  [/\baffichee\b/g, "affichée"],
  [/\bevaluees\b/g, "évaluées"],
  [/\bdeploies\b/g, "déploies"],
  [/\bEcris\b/g, "Écris"],
  [/\bRedige\b/g, "Rédige"],
  [/\bConçois\b/g, "Conçois"],
  [/\bautorises\b/g, "autorisés"],
  [/\bseulement si\b/g, "seulement si"]
];

function polishFrench(value: string) {
  return frenchTextFixes.reduce((current, [pattern, replacement]) => {
    return current.replace(pattern, replacement);
  }, value);
}

function getAnswerState(
  selected: number | undefined,
  submitted: boolean,
  index: number,
  correct: number
) {
  if (!submitted) {
    return selected === index ? "selected" : "idle";
  }

  if (index === correct) {
    return "correct";
  }

  if (selected === index && selected !== correct) {
    return "wrong";
  }

  return "idle";
}

function isLocale(value: unknown): value is Locale {
  return value === "fr" || value === "en";
}

export default function LearningApp() {
  const [locale, setLocale] = useState<Locale>("fr");
  const [levelId, setLevelId] = useState(content.levels[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [labChecks, setLabChecks] = useState<Record<string, boolean>>({});
  const [submittedLevels, setSubmittedLevels] = useState<Record<string, boolean>>({});
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);

  const t = copy[locale];

  const activeLevel = useMemo(
    () => content.levels.find((level) => level.id === levelId) ?? content.levels[0],
    [levelId]
  );

  const text = (value: string) => (locale === "fr" ? polishFrench(value) : value);

  const levelSummaries = useMemo(() => {
    return content.levels.map((level) => {
      const moduleDone = level.modules.filter((module) => completedModules[module.id]).length;
      const answered = level.quiz.filter((question) => answers[question.id] !== undefined).length;
      const score = level.quiz.reduce((total, question) => {
        return total + (answers[question.id] === question.answer ? 1 : 0);
      }, 0);
      const submitted = Boolean(submittedLevels[level.id]);
      const quizPercent = level.quiz.length > 0 ? Math.round((score / level.quiz.length) * 100) : 0;
      const modulePercent =
        level.modules.length > 0 ? Math.round((moduleDone / level.modules.length) * 100) : 0;
      const complete = moduleDone === level.modules.length && submitted && quizPercent >= 70;
      const progress = Math.round(modulePercent * 0.55 + (submitted ? quizPercent : answered * 10) * 0.45);

      return {
        answered,
        complete,
        id: level.id,
        moduleDone,
        modulePercent,
        progress: Math.min(progress, 100),
        quizPercent,
        score,
        submitted
      };
    });
  }, [answers, completedModules, submittedLevels]);

  const currentSummary =
    levelSummaries.find((summary) => summary.id === activeLevel.id) ?? levelSummaries[0];
  const currentSubmitted = Boolean(submittedLevels[activeLevel.id]);
  const answeredCurrent = currentSummary?.answered ?? 0;
  const score = currentSummary?.score ?? 0;
  const scorePercent = currentSummary?.quizPercent ?? 0;
  const unanswered = activeLevel.quiz.length - answeredCurrent;

  const totalModules = content.levels.reduce((total, level) => total + level.modules.length, 0);
  const completedModuleCount = content.levels.reduce((total, level) => {
    return total + level.modules.filter((module) => completedModules[module.id]).length;
  }, 0);
  const totalQuestions = content.levels.reduce((total, level) => total + level.quiz.length, 0);
  const correctAnswers = content.levels.reduce((total, level) => {
    return (
      total +
      level.quiz.reduce((quizTotal, question) => {
        return quizTotal + (answers[question.id] === question.answer ? 1 : 0);
      }, 0)
    );
  }, 0);
  const readiness = Math.round(
    (completedModuleCount / totalModules) * 60 + (correctAnswers / totalQuestions) * 40
  );
  const completedLevels = levelSummaries.filter((summary) => summary.complete).length;
  const nextModule = activeLevel.modules.find((module) => !completedModules[module.id]);
  const activePlaybook = labPlaybooks[activeLevel.id] ?? labPlaybooks.beginner;
  const activeLabSteps = activePlaybook.steps;
  const completedLabSteps = activeLabSteps.filter((step) => labChecks[`${activeLevel.id}:${step.id}`]).length;
  const labProgressPercent =
    activeLabSteps.length > 0 ? Math.round((completedLabSteps / activeLabSteps.length) * 100) : 0;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Browser storage is unavailable during SSR, so saved progress is restored after mount.
    try {
      const rawProgress = window.localStorage.getItem(STORAGE_KEY);

      if (rawProgress) {
        const parsed = JSON.parse(rawProgress) as ProgressSnapshot;
        const savedLevelExists = content.levels.some((level) => level.id === parsed.levelId);

        setAnswers(parsed.answers ?? {});
        setCompletedModules(parsed.completedModules ?? {});
        setLabChecks(parsed.labChecks ?? {});
        setSubmittedLevels(parsed.submittedLevels ?? {});

        if (savedLevelExists && parsed.levelId) {
          setLevelId(parsed.levelId);
        }

        if (isLocale(parsed.locale)) {
          setLocale(parsed.locale);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasLoadedProgress(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (!hasLoadedProgress) {
      return;
    }

    const snapshot: ProgressSnapshot = {
      answers,
      completedModules,
      labChecks,
      levelId,
      locale,
      submittedLevels
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [answers, completedModules, hasLoadedProgress, labChecks, levelId, locale, submittedLevels]);

  function selectLevel(nextLevelId: string) {
    setLevelId(nextLevelId);
  }

  function selectAnswer(questionId: string, answerIndex: number) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answerIndex
    }));
  }

  function submitQuiz() {
    if (unanswered > 0) {
      return;
    }

    setSubmittedLevels((current) => ({
      ...current,
      [activeLevel.id]: true
    }));
  }

  function resetQuiz() {
    const nextAnswers = { ...answers };

    for (const question of activeLevel.quiz) {
      delete nextAnswers[question.id];
    }

    setAnswers(nextAnswers);
    setSubmittedLevels((current) => ({
      ...current,
      [activeLevel.id]: false
    }));
  }

  function resetAllProgress() {
    setAnswers({});
    setCompletedModules({});
    setLabChecks({});
    setSubmittedLevels({});
  }

  function toggleModule(moduleId: string) {
    setCompletedModules((current) => ({
      ...current,
      [moduleId]: !current[moduleId]
    }));
  }

  function toggleLabStep(stepId: string) {
    const key = `${activeLevel.id}:${stepId}`;

    setLabChecks((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  function resetLabSteps() {
    setLabChecks((current) => {
      const next = { ...current };

      for (const step of activeLabSteps) {
        delete next[`${activeLevel.id}:${step.id}`];
      }

      return next;
    });
  }

  async function copyCommand(commandId: string, command: string) {
    let copied = false;

    try {
      await navigator.clipboard.writeText(command);
      copied = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = command;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    if (copied) {
      setCopiedCommandId(commandId);
      window.setTimeout(() => setCopiedCommandId(null), 1400);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label={text(content.meta.title[locale])}>
          <span className="brand-mark" aria-hidden="true">
            <Cloud size={20} strokeWidth={2.5} />
          </span>
          <span className="brand-copy">
            <span>{t.academy}</span>
            <strong>{text(content.meta.title[locale])}</strong>
          </span>
        </div>

        <div className="toolbar">
          <div className="readiness-chip" aria-label={`${t.readiness}: ${readiness}%`}>
            <Gauge size={16} aria-hidden="true" />
            <span>{readiness}%</span>
          </div>
          <span className="toolbar-label">{t.language}</span>
          <div className="segmented" aria-label={t.language}>
            <button
              type="button"
              aria-pressed={locale === "fr"}
              data-active={locale === "fr"}
              onClick={() => setLocale("fr")}
            >
              FR
            </button>
            <button
              type="button"
              aria-pressed={locale === "en"}
              data-active={locale === "en"}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" aria-label={t.chooseLevel}>
          <div className="sidebar-header">
            <p className="sidebar-title">{t.studyPlan}</p>
            <span className="sidebar-count">
              {completedLevels}/{content.levels.length}
            </span>
          </div>

          <nav className="level-nav">
            {content.levels.map((level) => {
              const summary = levelSummaries.find((item) => item.id === level.id);
              const isActive = level.id === activeLevel.id;
              const isComplete = Boolean(summary?.complete);

              return (
                <button
                  className="level-button"
                  data-active={isActive}
                  data-complete={isComplete}
                  aria-current={isActive ? "step" : undefined}
                  key={level.id}
                  onClick={() => selectLevel(level.id)}
                  type="button"
                >
                  <span className="level-index">{level.rank}</span>
                  <span className="level-copy">
                    <strong>{text(level.name[locale])}</strong>
                    <span>{text(level.duration[locale])}</span>
                  </span>
                  {isComplete ? (
                    <CheckCircle2 className="level-icon" size={18} aria-hidden="true" />
                  ) : (
                    <ChevronRight className="level-icon" size={18} aria-hidden="true" />
                  )}
                  <span className="level-progress" aria-hidden="true">
                    <span style={{ width: `${summary?.progress ?? 0}%` }} />
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="sidebar-metrics" aria-label={t.progress}>
            <div>
              <span>{t.modules}</span>
              <strong>
                {completedModuleCount}/{totalModules}
              </strong>
            </div>
            <div>
              <span>{t.quiz}</span>
              <strong>
                {correctAnswers}/{totalQuestions}
              </strong>
            </div>
          </div>
        </aside>

        <main className="main">
          <section className="hero" aria-labelledby="page-title">
            <div className="hero-copy">
              <p className="eyebrow">
                <ShieldCheck size={15} aria-hidden="true" />
                Google Cloud Network Engineering
              </p>
              <h1 id="page-title">{text(content.meta.title[locale])}</h1>
              <p className="lead">{text(content.meta.subtitle[locale])}</p>

              <div className="hero-actions">
                <a className="primary-link" href="#modules">
                  <Layers3 size={17} aria-hidden="true" />
                  {t.modules}
                </a>
                <a className="secondary-link" href="#quiz">
                  <ClipboardCheck size={17} aria-hidden="true" />
                  {t.quiz}
                </a>
              </div>
            </div>

            <div className="status-panel" aria-label={t.progress} aria-live="polite">
              <div className="topology-card" aria-label={t.topology}>
                <span className="topology-title">{t.topology}</span>
                <div className="topology-map" aria-hidden="true">
                  <span className="topology-line line-one" />
                  <span className="topology-line line-two" />
                  <span className="node node-dns">DNS</span>
                  <span className="node node-cdn">CDN</span>
                  <span className="node node-lb">LB</span>
                  <span className="node node-vpc">VPC</span>
                  <span className="node node-iam">IAM</span>
                </div>
              </div>

              <div className="metric-grid">
                <div className="metric">
                  <span>{t.level}</span>
                  <strong>{text(activeLevel.name[locale])}</strong>
                </div>
                <div className="metric">
                  <span>{t.duration}</span>
                  <strong>{text(activeLevel.duration[locale])}</strong>
                </div>
                <div className="metric metric-accent">
                  <span>{t.mastery}</span>
                  <strong>{currentSummary?.progress ?? 0}%</strong>
                </div>
                <div className="metric">
                  <span>{t.labCoach}</span>
                  <strong>{labProgressPercent}%</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="objective-section" aria-labelledby="objective-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  <Target size={15} aria-hidden="true" />
                  {t.objective}
                </p>
                <h2 id="objective-title">{text(activeLevel.name[locale])}</h2>
              </div>
              {activeLevel.id === "beginner" ? (
                <span className="pill">{t.beginnerPath}</span>
              ) : null}
            </div>
            <p>{text(activeLevel.goal[locale])}</p>
            <div className="source-strip">
              <BookOpenCheck size={18} aria-hidden="true" />
              <span>{text(content.meta.sourceNote[locale])}</span>
            </div>
          </section>

          <section className="dashboard-strip" aria-label={t.progress}>
            <div className="dashboard-card">
              <Clock3 size={20} aria-hidden="true" />
              <span>{t.nextFocus}</span>
              <strong>{nextModule ? text(nextModule.title[locale]) : t.emptyFocus}</strong>
            </div>
            <div className="dashboard-card">
              <GraduationCap size={20} aria-hidden="true" />
              <span>{t.modules}</span>
              <strong>
                {currentSummary?.moduleDone ?? 0}/{activeLevel.modules.length} {t.completed}
              </strong>
            </div>
            <div className="dashboard-card">
              <Trophy size={20} aria-hidden="true" />
              <span>{t.score}</span>
              <strong>
                {currentSubmitted
                  ? `${scorePercent}% - ${scorePercent >= 70 ? t.pass : t.improve}`
                  : `${answeredCurrent}/${activeLevel.quiz.length} ${t.answered}`}
              </strong>
            </div>
          </section>

          <section className="content-section lab-coach-section" aria-labelledby="lab-coach-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  <ShieldCheck size={15} aria-hidden="true" />
                  {t.labCoach}
                </p>
                <h2 id="lab-coach-title">{text(activePlaybook.title[locale])}</h2>
                <p>{text(activePlaybook.brief[locale])}</p>
              </div>
              <span className="section-progress">
                {completedLabSteps}/{activeLabSteps.length}
              </span>
            </div>

            <div className="lab-coach-grid">
              <div className="lab-checklist" aria-label={t.labSteps}>
                <div className="lab-progress">
                  <span>
                    {labProgressPercent === 100 ? t.labComplete : t.labInProgress}
                  </span>
                  <strong>{labProgressPercent}%</strong>
                  <span className="lab-progress-track" aria-hidden="true">
                    <span style={{ width: `${labProgressPercent}%` }} />
                  </span>
                </div>

                <ol className="lab-step-list">
                  {activeLabSteps.map((step, stepIndex) => {
                    const stepKey = `${activeLevel.id}:${step.id}`;
                    const isDone = Boolean(labChecks[stepKey]);

                    return (
                      <li key={step.id}>
                        <button
                          className="lab-step"
                          data-complete={isDone}
                          type="button"
                          aria-pressed={isDone}
                          aria-label={isDone ? t.markStepOpen : t.markStepDone}
                          onClick={() => toggleLabStep(step.id)}
                        >
                          <span className="lab-step-index" aria-hidden="true">
                            {isDone ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              String(stepIndex + 1).padStart(2, "0")
                            )}
                          </span>
                          <span>
                            <strong>{text(step.title[locale])}</strong>
                            <span>{text(step.detail[locale])}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="command-panel" aria-label={t.commands}>
                <div className="command-panel-header">
                  <span>{t.commands}</span>
                  <button className="ghost-button compact-button" type="button" onClick={resetLabSteps}>
                    <RotateCcw size={16} aria-hidden="true" />
                    {t.resetLab}
                  </button>
                </div>

                {activePlaybook.commands.map((snippet) => {
                  const commandKey = `${activeLevel.id}:${snippet.id}`;

                  return (
                    <div className="command-row" key={snippet.id}>
                      <div>
                        <span>{text(snippet.label[locale])}</span>
                        <code>{snippet.command}</code>
                      </div>
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        onClick={() => copyCommand(commandKey, snippet.command)}
                      >
                        <ClipboardCheck size={16} aria-hidden="true" />
                        {copiedCommandId === commandKey ? t.copied : t.copyCommand}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="content-section" id="modules" aria-labelledby="modules-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  <Layers3 size={15} aria-hidden="true" />
                  {t.modules}
                </p>
                <h2 id="modules-title">
                  {activeLevel.modules.length} {t.modules.toLowerCase()}
                </h2>
              </div>
              <span className="section-progress">
                {currentSummary?.modulePercent ?? 0}%
              </span>
            </div>

            <div className="module-grid">
              {activeLevel.modules.map((module) => {
                const isDone = Boolean(completedModules[module.id]);

                return (
                  <article className="module-card" data-complete={isDone} key={module.id}>
                    <div className="module-card-header">
                      <div>
                        <span className="module-state">
                          {isDone ? t.moduleDone : t.moduleOpen}
                        </span>
                        <h3>{text(module.title[locale])}</h3>
                      </div>
                      <button
                        className="icon-toggle"
                        type="button"
                        aria-pressed={isDone}
                        aria-label={isDone ? t.markUndone : t.markDone}
                        title={isDone ? t.markUndone : t.markDone}
                        onClick={() => toggleModule(module.id)}
                      >
                        {isDone ? (
                          <CheckCircle2 size={22} aria-hidden="true" />
                        ) : (
                          <Circle size={22} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <p>{text(module.summary[locale])}</p>

                    <div className="module-meta">
                      <span className="tag">{t.keyPoints}</span>
                      <span className="tag tag-green">{t.practice}</span>
                    </div>

                    <ul className="key-list">
                      {module.keyPoints[locale].map((point) => (
                        <li key={point}>{text(point)}</li>
                      ))}
                    </ul>

                    <div className="lab-box">
                      <strong>{t.practice}</strong>
                      <span>{text(module.practice[locale])}</span>
                    </div>

                    <ol className="tip-list">
                      {module.tips[locale].map((tip) => (
                        <li key={tip}>{text(tip)}</li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="quiz-panel" id="quiz" aria-labelledby="quiz-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  <ClipboardCheck size={15} aria-hidden="true" />
                  {t.quiz}
                </p>
                <h2 id="quiz-title">{text(activeLevel.name[locale])}</h2>
                <p>{t.quizIntro}</p>
              </div>
              <div className="score-card">
                <span>{t.score}</span>
                <strong>
                  {currentSubmitted ? `${score}/${activeLevel.quiz.length}` : "--"}
                </strong>
              </div>
            </div>

            <div className="quiz-status" data-ready={unanswered === 0}>
              {unanswered === 0 ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : (
                <Clock3 size={18} aria-hidden="true" />
              )}
              <span>
                {unanswered === 0 ? t.quizReady : `${unanswered} ${t.unanswered}`}
              </span>
            </div>

            {activeLevel.quiz.map((question, questionIndex) => (
              <div className="question" key={question.id}>
                <p className="question-title">
                  {questionIndex + 1}. {text(question.question[locale])}
                </p>
                <div className="answers">
                  {question.options[locale].map((option, optionIndex) => {
                    const state = getAnswerState(
                      answers[question.id],
                      currentSubmitted,
                      optionIndex,
                      question.answer
                    );
                    const isPressed = answers[question.id] === optionIndex;

                    return (
                      <button
                        className="answer"
                        data-state={state}
                        aria-pressed={isPressed}
                        key={option}
                        onClick={() => selectAnswer(question.id, optionIndex)}
                        type="button"
                      >
                        <span className="answer-mark" aria-hidden="true">
                          {state === "correct" ? (
                            <CheckCircle2 size={17} />
                          ) : state === "wrong" ? (
                            <XCircle size={17} />
                          ) : (
                            <Circle size={17} />
                          )}
                        </span>
                        <span>{text(option)}</span>
                      </button>
                    );
                  })}
                </div>
                {currentSubmitted ? (
                  <p className="explanation">{text(question.explanation[locale])}</p>
                ) : null}
              </div>
            ))}

            <div className="quiz-actions">
              <button
                className="primary-button"
                disabled={unanswered > 0}
                onClick={submitQuiz}
                type="button"
              >
                <ClipboardCheck size={18} aria-hidden="true" />
                {t.answer}
              </button>
              <button className="secondary-button" onClick={resetQuiz} type="button">
                <RotateCcw size={18} aria-hidden="true" />
                {t.reset}
              </button>
              <button className="ghost-button" onClick={resetAllProgress} type="button">
                {t.resetAll}
              </button>
              <span className="score-summary" aria-live="polite">
                {currentSubmitted
                  ? `${scorePercent}% - ${scorePercent >= 70 ? t.pass : t.improve}`
                  : t.lockedScore}
              </span>
            </div>
          </section>

          <section className="content-section capstone-section" aria-labelledby="capstone-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  <Globe2 size={15} aria-hidden="true" />
                  {t.capstone}
                </p>
                <h2 id="capstone-title">{text(content.capstone.title[locale])}</h2>
              </div>
              <span className="pill">{t.checkpoint}</span>
            </div>
            <p>{text(content.capstone.brief[locale])}</p>
            <h3>{t.deliverables}</h3>
            <ul className="deliverable-list">
              {content.capstone.deliverables[locale].map((deliverable) => (
                <li key={deliverable}>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  <span>{text(deliverable)}</span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
}
