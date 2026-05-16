"use client";

import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Cloud,
  Copy,
  Database,
  Download,
  ExternalLink,
  FlaskConical,
  Gauge,
  GraduationCap,
  KeyRound,
  Lightbulb,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Terminal,
  Trophy,
  Unlock,
  UserRound,
  XCircle
} from "lucide-react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { content } from "../data/courses";
import type { CourseModule as Module, LabStep, Level, Locale, Localized } from "../data/course-types";
import { pedagogyGuides } from "../data/pedagogy";
import { moduleQuizBank } from "../data/quizzes";
import { copy } from "../data/translations";
import { createClient, hasSupabaseConfig } from "../lib/supabase/client";

type ProgressSnapshot = {
  answers?: Record<string, number>;
  completedModules?: Record<string, boolean>;
  labChecks?: Record<string, boolean>;
  levelId?: string;
  locale?: Locale;
  moduleId?: string;
  moduleLabChecks?: Record<string, boolean>;
  moduleRead?: Record<string, boolean>;
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
  completedModuleLabSteps: number;
  correctAnswers: number;
  labReadiness: number;
  levelCount: number;
  moduleCompletion: number;
  points: number;
  quizAccuracy: number;
  readiness: number;
  totalLabSteps: number;
  totalModuleLabSteps: number;
  totalModules: number;
  totalQuestions: number;
};

const STORAGE_KEY = "cloud-cert-progress-v2";
const LOCALE_STORAGE_KEY = "cloud-cert-locale";
const MODULE_PASS_PERCENT = 70;

type CommandSnippet = {
  command: string;
  id: string;
  label: Localized;
};

type LabPlaybook = {
  brief: Localized;
  commands: CommandSnippet[];
  steps: LabStep[];
  title: Localized;
};

type MotionGraph = {
  caption: Localized;
  takeaways: Localized[];
  visual: "flow" | "edge" | "hybrid" | "security" | "governance";
  nodes: Localized[];
};

type SourceLink = {
  label: string;
  url: string;
};

