# Graph Report - .  (2026-05-11)

## Corpus Check
- 100 files · ~62,838 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 385 nodes · 802 edges · 37 communities (25 shown, 12 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core App & Auth Context|Core App & Auth Context]]
- [[_COMMUNITY_Legal & Compliance Docs|Legal & Compliance Docs]]
- [[_COMMUNITY_Cash Register & Closing|Cash Register & Closing]]
- [[_COMMUNITY_Clients & Cart Management|Clients & Cart Management]]
- [[_COMMUNITY_Pages & Navigation|Pages & Navigation]]
- [[_COMMUNITY_App Layout & Providers|App Layout & Providers]]
- [[_COMMUNITY_Error Boundary Components|Error Boundary Components]]
- [[_COMMUNITY_Logotipo SVG Brand Assets|Logotipo SVG Brand Assets]]
- [[_COMMUNITY_Logotipo2 Dark Brand Assets|Logotipo2 Dark Brand Assets]]
- [[_COMMUNITY_Cierre de Caja UI Screen|Cierre de Caja UI Screen]]
- [[_COMMUNITY_Maskable App Icon Assets|Maskable App Icon Assets]]
- [[_COMMUNITY_Service Worker (PWA)|Service Worker (PWA)]]
- [[_COMMUNITY_Sales-Cashbox Migration Script|Sales-Cashbox Migration Script]]
- [[_COMMUNITY_App Icon 512px Assets|App Icon 512px Assets]]
- [[_COMMUNITY_Brand Icon SVG|Brand Icon SVG]]
- [[_COMMUNITY_Logo Spinner Component|Logo Spinner Component]]
- [[_COMMUNITY_App Icon 192px Assets|App Icon 192px Assets]]
- [[_COMMUNITY_Communication Quote Icon|Communication Quote Icon]]
- [[_COMMUNITY_Network Hexagonal Icon|Network Hexagonal Icon]]
- [[_COMMUNITY_Chain Link Icon|Chain Link Icon]]
- [[_COMMUNITY_Shield Security Icon|Shield Security Icon]]
- [[_COMMUNITY_Connection Flow Icon|Connection Flow Icon]]
- [[_COMMUNITY_Staff & Team Functions|Staff & Team Functions]]
- [[_COMMUNITY_Auth Middleware|Auth Middleware]]
- [[_COMMUNITY_Data Migration Service|Data Migration Service]]
- [[_COMMUNITY_Next.js PWA Config|Next.js PWA Config]]
- [[_COMMUNITY_Disclaimer Page|Disclaimer Page]]
- [[_COMMUNITY_Privacy Page|Privacy Page]]
- [[_COMMUNITY_Terms of Service Page|Terms of Service Page]]
- [[_COMMUNITY_Terms Acceptance Modal|Terms Acceptance Modal]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Admin Wipe Database|Admin Wipe Database]]
- [[_COMMUNITY_User Claims Sync Function|User Claims Sync Function]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 43 edges
2. `Button` - 20 edges
3. `useCurrency()` - 19 edges
4. `Card()` - 17 edges
5. `Input` - 17 edges
6. `CardContent()` - 15 edges
7. `Cuadra Application` - 13 edges
8. `UserService` - 12 edges
9. `SalesService` - 11 edges
10. `Privacy Policy Document` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Privacy Policy Document` --semantically_similar_to--> `User Data Rights (Access/Correction/Deletion)`  [INFERRED] [semantically similar]
  PRIVACY_POLICY.md → DISCLAIMER.md
- `Firebase Auth Security (Hashed Passwords)` --semantically_similar_to--> `Firebase Authentication`  [INFERRED] [semantically similar]
  PRIVACY_POLICY.md → README.md
- `User Fiscal Responsibility` --semantically_similar_to--> `Limitation of Liability`  [INFERRED] [semantically similar]
  DISCLAIMER.md → TERMS_OF_SERVICE.md
- `Google Cloud Storage (EE.UU.)` --semantically_similar_to--> `Google Cloud Data Storage`  [INFERRED] [semantically similar]
  PRIVACY_POLICY.md → DISCLAIMER.md
- `PDVD Compliance (Venezuela Data Protection Law 2012)` --semantically_similar_to--> `PDVD (Ley de ProtecciÃ³n de Datos Venezuela 2012)`  [INFERRED] [semantically similar]
  TERMS_OF_SERVICE.md → PRIVACY_POLICY.md

## Hyperedges (group relationships)
- **Legal Compliance Document Triad** — disclaimer_doc, tos_doc, privacy_doc [EXTRACTED 1.00]
- **Terms Acceptance User Flow** — legal_guide_terms_acceptance_modal, legal_guide_accept_terms_api, legal_guide_terms_accepted_at, legal_guide_applayout [EXTRACTED 1.00]
- **SaaS Positioning to Avoid SENIAT Registration** — legal_guide_saas_model, disclaimer_no_fiscal_pos, disclaimer_user_fiscal_responsibility, legal_guide_seniat [EXTRACTED 0.95]

## Communities (37 total, 12 thin omitted)

### Community 0 - "Core App & Auth Context"
Cohesion: 0.13
Nodes (23): BRAND_ASSETS, firebaseConfig, AuthContext, AuthContextType, LegalModal(), LegalModalProps, LegalTab, Movement (+15 more)

### Community 1 - "Legal & Compliance Docs"
Cohesion: 0.07
Nodes (42): User Data Rights (Access/Correction/Deletion), Disclaimer Document, Google Cloud Data Storage, Not a Fiscal POS (No-SENIAT), User Fiscal Responsibility, API Route: /api/users/accept-terms, AppLayout Component, DisclaimerBanner Component (+34 more)

### Community 2 - "Cash Register & Closing"
Cohesion: 0.09
Nodes (18): METHOD_LABELS, NotificationsData, CashboxService, CashClosingService, CashSessionService, InventoryUpdate, MovementLog, ReturnService (+10 more)

### Community 3 - "Clients & Cart Management"
Cohesion: 0.12
Nodes (17): ClientListScreen(), CartContext, CartContextData, CartProvider(), useContactPicker(), CategoryModal(), CategoryModalProps, CATEGORY_ICONS (+9 more)

### Community 4 - "Pages & Navigation"
Cohesion: 0.11
Nodes (25): Home(), CashSessionsPage(), ClientProfileScreen(), CollectionsScreen(), DisclaimerBanner(), useAuth(), useCart(), useCurrency() (+17 more)

### Community 5 - "App Layout & Providers"
Cohesion: 0.11
Nodes (14): metadata, rubik, viewport, Providers(), UpdateDetector(), AuthProvider(), Currency, CurrencyContext (+6 more)

### Community 6 - "Error Boundary Components"
Cohesion: 0.12
Nodes (10): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, AdminGodDashboardPage(), COLORS, COLLECTIONS_TO_WIPE, DataManager, Select() (+2 more)

### Community 7 - "Logotipo SVG Brand Assets"
Cohesion: 0.24
Nodes (12): Brand Logo / Logotype, CSS Class cls-1 (stroke-width: 0px), Color Scheme (single fill, no stroke), SVG Layer: Capa 1, SVG Root Layer: Capa 2, Letterform Paths Group (text characters), Symbol Path Left (mirrored curve), Symbol Path Right (mirrored curve) (+4 more)

### Community 8 - "Logotipo2 Dark Brand Assets"
Cohesion: 0.23
Nodes (11): Brand Logo / Logotype, Dark Fill Color (black/near-black), SVG Layer: Capa 1, SVG Root Layer: Capa 2, Stylized S-Shape or Interlocking Paths, Main Symbol / Icon Mark, Path Group: Icon/Symbol Paths, Path Group: Letterform Paths (+3 more)

### Community 9 - "Cierre de Caja UI Screen"
Cohesion: 0.23
Nodes (12): Abrir Sesion Button, Cierre de Caja Screen, Cierre Record 5/5/2026 20:51, Cierre Record 5/5/2026 21:27, Date Filter Tabs (Hoy/Semana/Mes/Todo), Hacer Cierre Button, Historial de Cierres Section, Navigation Sidebar (+4 more)

### Community 10 - "Maskable App Icon Assets"
Cohesion: 0.43
Nodes (7): App Icon 512px Maskable, Blue Rounded Square Background, Brand Identity, Connection and Link Symbolism, Maskable PWA Icon Format, Progressive Web App Asset, White Interlinked Hexagonal Logomark

### Community 11 - "Service Worker (PWA)"
Cohesion: 0.4
Nodes (5): a(), c, f, r(), t

### Community 12 - "Sales-Cashbox Migration Script"
Cohesion: 0.33
Nodes (4): admin, db, path, serviceAccount

### Community 13 - "App Icon 512px Assets"
Cohesion: 0.4
Nodes (6): App Icon (512px), Blue Rounded Square Background, Brand Identity, Connection / Link Theme, PWA / Mobile App Icon, White Chain/Link Symbol Logo

### Community 14 - "Brand Icon SVG"
Cohesion: 0.4
Nodes (6): Abstract Interlocking S-curve Symbol, Brand Identity / Logo, Cuadra Application, Dual Mirrored Path Design, Monochrome Color Scheme, App Icon SVG

### Community 16 - "App Icon 192px Assets"
Cohesion: 0.6
Nodes (5): App Icon 192px, Blue Rounded Square Background, Abstract N/Link Logomark, Progressive Web App Manifest Icon, White Chain/Link Icon

### Community 17 - "Communication Quote Icon"
Cohesion: 0.5
Nodes (5): Communication / Quote Concept, Monochrome Design Style, Icon 1 - Quotation Marks / Link Symbol, Quotation Marks Visual Element, Two Curved Path Shapes

### Community 18 - "Network Hexagonal Icon"
Cohesion: 0.5
Nodes (5): Interlocking Loop or Link Symbol, Network/Chain Connectivity Concept, Icon 2 - Hexagonal Network/Chain Logo, SVG Layer Capa 1, Hexagonal Outline Shape

### Community 19 - "Chain Link Icon"
Cohesion: 0.6
Nodes (5): Icon 3 - Interlocking Paths / Chain Link Symbol, SVG Layer - Capa 1, Left Curved Path (lower-left chain element), Right Curved Path (upper-right chain element), Chain Link / Connection Symbol

### Community 20 - "Shield Security Icon"
Cohesion: 0.5
Nodes (5): Icon 4 - Shield/Hexagon Shape, Iconos Collection, Security or Protection Symbol, Geometric Path Shape, Visual Icon Design

### Community 21 - "Connection Flow Icon"
Cohesion: 0.6
Nodes (5): Connection / Link Concept, Flow / Chain Concept, Icon 5 - Connection/Link Symbol, Left Curved Path (Lower Body), Right Curved Path (Upper Body)

### Community 22 - "Staff & Team Functions"
Cohesion: 0.5
Nodes (3): CreateStaffData, createStaffMember, deleteStaffMember

## Knowledge Gaps
- **95 isolated node(s):** `eslintConfig`, `withPWA`, `nextConfig`, `config`, `wipeDatabase` (+90 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Pages & Navigation` to `Core App & Auth Context`, `Cash Register & Closing`, `Clients & Cart Management`, `App Layout & Providers`, `Error Boundary Components`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `withPWA`, `nextConfig` to the rest of the system?**
  _95 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core App & Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Legal & Compliance Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Cash Register & Closing` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Clients & Cart Management` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Pages & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._