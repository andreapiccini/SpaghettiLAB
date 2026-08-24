# Modello deployment, ruoli e accesso remoto

[Indice master Software](SOFTWARE_MASTER_INDEX.md) ·
[Dashboard](dashboard/DASHBOARD_ARCHITECTURE.md) ·
[Node-RED](node-red/README.md) ·
[React Flow](REACT_FLOW_ARCHITECTURE.md) ·
[Roadmap accesso](roadmap/ecosystem-access-v1/README.md)

## Scopo

Formalizzare come SpaghettiLAB vende **valore già configurato** (non solo
ecosistema da implementare): pacchetti turnkey per il cliente finale, con
**dashboard + host Node-RED** on-prem (o edge), **ruoli differenziati** e
**accesso remoto sicuro** per partner e assistenza SpaghettiLAB.

Questo documento è la fonte di verità per identità, tenancy e permessi **a
livello prodotto**. L'enforcement reale vive sempre sul **Dashboard Host**
(central authority); le app (Flutter, React Flow, Node-RED Admin) fanno solo UI +
controlli preventivi locali (coerente con S121).

## Due modi di vendere

| Modello | Cliente ottiene | Chi configura sotto |
|---|---|---|
| **Ecosistema** | Tool + protocollo; implementa da zero | Cliente / integratore |
| **Turnkey (Site Package)** | Stack funzionante + UI + flussi base | Partner o SpaghettiLAB **prima** della consegna |

Il turnkey non sostituisce React Flow per chi progetta: **riduce a zero** il lavoro
per l'utente finale che deve solo accendere, collegare rete e usare la dashboard.

## Topologia deployment

```text
                    ┌─────────────────────────────────────┐
                    │  Partner org (studio progettazione)   │
                    │  brand, Site Package, multi-cliente   │
                    └──────────────┬──────────────────────┘
                                   │ gestione (con permesso)
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   Customer org A            Customer org B            SpaghettiLAB
   Site on-prem              Site on-prem              support (grant)
   ┌─────────────────┐      ┌─────────────────┐
   │ Docker stack    │      │ Docker stack    │
   │ - Dashboard Host│      │ - Dashboard Host│
   │ - Node-RED      │      │ - Node-RED      │
   │ - MQTT/broker*  │      │ - MQTT/broker*  │
   │ - optional BLE  │      │                 │
   │   gateway       │      │                 │
   └────────┬────────┘      └────────┬────────┘
            │ LAN                     │
            ▼                         ▼
        Core / dispositivi        Core / dispositivi

* componenti secondo Site Package; non obbligatori in ogni turnkey
```

**Regola:** dashboard Flutter e Node-RED Admin **non** parlano direttamente con i
Core senza passare dal **Dashboard Host** (auth, audit, exposure, policy).

## Tenancy (gerarchia)

```text
Platform (SpaghettiLAB)
  └── PartnerOrg?          ← studio brandizzato (opzionale)
        └── CustomerOrg  ← azienda finale
              └── Site     ← istanza deploy (impianto, sede, casa pro)
                    └── Devices / Systems (Core esposti)
```

- Un **Site** = un compose stack + un `siteId` + credenziali + Site Package applicato.
- Un utente appartiene a una o più org con **ruoli per org/site**.
- Partner vede **solo** i site del proprio portafoglio clienti (mai altri partner).

## Attori e ruoli

Ruoli **prodotti** (non tecnici Protocol V1):

| Ruolo | Chi è | Obiettivo |
|---|---|---|
| **viewer** | Operatore / utente base | Guarda dashboard, nessuna config |
| **operator** | Operatore con controllo | Dashboard + comandi manuali su punti esposti |
| **site_admin** | IT azienda / referente | Utenti locali, policy, approva supporto remoto |
| **site_technician** | Tecnico che installa device | Onboarding device, diagnostica, manutenzione site |
| **integrator** | Progettista sul campo | Exposure, Node-RED, pack grafici (no platform) |
| **partner_admin** | Studio di progettazione | Multi-site clienti, brand, Site Package, utenti cliente |
| **partner_engineer** | Tecnico dello studio | Deploy e manutenzione per conto partner |
| **spaghetti_support** | Assistenza SpaghettiLAB | Solo via **Support Grant** approvato + audit |
| **platform_admin** | SpaghettiLAB interno | Marketplace, policy piattaforma (non accesso customer default) |

I ruoli sono **cumulativi per scope**: stesso login può essere `operator` su site A e
`partner_engineer` su site clienti del partner.

## Superfici e responsabilità

| Superficie | Cosa fa | Chi la usa |
|---|---|---|
| **Dashboard Flutter** | Presentazione, comandi manuali, appearance (entro policy) | viewer → operator |
| **Node-RED** | Automazioni, integrazioni (Telegram, …) | integrator+ (editor); runtime always-on |
| **React Flow** | Ingegneria Core, processing, exposure authoring | partner_engineer, integrator |
| **Dashboard Host API** | Auth, RBAC, exposure, audit, support grant | tutte le UI |

La dashboard **non** diventa editor Node-RED: al massimo link "Apri automazioni"
per ruoli autorizzati (browser verso Node-RED Admin scoped).

## Matrice permessi (sintesi)

Legenda: ✅ consentito · 🔒 policy/approvazione · ❌ no · 👁 read-only

