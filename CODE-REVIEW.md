## AIPOPS Workboard – Kode- og UX‑review

Denne fil samler en gennemgang af app’ens kodebase, arkitektur og UX‑kvalitet.

---

### 1. Arkitektur & overblik

- **Overordnet arkitektur**
  - Én stor `App.tsx` der styrer:
    - global state (workspace, projekter, opgaver, filtre, onboarding, tour, confirm‑modals, drag‑state osv.)
    - hele layoutet (sidebar, board, detaljer, modaler).
  - **Storage‑lag** er pænt adskilt i `storage.ts` med rene funktioner til CRUD på filer.
  - Typer (`TaskRecord`, `ProjectRecord` osv.) er centralt defineret i `types.ts`.

**Vurdering**  
Arkitekturen er enkel og “monolitisk” i UI‑delen. Det er fint til en mindre app, men `App.tsx` er nu blevet ret tung (1200+ linjer), så på sigt vil det give mening at splitte op.

---

### 2. Kvalitet i koden

**Styrker**

- TypeScript bruges konsekvent, og typerne er fornuftigt defineret.
- `storage.ts`:
  - tydelig adskillelse af funktioner (`createTask`, `updateTask`, `deleteTask`, `moveTaskToProject` osv.)
  - helper‑funktioner (`ensureUniqueTaskSlug`, `loadTasks`, `saveTask`) giver god struktur.
- `runAction` wrapper asynkrone handlinger med `busy`, `error`, `message` – god genbrug og ensartet fejl/feedback.
- Bekræftelser (slet opgave/projekt/vedhæftning, skift arbejdsmappe) er nu samlet via **`confirmState`** og en central confirm‑modal.

**Forbedringsmuligheder**

- `App.tsx` rummer meget ansvar:
  - state for workspace, projekter/opgaver, filtre, onboarding, tour, confirm‑modals, drag, panel osv.
  - Det gør filen svær at overskue og teste.
- Nogle funktioner er lidt lange og har blandet ansvar (fx `handleProjectDelete`, `handleSaveTask`).

**Forslag (uden over‑engineering)**

- Del `App.tsx` op i mindre komponenter:
  - `Sidebar.tsx` (brand + workspace + projekter + projekthandling)
  - `Board.tsx` (kolonner, drag/drop, kort)
  - `TaskPanel.tsx` (detaljer, vedhæftninger, kommentarer, save/delete)
  - evt. `ConfirmModal.tsx` og `TourHint.tsx` som små, rene komponenter.
- Læg de mest komplekse stykker logik i **custom hooks**, fx:
  - `useWorkspace()` (valg, persistence, skift)
  - `useTasksByProject()` (load/filter/drag)

Det vil ikke ændre funktionalitet, men gøre koden meget nemmere at vedligeholde.

---

### 3. Redundans & over‑engineering

**Redundans**

- Der er lidt gentagen logik i fx slet opgave/projekt/vedhæftning:
  - mønsteret “vis confirm → kør `runAction` → `loadAllData` → ryd state” gentages flere steder.
- Forskellige modaler (onboarding, tour, confirm) har hver deres markup og styling – ok nu, men med flere modaler kunne et lille, genbrugeligt modal‑layout være rart.

**Over‑engineering?**

- Du har tilføjet:
  - onboarding‑modal
  - valgfri mini‑tour
  - sticky knapper i detaljepanelet
  - egen confirm‑modal
  - special‑drag‑logik for at undgå utilsigtet åbning af detaljer.
- Det er ekstra logik, men uden tunge biblioteker og relativt direkte – **ikke unødvendigt over‑engineeret**, taget UX‑kravene i betragtning.

---

### 4. UX‑vurdering

**Stærke sider**

- **Første oplevelse**
  - Stor central modal “Vælg en arbejdsmappe for at komme i gang”.
  - Valgfri mini‑tour via checkbox – godt greb for ikke‑tekniske brugere.
- **Sidebar**
  - Arbejdsmappen tydelig, med blå primærknap.
  - Projekter i eget kort, opdelt i “Aktive projekter” og “Arkiverede projekter”.
  - Tydelig “+ Nyt projekt”‑knap.
- **Board**
  - Fire kolonner (Backlog, Klar, I gang, Færdig) side om side.
  - Kort viser:
    - titel + prioritet på samme linje
    - projektnavn
    - ansvarlig + frist
    - chips for filer/kommentarer.
  - Drag/drop opdaterer status, og der er bevidst arbejde for at undgå utilsigtet åbning af detaljepanel.
- **Detaljepanel**
  - Nu kompakt og overskueligt, uden unødvendig luft.
  - Sticky bund til “Slet opgave” / “Gem opgave” – vigtig brugervenlighed.
- **Bekræftelser**
  - Alle kritiske handlinger (slet opgave, projekt, vedhæftning, skift arbejdsmappe) bruger nu samme pæne confirm‑modal i stedet for browserens `confirm`.

**Små UX‑forbedringer, man kan overveje senere**

- Drag‑ikonet kunne gøres mere visuelt standard (f.eks. seks prikker i stedet for ☰), men er ikke kritisk.
- Tour‑teksterne kunne på sigt gøres mere kontekstuelle (fx highlight faktiske UI‑elementer), men som mini‑tour er de tilstrækkelige.

---

### 5. Samlet konklusion

- **Koden er grundlæggende sund**:
  - god separation mellem storage‑lag og UI
  - god fejl‑/busy‑håndtering
  - fornuftig brug af TypeScript.
- **Arkitekturen er enkel, men `App.tsx` er blevet for stor**:
  - største næste skridt er at splitte UI i komponenter og evt. hooks.
- **UX’en er på et højt niveau** for en lille webapp til ikke‑tekniske brugere:
  - klar onboarding
  - konsekvente, pæne bekræftelsesmodals for risikable handlinger
  - kompakt og informativ opgavevisning
  - god håndtering af drag/drop i forhold til detaljepanelet.

**Anbefalet næste tekniske skridt**

1. Ekstrahere `TaskPanel` til egen komponent med props (`task`, `onSave`, `onDelete` osv.).
2. Ekstrahere `Sidebar` (arbejdsmappen + projekter) til komponent.
3. Flytte confirm‑modal og tour‑hint til små, genbrugelige komponenter.

Det vil gøre det meget lettere at fortsætte med at forbedre UX og funktionalitet uden at øge kompleksiteten i `App.tsx`.