type CapstoneBridge = {
  title: Localized;
  items: Localized[];
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

const moduleMotionGraphs: Record<string, MotionGraph> = {
  "cloud-foundations": {
    caption: {
      fr: "De la gouvernance jusqu'a la ressource: les permissions descendent dans la hierarchie.",
      en: "From governance to resource: permissions flow down the hierarchy."
    },
    takeaways: [
      { fr: "La policy la plus haute pose le cadre commun.", en: "The highest policy sets the shared guardrail." },
      { fr: "Le projet isole API, quotas, facturation et logs.", en: "The project isolates APIs, quotas, billing, and logs." },
      { fr: "IAM decide l'action autorisee sur la ressource cible.", en: "IAM decides the allowed action on the target resource." }
    ],
    visual: "governance",
    nodes: [
      { fr: "Organisation", en: "Organization" },
      { fr: "Folder", en: "Folder" },
      { fr: "Projet", en: "Project" },
      { fr: "IAM", en: "IAM" },
      { fr: "Ressource", en: "Resource" }
    ]
  },
  "vpc-basics": {
    caption: {
      fr: "Un paquet avance seulement si la route existe et si le firewall l'autorise.",
      en: "A packet moves only when a route exists and the firewall allows it."
    },
    takeaways: [
      { fr: "La route choisit le prochain saut du paquet.", en: "The route chooses the packet's next hop." },
      { fr: "Le firewall egress puis ingress autorise ou bloque.", en: "Egress then ingress firewall allows or blocks." },
      { fr: "Le test doit citer source, destination, protocole et port.", en: "The test must name source, destination, protocol, and port." }
    ],
    visual: "flow",
    nodes: [
      { fr: "VM source", en: "Source VM" },
      { fr: "Route", en: "Route" },
      { fr: "Firewall", en: "Firewall" },
      { fr: "Subnet", en: "Subnet" },
      { fr: "VM cible", en: "Target VM" }
    ]
  },
  "load-balancing-cdn-dns": {
    caption: {
      fr: "Le trafic public entre par DNS, passe au edge Google, puis rejoint seulement un backend sain.",
      en: "Public traffic enters through DNS, reaches Google's edge, then only a healthy backend."
    },
    takeaways: [
      { fr: "DNS pointe vers l'IP globale du load balancer.", en: "DNS points to the load balancer global IP." },
      { fr: "Cloud Armor filtre avant les backends.", en: "Cloud Armor filters before backends." },
      { fr: "CDN repond depuis le cache si le contenu est reutilisable.", en: "CDN responds from cache when content is reusable." }
    ],
    visual: "edge",
    nodes: [
      { fr: "Cloud DNS", en: "Cloud DNS" },
      { fr: "HTTPS LB", en: "HTTPS LB" },
      { fr: "Cloud Armor", en: "Cloud Armor" },
      { fr: "Cloud CDN", en: "Cloud CDN" },
      { fr: "Backend", en: "Backend" }
    ]
  },
  "gke-run-serverless": {
    caption: {
      fr: "Choisis le runtime selon le controle reseau, l'exploitation et le modele de trafic.",
      en: "Choose the runtime from network control, operations, and traffic model."
    },
    takeaways: [
      { fr: "Cloud Run simplifie l'exploitation HTTP.", en: "Cloud Run simplifies HTTP operations." },
      { fr: "GKE donne le controle Kubernetes et les policies fines.", en: "GKE gives Kubernetes control and fine policies." },
      { fr: "Ingress, Service et Pods doivent etre compris ensemble.", en: "Ingress, Service, and Pods must be understood together." }
    ],
    visual: "flow",
    nodes: [
      { fr: "Image", en: "Image" },
      { fr: "Cloud Run", en: "Cloud Run" },
      { fr: "GKE", en: "GKE" },
      { fr: "Service", en: "Service" },
      { fr: "Ingress", en: "Ingress" }
    ]
  },
  "hybrid-connectivity": {
    caption: {
      fr: "Le design hybride reussit quand CIDR, BGP et redondance sont prevus avant la connexion.",
      en: "Hybrid design succeeds when CIDR, BGP, and redundancy are planned before connecting."
    },
    takeaways: [
      { fr: "Le plan CIDR evite les routes ambiguës.", en: "The CIDR plan avoids ambiguous routes." },
      { fr: "Cloud Router echange les routes avec BGP.", en: "Cloud Router exchanges routes with BGP." },
      { fr: "La redondance doit etre testee, pas seulement dessinee.", en: "Redundancy must be tested, not only drawn." }
    ],
    visual: "hybrid",
    nodes: [
      { fr: "On-prem", en: "On-prem" },
      { fr: "HA VPN", en: "HA VPN" },
      { fr: "Interconnect", en: "Interconnect" },
      { fr: "Cloud Router", en: "Cloud Router" },
      { fr: "VPC", en: "VPC" }
    ]
  },
  "hybrid-dns": {
    caption: {
      fr: "Le DNS hybride doit avoir une autorite claire pour chaque suffixe, sans boucle.",
      en: "Hybrid DNS needs clear authority for every suffix, without loops."
    },
    takeaways: [
      { fr: "Chaque suffixe DNS a une autorite claire.", en: "Every DNS suffix has a clear authority." },
      { fr: "Forwarding envoie seulement certains domaines on-prem.", en: "Forwarding sends only selected domains on-prem." },
      { fr: "Les tests doivent etre faits depuis les deux cotes.", en: "Tests must be run from both sides." }
    ],
    visual: "hybrid",
    nodes: [
      { fr: "Resolver VPC", en: "VPC resolver" },
      { fr: "Private zone", en: "Private zone" },
      { fr: "Forwarding", en: "Forwarding" },
      { fr: "DNS on-prem", en: "On-prem DNS" },
      { fr: "Test dig", en: "dig test" }
    ]
  },
  troubleshooting: {
    caption: {
      fr: "Un diagnostic fiable suit les couches et garde une preuve avant chaque correction.",
      en: "Reliable diagnosis follows layers and keeps evidence before each fix."
    },
    takeaways: [
      { fr: "On teste DNS avant de toucher au firewall.", en: "Test DNS before touching firewall." },
      { fr: "Connectivity Tests montre la couche bloquante.", en: "Connectivity Tests shows the blocking layer." },
      { fr: "Une correction fiable change une seule variable.", en: "A reliable fix changes one variable." }
    ],
    visual: "flow",
    nodes: [
      { fr: "DNS", en: "DNS" },
      { fr: "Route", en: "Route" },
      { fr: "Firewall", en: "Firewall" },
      { fr: "Service", en: "Service" },
      { fr: "Logs", en: "Logs" }
    ]
  },
  "edge-security": {
    caption: {
      fr: "La securite edge filtre les attaques HTTP avant que le backend ne consomme des ressources.",
      en: "Edge security filters HTTP attacks before the backend spends resources."
    },
    takeaways: [
      { fr: "Le trafic suspect est bloque au edge.", en: "Suspicious traffic is blocked at the edge." },
      { fr: "Le mode preview reduit les faux positifs.", en: "Preview mode reduces false positives." },
      { fr: "Rate limit protege les endpoints sensibles.", en: "Rate limiting protects sensitive endpoints." }
    ],
    visual: "security",
    nodes: [
      { fr: "Internet", en: "Internet" },
      { fr: "Cloud Armor", en: "Cloud Armor" },
      { fr: "WAF", en: "WAF" },
      { fr: "Rate limit", en: "Rate limit" },
      { fr: "Backend", en: "Backend" }
    ]
  },
  "egress-nat-inspection": {
    caption: {
      fr: "L'egress securise combine connectivite sortante, controle applicatif et detection.",
      en: "Secure egress combines outbound connectivity, application control, and detection."
    },
    takeaways: [
      { fr: "NAT donne la sortie sans publier la VM.", en: "NAT gives outbound access without publishing the VM." },
      { fr: "Le proxy controle les domaines et URLs.", en: "The proxy controls domains and URLs." },
      { fr: "IDS detecte; firewall ou Armor bloque.", en: "IDS detects; firewall or Armor blocks." }
    ],
    visual: "security",
    nodes: [
      { fr: "Workload prive", en: "Private workload" },
      { fr: "Secure Web Proxy", en: "Secure Web Proxy" },
      { fr: "Cloud NAT", en: "Cloud NAT" },
      { fr: "Cloud IDS", en: "Cloud IDS" },
      { fr: "Internet", en: "Internet" }
    ]
  },
  governance: {
    caption: {
      fr: "La gouvernance impose les denies critiques et laisse les projets gerer les flux justifies.",
      en: "Governance enforces critical denies and lets projects manage justified flows."
    },
    takeaways: [
      { fr: "Le folder prod impose les denies critiques.", en: "The prod folder enforces critical denies." },
      { fr: "Les projets gardent les allows justifies.", en: "Projects keep justified allows." },
      { fr: "Chaque exception doit expirer et etre auditee.", en: "Every exception must expire and be audited." }
    ],
    visual: "governance",
    nodes: [
      { fr: "Organisation", en: "Organization" },
      { fr: "Policy folder", en: "Folder policy" },
      { fr: "Projet", en: "Project" },
      { fr: "Exception", en: "Exception" },
      { fr: "Audit", en: "Audit" }
    ]
  }
};

const moduleSourceLinks: Record<string, SourceLink[]> = {
  "cloud-foundations": [
    { label: "Resource hierarchy", url: "https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy" },
    { label: "IAM overview", url: "https://cloud.google.com/iam/docs/overview" },
    { label: "Service accounts", url: "https://cloud.google.com/iam/docs/service-account-overview" },
    { label: "Organization Policy", url: "https://cloud.google.com/resource-manager/docs/organization-policy/overview" },
    { label: "Audit Logs", url: "https://cloud.google.com/logging/docs/audit" }
  ],
  "vpc-basics": [
    { label: "VPC networks", url: "https://cloud.google.com/vpc/docs/vpc" },
    { label: "Subnets", url: "https://cloud.google.com/vpc/docs/subnets" },
    { label: "Routes", url: "https://cloud.google.com/vpc/docs/routes" },
    { label: "Firewall rules", url: "https://cloud.google.com/firewall/docs/firewalls" },
    { label: "Private Google Access", url: "https://cloud.google.com/vpc/docs/private-google-access" },
    { label: "VPC Flow Logs", url: "https://cloud.google.com/vpc/docs/flow-logs" }
  ],
  "compute-and-storage": [
    { label: "Compute Engine VM instances", url: "https://cloud.google.com/compute/docs/instances" },
    { label: "Cloud Storage overview", url: "https://cloud.google.com/storage/docs/introduction" },
    { label: "Cloud SQL overview", url: "https://cloud.google.com/sql/docs/introduction" },
    { label: "Secret Manager", url: "https://cloud.google.com/secret-manager/docs/overview" },
    { label: "Private services access", url: "https://cloud.google.com/vpc/docs/private-services-access" }
  ],
  "firewall-identity": [
    { label: "VPC firewall rules", url: "https://cloud.google.com/firewall/docs/firewalls" },
    { label: "Service accounts", url: "https://cloud.google.com/iam/docs/service-account-overview" },
    { label: "Firewall Rules Logging", url: "https://cloud.google.com/firewall/docs/firewall-rules-logging" },
    { label: "Firewall policies", url: "https://cloud.google.com/firewall/docs/firewall-policies" },
    { label: "VPC Flow Logs", url: "https://cloud.google.com/vpc/docs/flow-logs" }
  ],
  "load-balancing-cdn-dns": [
    { label: "External Application Load Balancer", url: "https://cloud.google.com/load-balancing/docs/https" },
    { label: "Application Load Balancer overview", url: "https://cloud.google.com/load-balancing/docs/application-load-balancer" },
    { label: "Cloud CDN overview", url: "https://cloud.google.com/cdn/docs/overview" },
    { label: "Cloud DNS zones", url: "https://cloud.google.com/dns/docs/zones/zones-overview" },
    { label: "Health checks", url: "https://cloud.google.com/load-balancing/docs/health-checks" },
    { label: "Cloud Armor overview", url: "https://cloud.google.com/armor/docs/cloud-armor-overview" }
  ],
  "gke-run-serverless": [
    { label: "GKE networking", url: "https://cloud.google.com/kubernetes-engine/docs/concepts/network-overview" },
    { label: "VPC-native clusters", url: "https://cloud.google.com/kubernetes-engine/docs/concepts/alias-ips" },
    { label: "Private GKE clusters", url: "https://cloud.google.com/kubernetes-engine/docs/how-to/legacy/network-isolation" },
    { label: "GKE Network Policy", url: "https://cloud.google.com/kubernetes-engine/docs/how-to/network-policy" },
    { label: "Workload Identity Federation for GKE", url: "https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity" },
    { label: "Cloud Run networking", url: "https://cloud.google.com/run/docs/configuring/networking" }
  ],
  "hybrid-connectivity": [
    { label: "Network Connectivity Center", url: "https://cloud.google.com/network-connectivity/docs/network-connectivity-center/concepts/overview" },
    { label: "Network Connectivity products", url: "https://docs.cloud.google.com/network-connectivity/docs/concepts" },
    { label: "HA VPN", url: "https://cloud.google.com/network-connectivity/docs/vpn/concepts/overview" },
    { label: "Cloud Interconnect", url: "https://cloud.google.com/network-connectivity/docs/interconnect/concepts/overview" },
    { label: "Cloud Router", url: "https://cloud.google.com/network-connectivity/docs/router/concepts/overview" },
    { label: "Professional Network Engineer guide", url: "https://cloud.google.com/learn/certification/cloud-network-engineer" }
  ],
  "hybrid-dns": [
    { label: "Cloud DNS forwarding zones", url: "https://cloud.google.com/dns/docs/zones/zones-overview" },
    { label: "DNS server policies", url: "https://cloud.google.com/dns/docs/server-policies-overview" },
    { label: "Private zones", url: "https://cloud.google.com/dns/docs/zones/zones-overview#private_zones" },
    { label: "DNS peering zones", url: "https://cloud.google.com/dns/docs/zones/zones-overview#peering_zones" },
    { label: "Cloud DNS logging", url: "https://cloud.google.com/dns/docs/monitoring" }
  ],
  troubleshooting: [
    { label: "Network Intelligence Center", url: "https://docs.cloud.google.com/network-intelligence-center/docs" },
    { label: "Connectivity Tests", url: "https://docs.cloud.google.com/network-intelligence-center/docs/connectivity-tests/how-to/running-connectivity-tests" },
    { label: "Network Topology", url: "https://cloud.google.com/network-intelligence-center/docs/network-topology" },
    { label: "Flow Analyzer", url: "https://cloud.google.com/network-intelligence-center/docs/flow-analyzer" },
    { label: "Cloud Monitoring alerting", url: "https://cloud.google.com/monitoring/alerts" },
    { label: "Cloud Audit Logs", url: "https://cloud.google.com/logging/docs/audit" }
  ],
  "edge-security": [
    { label: "Cloud Armor overview", url: "https://docs.cloud.google.com/armor/docs/cloud-armor-overview" },
    { label: "Cloud Armor WAF rules", url: "https://cloud.google.com/armor/docs/waf-rules" },
    { label: "Rate limiting", url: "https://cloud.google.com/armor/docs/rate-limiting-overview" },
    { label: "Application Load Balancer", url: "https://cloud.google.com/load-balancing/docs/application-load-balancer" },
    { label: "DDoS protection", url: "https://cloud.google.com/armor/docs/cloud-armor-overview#ddos_protection" }
  ],
  "egress-nat-inspection": [
    { label: "Cloud NAT overview", url: "https://cloud.google.com/nat/docs/overview" },
    { label: "Cloud NAT ports", url: "https://cloud.google.com/nat/docs/ports-and-addresses" },
    { label: "Secure Web Proxy", url: "https://docs.cloud.google.com/secure-web-proxy/docs/overview" },
    { label: "Cloud IDS overview", url: "https://cloud.google.com/intrusion-detection-system/docs/overview" },
    { label: "Private Google Access", url: "https://cloud.google.com/vpc/docs/private-google-access" },
    { label: "Private access options", url: "https://cloud.google.com/vpc/docs/private-access-options" }
  ],
  governance: [
    { label: "Hierarchical firewall policies", url: "https://cloud.google.com/firewall/docs/firewall-policies" },
    { label: "Use firewall policies", url: "https://cloud.google.com/firewall/docs/using-firewall-policies" },
    { label: "Organization Policy", url: "https://cloud.google.com/resource-manager/docs/organization-policy/overview" },
    { label: "Cloud Asset Inventory", url: "https://cloud.google.com/asset-inventory/docs/overview" },
    { label: "VPC Flow Logs", url: "https://cloud.google.com/vpc/docs/flow-logs" },
    { label: "Firewall Rules Logging", url: "https://cloud.google.com/firewall/docs/firewall-rules-logging" }
  ]
};

const moduleCapstoneBridge: Record<string, CapstoneBridge> = {
  "cloud-foundations": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Definir organization, folders prod/dev et projets separes pour limiter le blast radius.", en: "Define organization, prod/dev folders, and separate projects to limit blast radius." },
      { fr: "Associer les roles IAM aux equipes reseau, securite, plateforme et audit.", en: "Map IAM roles to networking, security, platform, and audit teams." },
      { fr: "Utiliser Audit Logs pour prouver qui modifie reseau, firewall et DNS.", en: "Use Audit Logs to prove who changes networking, firewall, and DNS." }
    ]
  },
  "vpc-basics": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Construire bank-prod-vpc en mode custom avec subnets GKE, portail interne, data et egress.", en: "Build bank-prod-vpc in custom mode with GKE, internal portal, data, and egress subnets." },
      { fr: "Planifier les CIDR sans chevauchement avec on-premises, partenaires et futures regions.", en: "Plan CIDRs without overlap with on-premises, partners, and future regions." },
      { fr: "Activer Private Google Access, Flow Logs et firewall logging sur les subnets sensibles.", en: "Enable Private Google Access, Flow Logs, and firewall logging on sensitive subnets." }
    ]
  },
  "compute-and-storage": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Savoir pourquoi une VM ou base exposee directement n'est pas acceptable pour une banque.", en: "Know why a directly exposed VM or database is unacceptable for a bank." },
      { fr: "Utiliser Secret Manager et chemins prives pour les credentials applicatifs.", en: "Use Secret Manager and private paths for application credentials." },
      { fr: "Prevoir sauvegardes, identites de service et acces reseau minimaux.", en: "Plan backups, service identities, and minimal network access." }
    ]
  },
  "firewall-identity": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Produire la table des flux autorises: source, destination, port, service account et justification.", en: "Produce the allowed flow table: source, destination, port, service account, and justification." },
      { fr: "Bloquer Internet vers les workloads prives et autoriser seulement les flux metier.", en: "Block the internet from private workloads and allow only business flows." },
      { fr: "Cibler les regles par service account plutot que par IP quand les workloads changent.", en: "Target rules by service account rather than IP when workloads change." }
    ]
  },
  "load-balancing-cdn-dns": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Publier le site public via Cloud DNS public et Global External HTTPS Load Balancer.", en: "Publish the public site through public Cloud DNS and Global External HTTPS Load Balancer." },
      { fr: "Placer Cloud CDN devant le contenu statique et garder l'API derriere des backends sains.", en: "Place Cloud CDN before static content and keep the API behind healthy backends." },
      { fr: "Utiliser un Internal Application Load Balancer pour le portail employe.", en: "Use an Internal Application Load Balancer for the employee portal." }
    ]
  },
  "gke-run-serverless": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Heberger les workloads critiques dans un cluster GKE prive sans IP publique sur les nodes.", en: "Host critical workloads in a private GKE cluster with no public node IPs." },
      { fr: "Planifier les ranges secondaires Pods et Services avant la creation du cluster.", en: "Plan Pod and Service secondary ranges before creating the cluster." },
      { fr: "Utiliser Workload Identity et Network Policy pour reduire les privileges et flux pod-a-pod.", en: "Use Workload Identity and Network Policy to reduce privileges and pod-to-pod flows." }
    ]
  },
  "hybrid-connectivity": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Relier le datacenter bancaire a GCP via HA VPN pour lab ou Interconnect pour production critique.", en: "Connect the bank data center to GCP with HA VPN for labs or Interconnect for critical production." },
      { fr: "Utiliser Cloud Router/BGP pour annoncer les prefixes cloud et on-premises.", en: "Use Cloud Router/BGP to advertise cloud and on-premises prefixes." },
      { fr: "Prevoir deux chemins et tester la bascule avant validation.", en: "Plan two paths and test failover before approval." }
    ]
  },
  "hybrid-dns": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Creer Cloud DNS public pour www.bank-demo.com et private zones pour portal.bank.internal.", en: "Create public Cloud DNS for www.bank-demo.com and private zones for portal.bank.internal." },
      { fr: "Configurer forwarding zone vers DNS on-prem pour corp.bank.internal.", en: "Configure a forwarding zone to on-prem DNS for corp.bank.internal." },
      { fr: "Ajouter inbound DNS policy pour que on-prem resolve les noms prives GCP.", en: "Add inbound DNS policy so on-prem resolves private GCP names." }
    ]
  },
  troubleshooting: {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Prouver Internet vers site public 443 autorise et Internet vers portail interne refuse.", en: "Prove internet to public site 443 is allowed and internet to internal portal is denied." },
      { fr: "Utiliser Connectivity Tests pour on-prem vers portail, GKE vers DNS et GKE vers proxy.", en: "Use Connectivity Tests for on-prem to portal, GKE to DNS, and GKE to proxy." },
      { fr: "Construire alertes VPN, Interconnect, Cloud Router, NAT, Cloud Armor, IDS et GKE.", en: "Build alerts for VPN, Interconnect, Cloud Router, NAT, Cloud Armor, IDS, and GKE." }
    ]
  },
  "edge-security": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Proteger le site public avec Cloud Armor, WAF SQLi/XSS et rate limiting login.", en: "Protect the public site with Cloud Armor, SQLi/XSS WAF, and login rate limiting." },
      { fr: "Commencer en preview pour mesurer faux positifs avant blocage.", en: "Start in preview to measure false positives before blocking." },
      { fr: "Surveiller les 403/429 et pics de denies dans Cloud Logging/Monitoring.", en: "Monitor 403/429 and deny spikes in Cloud Logging/Monitoring." }
    ]
  },
  "egress-nat-inspection": {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Faire sortir les workloads prives via Cloud NAT sans IP publique.", en: "Let private workloads egress through Cloud NAT without public IPs." },
      { fr: "Forcer HTTP/HTTPS vers Secure Web Proxy pour autoriser seulement les domaines necessaires.", en: "Force HTTP/HTTPS through Secure Web Proxy to allow only required domains." },
      { fr: "Ajouter Cloud IDS sur les subnets GKE, portail interne et flux hybrides critiques.", en: "Add Cloud IDS on GKE, internal portal, and critical hybrid flow subnets." }
    ]
  },
  governance: {
    title: { fr: "Lien avec le projet bancaire", en: "Banking project link" },
    items: [
      { fr: "Imposer deny Internet vers workloads prives avec hierarchical firewall policies au folder prod.", en: "Enforce deny internet to private workloads with hierarchical firewall policies at the prod folder." },
      { fr: "Garder des exceptions datees avec owner, justification, logs et revue.", en: "Keep dated exceptions with owner, justification, logs, and review." },
      { fr: "Auditer les regles larges, les ports admin publics et les logs desactives.", en: "Audit broad rules, public admin ports, and disabled logs." }
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

function isLevelUnlocked(levels: Level[], levelIndex: number, completedModules: Record<string, boolean>) {
  return (
    levelIndex === 0 ||
    levels
      .slice(0, levelIndex)
      .every((level) => level.modules.every((module) => completedModules[module.id]))
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

function getPercent(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function getLessonAnchorId(moduleId: string, sectionId: string) {
  return `lesson-${moduleId}-${sectionId}`;
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

function readPreferredLocale(): Locale | null {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(saved) ? saved : null;
  } catch {
    return null;
  }
}

function ConceptMotionGraph({
  graph,
  locale,
  sourceLinks
}: {
  graph?: MotionGraph;
  locale: Locale;
  sourceLinks: SourceLink[];
}) {
  if (!graph && sourceLinks.length === 0) {
    return null;
  }

  return (
    <section className="concept-motion-card" aria-label={locale === "fr" ? "Carte mentale animee" : "Animated concept map"}>
      {graph ? (
        <>
          <div className="concept-motion-head">
            <span>
              <Layers3 size={17} aria-hidden="true" />
              {locale === "fr" ? "Carte mentale animee" : "Animated concept map"}
            </span>
            <p>{graph.caption[locale]}</p>
          </div>
          <div className="motion-flow" aria-hidden="true">
            {graph.nodes.map((node, index) => (
              <div className="motion-node-wrap" key={`${node.en}-${index}`}>
                <span className="motion-node" style={{ "--motion-delay": `${index * 220}ms` } as CSSProperties}>
                  <span className="motion-node-index">{index + 1}</span>
                  {node[locale]}
                </span>
                {index < graph.nodes.length - 1 ? <span className="motion-link" /> : null}
              </div>
            ))}
          </div>
          <div className="topology-motion" data-visual={graph.visual} aria-hidden="true">
            <span className="topology-zone zone-a" />
            <span className="topology-zone zone-b" />
            <span className="topology-zone zone-c" />
            <span className="topology-path path-main" />
            <span className="topology-path path-alt" />
            <span className="topology-pulse pulse-a" />
            <span className="topology-pulse pulse-b" />
            <span className="topology-label label-a">{graph.nodes[0]?.[locale]}</span>
            <span className="topology-label label-b">{graph.nodes[2]?.[locale]}</span>
            <span className="topology-label label-c">{graph.nodes[4]?.[locale]}</span>
          </div>
          <div className="packet-stage" aria-hidden="true">
            <span className="packet-track">
              <span className="packet-dot" />
            </span>
            <span className="packet-label">{locale === "fr" ? "requete / paquet" : "request / packet"}</span>
          </div>
          <ol className="motion-takeaways">
            {graph.takeaways.map((takeaway, index) => (
              <li key={`${takeaway.en}-${index}`}>
                <span>{index + 1}</span>
                {takeaway[locale]}
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {sourceLinks.length > 0 ? (
        <div className="source-strip">
          <span>{locale === "fr" ? "Docs Google Cloud" : "Google Cloud docs"}</span>
          {sourceLinks.map((source) => (
            <a href={source.url} key={source.url} rel="noreferrer" target="_blank">
              {source.label}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
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
  const [moduleLabChecks, setModuleLabChecks] = useState<Record<string, boolean>>({});
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
  const [activeTab, setActiveTab] = useState<"course" | "lab" | "quiz">("course");
  const [activeLessonSectionIndex, setActiveLessonSectionIndex] = useState(0);
  const [activeLessonModuleId, setActiveLessonModuleId] = useState(content.levels[0].modules[0].id);
  const [isLessonTocFloating, setIsLessonTocFloating] = useState(false);
  const [lessonTocLeft, setLessonTocLeft] = useState<number | null>(null);
  const [moduleRead, setModuleRead] = useState<Record<string, boolean>>({
    [content.levels[0].modules[0].id]: true
  });
  const courseReaderRef = useRef<HTMLDivElement | null>(null);

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
  const quizProgressPercent = currentSubmitted ? scorePercent : getPercent(answeredCurrent, activeModuleQuiz.length);
  const wrongAnswers = currentSubmitted
    ? activeModuleQuiz.filter((question) => answers[question.id] !== question.answer)
    : [];
  const activeModuleLabSteps = activeModule.guidedLab.steps;
  const completedModuleLabSteps = activeModuleLabSteps.filter((step) => {
    return moduleLabChecks[`${activeModule.id}:${step.id}`];
  }).length;
  const moduleLabProgressPercent = getPercent(completedModuleLabSteps, activeModuleLabSteps.length);
  const moduleLabComplete = activeModuleLabSteps.length === 0 || completedModuleLabSteps === activeModuleLabSteps.length;
  const canSubmitModuleQuiz = moduleLabComplete && !activeModuleQuiz.some((question) => answers[question.id] === undefined);

  // Aliases for tab-based UI
  const moduleQuizSubmitted = currentSubmitted;
  const moduleQuizPassed = modulePassed;
  const moduleScorePercent = scorePercent;
  const moduleQuizQuestions = activeModuleQuiz;
  const moduleLabDone = moduleLabComplete;
  const activeModuleDetail = activeModule;
  const activePedagogy = pedagogyGuides[activeModule.id];
  const activeLab = labPlaybooks[activeLevel.id] ?? null;
  const activeMotionGraph = moduleMotionGraphs[activeModule.id];
  const activeSourceLinks = moduleSourceLinks[activeModule.id] ?? [];
  const activeCapstoneBridge = moduleCapstoneBridge[activeModule.id];
  const lessonSections = activeModuleDetail.lessonSections ?? [];
  const activeLessonIndexForModule = activeLessonModuleId === activeModule.id ? activeLessonSectionIndex : 0;
  const safeLessonSectionIndex =
    lessonSections.length > 0 ? Math.min(activeLessonIndexForModule, lessonSections.length - 1) : 0;
  const lessonReadingProgress = getPercent(safeLessonSectionIndex + 1, lessonSections.length);

  const totalModules = content.levels.reduce((total, level) => total + level.modules.length, 0);
  const completedModuleCount = content.levels.reduce((total, level) => {
    return total + level.modules.filter((module) => completedModules[module.id]).length;
  }, 0);
  const allModulesComplete = completedModuleCount === totalModules;
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
  const totalModuleLabSteps = content.levels.reduce((total, level) => {
    return total + level.modules.reduce((moduleTotal, module) => moduleTotal + module.guidedLab.steps.length, 0);
  }, 0);
  const completedModuleLabStepCount = content.levels.reduce((total, level) => {
    return (
      total +
      level.modules.reduce((moduleTotal, module) => {
        return (
          moduleTotal +
          module.guidedLab.steps.filter((step) => moduleLabChecks[`${module.id}:${step.id}`]).length
        );
      }, 0)
    );
  }, 0);
  const moduleCompletion = getPercent(completedModuleCount, totalModules);
  const quizAccuracy = getPercent(correctAnswers, totalQuestions);
  const totalHandsOnSteps = totalLabSteps + totalModuleLabSteps;
  const completedHandsOnSteps = completedTotalLabSteps + completedModuleLabStepCount;
  const labReadiness = getPercent(completedHandsOnSteps, totalHandsOnSteps);
  const readiness = Math.round(moduleCompletion * 0.45 + quizAccuracy * 0.35 + labReadiness * 0.2);
  const points =
    completedModuleCount * 120 +
    correctAnswers * 80 +
    completedTotalLabSteps * 55 +
    completedModuleLabStepCount * 35 +
    completedLevels * 500 +
    (readiness >= 90 ? 350 : 0);
  const certificateReady =
    completedLevels === content.levels.length &&
    completedModuleCount === totalModules &&
    completedTotalLabSteps === totalLabSteps &&
    completedModuleLabStepCount === totalModuleLabSteps &&
    readiness >= 90;
  const allLabsDone =
    completedTotalLabSteps === totalLabSteps &&
    completedModuleLabStepCount === totalModuleLabSteps;
  const certificateUnlocked = certificateReady;
  const capstoneUnlocked = completedModuleCount === totalModules && allLabsDone;
  const displayName =
    cloudProfile?.display_name ||
    authName.trim() ||
    user?.email?.split("@")[0] ||
    (locale === "fr" ? "Apprenant Cloud" : "Cloud Learner");
  const certificateId = buildCertificateId(user?.id, points);
  const dashboardStats: DashboardStats = {
    certificateReady,
    completedLabSteps: completedHandsOnSteps,
    completedLevels,
    completedModuleCount,
    completedModuleLabSteps: completedModuleLabStepCount,
    correctAnswers,
    labReadiness,
    levelCount: content.levels.length,
    moduleCompletion,
    points,
    quizAccuracy,
    readiness,
    totalLabSteps: totalHandsOnSteps,
    totalModuleLabSteps,
    totalModules,
    totalQuestions
  };
  const dashboardInsights = [
    {
      icon: <BookOpenCheck size={18} aria-hidden="true" />,
      id: "modules",
      label: t.moduleCompletion,
      percent: dashboardStats.moduleCompletion,
      value: `${dashboardStats.completedModuleCount}/${dashboardStats.totalModules}`
    },
    {
      icon: <ClipboardCheck size={18} aria-hidden="true" />,
      id: "quiz",
      label: t.quizAccuracy,
      percent: dashboardStats.quizAccuracy,
      value: `${dashboardStats.correctAnswers}/${dashboardStats.totalQuestions}`
    },
    {
      icon: <ShieldCheck size={18} aria-hidden="true" />,
      id: "labs",
      label: t.handsOnLabs,
      percent: dashboardStats.labReadiness,
      value: `${dashboardStats.completedLabSteps}/${dashboardStats.totalLabSteps}`
    },
    {
      icon: <Award size={18} aria-hidden="true" />,
      id: "certificate",
      label: t.certificationGate,
      percent: dashboardStats.certificateReady ? 100 : dashboardStats.readiness,
      value: dashboardStats.certificateReady ? t.certificateReady : t.certificateLocked
    }
  ];
  const moduleGateCards = [
    {
      id: "lesson",
      label: t.estimatedTime,
      percent: 100,
      state: "complete",
      value: text(activeModule.estimatedTime[locale])
    },
    {
      id: "lab",
      label: t.guidedMiniLab,
      percent: moduleLabProgressPercent,
      state: moduleLabComplete ? "complete" : "open",
      value: `${completedModuleLabSteps}/${activeModuleLabSteps.length}`
    },
    {
      id: "quiz",
      label: t.quizGate,
      percent: quizProgressPercent,
      state: modulePassed ? "complete" : unanswered === 0 && !currentSubmitted ? "ready" : "open",
      value: currentSubmitted ? `${scorePercent}%` : `${answeredCurrent}/${activeModuleQuiz.length}`
    }
  ];
  const capstoneProgress = Math.min(
    Math.round(moduleCompletion * 0.5 + labReadiness * 0.3 + quizAccuracy * 0.2),
    100
  );
  const nextLockedLevel = content.levels.find((level, index) => {
    return index > 0 && !isLevelUnlocked(content.levels, index, completedModules);
  });
  const levelPathPercent = getPercent(
    content.levels.filter((level) => level.modules.every((module) => completedModules[module.id])).length,
    content.levels.length
  );
  const moduleNextAction = !moduleLabComplete
    ? t.finishMiniLab
    : unanswered > 0
      ? t.answerRemainingQuestions
      : !currentSubmitted
        ? t.submitReadyQuiz
        : modulePassed
          ? t.readyForNext
          : t.reviewMistakes;
  const currentProgressSnapshot = useMemo<ProgressSnapshot>(
    () => ({
      answers,
      completedModules,
      labChecks,
      levelId,
      locale,
      moduleId,
      moduleLabChecks,
      moduleRead,
      submittedModuleQuizzes,
      submittedLevels
    }),
    [
      answers,
      completedModules,
      labChecks,
      levelId,
      locale,
      moduleId,
      moduleLabChecks,
      moduleRead,
      submittedModuleQuizzes,
      submittedLevels
    ]
  );
  const latestSnapshotRef = useRef(currentProgressSnapshot);
  const latestPointsRef = useRef(points);
  const userSelectedLocaleRef = useRef<Locale | null>(null);

  useEffect(() => {
    latestSnapshotRef.current = currentProgressSnapshot;
    latestPointsRef.current = points;
  }, [currentProgressSnapshot, points]);

  useEffect(() => {
    if (activeTab !== "course") {
      return;
    }

    const updateFloatingToc = () => {
      const reader = courseReaderRef.current;

      if (!reader) {
        setIsLessonTocFloating(false);
        return;
      }

      const tocPanel = reader.querySelector<HTMLElement>(".lesson-toc-panel");
      const readerRect = reader.getBoundingClientRect();
      const panelRect = tocPanel?.getBoundingClientRect();
      const shouldFloat = window.innerWidth > 1180 && readerRect.top <= 94 && readerRect.bottom > 380;

      setIsLessonTocFloating(shouldFloat);

      if (panelRect) {
        setLessonTocLeft(Math.round(panelRect.left));
      }
    };

    const frame = window.requestAnimationFrame(updateFloatingToc);
    window.addEventListener("scroll", updateFloatingToc, { passive: true });
    window.addEventListener("resize", updateFloatingToc);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateFloatingToc);
      window.removeEventListener("resize", updateFloatingToc);
    };
  }, [activeModule.id, activeTab]);

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
        setModuleLabChecks(parsed.moduleLabChecks ?? {});
        setModuleRead(parsed.moduleRead ?? (savedModuleExists && parsed.moduleId ? { [parsed.moduleId]: true } : {}));
        setSubmittedModuleQuizzes(parsed.submittedModuleQuizzes ?? {});
        setSubmittedLevels(parsed.submittedLevels ?? {});

        if (savedLevelExists && parsed.levelId) {
          setLevelId(parsed.levelId);
        }

        if (savedModuleExists && parsed.moduleId) {
          setModuleId(parsed.moduleId);
        }

        const preferredLocale = readPreferredLocale();
        if (preferredLocale) {
          userSelectedLocaleRef.current = preferredLocale;
          setLocale(preferredLocale);
        } else if (!userSelectedLocaleRef.current && isLocale(parsed.locale)) {
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
        setModuleLabChecks(savedProgress.moduleLabChecks ?? {});
        setModuleRead(
          savedProgress.moduleRead ??
            (savedModuleExists && savedProgress.moduleId ? { [savedProgress.moduleId]: true } : {})
        );
        setSubmittedModuleQuizzes(savedProgress.submittedModuleQuizzes ?? {});
        setSubmittedLevels(savedProgress.submittedLevels ?? {});

        if (savedLevelExists && savedProgress.levelId) {
          setLevelId(savedProgress.levelId);
        }

        if (savedModuleExists && savedProgress.moduleId) {
          setModuleId(savedProgress.moduleId);
        }

        const preferredLocale = readPreferredLocale();
        const restoredLocale = isLocale(savedProgress.locale)
          ? savedProgress.locale
          : latestSnapshotRef.current.locale ?? "fr";

        if (preferredLocale) {
          userSelectedLocaleRef.current = preferredLocale;
          setLocale(preferredLocale);
        } else if (!userSelectedLocaleRef.current) {
          setLocale(restoredLocale);
        }

        setAuthNotice(copy[userSelectedLocaleRef.current ?? restoredLocale].welcomeBack);
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
  }, [supabase, user]);
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
    const levelIndex = content.levels.findIndex((level) => level.id === nextLevelId);

    if (levelIndex < 0 || !isLevelUnlocked(content.levels, levelIndex, completedModules)) {
      return;
    }

    const nextLevel = content.levels.find((level) => level.id === nextLevelId) ?? content.levels[0];
    const nextModuleId = getFirstAvailableModule(nextLevel, completedModules).id;

    setLevelId(nextLevel.id);
    setModuleId(nextModuleId);
    setActiveLessonModuleId(nextModuleId);
    setActiveLessonSectionIndex(0);
    setActiveTab("course");
    setModuleRead((current) => ({ ...current, [nextModuleId]: true }));
  }

  function changeLocale(nextLocale: Locale) {
    userSelectedLocaleRef.current = nextLocale;
    setLocale(nextLocale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...latestSnapshotRef.current,
          locale: nextLocale
        })
      );
    } catch {
      // Locale switching must keep working even if browser storage is unavailable.
    }

    if (supabase && user && hasLoadedCloudProgress) {
      setCloudStatus("syncing");
      const nextProgress = {
        ...latestSnapshotRef.current,
        locale: nextLocale
      };

      supabase
        .from("cloud_cert_profiles")
        .upsert({
          certificate_issued_at: certificateReady
            ? cloudProfile?.certificate_issued_at ?? new Date().toISOString()
            : cloudProfile?.certificate_issued_at ?? null,
          display_name: displayName,
          points,
          progress: nextProgress,
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
    }
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
    setModuleLabChecks({});
    setModuleRead({ [content.levels[0].modules[0].id]: true });
    setSubmittedModuleQuizzes({});
    setSubmittedLevels({});
    setLevelId(content.levels[0].id);
    setModuleId(content.levels[0].modules[0].id);
    setActiveLessonModuleId(content.levels[0].modules[0].id);
    setActiveLessonSectionIndex(0);
    setActiveTab("course");
  }

  function selectLessonSection(index: number) {
    const section = lessonSections[index];

    if (!section) {
      return;
    }

    setActiveLessonModuleId(activeModule.id);
    setActiveLessonSectionIndex(index);
    window.requestAnimationFrame(() => {
      document
        .getElementById(getLessonAnchorId(activeModule.id, section.id))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function moveLessonSection(direction: -1 | 1) {
    const nextIndex = Math.min(Math.max(safeLessonSectionIndex + direction, 0), lessonSections.length - 1);

    selectLessonSection(nextIndex);
  }

  // Aliases for tab UI
  const submitModuleQuiz = submitQuiz;
  const resetModuleQuiz = resetQuiz;

  function selectModule(nextModuleId: string) {
    const moduleIndex = activeLevel.modules.findIndex((module) => module.id === nextModuleId);

    if (moduleIndex < 0) {
      return;
    }

    if (!isModuleUnlocked(activeLevel, moduleIndex, completedModules)) {
      return;
    }

    setModuleId(nextModuleId);
    setActiveLessonModuleId(nextModuleId);
    setActiveLessonSectionIndex(0);
    setActiveTab("course");
    setModuleRead((current) => ({ ...current, [nextModuleId]: true }));
  }

  function goToNextModule() {
    if (!canGoNextModule) {
      return;
    }

    if (nextSequentialModule) {
      setModuleId(nextSequentialModule.id);
      setActiveLessonModuleId(nextSequentialModule.id);
      setActiveLessonSectionIndex(0);
      setActiveTab("course");
      setModuleRead((current) => ({ ...current, [nextSequentialModule.id]: true }));
      return;
    }

    const nextLevel = content.levels.find((level) => level.rank === activeLevel.rank + 1);

    if (nextLevel) {
      setLevelId(nextLevel.id);
      setModuleId(nextLevel.modules[0].id);
      setActiveLessonModuleId(nextLevel.modules[0].id);
      setActiveLessonSectionIndex(0);
      setActiveTab("course");
      setModuleRead((current) => ({ ...current, [nextLevel.modules[0].id]: true }));
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

  function toggleModuleLabStep(stepId: string) {
    const key = `${activeModule.id}:${stepId}`;

    setModuleLabChecks((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  function resetModuleLabSteps() {
    setModuleLabChecks((current) => {
      const next = { ...current };

      for (const step of activeModuleLabSteps) {
        delete next[`${activeModule.id}:${step.id}`];
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
                onClick={() => changeLocale("fr")}
              >
                FR
              </button>
              <button
                type="button"
                aria-pressed={locale === "en"}
                data-active={locale === "en"}
                onClick={() => changeLocale("en")}
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
              onClick={() => changeLocale("fr")}
            >
              FR
            </button>
            <button
              type="button"
              aria-pressed={locale === "en"}
              data-active={locale === "en"}
              onClick={() => changeLocale("en")}
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
            <div className="level-path" aria-hidden="true">
              <span style={{ height: `${levelPathPercent}%` }} />
            </div>
            {content.levels.map((level, levelIndex) => {
              const summary = levelSummaries.find((item) => item.id === level.id);
              const isActive = level.id === activeLevel.id;
              const isComplete = Boolean(summary?.complete);
              const unlocked = isLevelUnlocked(content.levels, levelIndex, completedModules);

              return (
                <button
                  className="level-button"
                  data-active={isActive}
                  data-complete={isComplete}
                  data-locked={!unlocked}
                  aria-current={isActive ? "step" : undefined}
                  aria-disabled={!unlocked}
                  disabled={!unlocked}
                  key={level.id}
                  onClick={() => selectLevel(level.id)}
                  type="button"
                >
                  <span className="level-index">{level.rank}</span>
                  <span className="level-copy">
                    <strong>{text(level.name[locale])}</strong>
                    <span>{unlocked ? text(level.duration[locale]) : t.moduleLocked}</span>
                  </span>
                  {isComplete ? (
                    <CheckCircle2 className="level-icon" size={18} aria-hidden="true" />
                  ) : unlocked ? (
                    <Unlock className="level-icon" size={18} aria-hidden="true" />
                  ) : (
                    <Lock className="level-icon" size={18} aria-hidden="true" />
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
          <section className="compact-dashboard fade-in" aria-label={t.dashboard}>
            <div className="mastery-map" aria-label={t.studyPlan}>
              {content.levels.map((level, levelIndex) => {
                const summary = levelSummaries.find((item) => item.id === level.id);
                const unlocked = isLevelUnlocked(content.levels, levelIndex, completedModules);
                const complete = Boolean(summary?.complete);
                const active = level.id === activeLevel.id;

                return (
                  <button
                    className="mastery-node"
                    data-active={active}
                    data-complete={complete}
                    data-locked={!unlocked}
                    disabled={!unlocked}
                    key={level.id}
                    onClick={() => selectLevel(level.id)}
                    type="button"
                  >
                    <span>{complete ? <CheckCircle2 size={17} /> : unlocked ? <Unlock size={17} /> : <Lock size={17} />}</span>
                    <strong>{text(level.name[locale])}</strong>
                    <small>{summary?.progress ?? 0}%</small>
                  </button>
                );
              })}
            </div>
            <div className="dashboard-hero">
              <div>
                <p className="eyebrow">
                  <BarChart3 size={15} aria-hidden="true" />
                  {t.dashboard}
                </p>
                <h1>{displayName}</h1>
                <p>{moduleNextAction}</p>
              </div>
              <div className="score-ring" aria-label={`${t.readiness}: ${readiness}%`}>
                <span>{readiness}%</span>
                <small>{t.readinessIndex}</small>
              </div>
            </div>

            <div className="dashboard-mini-grid">
              {dashboardInsights.map((insight) => (
                <article className="mini-stat-card" key={insight.id}>
                  <span>
                    {insight.icon}
                    {insight.label}
                  </span>
                  <strong>{insight.value}</strong>
                  <span className="mini-progress" aria-hidden="true">
                    <span style={{ width: `${insight.percent}%` }} />
                  </span>
                  <small>{insight.percent}%</small>
                </article>
              ))}
            </div>

            <div className="module-gate-grid" aria-label={t.moduleControl}>
              {moduleGateCards.map((gate) => (
                <article className="module-gate-card" data-state={gate.state} key={gate.id}>
                  <span>{gate.label}</span>
                  <strong>{gate.value}</strong>
                  <span className="mini-progress" aria-hidden="true">
                    <span style={{ width: `${gate.percent}%` }} />
                  </span>
                </article>
              ))}
            </div>

            <div className="dashboard-footer">
              <span>
                <Unlock size={15} aria-hidden="true" />
                {nextLockedLevel ? `${t.nextLevel}: ${text(nextLockedLevel.name[locale])}` : t.allModulesComplete}
              </span>
              <span>
                <Target size={15} aria-hidden="true" />
                {t.nextFocus}: {nextModule ? text(nextModule.title[locale]) : t.emptyFocus}
              </span>
              <span>
                <GraduationCap size={15} aria-hidden="true" />
                {t.levelProgress}: {currentSummary?.progress ?? 0}%
              </span>
              <span>
                <Trophy size={15} aria-hidden="true" />
                {t.score}: {currentSubmitted ? `${score}/${activeModuleQuiz.length}` : `${answeredCurrent}/${activeModuleQuiz.length}`}
              </span>
              <span>
                <FlaskConical size={15} aria-hidden="true" />
                {t.levelLab}: {labProgressPercent}%
              </span>
              <button className="ghost-button compact-button" type="button" onClick={resetAllProgress}>
                <RotateCcw size={15} aria-hidden="true" />
                {t.resetAll}
              </button>
            </div>
          </section>
          <section className="capstone-arena fade-in" aria-label={t.capstone}>
            <div className="capstone-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="capstone-arena-copy">
              <p className="eyebrow">
                <Trophy size={15} aria-hidden="true" />
                {t.capstone}
              </p>
              <h2>{text(content.capstone.title[locale])}</h2>
              <p>{text(content.capstone.brief[locale])}</p>
              <div className="capstone-progress">
                <span>
                  {capstoneUnlocked ? t.certificateReady : t.certificateLocked}
                  <strong>{capstoneProgress}%</strong>
                </span>
                <span className="capstone-progress-track" aria-hidden="true">
                  <span style={{ width: `${capstoneProgress}%` }} />
                </span>
              </div>
            </div>
            <div className="capstone-deliverables">
              {content.capstone.deliverables[locale].map((deliverable, index) => (
                <span data-ready={capstoneUnlocked} key={index}>
                  {capstoneUnlocked ? <CheckCircle2 size={15} aria-hidden="true" /> : <Lock size={15} aria-hidden="true" />}
                  {text(deliverable)}
                </span>
              ))}
            </div>
          </section>
          {/* ── Module Header ── */}
          <div className="module-header fade-in" key={`header-${activeModule.id}`}>
            <p className="eyebrow">
              <Layers3 size={15} aria-hidden="true" />
              {text(activeLevel.name[locale])} — {t.module} {activeModuleIndex + 1}/{activeLevel.modules.length}
            </p>
            <h2>{text(activeModule.title[locale])}</h2>
            <p>{text(activeModule.summary[locale])}</p>

            {/* Phase indicators */}
            <div className="module-phases">
              <span className="phase-step" data-done={Boolean(moduleRead[activeModule.id])} data-active={activeTab === "course"}>
                {moduleRead[activeModule.id] ? <CheckCircle2 size={14} aria-hidden="true" /> : <BookOpen size={14} aria-hidden="true" />}
                {t.phaseLesson}
              </span>
              <span className="phase-step" data-done={moduleLabDone} data-active={activeTab === "lab"}>
                {moduleLabDone ? <CheckCircle2 size={14} aria-hidden="true" /> : <FlaskConical size={14} aria-hidden="true" />}
                {t.phaseLab}
              </span>
              <span className="phase-step" data-done={moduleQuizPassed} data-active={activeTab === "quiz"}>
                {moduleQuizPassed ? <CheckCircle2 size={14} aria-hidden="true" /> : <ClipboardCheck size={14} aria-hidden="true" />}
                {t.phaseQuiz}
              </span>
            </div>
          </div>

          {/* ── Tab Bar ── */}
          <div className="tab-bar">
            <button className="tab-button" type="button" data-active={activeTab === "course"} onClick={() => { setActiveTab("course"); setModuleRead((c) => ({ ...c, [activeModule.id]: true })); }}>
              <BookOpen size={16} aria-hidden="true" />
              {t.courseTab}
            </button>
            <button className="tab-button" type="button" data-active={activeTab === "lab"} onClick={() => setActiveTab("lab")}>
              <FlaskConical size={16} aria-hidden="true" />
              {t.labTab}
            </button>
            <button className="tab-button" type="button" data-active={activeTab === "quiz"} onClick={() => setActiveTab("quiz")}>
              <ClipboardCheck size={16} aria-hidden="true" />
              {t.quizTab}
            </button>
          </div>

          {/* ── Tab Content ── */}
          <div className="tab-content" key={`${activeModule.id}-${activeTab}`}>

            {/* ══════ COURSE TAB ══════ */}
            {activeTab === "course" && activeModuleDetail && (
              <div className="fade-in course-reader" ref={courseReaderRef}>
                <aside
                  aria-label={t.lessonToc}
                  className="lesson-toc-panel"
                  data-floating={isLessonTocFloating}
                  style={
                    lessonTocLeft === null
                      ? undefined
                      : ({ "--lesson-toc-left": `${lessonTocLeft}px` } as CSSProperties)
                  }
                >
                  <div className="lesson-toc-card">
                    <div className="lesson-toc-header">
                      <span>{t.lessonToc}</span>
                      <strong>
                        {lessonSections.length > 0 ? `${safeLessonSectionIndex + 1}/${lessonSections.length}` : "0/0"}
                      </strong>
                    </div>
                    <div className="reading-progress">
                      <span>
                        {t.readingProgress}
                        <strong>{lessonReadingProgress}%</strong>
                      </span>
                      <span className="reading-progress-track" aria-hidden="true">
                        <span style={{ width: `${lessonReadingProgress}%` }} />
                      </span>
                    </div>
                    <nav className="lesson-toc-list">
                      {lessonSections.map((section, sectionIndex) => (
                        <a
                          aria-current={sectionIndex === safeLessonSectionIndex ? "true" : undefined}
                          className="lesson-toc-link"
                          data-active={sectionIndex === safeLessonSectionIndex}
                          href={`#${getLessonAnchorId(activeModule.id, section.id)}`}
                          key={section.id}
                          onClick={() => setActiveLessonSectionIndex(sectionIndex)}
                        >
                          <span className="toc-num">{sectionIndex + 1}</span>
                          <span>{text(section.title[locale])}</span>
                        </a>
                      ))}
                    </nav>
                  </div>
                </aside>

                <div className="course-reader-main">
                  {/* Overview */}
                  <div className="content-block course-overview-block">
                    <h3><BookOpen size={20} aria-hidden="true" /> {t.overviewTitle}</h3>
                    <p>{text(activeModule.summary[locale])}</p>
                    {activeModuleDetail.estimatedTime && (
                      <div className="highlight-box">
                        <strong>{t.estimatedTime}: </strong>{text(activeModuleDetail.estimatedTime[locale])}
                      </div>
                    )}
                  </div>

                  <ConceptMotionGraph graph={activeMotionGraph} locale={locale} sourceLinks={activeSourceLinks} />

                  {activeCapstoneBridge ? (
                    <div className="content-block capstone-bridge">
                      <h3><ShieldCheck size={20} aria-hidden="true" /> {text(activeCapstoneBridge.title[locale])}</h3>
                      <ul>
                        {activeCapstoneBridge.items.map((item, i) => (
                          <li key={i}>{text(item[locale])}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="course-prep-grid">
                    {/* Learning Objectives */}
                    {activeModuleDetail.objectives && (
                      <div className="content-block">
                        <h3><Target size={20} aria-hidden="true" /> {t.whatYouWillLearn}</h3>
                        <ol>
                          {activeModuleDetail.objectives[locale].map((obj, i) => (
                            <li key={i}>{text(obj)}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Prerequisites */}
                    {activeModuleDetail.prerequisites && (
                      <div className="content-block">
                        <h3><AlertCircle size={20} aria-hidden="true" /> {t.beforeYouStart}</h3>
                        <ul>
                          {activeModuleDetail.prerequisites[locale].map((pre, i) => (
                            <li key={i}>{text(pre)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Lesson Sections */}
                  <div className="lesson-stack" aria-label={t.lessonSections}>
                    {lessonSections.map((section, sectionIndex) => (
                      <article
                        className="lesson-card"
                        data-active={sectionIndex === safeLessonSectionIndex}
                        id={getLessonAnchorId(activeModule.id, section.id)}
                        key={section.id}
                      >
                        <div className="lesson-card-header">
                          <span className="lesson-number">{sectionIndex + 1}</span>
                          <div>
                            <span className="lesson-kicker">
                              {t.lesson} {sectionIndex + 1}/{lessonSections.length}
                            </span>
                            <h3>{text(section.title[locale])}</h3>
                          </div>
                        </div>
                        <p className="lesson-body">{text(section.body[locale])}</p>

                        {section.bullets?.[locale]?.length ? (
                          <ul className="lesson-bullets">
                            {section.bullets[locale].map((bullet, i) => (
                              <li key={i}>{text(bullet)}</li>
                            ))}
                          </ul>
                        ) : null}

                        {section.diagram ? (
                          <div className="diagram-block">
                            <div className="diagram-header">
                              <Layers3 size={15} aria-hidden="true" />
                              {t.architectureDiagram}
                            </div>
                            <pre><code>{section.diagram[locale]}</code></pre>
                          </div>
                        ) : null}

                        {section.codeExamples?.[locale]?.length ? (
                          <div className="code-examples">
                            <div className="code-examples-header">
                              <Terminal size={15} aria-hidden="true" />
                              {t.usefulCommands}
                            </div>
                            <pre><code>{section.codeExamples[locale].join("\n")}</code></pre>
                          </div>
                        ) : null}

                        {section.productionNote ? (
                          <div className="production-note">
                            <span className="production-note-icon" aria-hidden="true">
                              <ShieldCheck size={16} />
                            </span>
                            <p>
                              <strong>{t.productionNoteLabel}</strong>
                              {text(section.productionNote[locale])}
                            </p>
                          </div>
                        ) : null}

                        {section.errorScenario ? (
                          <div className="error-scenario">
                            <span className="error-scenario-icon" aria-hidden="true">
                              <AlertCircle size={16} />
                            </span>
                            <p>
                              <strong>{t.frequentErrorLabel}</strong>
                              {text(section.errorScenario[locale])}
                            </p>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>

                  <div className="section-nav" aria-label={t.lessonSections}>
                    <button
                      className="secondary-button"
                      disabled={safeLessonSectionIndex === 0}
                      onClick={() => moveLessonSection(-1)}
                      type="button"
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                      {t.previousSection}
                    </button>
                    <span>
                      {t.sectionProgress}: {lessonSections.length > 0 ? safeLessonSectionIndex + 1 : 0}/{lessonSections.length}
                    </span>
                    <button
                      className="secondary-button"
                      disabled={lessonSections.length === 0 || safeLessonSectionIndex === lessonSections.length - 1}
                      onClick={() => moveLessonSection(1)}
                      type="button"
                    >
                      {t.nextSection}
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </div>

                {activePedagogy && (
                  <div className="content-block pedagogy-block">
                    <h3><GraduationCap size={20} aria-hidden="true" /> {t.coachMethod}</h3>
                    <div className="pedagogy-grid">
                      <article className="pedagogy-card span-2">
                        <h4><Lightbulb size={16} aria-hidden="true" /> {t.mentalModel}</h4>
                        <p>{text(activePedagogy.mentalModel[locale])}</p>
                      </article>

                      <article className="pedagogy-card scenario-card span-2">
                        <h4><Target size={16} aria-hidden="true" /> {text(activePedagogy.scenario.title[locale])}</h4>
                        <p>{text(activePedagogy.scenario.brief[locale])}</p>
                        <ul>
                          {activePedagogy.scenario.checkpoints[locale].map((checkpoint, i) => (
                            <li key={i}>{text(checkpoint)}</li>
                          ))}
                        </ul>
                      </article>

                      <article className="pedagogy-card">
                        <h4><AlertCircle size={16} aria-hidden="true" /> {t.commonMistakes}</h4>
                        <ul>
                          {activePedagogy.commonMistakes[locale].map((mistake, i) => (
                            <li key={i}>{text(mistake)}</li>
                          ))}
                        </ul>
                      </article>

                      <article className="pedagogy-card">
                        <h4><ClipboardCheck size={16} aria-hidden="true" /> {t.readinessChecklist}</h4>
                        <ul>
                          {activePedagogy.readinessChecklist[locale].map((item, i) => (
                            <li key={i}>{text(item)}</li>
                          ))}
                        </ul>
                      </article>
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {activeModule.keyPoints && (
                  <div className="content-block">
                    <h3><Star size={20} aria-hidden="true" /> {t.keyTakeaways}</h3>
                    <div className="highlight-box green">
                      <ul>
                        {activeModule.keyPoints[locale].map((point, i) => (
                          <li key={i}>{text(point)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Examples */}
                {activeModuleDetail.examples && (
                  <div className="content-block">
                    <h3><Lightbulb size={20} aria-hidden="true" /> {t.realWorldExamples}</h3>
                    <ul>
                      {activeModuleDetail.examples[locale].map((example, i) => (
                        <li key={i}>{text(example)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Practice */}
                {activeModule.practice && (
                  <div className="content-block">
                    <h3><Terminal size={20} aria-hidden="true" /> {t.practiceExercise}</h3>
                    <div className="highlight-box amber">
                      <p style={{ margin: 0 }}>{text(activeModule.practice[locale])}</p>
                    </div>
                  </div>
                )}

                {/* Field Tips */}
                {activeModule.tips && (
                  <div className="content-block">
                    <h3><MessageCircle size={20} aria-hidden="true" /> {t.fieldTips}</h3>
                    <ul>
                      {activeModule.tips[locale].map((tip, i) => (
                        <li key={i}>{text(tip)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Continue to Lab button */}
                <button className="next-step-button" type="button" onClick={() => setActiveTab("lab")}>
                  <FlaskConical size={18} aria-hidden="true" />
                  {t.continueToLab}
                </button>
                </div>
              </div>
            )}

            {/* ══════ LAB TAB ══════ */}
            {activeTab === "lab" && (
              <div className="fade-in">
                {/* Module Mini-Lab */}
                {activeModuleDetail?.guidedLab && (
                  <div className="content-block">
                    <h3><FlaskConical size={20} aria-hidden="true" /> {t.guidedMiniLab}: {text(activeModuleDetail.guidedLab.title[locale])}</h3>
                    <div className="highlight-box">
                      <strong>{t.labObjective}: </strong>{text(activeModuleDetail.guidedLab.objective[locale])}
                    </div>

                    <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                      {activeModuleDetail.guidedLab.steps.map((step, stepIndex) => {
                        const stepKey = `${activeModule.id}:${step.id}`;
                        const isDone = Boolean(moduleLabChecks[stepKey]);

                        return (
                          <div className="lab-step" data-complete={isDone} key={stepKey}>
                            <span className="lab-step-index">{isDone ? <CheckCircle2 size={14} /> : stepIndex + 1}</span>
                            <span>
                              <strong>{text(step.title[locale])}</strong>
                              <span>{text(step.detail[locale])}</span>
                            </span>
                            <button className="compact-button" type="button" onClick={() => toggleModuleLabStep(step.id)}>
                              {isDone ? t.markStepOpen : t.markStepDone}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {moduleLabDone && (
                      <div className="success-banner" style={{ marginTop: 16 }}>
                        <CheckCircle2 size={20} />
                        <div>
                          <strong>{t.labComplete}</strong>
                        </div>
                      </div>
                    )}

                    <button className="ghost-button compact-button" type="button" onClick={resetModuleLabSteps}>
                      <RotateCcw size={15} aria-hidden="true" />
                      {t.resetLab}
                    </button>
                  </div>
                )}

                {/* Level Lab Playbook */}
                {activeLab && (
                  <div className="content-block">
                    <h3><BookOpen size={20} aria-hidden="true" /> {t.labRunbook}: {text(activeLab.title[locale])}</h3>

                    <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                      {activeLab.steps.map((step, stepIndex) => {
                        const stepKey = `${activeLevel.id}:${step.id}`;
                        const isDone = Boolean(labChecks[stepKey]);

                        return (
                          <div className="lab-step" data-complete={isDone} key={stepKey}>
                            <span className="lab-step-index">{isDone ? <CheckCircle2 size={14} /> : stepIndex + 1}</span>
                            <span>
                              <strong>{text(step.title[locale])}</strong>
                              <span>{text(step.detail[locale])}</span>
                            </span>
                            <button className="compact-button" type="button" onClick={() => toggleLabStep(step.id)}>
                              {isDone ? t.markStepOpen : t.markStepDone}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button className="ghost-button compact-button" type="button" onClick={resetLabSteps}>
                      <RotateCcw size={15} aria-hidden="true" />
                      {t.resetLab}
                    </button>
                  </div>
                )}

                {/* Commands */}
                {activeLab?.commands && activeLab.commands.length > 0 && (
                  <div className="content-block">
                    <h3><Terminal size={20} aria-hidden="true" /> {t.commands}</h3>
                    <div className="command-panel">
                      {activeLab.commands.map((cmd) => (
                        <div className="command-row" key={cmd.id}>
                          <div>
                            <span>{text(cmd.label[locale])}</span>
                            <code>{cmd.command}</code>
                          </div>
                          <button
                            className="compact-button"
                            type="button"
                            onClick={() => copyCommand(`${activeLevel.id}:${cmd.id}`, cmd.command)}
                          >
                            {copiedCommandId === `${activeLevel.id}:${cmd.id}` ? (
                              <><CheckCircle2 size={14} aria-hidden="true" /> {t.copied}</>
                            ) : (
                              <><Copy size={14} aria-hidden="true" /> {t.copyCommand}</>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Continue to Quiz */}
                <button className="next-step-button" type="button" onClick={() => setActiveTab("quiz")}>
                  <ClipboardCheck size={18} aria-hidden="true" />
                  {t.continueToQuiz}
                </button>
              </div>
            )}

            {/* ══════ QUIZ TAB ══════ */}
            {activeTab === "quiz" && (
              <div className="fade-in">
                {/* Success banner if passed */}
                {moduleQuizPassed && (
                  <div className="success-banner">
                    <Award size={24} aria-hidden="true" />
                    <div>
                      <strong>{t.congratulations} {t.modulePassed}</strong>
                      <span> — {moduleScorePercent}%</span>
                    </div>
                  </div>
                )}

                {/* Failed banner */}
                {moduleQuizSubmitted && !moduleQuizPassed && (
                  <div className="success-banner" style={{ borderColor: "rgba(224, 113, 104, 0.4)", background: "linear-gradient(135deg, #fef2f2, #fff1f2)" }}>
                    <XCircle size={24} style={{ color: "var(--red)" }} aria-hidden="true" />
                    <div>
                      <strong style={{ color: "var(--red)" }}>{t.moduleFailed}</strong>
                      <span> — {moduleScorePercent}%</span>
                    </div>
                  </div>
                )}

                {/* Remediation feedback */}
                {moduleQuizSubmitted && !moduleQuizPassed && activeModuleDetail?.failureFeedback && (
                  <div className="content-block">
                    <h3><AlertCircle size={20} aria-hidden="true" /> {t.remediation}</h3>
                    <div className="highlight-box amber">
                      <p style={{ margin: 0 }}>{text(activeModuleDetail.failureFeedback[locale])}</p>
                    </div>
                    <p className="remediation-count">
                      {moduleQuizQuestions.length - wrongAnswers.length}/{moduleQuizQuestions.length} {t.correctCount}
                    </p>
                  </div>
                )}

                {/* Quiz info bar */}
                <div className="content-block" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ClipboardCheck size={18} aria-hidden="true" />
                    <strong>{t.moduleQuiz}</strong>
                  </div>
                  <span className="tag">{t.passRequired}</span>
                  {!moduleLabComplete ? <span className="tag" data-state="warning">{t.labRequiredBeforeQuiz}</span> : null}
                  <span className="tag">{moduleQuizQuestions.length} {t.questionCount}</span>
                </div>

                {/* Questions */}
                <div className="quiz-panel" id="quiz">
                  {moduleQuizQuestions.map((q, qIndex) => {
                    const selectedAnswer = answers[q.id];
                    const isAnswered = selectedAnswer !== undefined;

                    return (
                      <div className="question" key={q.id}>
                        <p className="question-title">
                          {qIndex + 1}. {text(q.question[locale])}
                        </p>
                        <div className="answers">
                          {q.options[locale].map((option, optionIndex) => {
                            const state = getAnswerState(
                              selectedAnswer,
                              moduleQuizSubmitted,
                              optionIndex,
                              q.answer
                            );

                            return (
                              <button
                                className="answer"
                                data-state={state}
                                aria-pressed={selectedAnswer === optionIndex}
                                disabled={moduleQuizSubmitted}
                                key={optionIndex}
                                type="button"
                                onClick={() => selectAnswer(q.id, optionIndex)}
                              >
                                <span className="answer-mark">
                                  {state === "correct" ? (
                                    <CheckCircle2 size={18} aria-hidden="true" />
                                  ) : state === "wrong" ? (
                                    <XCircle size={18} aria-hidden="true" />
                                  ) : optionIndex === selectedAnswer ? (
                                    <CheckCircle2 size={18} aria-hidden="true" />
                                  ) : (
                                    <Circle size={18} aria-hidden="true" />
                                  )}
                                </span>
                                {text(option)}
                              </button>
                            );
                          })}
                        </div>

                        {moduleQuizSubmitted && q.explanation && (
                          <div className="explanation">
                            {isAnswered && selectedAnswer !== q.answer && (
                              <p><strong>{t.yourAnswer}:</strong> {text(q.options[locale][selectedAnswer])}</p>
                            )}
                            <p><strong>{t.correctAnswer}:</strong> {text(q.options[locale][q.answer])}</p>
                            <p>{text(q.explanation[locale])}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Quiz actions */}
                  <div className="quiz-actions">
                    {!moduleQuizSubmitted ? (
                      <button
                        className="primary-button"
                        disabled={!canSubmitModuleQuiz}
                        type="button"
                        onClick={submitModuleQuiz}
                      >
                        <ClipboardCheck size={17} aria-hidden="true" />
                        {t.answer}
                      </button>
                    ) : (
                      <button className="secondary-button" type="button" onClick={resetModuleQuiz}>
                        <RotateCcw size={17} aria-hidden="true" />
                        {t.retryModule}
                      </button>
                    )}

                    <span className="score-summary">
                      {moduleQuizSubmitted
                        ? `${t.score}: ${moduleScorePercent}%`
                        : `${moduleQuizQuestions.filter((q) => answers[q.id] !== undefined).length}/${moduleQuizQuestions.length} ${t.answered}`}
                    </span>
                  </div>
                </div>

                {/* Next Module button (shown when passed) */}
                {moduleQuizPassed && canGoNextModule && (
                  <button className="next-step-button" type="button" onClick={goToNextModule} style={{ marginTop: 16 }}>
                    <ChevronRight size={18} aria-hidden="true" />
                    {nextSequentialModule ? t.nextModule : t.nextLevel}
                  </button>
                )}

                {/* Certificate section if all complete */}
                {allModulesComplete && allLabsDone && (
                  <section className="content-block" style={{ marginTop: 20, borderColor: "rgba(15,138,95,0.4)", background: "linear-gradient(135deg, #f0fdf6, #ecfdf5)" }}>
                    <h3><Award size={20} aria-hidden="true" /> {certificateUnlocked ? t.certificateReady : t.certificateLocked}</h3>
                    <p>{t.certificateRule}</p>
                    {certificateUnlocked && (
                      <button className="next-step-button" type="button" onClick={downloadCertificate} style={{ background: "linear-gradient(135deg, var(--green), #059669)" }}>
                        <Download size={18} aria-hidden="true" />
                        {t.downloadCertificate}
                      </button>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