| Capacità | viewer | operator | site_admin | site_technician | integrator | partner_* | spaghetti_support* |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Vedere dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👁/🔒 |
| Comandi manuali esposti | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Modificare appearance/layout | ❌ | ❌* | ✅ | ❌ | ✅ | ✅ | 🔒 |
| Marketplace pack | ❌ | ❌ | 🔒 | ❌ | ✅ | ✅ | ❌ |
| Node-RED editor | ❌ | ❌ | 👁 | 👁 | ✅ | ✅ | 🔒 |
| Node-RED deploy | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | 🔒 |
| React Flow / deploy Config | ❌ | ❌ | ❌ | 🔒 | ✅ | ✅ | 🔒 |
| Gestione utenti site | ❌ | ❌ | ✅ | ❌ | 🔒 | ✅ | ❌ |
| Approvare Support Grant | ❌ | ❌ | ✅ | ❌ | ❌ | 🔒 | — |
| Onboarding device | ❌ | ❌ | 🔒 | ✅ | ✅ | ✅ | 🔒 |

\* `operator` appearance solo se Site Package lo permette (kiosk locked).  
\* `spaghetti_support` **solo** durante Support Grant attivo, scope esplicito.

### Mapping verso scope tecnici (S121 estensione futura)

Gli scope `PERMISSION_SCOPES` React Flow (S121) restano per ingegneria. Aggiungere
parallelamente scope **dashboard/host** (implementazione E040+):

```text
dashboard.view
dashboard.command
dashboard.appearance.edit
dashboard.layout.edit
host.user.manage
host.support.grant.approve
host.support.session
nodered.view
nodered.edit
nodered.deploy
partner.site.manage
partner.brand.manage
```

L'host emette JWT/session con scope; ogni app fa `checkPermission` locale + enforcement
host.

## Site Package (prodotto turnkey)

Unità consegnabile al cliente — **manifest versionato**, non codice ad hoc:

```text
SitePackage
  packageId, name, version
  partnerId?, brandRef?
  dockerComposeProfile     ← servizi inclusi (host, node-red, broker, gateway)
  visualPackRef              ← dashboard look + optional scene
  nodeRedFlowBundleRef       ← flow import (Telegram, logiche base)
  exposureManifestRef      ← punti esposti pre-mappati
  defaultRoles[]             ← es. primo site_admin invito
  policy:
    appearanceLocked?
    maxSupportGrantHours?
    allowedIntegrations[]?
```

**Flusso consegna:**

1. Partner/SpaghettiLAB prepara Site Package (React Flow + Node-RED + Visual Pack).
2. Cliente installa stack Docker on-prem (`compose up`) o appliance fornita.
3. Primo accesso: wizard attivazione + invito `site_admin`.
4. Utenti base ricevono dashboard già popolata — **zero implementazione**.

## Accesso remoto sicuro (SpaghettiLAB e partner)

**Mai** backdoor permanente. Modello **Support Grant**:

```text
SupportGrant
  grantId, siteId
  requesterOrg     ← spaghetti | partner
  requestedBy      ← user id
  approvedBy?      ← site_admin (obbligatorio per spaghetti_support)
  scope            ← read_only | maintenance | full_integrator
  expiresAt        ← max duration (policy site, es. 8h)
  auditChannel     ← append-only id
```

**Flusso:**

1. Cliente apre ticket / partner richiede accesso / SpaghettiLAB propone grant.
2. `site_admin` (o `partner_admin` se contratto lo prevede) **approva** scope + durata.
3. Sessione temporanea. Infra produzione: reverse SSH / Tailscale ACL / HTTPS mTLS
   (nessuna porta permanente). FakeHost usa `channel: demo://loopback`.
4. Ogni azione in grant → audit (`host.support.session` scope).
5. Scadenza automatica; revoca manuale anytime.

Per **partner_engineer** su site cliente: grant **più lungo** o ruolo permanente
definito in contratto — stesso meccanismo audit, no eccezioni non tracciate.

## Brand / white-label

- `PartnerOrg` possiede: logo, palette default, Visual Pack preinstallati, dominio
  opzionale (`dashboard.cliente-partner.it`).
- `CustomerOrg` può override appearance **solo se** `appearanceLocked: false`.
- Dashboard Flutter legge `brand` + policy da host — già previsto in `DashboardAppearance`.

## Cosa NON fa questo modello

- Non sostituisce Identity/Protocol V1 sul Core (device auth resta firmware).
- Non mette RBAC nel firmware "per la dashboard".
- Non permette a SpaghettiLAB di accedere senza approvazione site (salvo contratto
  enterprise esplicito documentato — comunque via grant auditato).

## Fasi di implementazione

| Fase | Contenuto | Roadmap |
|---|---|---|
| **Doc + hook** | Modello congelato; capability flags in HOST_API | E010 (questo doc) |
| **Host auth/RBAC** | JWT, ruoli, enforcement | E020–E040 |
| **Dashboard login** | UI role-aware | E050 |
| **Node-RED scoped** | Admin auth allineato host | E060 |
| **Site Package** | Manifest + compose profile | E070 |
| **Support Grant** | Approve + session + audit | E080 |
| **Partner tenancy** | Multi-customer portal | E090 |

Dettaglio task: [`roadmap/ecosystem-access-v1/README.md`](roadmap/ecosystem-access-v1/README.md).

## Relazione con roadmap esistenti

| Roadmap | Relazione |
|---|---|
| dashboard-v1 (D0xx) | Fase 1 UI senza login; hook `capabilities` e doc E010 |
| react-flow-v1 S121 | Scope ingegneria; estendere con scope dashboard/host |
| node-red | Auth admin + deploy scoped (E060) |
| Firmware 355 identity | Device/principal sul Core ≠ user dashboard |
