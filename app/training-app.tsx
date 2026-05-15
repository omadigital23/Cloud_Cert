"use client";

import {
  Award,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock3,
  Cloud,
  Database,
  Download,
  Gauge,
  Globe2,
  GraduationCap,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Medal,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  XCircle
} from "lucide-react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import training from "../data/training.json";
import { createClient, hasSupabaseConfig } from "../lib/supabase/client";

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
  moduleId?: string;
  submittedModuleQuizzes?: Record<string, boolean>;
  submittedLevels?: Record<string, boolean>;
};

type AuthMode = "signIn" | "signUp";

type CloudProfile = {
  certificate_issued_at: string | null;
  display_name: string | null;
  points: number;
  progress: ProgressSnapshot;
  user_id: string;
};

type DashboardStats = {
  certificateReady: boolean;
  completedLabSteps: number;
  completedLevels: number;
  completedModuleCount: number;
  correctAnswers: number;
  levelCount: number;
  points: number;
  readiness: number;
  totalLabSteps: number;
  totalModules: number;
  totalQuestions: number;
};

const STORAGE_KEY = "cloud-cert-progress-v2";
const MODULE_PASS_PERCENT = 70;

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
    module: "Module",
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
    labInProgress: "Lab en cours",
    lesson: "Cours",
    moduleQuiz: "Quiz du module",
    modulePassed: "Module réussi",
    moduleFailed: "Score insuffisant",
    moduleLocked: "Module verrouillé",
    passRequired: "Réussite requise: 70%",
    nextModule: "Module suivant",
    nextLevel: "Niveau suivant",
    retryModule: "Réessayer le module",
    courseFlow: "Parcours guidé",
    concept: "Concept",
    remember: "À retenir",
    apply: "À pratiquer",
    fieldReview: "Terrain",
    currentModule: "Module en cours",
    completedPath: "Niveau terminé",
    signIn: "Se connecter",
    signUp: "Créer un compte",
    signOut: "Déconnexion",
    email: "Email",
    password: "Mot de passe",
    fullName: "Nom complet",
    authTitle: "Espace apprenant Cloud Cert",
    authSubtitle:
      "Crée ton compte, reprends tes cours sur n'importe quel appareil et télécharge ton certificat quand le parcours est terminé.",
    continueLocal: "Continuer en mode local",
    localMode: "Mode local",
    cloudMode: "Session cloud",
    cloudSync: "Synchronisation cloud",
    cloudReady: "Sauvegardé",
    cloudMissing: "Supabase non configuré",
    authRequired: "Connecte-toi pour sauvegarder ta progression dans Supabase.",
    authSwitchSignIn: "Déjà un compte ? Se connecter",
    authSwitchSignUp: "Nouveau ? Créer un compte",
    dashboard: "Dashboard",
    learner: "Apprenant",
    points: "Points",
    badges: "Badges",
    certificate: "Certificat",
    downloadCertificate: "Télécharger le certificat",
    certificateLocked: "Certificat verrouillé",
    certificateReady: "Certificat prêt",
    certificateRule: "Débloqué quand tous les niveaux, quiz et labs sont validés.",
    profile: "Profil",
    account: "Compte",
    startLearning: "Accéder au parcours",
    worldClass: "Norme classe mondiale",
    supabaseVercel: "Supabase + Vercel ready",
    saveError: "Erreur de sauvegarde",
    welcomeBack: "Progression restaurée",
    accountCreated: "Compte créé. Connecte-toi maintenant.",
    cloudHint: "Ajoute tes variables Supabase sur Vercel pour activer les comptes réels.",
    today: "Aujourd'hui",
    issuedTo: "Décerné à",
    verifyId: "ID certificat"
  },
  en: {
    academy: "Cloud Cert",
    language: "Language",
    level: "Level",
    duration: "Duration",
    modules: "Modules",
    module: "Module",
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
    labInProgress: "Lab in progress",
    lesson: "Lesson",
    moduleQuiz: "Module quiz",
    modulePassed: "Module passed",
    moduleFailed: "Score too low",
    moduleLocked: "Module locked",
    passRequired: "Required pass: 70%",
    nextModule: "Next module",
    nextLevel: "Next level",
    retryModule: "Retry module",
    courseFlow: "Guided path",
    concept: "Concept",
    remember: "Remember",
    apply: "Practice",
    fieldReview: "Field review",
    currentModule: "Current module",
    completedPath: "Level complete",
    signIn: "Sign in",
    signUp: "Create account",
    signOut: "Sign out",
    email: "Email",
    password: "Password",
    fullName: "Full name",
    authTitle: "Cloud Cert learner workspace",
    authSubtitle:
      "Create an account, resume lessons on any device, and download your certificate when the path is complete.",
    continueLocal: "Continue in local mode",
    localMode: "Local mode",
    cloudMode: "Cloud session",
    cloudSync: "Cloud sync",
    cloudReady: "Saved",
    cloudMissing: "Supabase not configured",
    authRequired: "Sign in to save progress in Supabase.",
    authSwitchSignIn: "Already have an account? Sign in",
    authSwitchSignUp: "New here? Create account",
    dashboard: "Dashboard",
    learner: "Learner",
    points: "Points",
    badges: "Badges",
    certificate: "Certificate",
    downloadCertificate: "Download certificate",
    certificateLocked: "Certificate locked",
    certificateReady: "Certificate ready",
    certificateRule: "Unlocked when every level, quiz, and lab is completed.",
    profile: "Profile",
    account: "Account",
    startLearning: "Open learning path",
    worldClass: "World-class standard",
    supabaseVercel: "Supabase + Vercel ready",
    saveError: "Save error",
    welcomeBack: "Progress restored",
    accountCreated: "Account created. Sign in now.",
    cloudHint: "Add your Supabase variables on Vercel to enable real accounts.",
    today: "Today",
    issuedTo: "Issued to",
    verifyId: "Certificate ID"
  }
} as const;

