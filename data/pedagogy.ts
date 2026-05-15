import type { Locale, Localized } from "./course-types";

export type PedagogyModuleGuide = {
  mentalModel: Localized;
  scenario: {
    brief: Localized;
    checkpoints: Record<Locale, string[]>;
    title: Localized;
  };
  commonMistakes: Record<Locale, string[]>;
  readinessChecklist: Record<Locale, string[]>;
};

export const pedagogyGuides: Record<string, PedagogyModuleGuide> = {
  "cloud-foundations": {
    mentalModel: {
      fr: "Pense Google Cloud comme une hiérarchie de responsabilités : l'organisation fixe le cadre, les dossiers segmentent les équipes, les projets isolent les ressources, IAM décide qui peut agir.",
      en: "Think of Google Cloud as a responsibility hierarchy: the organization sets guardrails, folders segment teams, projects isolate resources, and IAM decides who can act."
    },
    scenario: {
      title: { fr: "Scénario : préparer un projet de lab sécurisé", en: "Scenario: prepare a secure lab project" },
      brief: {
        fr: "Tu rejoins une équipe qui doit créer un environnement de test. Ton rôle est d'identifier le projet, vérifier les rôles IAM et éviter les permissions trop larges avant de créer des ressources.",
        en: "You join a team that must create a test environment. Your role is to identify the project, review IAM roles, and avoid overly broad permissions before resources are created."
      },
      checkpoints: {
        fr: ["Retrouver project ID et project number.", "Identifier les rôles Owner/Editor/Viewer et leur risque.", "Confirmer que les API nécessaires sont activées."],
        en: ["Find the project ID and project number.", "Identify Owner/Editor/Viewer roles and their risk.", "Confirm that required APIs are enabled."]
      }
    },
    commonMistakes: {
      fr: ["Confondre project ID et nom affiché.", "Donner Owner pour résoudre un blocage temporaire.", "Oublier qu'une ressource appartient toujours à un projet."],
      en: ["Confusing project ID with display name.", "Granting Owner to fix a temporary blocker.", "Forgetting that every resource belongs to a project."]
    },
    readinessChecklist: {
      fr: ["Je peux expliquer la différence entre organization, folder et project.", "Je sais vérifier un rôle IAM et son périmètre.", "Je sais pourquoi le moindre privilège est une règle de base."],
      en: ["I can explain the difference between organization, folder, and project.", "I can review an IAM role and its scope.", "I know why least privilege is a baseline rule."]
    }
  },
  "vpc-basics": {
    mentalModel: {
      fr: "Un VPC est le réseau privé global. Les subnets sont régionaux. Les routes indiquent le chemin, les règles firewall décident si le paquet passe.",
      en: "A VPC is the global private network. Subnets are regional. Routes define the path, firewall rules decide whether packets are allowed."
    },
    scenario: {
      title: { fr: "Scénario : recréer le réseau default proprement", en: "Scenario: recreate the default network cleanly" },
      brief: {
        fr: "Après suppression du réseau default, tu dois créer mynetwork en mode automatique et prouver que deux VM peuvent communiquer par IP interne et externe.",
        en: "After deleting the default network, you must create mynetwork in automatic mode and prove that two VMs can communicate through internal and external IPs."
      },
      checkpoints: {
        fr: ["Créer mynetwork en mode Automatic.", "Vérifier les subnets us-west1/europe-west4 ou ceux du lab.", "Tester SSH, ping interne et ping externe."],
        en: ["Create mynetwork in Automatic mode.", "Review the us-west1/europe-west4 subnets or the lab regions.", "Test SSH, internal ping, and external ping."]
      }
    },
    commonMistakes: {
      fr: ["Chercher mynetwork avant de l'avoir créé.", "Créer un subnet custom alors que le lab demande Automatic.", "Croire que ping teste SSH alors qu'il teste ICMP."],
      en: ["Looking for mynetwork before creating it.", "Creating a custom subnet when the lab asks for Automatic.", "Thinking ping tests SSH when it tests ICMP."]
    },
    readinessChecklist: {
      fr: ["Je sais où trouver VPC networks, Routes et Firewall.", "Je sais associer une VM à un subnet régional.", "Je peux expliquer quelle règle autorise ICMP ou SSH."],
      en: ["I know where to find VPC networks, Routes, and Firewall.", "I can attach a VM to a regional subnet.", "I can explain which rule allows ICMP or SSH."]
    }
  },
  "compute-and-storage": {
    mentalModel: {
      fr: "Compute exécute, Storage persiste, Cloud SQL structure les données. En production, chaque service doit avoir une identité, un réseau, une sauvegarde et un mode d'accès clair.",
      en: "Compute runs, Storage persists, Cloud SQL structures data. In production, every service needs a clear identity, network path, backup, and access pattern."
    },
    scenario: {
      title: { fr: "Scénario : publier une application simple", en: "Scenario: publish a simple application" },
      brief: {
        fr: "Tu dois déployer une VM web, stocker des médias dans Cloud Storage et préparer une base Cloud SQL sans ouvrir plus d'accès que nécessaire.",
        en: "You must deploy a web VM, store media in Cloud Storage, and prepare a Cloud SQL database without opening more access than needed."
      },
      checkpoints: {
        fr: ["Choisir e2-micro pour un lab à coût réduit.", "Activer seulement le trafic HTTP si le test l'exige.", "Noter le service account utilisé par la VM."],
        en: ["Choose e2-micro for a low-cost lab.", "Allow HTTP traffic only if the test requires it.", "Note the service account used by the VM."]
      }
    },
    commonMistakes: {
      fr: ["Laisser une IP externe en production sans justification.", "Rendre un bucket public par facilité.", "Oublier les sauvegardes Cloud SQL."],
      en: ["Leaving an external IP in production without justification.", "Making a bucket public for convenience.", "Forgetting Cloud SQL backups."]
    },
    readinessChecklist: {
      fr: ["Je sais choisir une machine selon coût et charge.", "Je comprends l'usage d'un bucket et d'une base relationnelle.", "Je sais repérer les options réseau d'une VM."],
      en: ["I can choose a machine type based on cost and workload.", "I understand when to use a bucket or a relational database.", "I can identify VM networking options."]
    }
  },
  "firewall-identity": {
    mentalModel: {
      fr: "Un firewall moderne ne doit pas seulement raisonner en IP. Les service accounts expriment l'identité du workload et rendent les flux plus robustes.",
      en: "A modern firewall should not reason only about IPs. Service accounts express workload identity and make flows more robust."
    },
    scenario: {
      title: { fr: "Scénario : microservices privés", en: "Scenario: private microservices" },
      brief: {
        fr: "Trois services doivent communiquer sur des ports précis. Tu écris la matrice de flux puis tu crées les règles basées sur les comptes de service.",
        en: "Three services must communicate on precise ports. You write the flow matrix, then create service-account-based rules."
      },
      checkpoints: {
        fr: ["Définir source, destination, port et justification.", "Utiliser target service account pour limiter la règle.", "Activer les logs sur les flux sensibles."],
        en: ["Define source, destination, port, and justification.", "Use target service account to limit the rule.", "Enable logs on sensitive flows."]
      }
    },
    commonMistakes: {
      fr: ["Utiliser 0.0.0.0/0 pour un flux interne.", "Nommer les règles sans indiquer le flux.", "Oublier que la priorité la plus petite gagne."],
      en: ["Using 0.0.0.0/0 for an internal flow.", "Naming rules without describing the flow.", "Forgetting that the lowest priority number wins."]
    },
    readinessChecklist: {
      fr: ["Je sais lire une règle firewall complète.", "Je sais cibler par tag ou service account.", "Je peux justifier chaque port ouvert."],
      en: ["I can read a full firewall rule.", "I can target by tag or service account.", "I can justify every open port."]
    }
  },
  "load-balancing-cdn-dns": {
    mentalModel: {
      fr: "DNS trouve l'entrée, le load balancer distribue vers des backends sains, Cloud CDN rapproche les contenus statiques des utilisateurs.",
      en: "DNS finds the entry point, the load balancer distributes traffic to healthy backends, and Cloud CDN brings static content closer to users."
    },
    scenario: {
      title: { fr: "Scénario : site public mondial", en: "Scenario: global public site" },
      brief: {
        fr: "Une application doit être accessible mondialement. Tu configures DNS, HTTPS load balancing, health checks et cache CDN pour réduire la latence.",
        en: "An application must be globally reachable. You configure DNS, HTTPS load balancing, health checks, and CDN caching to reduce latency."
      },
      checkpoints: {
        fr: ["Associer DNS à l'IP du load balancer.", "Autoriser les health checks côté firewall.", "Vérifier les headers de cache."],
        en: ["Map DNS to the load balancer IP.", "Allow health checks in firewall rules.", "Review cache headers."]
      }
    },
    commonMistakes: {
      fr: ["Pointer DNS directement vers une VM fragile.", "Oublier la règle firewall des health checks.", "Cacher du contenu dynamique sans stratégie."],
      en: ["Pointing DNS directly to a fragile VM.", "Forgetting the health check firewall rule.", "Caching dynamic content without a strategy."]
    },
    readinessChecklist: {
      fr: ["Je sais expliquer frontend, backend service et health check.", "Je sais quand activer Cloud CDN.", "Je comprends l'impact du TTL DNS."],
      en: ["I can explain frontend, backend service, and health check.", "I know when to enable Cloud CDN.", "I understand DNS TTL impact."]
    }
  },
  "gke-run-serverless": {
    mentalModel: {
      fr: "Cloud Run optimise la simplicité serverless. GKE donne le contrôle Kubernetes. Le bon choix dépend du niveau d'exploitation que l'équipe peut assumer.",
      en: "Cloud Run optimizes serverless simplicity. GKE gives Kubernetes control. The right choice depends on the operations level the team can handle."
    },
    scenario: {
      title: { fr: "Scénario : choisir un runtime conteneur", en: "Scenario: choose a container runtime" },
      brief: {
        fr: "Une équipe hésite entre Cloud Run et GKE. Tu compares trafic, réseau, déploiement, scaling et contraintes de sécurité avant de recommander une option.",
        en: "A team is deciding between Cloud Run and GKE. You compare traffic, networking, deployment, scaling, and security constraints before recommending an option."
      },
      checkpoints: {
        fr: ["Identifier besoin HTTP, jobs ou événements.", "Comparer simplicité Cloud Run et contrôle GKE.", "Vérifier IAM d'invocation ou exposition réseau."],
        en: ["Identify HTTP, jobs, or event needs.", "Compare Cloud Run simplicity with GKE control.", "Check invocation IAM or network exposure."]
      }
    },
    commonMistakes: {
      fr: ["Choisir GKE pour une simple API sans besoin Kubernetes.", "Ignorer les revisions Cloud Run.", "Oublier que serverless n'annule pas les règles IAM."],
      en: ["Choosing GKE for a simple API with no Kubernetes need.", "Ignoring Cloud Run revisions.", "Forgetting that serverless does not remove IAM rules."]
    },
    readinessChecklist: {
      fr: ["Je sais dire quand Cloud Run suffit.", "Je sais identifier les cas où GKE est pertinent.", "Je comprends image, revision, service et ingress."],
      en: ["I know when Cloud Run is enough.", "I can identify when GKE is relevant.", "I understand image, revision, service, and ingress."]
    }
  },
  "hybrid-connectivity": {
    mentalModel: {
      fr: "Le réseau hybride relie deux mondes. Le succès dépend du plan CIDR, de la redondance, du routage dynamique et de la preuve de connectivité.",
      en: "Hybrid networking connects two worlds. Success depends on the CIDR plan, redundancy, dynamic routing, and connectivity proof."
    },
    scenario: {
      title: { fr: "Scénario : connecter un datacenter", en: "Scenario: connect a data center" },
      brief: {
        fr: "Une entreprise doit connecter on-prem à Google Cloud. Tu dois choisir VPN ou Interconnect, préparer les plages IP et définir la haute disponibilité.",
        en: "A company must connect on-prem to Google Cloud. You must choose VPN or Interconnect, prepare IP ranges, and define high availability."
      },
      checkpoints: {
        fr: ["Valider qu'aucun CIDR ne se chevauche.", "Choisir VPN ou Interconnect selon SLA et débit.", "Documenter Cloud Router, ASN et routes annoncées."],
        en: ["Validate that no CIDR overlaps.", "Choose VPN or Interconnect based on SLA and throughput.", "Document Cloud Router, ASN, and advertised routes."]
      }
    },
    commonMistakes: {
      fr: ["Découvrir un chevauchement CIDR trop tard.", "Créer un seul tunnel sans HA.", "Modifier des routes sans plan de rollback."],
      en: ["Discovering CIDR overlap too late.", "Creating a single tunnel without HA.", "Changing routes without a rollback plan."]
    },
    readinessChecklist: {
      fr: ["Je sais lire un plan IP hybride.", "Je comprends BGP et Cloud Router au niveau conceptuel.", "Je peux proposer une architecture HA."],
      en: ["I can read a hybrid IP plan.", "I conceptually understand BGP and Cloud Router.", "I can propose an HA architecture."]
    }
  },
  "hybrid-dns": {
    mentalModel: {
      fr: "Le DNS hybride est un graphe de résolution. Chaque zone doit avoir un propriétaire clair et un chemin sans boucle.",
      en: "Hybrid DNS is a resolution graph. Every zone needs a clear owner and a loop-free path."
    },
    scenario: {
      title: { fr: "Scénario : résoudre les noms privés", en: "Scenario: resolve private names" },
      brief: {
        fr: "Les VM cloud doivent résoudre des domaines on-prem et inversement. Tu conçois les zones privées, forwarding policies et tests dig/nslookup.",
        en: "Cloud VMs must resolve on-prem domains and the reverse. You design private zones, forwarding policies, and dig/nslookup tests."
      },
      checkpoints: {
        fr: ["Lister zones cloud et on-prem.", "Décider qui répond pour chaque domaine.", "Tester la résolution depuis chaque côté."],
        en: ["List cloud and on-prem zones.", "Decide who answers for each domain.", "Test resolution from each side."]
      }
    },
    commonMistakes: {
      fr: ["Créer une boucle de forwarding.", "Oublier la latence DNS dans le diagnostic.", "Ne pas documenter le propriétaire d'une zone."],
      en: ["Creating a forwarding loop.", "Ignoring DNS latency during diagnosis.", "Not documenting zone ownership."]
    },
    readinessChecklist: {
      fr: ["Je sais choisir zone privée, forwarding ou peering.", "Je sais tester avec dig ou nslookup.", "Je peux dessiner le chemin d'une requête DNS."],
      en: ["I can choose private zone, forwarding, or peering.", "I can test with dig or nslookup.", "I can draw the path of a DNS query."]
    }
  },
  "monitoring-troubleshooting": {
    mentalModel: {
      fr: "Un bon diagnostic réseau suit les couches : DNS, route, firewall, service, health check, logs. On ne corrige qu'après avoir une preuve.",
      en: "Good network troubleshooting follows layers: DNS, route, firewall, service, health check, logs. You fix only after gathering evidence."
    },
    scenario: {
      title: { fr: "Scénario : incident HTTP intermittent", en: "Scenario: intermittent HTTP incident" },
      brief: {
        fr: "Des utilisateurs voient des erreurs. Tu dois reproduire, isoler la couche responsable, lire les logs et valider une correction minimale.",
        en: "Users see errors. You must reproduce, isolate the failing layer, read logs, and validate a minimal fix."
      },
      checkpoints: {
        fr: ["Noter résultat attendu et observé.", "Tester DNS, route, firewall et port d'écoute.", "Relancer le même test après correction."],
        en: ["Record expected and observed results.", "Test DNS, route, firewall, and listening port.", "Run the same test after the fix."]
      }
    },
    commonMistakes: {
      fr: ["Ouvrir tous les ports au lieu d'isoler la cause.", "Changer plusieurs paramètres à la fois.", "Ne pas garder les timestamps et IP source/destination."],
      en: ["Opening every port instead of isolating the cause.", "Changing multiple settings at once.", "Not keeping timestamps and source/destination IPs."]
    },
    readinessChecklist: {
      fr: ["Je sais formuler une hypothèse testable.", "Je sais utiliser logs firewall et Connectivity Tests.", "Je peux documenter preuve, correction et rollback."],
      en: ["I can write a testable hypothesis.", "I can use firewall logs and Connectivity Tests.", "I can document evidence, fix, and rollback."]
    }
  },
  "edge-security": {
    mentalModel: {
      fr: "La sécurité edge protège avant les backends. On commence par observer, puis on bloque avec des règles ciblées et mesurables.",
      en: "Edge security protects before backends. You start by observing, then block with targeted and measurable rules."
    },
    scenario: {
      title: { fr: "Scénario : protéger une application publique", en: "Scenario: protect a public application" },
      brief: {
        fr: "Une application derrière un load balancer reçoit du trafic suspect. Tu ajoutes Cloud Armor, WAF, rate limiting et alertes sans casser les vrais utilisateurs.",
        en: "An application behind a load balancer receives suspicious traffic. You add Cloud Armor, WAF, rate limiting, and alerts without breaking real users."
      },
      checkpoints: {
        fr: ["Identifier endpoints publics.", "Créer une policy en mode observation.", "Mesurer denies, faux positifs et latence."],
        en: ["Identify public endpoints.", "Create a policy in observation mode.", "Measure denies, false positives, and latency."]
      }
    },
    commonMistakes: {
      fr: ["Bloquer trop large sans mesurer.", "Ne pas prévoir d'exception temporaire.", "Oublier les logs Cloud Armor."],
      en: ["Blocking too broadly without measuring.", "Not planning a temporary exception.", "Forgetting Cloud Armor logs."]
    },
    readinessChecklist: {
      fr: ["Je sais où s'attache Cloud Armor.", "Je comprends WAF, deny ciblé et rate limiting.", "Je sais passer d'observation à blocage."],
      en: ["I know where Cloud Armor attaches.", "I understand WAF, targeted deny, and rate limiting.", "I know how to move from observation to blocking."]
    }
  },
  "egress-nat-inspection": {
    mentalModel: {
      fr: "L'egress sécurisé permet de sortir sans exposer les VM. Cloud NAT donne l'accès sortant, le proxy et l'inspection ajoutent contrôle et visibilité.",
      en: "Secure egress allows outbound access without exposing VMs. Cloud NAT gives outbound access, while proxy and inspection add control and visibility."
    },
    scenario: {
      title: { fr: "Scénario : VM privée avec sortie contrôlée", en: "Scenario: private VM with controlled egress" },
      brief: {
        fr: "Une VM sans IP externe doit télécharger des mises à jour. Tu configures Cloud NAT, observes les logs et proposes une inspection egress adaptée.",
        en: "A VM without an external IP must download updates. You configure Cloud NAT, observe logs, and propose suitable egress inspection."
      },
      checkpoints: {
        fr: ["Créer une VM sans IP externe.", "Associer Cloud Router et Cloud NAT.", "Vérifier curl sortant et logs NAT."],
        en: ["Create a VM without an external IP.", "Attach Cloud Router and Cloud NAT.", "Verify outbound curl and NAT logs."]
      }
    },
    commonMistakes: {
      fr: ["Penser que Cloud NAT autorise l'ingress.", "Ajouter une IP externe pour contourner un blocage.", "Ne pas dimensionner les ports NAT."],
      en: ["Thinking Cloud NAT allows ingress.", "Adding an external IP to bypass a blocker.", "Not sizing NAT ports."]
    },
    readinessChecklist: {
      fr: ["Je sais expliquer ingress vs egress.", "Je sais pourquoi une VM privée peut sortir sans IP publique.", "Je peux choisir entre NAT, proxy et IDS."],
      en: ["I can explain ingress versus egress.", "I know why a private VM can reach out without a public IP.", "I can choose between NAT, proxy, and IDS."]
    }
  },
  governance: {
    mentalModel: {
      fr: "La gouvernance rend le réseau répétable : standards, owners, logs, exceptions datées et politiques hiérarchiques empêchent la dérive.",
      en: "Governance makes networking repeatable: standards, owners, logs, dated exceptions, and hierarchical policies prevent drift."
    },
    scenario: {
      title: { fr: "Scénario : standard réseau d'entreprise", en: "Scenario: enterprise network standard" },
      brief: {
        fr: "Tu dois créer une matrice de règles et exceptions pour plusieurs projets. L'objectif est de bloquer les risques communs sans empêcher les équipes de livrer.",
        en: "You must create a rule and exception matrix for multiple projects. The goal is to block common risks without preventing teams from shipping."
      },
      checkpoints: {
        fr: ["Classer deny global, allow standard et exception.", "Définir owner, date d'expiration et justification.", "Prévoir revue et alertes sur règles larges."],
        en: ["Classify global deny, standard allow, and exception.", "Define owner, expiration date, and justification.", "Plan reviews and alerts on broad rules."]
      }
    },
    commonMistakes: {
      fr: ["Laisser des exceptions permanentes.", "Ne pas activer les logs sur les flux sensibles.", "Permettre aux projets de contourner les règles critiques."],
      en: ["Leaving permanent exceptions.", "Not enabling logs on sensitive flows.", "Allowing projects to bypass critical rules."]
    },
    readinessChecklist: {
      fr: ["Je sais construire une matrice de gouvernance firewall.", "Je comprends les policies hiérarchiques.", "Je peux auditer les règles trop larges."],
      en: ["I can build a firewall governance matrix.", "I understand hierarchical policies.", "I can audit overly broad rules."]
    }
  }
};