const moduleQuizBank: Record<string, Question[]> = {
  "cloud-foundations": [
    {
      id: "cloud-foundations-q1",
      question: {
        fr: "Quel element sert d'unite principale pour activer des API, isoler des ressources et suivre la facturation ?",
        en: "Which element is the main unit for enabling APIs, isolating resources, and tracking billing?"
      },
      options: {
        fr: ["Folder", "Project", "Zone", "Service account"],
        en: ["Folder", "Project", "Zone", "Service account"]
      },
      answer: 1,
      explanation: {
        fr: "Le projet Google Cloud porte les API, les ressources, les IAM bindings et la facturation.",
        en: "The Google Cloud project carries APIs, resources, IAM bindings, and billing."
      }
    },
    {
      id: "cloud-foundations-q2",
      question: {
        fr: "Quel type de role IAM est le plus dangereux s'il est donne trop largement ?",
        en: "Which IAM role type is the riskiest when granted too broadly?"
      },
      options: {
        fr: ["Basic role", "Predefined role", "Custom role", "Conditional role"],
        en: ["Basic role", "Predefined role", "Custom role", "Conditional role"]
      },
      answer: 0,
      explanation: {
        fr: "Les roles basic comme Owner et Editor donnent beaucoup de permissions. Pour la production, prefere des roles plus precis.",
        en: "Basic roles like Owner and Editor grant many permissions. In production, prefer more specific roles."
      }
    },
    {
      id: "cloud-foundations-q3",
      question: {
        fr: "Quelle bonne pratique IAM doit guider les acces d'un apprenant comme d'une equipe production ?",
        en: "Which IAM best practice should guide learner and production access?"
      },
      options: {
        fr: ["Moindre privilege", "Un seul Owner pour tous", "Mots de passe dans le code", "Desactiver les logs"],
        en: ["Least privilege", "One Owner for everyone", "Passwords in code", "Disable logs"]
      },
      answer: 0,
      explanation: {
        fr: "Le moindre privilege limite chaque identite aux permissions strictement necessaires.",
        en: "Least privilege limits each identity to only the permissions it needs."
      }
    }
  ],
  "vpc-basics": [
    {
      id: "vpc-basics-q1",
      question: {
        fr: "Dans Google Cloud, quelle affirmation decrit correctement un VPC ?",
        en: "In Google Cloud, which statement correctly describes a VPC?"
      },
      options: {
        fr: ["Le VPC est regional", "Le VPC est global et les subnets sont regionaux", "Le VPC est une zone", "Le VPC remplace IAM"],
        en: ["The VPC is regional", "The VPC is global and subnets are regional", "The VPC is a zone", "The VPC replaces IAM"]
      },
      answer: 1,
      explanation: {
        fr: "Le reseau VPC est global. Les sous-reseaux appartiennent a des regions.",
        en: "The VPC network is global. Subnets belong to regions."
      }
    },
    {
      id: "vpc-basics-q2",
      question: {
        fr: "Pourquoi la creation d'une VM echoue si aucun VPC n'existe ?",
        en: "Why does VM creation fail if no VPC exists?"
      },
      options: {
        fr: ["La VM n'a pas d'interface reseau disponible", "Debian est indisponible", "Cloud Storage est obligatoire", "Le disque est trop petit"],
        en: ["The VM has no available network interface", "Debian is unavailable", "Cloud Storage is mandatory", "The disk is too small"]
      },
      answer: 0,
      explanation: {
        fr: "Une VM Compute Engine a besoin d'une interface rattachee a un reseau et a un sous-reseau.",
        en: "A Compute Engine VM needs an interface attached to a network and subnet."
      }
    },
    {
      id: "vpc-basics-q3",
      question: {
        fr: "Quelle regle permet le ping vers une IP externe quand le lab cree mynetwork ?",
        en: "Which rule allows ping to an external IP when the lab creates mynetwork?"
      },
      options: {
        fr: ["mynetwork-allow-ssh", "mynetwork-allow-icmp", "mynetwork-allow-rdp", "mynetwork-allow-custom"],
        en: ["mynetwork-allow-ssh", "mynetwork-allow-icmp", "mynetwork-allow-rdp", "mynetwork-allow-custom"]
      },
      answer: 1,
      explanation: {
        fr: "Le ping utilise ICMP. La regle allow-icmp autorise ce trafic depuis Internet.",
        en: "Ping uses ICMP. The allow-icmp rule allows that traffic from the internet."
      }
    }
  ],
  "compute-and-storage": [
    {
      id: "compute-and-storage-q1",
      question: {
        fr: "Quel service fournit des machines virtuelles configurables ?",
        en: "Which service provides configurable virtual machines?"
      },
      options: {
        fr: ["Compute Engine", "Cloud Storage", "Cloud SQL", "Cloud DNS"],
        en: ["Compute Engine", "Cloud Storage", "Cloud SQL", "Cloud DNS"]
      },
      answer: 0,
      explanation: {
        fr: "Compute Engine fournit des VM avec machine type, disque, image, reseau et options de securite.",
        en: "Compute Engine provides VMs with machine type, disk, image, network, and security options."
      }
    },
    {
      id: "compute-and-storage-q2",
      question: {
        fr: "Cloud Storage est surtout adapte a quel type de stockage ?",
        en: "Cloud Storage is mainly suited for which storage model?"
      },
      options: {
        fr: ["Stockage objet", "Base SQL relationnelle", "Regles firewall", "Secrets applicatifs"],
        en: ["Object storage", "Relational SQL database", "Firewall rules", "Application secrets"]
      },
      answer: 0,
      explanation: {
        fr: "Cloud Storage stocke des objets: fichiers, images, backups, archives et datasets.",
        en: "Cloud Storage stores objects: files, images, backups, archives, and datasets."
      }
    },
    {
      id: "compute-and-storage-q3",
      question: {
        fr: "Quelle pratique est plus sure que mettre un mot de passe Cloud SQL dans index.php ?",
        en: "Which practice is safer than putting a Cloud SQL password in index.php?"
      },
      options: {
        fr: ["Secret Manager", "Une IP externe", "Un role Viewer", "Un snapshot schedule"],
        en: ["Secret Manager", "An external IP", "A Viewer role", "A snapshot schedule"]
      },
      answer: 0,
      explanation: {
        fr: "Secret Manager separe les secrets du code et facilite la rotation.",
        en: "Secret Manager separates secrets from code and makes rotation easier."
      }
    }
  ],
  "firewall-identity": [
    {
      id: "firewall-identity-q1",
      question: {
        fr: "Quel ciblage est plus robuste que des IP pour autoriser des flux entre microservices sur VM ?",
        en: "Which targeting model is more robust than IPs for allowing flows between VM microservices?"
      },
      options: {
        fr: ["Service accounts", "Noms de disque", "Regions", "Snapshots"],
        en: ["Service accounts", "Disk names", "Regions", "Snapshots"]
      },
      answer: 0,
      explanation: {
        fr: "Les service accounts representent l'identite du workload et restent utiles quand les IP changent.",
        en: "Service accounts represent workload identity and remain useful when IPs change."
      }
    },
    {
      id: "firewall-identity-q2",
      question: {
        fr: "Dans une regle ingress, quelle information decrit le service ecoute ?",
        en: "In an ingress rule, which information describes the listening service?"
      },
      options: {
        fr: ["Protocole et port", "Nom du bucket", "Taille du disque", "Project number"],
        en: ["Protocol and port", "Bucket name", "Disk size", "Project number"]
      },
      answer: 0,
      explanation: {
        fr: "Une regle ingress autorise un protocole et un port vers une cible precise.",
        en: "An ingress rule allows a protocol and port toward a specific target."
      }
    }
  ],
  "load-balancing-cdn-dns": [
    {
      id: "load-balancing-cdn-dns-q1",
      question: {
        fr: "Quel composant distribue le trafic vers des backends sains ?",
        en: "Which component distributes traffic to healthy backends?"
      },
      options: {
        fr: ["Load balancer", "Cloud SQL", "Secret Manager", "Snapshot"],
        en: ["Load balancer", "Cloud SQL", "Secret Manager", "Snapshot"]
      },
      answer: 0,
      explanation: {
        fr: "Le load balancer oriente le trafic vers les backends disponibles selon les health checks.",
        en: "The load balancer routes traffic to available backends based on health checks."
      }
    },
    {
      id: "load-balancing-cdn-dns-q2",
      question: {
        fr: "Quel service rapproche les contenus caches des utilisateurs ?",
        en: "Which service brings cached content closer to users?"
      },
      options: {
        fr: ["Cloud CDN", "Cloud VPN", "Cloud NAT", "Cloud IDS"],
        en: ["Cloud CDN", "Cloud VPN", "Cloud NAT", "Cloud IDS"]
      },
      answer: 0,
      explanation: {
        fr: "Cloud CDN met en cache le contenu edge pour reduire latence et charge backend.",
        en: "Cloud CDN caches content at the edge to reduce latency and backend load."
      }
    }
  ],
  "gke-run-serverless": [
    {
      id: "gke-run-serverless-q1",
      question: {
        fr: "Quel service execute des conteneurs sans gerer de cluster Kubernetes ?",
        en: "Which service runs containers without managing a Kubernetes cluster?"
      },
      options: {
        fr: ["Cloud Run", "GKE Standard", "Cloud DNS", "Cloud Router"],
        en: ["Cloud Run", "GKE Standard", "Cloud DNS", "Cloud Router"]
      },
      answer: 0,
      explanation: {
        fr: "Cloud Run execute des conteneurs serverless avec scaling automatique.",
        en: "Cloud Run runs serverless containers with automatic scaling."
      }
    },
    {
      id: "gke-run-serverless-q2",
      question: {
        fr: "Quel service est le bon choix quand il faut controler finement Kubernetes ?",
        en: "Which service is the right choice when you need fine Kubernetes control?"
      },
      options: {
        fr: ["GKE", "Cloud Storage", "Cloud CDN", "Cloud SQL"],
        en: ["GKE", "Cloud Storage", "Cloud CDN", "Cloud SQL"]
      },
      answer: 0,
      explanation: {
        fr: "GKE fournit Kubernetes manage avec controle des workloads, services, ingress et policies.",
        en: "GKE provides managed Kubernetes with control over workloads, services, ingress, and policies."
      }
    }
  ],
  "hybrid-connectivity": [
    {
      id: "hybrid-connectivity-q1",
      question: {
        fr: "Quel produit cree un tunnel chiffre entre un reseau on-prem et Google Cloud ?",
        en: "Which product creates an encrypted tunnel between on-prem and Google Cloud?"
      },
      options: {
        fr: ["Cloud VPN", "Cloud CDN", "Cloud SQL", "Cloud Storage"],
        en: ["Cloud VPN", "Cloud CDN", "Cloud SQL", "Cloud Storage"]
      },
      answer: 0,
      explanation: {
        fr: "Cloud VPN fournit une connectivite IPsec chiffree.",
        en: "Cloud VPN provides encrypted IPsec connectivity."
      }
    },
    {
      id: "hybrid-connectivity-q2",
      question: {
        fr: "Quel composant echange des routes dynamiques avec BGP ?",
        en: "Which component exchanges dynamic routes with BGP?"
      },
      options: {
        fr: ["Cloud Router", "Cloud Armor", "Cloud CDN", "Cloud SQL"],
        en: ["Cloud Router", "Cloud Armor", "Cloud CDN", "Cloud SQL"]
      },
      answer: 0,
      explanation: {
        fr: "Cloud Router apprend et annonce des routes avec BGP pour VPN ou Interconnect.",
        en: "Cloud Router learns and advertises routes with BGP for VPN or Interconnect."
      }
    }
  ],
  "hybrid-dns": [
    {
      id: "hybrid-dns-q1",
      question: {
        fr: "Quel besoin justifie une configuration DNS hybride ?",
        en: "Which need justifies hybrid DNS configuration?"
      },
      options: {
        fr: ["Resoudre des noms entre on-prem et VPC", "Augmenter la RAM d'une VM", "Creer un bucket", "Changer une image disque"],
        en: ["Resolve names between on-prem and VPC", "Increase VM RAM", "Create a bucket", "Change a disk image"]
      },
      answer: 0,
      explanation: {
        fr: "Le DNS hybride permet aux environnements connectes de resoudre les noms necessaires.",
        en: "Hybrid DNS lets connected environments resolve the names they need."
      }
    },
    {
      id: "hybrid-dns-q2",
      question: {
        fr: "Quelle erreur est frequente dans un design DNS hybride ?",
        en: "Which mistake is common in hybrid DNS design?"
      },
      options: {
        fr: ["Boucles de forwarding", "Trop de labels sur VM", "Disque trop grand", "Pas de snapshot schedule"],
        en: ["Forwarding loops", "Too many VM labels", "Disk too large", "No snapshot schedule"]
      },
      answer: 0,
      explanation: {
        fr: "Les boucles DNS provoquent delais, echecs de resolution et comportements difficiles a diagnostiquer.",
        en: "DNS loops cause latency, resolution failures, and hard-to-diagnose behavior."
      }
    }
  ],
  "monitoring-troubleshooting": [
    {
      id: "monitoring-troubleshooting-q1",
      question: {
        fr: "Quel type de preuve aide a comprendre pourquoi un flux reseau est bloque ?",
        en: "Which evidence helps explain why a network flow is blocked?"
      },
      options: {
        fr: ["Firewall logs et routes", "Nom du navigateur", "Couleur du dashboard", "Snapshot du disque"],
        en: ["Firewall logs and routes", "Browser name", "Dashboard color", "Disk snapshot"]
      },
      answer: 0,
      explanation: {
        fr: "Logs firewall, routes et tests de connectivite donnent une preuve exploitable.",
        en: "Firewall logs, routes, and connectivity tests provide actionable evidence."
      }
    },
    {
      id: "monitoring-troubleshooting-q2",
      question: {
        fr: "Que dois-tu verifier avant d'accuser l'application ?",
        en: "What should you verify before blaming the application?"
      },
      options: {
        fr: ["DNS, routes, firewall et health checks", "La police de caractere", "Le nom du projet", "Le logo"],
        en: ["DNS, routes, firewall, and health checks", "The font", "The project name", "The logo"]
      },
      answer: 0,
      explanation: {
        fr: "Un incident reseau se diagnostique par couches: resolution, routage, filtrage, backend.",
        en: "A network incident is diagnosed by layers: resolution, routing, filtering, backend."
      }
    }
  ],
  "edge-security": [
    {
      id: "edge-security-q1",
      question: {
        fr: "Quel produit protege des applications HTTP(S) avec politiques WAF ?",
        en: "Which product protects HTTP(S) applications with WAF policies?"
      },
      options: {
        fr: ["Cloud Armor", "Cloud NAT", "Cloud SQL", "Cloud Storage"],
        en: ["Cloud Armor", "Cloud NAT", "Cloud SQL", "Cloud Storage"]
      },
      answer: 0,
      explanation: {
        fr: "Cloud Armor applique des politiques edge, y compris des regles WAF et anti-DDoS.",
        en: "Cloud Armor applies edge policies, including WAF and anti-DDoS rules."
      }
    },
    {
      id: "edge-security-q2",
      question: {
        fr: "Ou places-tu idealement une protection WAF pour une application publique ?",
        en: "Where do you ideally place WAF protection for a public application?"
      },
      options: {
        fr: ["Devant le load balancer HTTP(S)", "Dans le fichier README", "Sur le disque boot", "Dans Cloud SQL"],
        en: ["In front of the HTTP(S) load balancer", "In the README", "On the boot disk", "Inside Cloud SQL"]
      },
      answer: 0,
      explanation: {
        fr: "La protection edge filtre avant que le trafic atteigne les backends.",
        en: "Edge protection filters before traffic reaches backends."
      }
    }
  ],
  "egress-nat-inspection": [
    {
      id: "egress-nat-inspection-q1",
      question: {
        fr: "Quel service donne une sortie Internet aux VM privees sans IP externe ?",
        en: "Which service gives internet egress to private VMs without external IPs?"
      },
      options: {
        fr: ["Cloud NAT", "Cloud CDN", "Cloud SQL", "Cloud DNS public zone"],
        en: ["Cloud NAT", "Cloud CDN", "Cloud SQL", "Cloud DNS public zone"]
      },
      answer: 0,
      explanation: {
        fr: "Cloud NAT permet l'egress sortant sans exposer directement les VM.",
        en: "Cloud NAT allows outbound egress without directly exposing VMs."
      }
    },
    {
      id: "egress-nat-inspection-q2",
      question: {
        fr: "Quel service aide a detecter du trafic suspect dans le reseau ?",
        en: "Which service helps detect suspicious network traffic?"
      },
      options: {
        fr: ["Cloud IDS", "Cloud Run", "Cloud Storage", "Cloud SQL"],
        en: ["Cloud IDS", "Cloud Run", "Cloud Storage", "Cloud SQL"]
      },
      answer: 0,
      explanation: {
        fr: "Cloud IDS inspecte le trafic pour detecter des menaces et anomalies.",
        en: "Cloud IDS inspects traffic to detect threats and anomalies."
      }
    }
  ],
  governance: [
    {
      id: "governance-q1",
      question: {
        fr: "Quel outil applique des politiques firewall a plusieurs projets ou dossiers ?",
        en: "Which tool applies firewall policies across multiple projects or folders?"
      },
      options: {
        fr: ["Hierarchical firewall policies", "Un seul tag reseau", "Un bucket public", "Une VM bastion unique"],
        en: ["Hierarchical firewall policies", "One network tag", "A public bucket", "A single bastion VM"]
      },
      answer: 0,
      explanation: {
        fr: "Les hierarchical firewall policies permettent une gouvernance centrale a l'echelle de l'organisation.",
        en: "Hierarchical firewall policies enable central governance at organization scale."
      }
    },
    {
      id: "governance-q2",
      question: {
        fr: "Quel objectif de gouvernance reduit les exceptions dangereuses ?",
        en: "Which governance goal reduces dangerous exceptions?"
      },
      options: {
        fr: ["Standards communs et audit", "Des regles manuelles partout", "Des Owner par defaut", "Pas de logs"],
        en: ["Common standards and audit", "Manual rules everywhere", "Default Owners", "No logs"]
      },
      answer: 0,
      explanation: {
        fr: "Des standards communs, des logs et des revues regulieres reduisent les ecarts.",
        en: "Common standards, logs, and regular reviews reduce drift."
      }
    }
  ]
};

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

function getModuleQuiz(module: Module) {
  return moduleQuizBank[module.id] ?? [];
}

function getModuleScore(module: Module, answers: Record<string, number>) {
  const quiz = getModuleQuiz(module);
  const correct = quiz.reduce((total, question) => {
    return total + (answers[question.id] === question.answer ? 1 : 0);
  }, 0);

  return {
    correct,
    percent: quiz.length > 0 ? Math.round((correct / quiz.length) * 100) : 0,
    total: quiz.length
  };
}

function getFirstAvailableModule(level: Level, completedModules: Record<string, boolean>) {
  return (
    level.modules.find((module, index) => {
      return index === 0 || level.modules.slice(0, index).every((item) => completedModules[item.id]);
    }) ?? level.modules[0]
  );
}

function isModuleUnlocked(level: Level, moduleIndex: number, completedModules: Record<string, boolean>) {
  return (
    moduleIndex === 0 ||
    level.modules.slice(0, moduleIndex).every((module) => completedModules[module.id])
  );
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(locale: Locale, date = new Date()) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function buildCertificateId(userId: string | undefined, points: number) {
  const source = `${userId ?? "local"}-${points}-${new Date().getFullYear()}`;
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }

  return `OMA-GC-${Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")}`;
}

function buildCertificateSvg({
  certificateId,
  date,
  displayName,
  locale,
  points,
  readiness
}: {
  certificateId: string;
  date: string;
  displayName: string;
  locale: Locale;
  points: number;
  readiness: number;
}) {
  const safeName = escapeSvg(displayName);
  const title =
    locale === "fr"
      ? "Certificat Cloud Network Engineer"
      : "Cloud Network Engineer Certificate";
  const subtitle =
    locale === "fr"
      ? "Parcours Google Cloud validé avec labs, quiz et projet final"
      : "Google Cloud path completed with labs, quizzes, and final project";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07111f"/>
      <stop offset="52%" stop-color="#0d2346"/>
      <stop offset="100%" stop-color="#0b5c83"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff4bf"/>
      <stop offset="48%" stop-color="#d8aa3f"/>
      <stop offset="100%" stop-color="#8a5b13"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.24"/>
    </filter>
  </defs>
  <rect width="1600" height="1100" fill="url(#bg)"/>
  <rect x="70" y="70" width="1460" height="960" rx="36" fill="#f8fbff" filter="url(#softShadow)"/>
  <rect x="100" y="100" width="1400" height="900" rx="28" fill="#ffffff" stroke="#d8aa3f" stroke-width="4"/>
  <rect x="132" y="132" width="1336" height="836" rx="18" fill="none" stroke="#dce6f2" stroke-width="2"/>

  <text x="160" y="205" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="6" fill="#0d2346">OMA DIGITAL</text>
  <g transform="translate(1180 162)">
    <path d="M58 56h95c28 0 51-22 51-50s-23-50-51-50c-8 0-16 2-23 5C117-61 93-76 65-76 27-76-4-45-4-7c0 4 0 8 1 12-26 5-46 28-46 56 0 31 25 56 56 56h51z" transform="scale(.55) translate(92 165)" fill="#ffffff" stroke="#2563eb" stroke-width="9"/>
    <circle cx="82" cy="66" r="13" fill="#34a853"/>
    <circle cx="119" cy="66" r="13" fill="#fbbc05"/>
    <circle cx="156" cy="66" r="13" fill="#ea4335"/>
    <text x="0" y="128" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="800" fill="#1f2937">Google Cloud</text>
  </g>

  <text x="800" y="330" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="64" font-weight="300" fill="#0f172a">${escapeSvg(title)}</text>
  <text x="800" y="390" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#46566c">${escapeSvg(subtitle)}</text>

  <text x="800" y="510" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#64748b">${locale === "fr" ? "Décerné à" : "Issued to"}</text>
  <text x="800" y="590" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="82" font-weight="800" fill="#0d2346">${safeName}</text>
  <rect x="460" y="630" width="680" height="3" fill="url(#gold)"/>

  <g transform="translate(290 710)">
    <rect width="270" height="116" rx="18" fill="#f6f9fd" stroke="#dce6f2"/>
    <text x="135" y="46" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="3" fill="#64748b">POINTS</text>
    <text x="135" y="88" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="900" fill="#0d2346">${points}</text>
  </g>
  <g transform="translate(665 710)">
    <rect width="270" height="116" rx="18" fill="#f6f9fd" stroke="#dce6f2"/>
    <text x="135" y="46" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="3" fill="#64748b">MASTERY</text>
    <text x="135" y="88" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="900" fill="#0d2346">${readiness}%</text>
  </g>
  <g transform="translate(1040 710)">
    <rect width="270" height="116" rx="18" fill="#f6f9fd" stroke="#dce6f2"/>
    <text x="135" y="46" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="3" fill="#64748b">DATE</text>
    <text x="135" y="88" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="900" fill="#0d2346">${escapeSvg(date)}</text>
  </g>

  <circle cx="800" cy="905" r="72" fill="url(#gold)"/>
  <circle cx="800" cy="905" r="54" fill="#ffffff" opacity="0.92"/>
  <text x="800" y="919" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="900" fill="#0d2346">GC</text>
  <text x="160" y="945" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#64748b">${escapeSvg(certificateId)}</text>
  <text x="1440" y="945" text-anchor="end" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#64748b">cloudcert.omadigital</text>
</svg>`;
}

export default function LearningApp() {
  const supabase = useMemo(() => createClient(), []);
  const supabaseConfigured = hasSupabaseConfig();
  const [locale, setLocale] = useState<Locale>("fr");
  const [levelId, setLevelId] = useState(content.levels[0].id);
  const [moduleId, setModuleId] = useState(content.levels[0].modules[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [labChecks, setLabChecks] = useState<Record<string, boolean>>({});
  const [submittedModuleQuizzes, setSubmittedModuleQuizzes] = useState<Record<string, boolean>>({});
  const [submittedLevels, setSubmittedLevels] = useState<Record<string, boolean>>({});
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(!supabase);
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [cloudProfile, setCloudProfile] = useState<CloudProfile | null>(null);
  const [hasLoadedCloudProgress, setHasLoadedCloudProgress] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<"idle" | "syncing" | "saved" | "error">("idle");

  const t = copy[locale];

  const activeLevel = useMemo(
    () => content.levels.find((level) => level.id === levelId) ?? content.levels[0],
    [levelId]
  );
  const activeModule = useMemo(() => {
    return activeLevel.modules.find((module) => module.id === moduleId) ?? activeLevel.modules[0];
  }, [activeLevel, moduleId]);
  const activeModuleIndex = activeLevel.modules.findIndex((module) => module.id === activeModule.id);
  const activeModuleQuiz = useMemo(() => getModuleQuiz(activeModule), [activeModule]);

  const text = (value: string) => (locale === "fr" ? polishFrench(value) : value);

  const levelSummaries = useMemo(() => {
    return content.levels.map((level) => {
      const moduleDone = level.modules.filter((module) => completedModules[module.id]).length;
      const moduleQuestions = level.modules.flatMap((module) => getModuleQuiz(module));
      const answered = moduleQuestions.filter((question) => answers[question.id] !== undefined).length;
      const score = moduleQuestions.reduce((total, question) => {
        return total + (answers[question.id] === question.answer ? 1 : 0);
      }, 0);
      const submitted = level.modules.every((module) => submittedModuleQuizzes[module.id]);
      const quizPercent =
        moduleQuestions.length > 0 ? Math.round((score / moduleQuestions.length) * 100) : 0;
      const modulePercent =
        level.modules.length > 0 ? Math.round((moduleDone / level.modules.length) * 100) : 0;
      const complete = moduleDone === level.modules.length;
      const answeredPercent =
        moduleQuestions.length > 0 ? Math.round((answered / moduleQuestions.length) * 100) : 0;
      const progress = Math.round(modulePercent * 0.7 + (submitted ? quizPercent : answeredPercent) * 0.3);

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
  }, [answers, completedModules, submittedModuleQuizzes]);

  const currentSummary =
    levelSummaries.find((summary) => summary.id === activeLevel.id) ?? levelSummaries[0];
  const currentSubmitted = Boolean(submittedModuleQuizzes[activeModule.id]);
  const answeredCurrent = activeModuleQuiz.filter((question) => answers[question.id] !== undefined).length;
  const moduleScore = getModuleScore(activeModule, answers);
  const score = moduleScore.correct;
  const scorePercent = moduleScore.percent;
  const unanswered = activeModuleQuiz.length - answeredCurrent;
  const modulePassed = currentSubmitted && scorePercent >= MODULE_PASS_PERCENT;
  const canGoNextModule = modulePassed;

  const totalModules = content.levels.reduce((total, level) => total + level.modules.length, 0);
  const completedModuleCount = content.levels.reduce((total, level) => {
    return total + level.modules.filter((module) => completedModules[module.id]).length;
  }, 0);
  const totalQuestions = content.levels.reduce((total, level) => {
    return total + level.modules.reduce((moduleTotal, module) => moduleTotal + getModuleQuiz(module).length, 0);
  }, 0);
  const correctAnswers = content.levels.reduce((total, level) => {
    return (
      total +
      level.modules.reduce((moduleTotal, module) => {
        return (
          moduleTotal +
          getModuleQuiz(module).reduce((quizTotal, question) => {
            return quizTotal + (answers[question.id] === question.answer ? 1 : 0);
          }, 0)
        );
      }, 0)
    );
  }, 0);
  const readiness = Math.round(
    (completedModuleCount / totalModules) * 60 + (correctAnswers / totalQuestions) * 40
  );
  const completedLevels = levelSummaries.filter((summary) => summary.complete).length;
  const nextSequentialModule = activeLevel.modules[activeModuleIndex + 1];
  const nextModule = completedModules[activeModule.id]
    ? nextSequentialModule
    : activeModule;
  const activePlaybook = labPlaybooks[activeLevel.id] ?? labPlaybooks.beginner;
  const activeLabSteps = activePlaybook.steps;
  const completedLabSteps = activeLabSteps.filter((step) => labChecks[`${activeLevel.id}:${step.id}`]).length;
  const labProgressPercent =
    activeLabSteps.length > 0 ? Math.round((completedLabSteps / activeLabSteps.length) * 100) : 0;
  const totalLabSteps = content.levels.reduce((total, level) => {
    return total + (labPlaybooks[level.id]?.steps.length ?? 0);
  }, 0);
  const completedTotalLabSteps = content.levels.reduce((total, level) => {
    const playbook = labPlaybooks[level.id];

    if (!playbook) {
      return total;
    }

    return (
      total +
      playbook.steps.filter((step) => labChecks[`${level.id}:${step.id}`]).length
    );
  }, 0);
  const points =
    completedModuleCount * 120 +
    correctAnswers * 80 +
    completedTotalLabSteps * 55 +
    completedLevels * 500 +
    (readiness >= 90 ? 350 : 0);
  const certificateReady =
    completedLevels === content.levels.length &&
    completedModuleCount === totalModules &&
    completedTotalLabSteps === totalLabSteps &&
    readiness >= 90;
  const displayName =
    cloudProfile?.display_name ||
    authName.trim() ||
    user?.email?.split("@")[0] ||
    (locale === "fr" ? "Apprenant Cloud" : "Cloud Learner");
  const certificateId = buildCertificateId(user?.id, points);
  const dashboardStats: DashboardStats = {
    certificateReady,
    completedLabSteps: completedTotalLabSteps,
    completedLevels,
    completedModuleCount,
    correctAnswers,
    levelCount: content.levels.length,
    points,
    readiness,
    totalLabSteps,
    totalModules,
    totalQuestions
  };
  const currentProgressSnapshot = useMemo<ProgressSnapshot>(
    () => ({
      answers,
      completedModules,
      labChecks,
      levelId,
      locale,
      moduleId,
      submittedModuleQuizzes,
      submittedLevels
    }),
    [answers, completedModules, labChecks, levelId, locale, moduleId, submittedModuleQuizzes, submittedLevels]
  );
  const latestSnapshotRef = useRef(currentProgressSnapshot);
  const latestPointsRef = useRef(points);

  useEffect(() => {
    latestSnapshotRef.current = currentProgressSnapshot;
    latestPointsRef.current = points;
  }, [currentProgressSnapshot, points]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Browser storage is unavailable during SSR, so saved progress is restored after mount.
    try {
      const rawProgress = window.localStorage.getItem(STORAGE_KEY);

      if (rawProgress) {
        const parsed = JSON.parse(rawProgress) as ProgressSnapshot;
        const savedLevelExists = content.levels.some((level) => level.id === parsed.levelId);
        const savedModuleExists = content.levels.some((level) => {
          return level.modules.some((module) => module.id === parsed.moduleId);
        });

        setAnswers(parsed.answers ?? {});
        setCompletedModules(parsed.completedModules ?? {});
        setLabChecks(parsed.labChecks ?? {});
        setSubmittedModuleQuizzes(parsed.submittedModuleQuizzes ?? {});
        setSubmittedLevels(parsed.submittedLevels ?? {});

        if (savedLevelExists && parsed.levelId) {
          setLevelId(parsed.levelId);
        }

        if (savedModuleExists && parsed.moduleId) {
          setModuleId(parsed.moduleId);
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

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsSessionReady(true);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsSessionReady(true);
      setIsLocalMode(false);
      setAuthError(null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) {
      setCloudProfile(null);
      setHasLoadedCloudProgress(false);
      return;
    }

    let isActive = true;

    async function loadCloudProgress(client: SupabaseClient, currentUser: User) {
      setCloudStatus("syncing");

      const { data, error } = await client
        .from("cloud_cert_profiles")
        .select("user_id, display_name, progress, points, certificate_issued_at")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!isActive) {
        return;
      }

      if (error) {
        setCloudStatus("error");
        setAuthError(error.message);
        setHasLoadedCloudProgress(true);
        return;
      }

      if (data) {
        const profile = data as CloudProfile;
        const savedProgress = profile.progress ?? {};
        const savedLevelExists = content.levels.some((level) => level.id === savedProgress.levelId);
        const savedModuleExists = content.levels.some((level) => {
          return level.modules.some((module) => module.id === savedProgress.moduleId);
        });

        setCloudProfile(profile);
        setAnswers(savedProgress.answers ?? {});
        setCompletedModules(savedProgress.completedModules ?? {});
        setLabChecks(savedProgress.labChecks ?? {});
        setSubmittedModuleQuizzes(savedProgress.submittedModuleQuizzes ?? {});
        setSubmittedLevels(savedProgress.submittedLevels ?? {});

        if (savedLevelExists && savedProgress.levelId) {
          setLevelId(savedProgress.levelId);
        }

        if (savedModuleExists && savedProgress.moduleId) {
          setModuleId(savedProgress.moduleId);
        }

        if (isLocale(savedProgress.locale)) {
          setLocale(savedProgress.locale);
        }

        setAuthNotice(t.welcomeBack);
      } else {
        const metadataName =
          typeof currentUser.user_metadata?.display_name === "string"
            ? currentUser.user_metadata.display_name
            : null;
        const display = metadataName || currentUser.email?.split("@")[0] || "Cloud learner";

        const { data: inserted, error: insertError } = await client
          .from("cloud_cert_profiles")
          .insert({
            display_name: display,
            points: latestPointsRef.current,
            progress: latestSnapshotRef.current,
            user_id: currentUser.id
          })
          .select("user_id, display_name, progress, points, certificate_issued_at")
          .single();

        if (!isActive) {
          return;
        }

        if (insertError) {
          setCloudStatus("error");
          setAuthError(insertError.message);
          setHasLoadedCloudProgress(true);
          return;
        } else {
          setCloudProfile(inserted as CloudProfile);
          setCloudStatus("saved");
        }
      }

      setHasLoadedCloudProgress(true);
      setCloudStatus("saved");
    }

    void loadCloudProgress(supabase, user);

    return () => {
      isActive = false;
    };
  }, [supabase, t.welcomeBack, user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (!hasLoadedProgress) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProgressSnapshot));
  }, [currentProgressSnapshot, hasLoadedProgress]);

  useEffect(() => {
    if (!supabase || !user || !hasLoadedCloudProgress) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCloudStatus("syncing");

      supabase
        .from("cloud_cert_profiles")
        .upsert({
          certificate_issued_at: certificateReady
            ? cloudProfile?.certificate_issued_at ?? new Date().toISOString()
            : cloudProfile?.certificate_issued_at ?? null,
          display_name: displayName,
          points,
          progress: currentProgressSnapshot,
          user_id: user.id
        })
        .select("user_id, display_name, progress, points, certificate_issued_at")
        .single()
        .then(({ data, error }) => {
          if (error) {
            setCloudStatus("error");
            setAuthError(error.message);
            return;
          }

          setCloudProfile(data as CloudProfile);
          setCloudStatus("saved");
        });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    certificateReady,
    cloudProfile?.certificate_issued_at,
    currentProgressSnapshot,
    displayName,
    hasLoadedCloudProgress,
    points,
    supabase,
    user
  ]);

  function selectLevel(nextLevelId: string) {
    const nextLevel = content.levels.find((level) => level.id === nextLevelId) ?? content.levels[0];

    setLevelId(nextLevel.id);
    setModuleId(getFirstAvailableModule(nextLevel, completedModules).id);
  }

  function selectAnswer(questionId: string, answerIndex: number) {
    if (currentSubmitted) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [questionId]: answerIndex
    }));
  }

  function submitQuiz() {
    if (unanswered > 0) {
      return;
    }

    const passed = scorePercent >= MODULE_PASS_PERCENT;

    setSubmittedModuleQuizzes((current) => ({
      ...current,
      [activeModule.id]: true
    }));
    setCompletedModules((current) => {
      const next = { ...current };

      if (passed) {
        next[activeModule.id] = true;
      } else {
        delete next[activeModule.id];
      }

      return next;
    });
  }

  function resetQuiz() {
    const nextAnswers = { ...answers };

    for (const question of activeModuleQuiz) {
      delete nextAnswers[question.id];
    }

    setAnswers(nextAnswers);
    setSubmittedModuleQuizzes((current) => {
      const next = { ...current };

      delete next[activeModule.id];

      return next;
    });
    setCompletedModules((current) => {
      const next = { ...current };

      delete next[activeModule.id];

      return next;
    });
  }

  function resetAllProgress() {
    setAnswers({});
    setCompletedModules({});
    setLabChecks({});
    setSubmittedModuleQuizzes({});
    setSubmittedLevels({});
    setLevelId(content.levels[0].id);
    setModuleId(content.levels[0].modules[0].id);
  }

  function selectModule(nextModuleId: string) {
    const moduleIndex = activeLevel.modules.findIndex((module) => module.id === nextModuleId);

    if (moduleIndex < 0) {
      return;
    }

    if (!isModuleUnlocked(activeLevel, moduleIndex, completedModules)) {
      return;
    }

    setModuleId(nextModuleId);
  }

  function goToNextModule() {
    if (!canGoNextModule) {
      return;
    }

    if (nextSequentialModule) {
      setModuleId(nextSequentialModule.id);
      return;
    }

    const nextLevel = content.levels.find((level) => level.rank === activeLevel.rank + 1);

    if (nextLevel) {
      setLevelId(nextLevel.id);
      setModuleId(nextLevel.modules[0].id);
    }
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

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !supabaseConfigured) {
      setAuthError(t.cloudHint);
      return;
    }

    setIsAuthBusy(true);
    setAuthError(null);
    setAuthNotice(null);

    const email = authEmail.trim();
    const password = authPassword;

    if (authMode === "signUp") {
      const { data, error } = await supabase.auth.signUp({
        email,
        options: {
          data: {
            display_name: authName.trim() || email.split("@")[0]
          }
        },
        password
      });

      if (error) {
        setAuthError(error.message);
      } else {
        if (data.session) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setCloudProfile(null);
          setHasLoadedCloudProgress(false);
        }

        setAuthMode("signIn");
        setAuthPassword("");
        setAuthNotice(t.accountCreated);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthNotice(t.welcomeBack);
      }
    }

    setIsAuthBusy(false);
  }

  async function signOut() {
    if (!supabase) {
      setIsLocalMode(false);
      return;
    }

    setIsAuthBusy(true);
    await supabase.auth.signOut();
    setCloudProfile(null);
    setHasLoadedCloudProgress(false);
    setIsLocalMode(false);
    setAuthNotice(null);
    setIsAuthBusy(false);
  }

  function downloadCertificate() {
    if (!certificateReady) {
      return;
    }

    const issuedDate = cloudProfile?.certificate_issued_at
      ? new Date(cloudProfile.certificate_issued_at)
      : new Date();
    const svg = buildCertificateSvg({
      certificateId,
      date: formatDate(locale, issuedDate),
      displayName,
      locale,
      points,
      readiness
    });
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${certificateId}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  const cloudLabel =
    cloudStatus === "syncing"
      ? t.cloudSync
      : cloudStatus === "error"
        ? t.saveError
        : session
          ? t.cloudReady
          : isLocalMode
            ? t.localMode
            : t.cloudMissing;
  const authSubmitLabel = authMode === "signIn" ? t.signIn : t.signUp;
  const authSwitchLabel = authMode === "signIn" ? t.authSwitchSignUp : t.authSwitchSignIn;

  if (!session && !isLocalMode) {
    return (
      <div className="app-shell auth-shell">
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

        <main className="auth-layout">
          <section className="auth-value" aria-labelledby="auth-title">
            <p className="eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              {t.worldClass}
            </p>
            <h1 id="auth-title">{t.authTitle}</h1>
            <p className="lead">{t.authSubtitle}</p>

            <div className="auth-feature-grid" aria-label={t.dashboard}>
              <div>
                <BarChart3 size={20} aria-hidden="true" />
                <strong>{t.dashboard}</strong>
                <span>{t.points} / {t.progress} / {t.quiz}</span>
              </div>
              <div>
                <Database size={20} aria-hidden="true" />
                <strong>{t.supabaseVercel}</strong>
                <span>{supabaseConfigured ? t.cloudMode : t.cloudHint}</span>
              </div>
              <div>
                <Award size={20} aria-hidden="true" />
                <strong>{t.certificate}</strong>
                <span>{t.certificateRule}</span>
              </div>
            </div>
          </section>

          <section className="auth-panel" aria-label={t.account}>
            <div className="auth-panel-head">
              <span className="sync-pill" data-state={supabaseConfigured ? "saved" : "error"}>
                {supabaseConfigured ? t.cloudMode : t.cloudMissing}
              </span>
              <h2>{authSubmitLabel}</h2>
              <p>{t.authRequired}</p>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "signUp" ? (
                <label>
                  <span>{t.fullName}</span>
                  <span className="input-shell">
                    <UserRound size={17} aria-hidden="true" />
                    <input
                      autoComplete="name"
                      value={authName}
                      onChange={(event) => setAuthName(event.target.value)}
                      placeholder="Oma Learner"
                    />
                  </span>
                </label>
              ) : null}

              <label>
                <span>{t.email}</span>
                <span className="input-shell">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    autoComplete="email"
                    inputMode="email"
                    required
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="student@omadigital.com"
                  />
                </span>
              </label>

              <label>
                <span>{t.password}</span>
                <span className="input-shell">
                  <KeyRound size={17} aria-hidden="true" />
                  <input
                    autoComplete={authMode === "signIn" ? "current-password" : "new-password"}
                    minLength={6}
                    required
                    type="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </span>
              </label>

              {authError ? <p className="auth-message" data-state="error">{authError}</p> : null}
              {authNotice ? <p className="auth-message" data-state="success">{authNotice}</p> : null}

              <button className="primary-button" disabled={isAuthBusy || !supabaseConfigured || !isSessionReady} type="submit">
                {isAuthBusy || !isSessionReady ? (
                  <Loader2 className="spin" size={18} aria-hidden="true" />
                ) : authMode === "signIn" ? (
                  <LogIn size={18} aria-hidden="true" />
                ) : (
                  <UserRound size={18} aria-hidden="true" />
                )}
                {authSubmitLabel}
              </button>
            </form>

            <div className="auth-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setAuthMode((mode) => (mode === "signIn" ? "signUp" : "signIn"));
                  setAuthError(null);
                  setAuthNotice(null);
                }}
              >
                {authSwitchLabel}
              </button>
              <button className="ghost-button" type="button" onClick={() => setIsLocalMode(true)}>
                {t.continueLocal}
              </button>
            </div>
          </section>
        </main>
      </div>
    );
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
          <div className="account-chip" data-state={cloudStatus}>
            {cloudStatus === "syncing" ? (
              <Loader2 className="spin" size={15} aria-hidden="true" />
            ) : session ? (
              <ShieldCheck size={15} aria-hidden="true" />
            ) : (
              <Cloud size={15} aria-hidden="true" />
            )}
            <span>{cloudLabel}</span>
            {session ? <strong>{displayName}</strong> : null}
          </div>
          <button className="icon-button" type="button" title={t.signOut} onClick={signOut}>
            <LogOut size={18} aria-hidden="true" />
          </button>
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

          <div className="module-rail" aria-label={t.courseFlow}>
            <div className="module-rail-header">
              <span>{t.courseFlow}</span>
              <strong>
                {activeModuleIndex + 1}/{activeLevel.modules.length}
              </strong>
            </div>
            {activeLevel.modules.map((module, moduleIndex) => {
              const unlocked = isModuleUnlocked(activeLevel, moduleIndex, completedModules);
              const isActive = module.id === activeModule.id;
              const isDone = Boolean(completedModules[module.id]);

              return (
                <button
                  className="module-step-button"
                  data-active={isActive}
                  data-complete={isDone}
                  disabled={!unlocked}
                  key={module.id}
                  onClick={() => selectModule(module.id)}
                  type="button"
                >
                  <span className="module-step-index">
                    {isDone ? <CheckCircle2 size={16} aria-hidden="true" /> : moduleIndex + 1}
                  </span>
                  <span>
                    <strong>{text(module.title[locale])}</strong>
                    <small>{unlocked ? (isDone ? t.modulePassed : t.currentModule) : t.moduleLocked}</small>
                  </span>
                </button>
              );
            })}
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

          <section className="dashboard-panel" aria-labelledby="dashboard-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  <BarChart3 size={15} aria-hidden="true" />
                  {t.dashboard}
                </p>
                <h2 id="dashboard-title">{displayName}</h2>
                <p>{t.certificateRule}</p>
              </div>
              <span className="sync-pill" data-state={cloudStatus}>
                {cloudStatus === "syncing" ? (
                  <Loader2 className="spin" size={15} aria-hidden="true" />
                ) : cloudStatus === "error" ? (
                  <XCircle size={15} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={15} aria-hidden="true" />
                )}
                {cloudLabel}
              </span>
            </div>

            <div className="dashboard-grid">
              <article className="stat-card">
                <span>{t.points}</span>
                <strong>{dashboardStats.points}</strong>
                <small>{dashboardStats.completedLevels}/{dashboardStats.levelCount} {t.level}</small>
              </article>
              <article className="stat-card">
                <span>{t.progress}</span>
                <strong>{dashboardStats.readiness}%</strong>
                <small>
                  {dashboardStats.completedModuleCount}/{dashboardStats.totalModules} {t.modules}
                </small>
              </article>
              <article className="stat-card">
                <span>{t.quiz}</span>
                <strong>{dashboardStats.correctAnswers}/{dashboardStats.totalQuestions}</strong>
                <small>{currentSubmitted ? t.pass : t.quizPending}</small>
              </article>
              <article className="stat-card">
                <span>{t.labCoach}</span>
                <strong>{dashboardStats.completedLabSteps}/{dashboardStats.totalLabSteps}</strong>
                <small>{dashboardStats.certificateReady ? t.certificateReady : t.certificateLocked}</small>
              </article>
            </div>

            <div className="achievement-grid">
              <div className="badge-rail" aria-label={t.badges}>
                <span className="badge-token" data-active={completedModuleCount > 0}>
                  <BookOpenCheck size={18} aria-hidden="true" />
                  {t.learner}
                </span>
                <span className="badge-token" data-active={completedLevels >= 2}>
                  <Medal size={18} aria-hidden="true" />
                  {t.mastery}
                </span>
                <span className="badge-token" data-active={certificateReady}>
                  <Trophy size={18} aria-hidden="true" />
                  {t.certificate}
                </span>
              </div>

              <div className="certificate-card" data-ready={certificateReady}>
                <div>
                  <span>{t.certificate}</span>
                  <strong>{certificateReady ? t.certificateReady : t.certificateLocked}</strong>
                  <p>{t.verifyId}: {certificateId}</p>
                </div>
                <button
                  className="primary-button"
                  disabled={!certificateReady}
                  onClick={downloadCertificate}
                  type="button"
                >
                  <Download size={18} aria-hidden="true" />
                  {t.downloadCertificate}
                </button>
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
                  ? `${scorePercent}% - ${modulePassed ? t.pass : t.improve}`
                  : `${answeredCurrent}/${activeModuleQuiz.length} ${t.answered}`}
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

          <section className="content-section module-course-section" id="modules" aria-labelledby="modules-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  <Layers3 size={15} aria-hidden="true" />
                  {t.lesson}
                </p>
                <h2 id="modules-title">{text(activeModule.title[locale])}</h2>
                <p>{text(activeModule.summary[locale])}</p>
              </div>
              <span className="section-progress">
                {t.module} {activeModuleIndex + 1}/{activeLevel.modules.length}
              </span>
            </div>

            <div className="course-grid">
              <article className="course-card course-card-wide">
                <span>{t.concept}</span>
                <p>{text(activeModule.summary[locale])}</p>
              </article>

              <article className="course-card">
                <span>{t.remember}</span>
                <ul className="key-list">
                  {activeModule.keyPoints[locale].map((point) => (
                    <li key={point}>{text(point)}</li>
                  ))}
                </ul>
              </article>

              <article className="course-card">
                <span>{t.apply}</span>
                <div className="lab-box">
                  <strong>{t.practice}</strong>
                  <span>{text(activeModule.practice[locale])}</span>
                </div>
              </article>

              <article className="course-card course-card-wide">
                <span>{t.fieldReview}</span>
                <ol className="tip-list">
                  {activeModule.tips[locale].map((tip) => (
                    <li key={tip}>{text(tip)}</li>
                  ))}
                </ol>
              </article>
            </div>
          </section>

          <section className="quiz-panel" id="quiz" aria-labelledby="quiz-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">
                  <ClipboardCheck size={15} aria-hidden="true" />
                  {t.moduleQuiz}
                </p>
                <h2 id="quiz-title">{text(activeModule.title[locale])}</h2>
                <p>{t.passRequired}</p>
              </div>
              <div className="score-card">
                <span>{t.score}</span>
                <strong>
                  {currentSubmitted ? `${score}/${activeModuleQuiz.length}` : "--"}
                </strong>
              </div>
            </div>

            <div className="quiz-status" data-ready={unanswered === 0 && !currentSubmitted}>
              {modulePassed ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : currentSubmitted ? (
                <XCircle size={18} aria-hidden="true" />
              ) : unanswered === 0 ? (
                <CheckCircle2 size={18} aria-hidden="true" />
              ) : (
                <Clock3 size={18} aria-hidden="true" />
              )}
              <span>
                {modulePassed
                  ? t.modulePassed
                  : currentSubmitted
                    ? t.moduleFailed
                    : unanswered === 0
                      ? t.quizReady
                      : `${unanswered} ${t.unanswered}`}
              </span>
            </div>

            {activeModuleQuiz.map((question, questionIndex) => (
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
                        disabled={currentSubmitted}
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
                disabled={unanswered > 0 || currentSubmitted}
                onClick={submitQuiz}
                type="button"
              >
                <ClipboardCheck size={18} aria-hidden="true" />
                {t.answer}
              </button>
              <button
                className="primary-button"
                disabled={!canGoNextModule}
                onClick={goToNextModule}
                type="button"
              >
                <ChevronRight size={18} aria-hidden="true" />
                {nextSequentialModule ? t.nextModule : t.nextLevel}
              </button>
              <button className="secondary-button" onClick={resetQuiz} type="button">
                <RotateCcw size={18} aria-hidden="true" />
                {currentSubmitted && !modulePassed ? t.retryModule : t.reset}
              </button>
              <button className="ghost-button" onClick={resetAllProgress} type="button">
                {t.resetAll}
              </button>
              <span className="score-summary" aria-live="polite">
                {currentSubmitted
                  ? `${scorePercent}% - ${modulePassed ? t.pass : t.improve}`
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
