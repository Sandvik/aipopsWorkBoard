# WorkBoard

WorkBoard er et local-first projekt- og opgaveboard bygget med React, TypeScript og Vite.

Appen har ingen server og gemmer data som almindelige filer i en mappe, brugeren selv vælger via browserens File System Access API. Projekter, opgaver, noter, vedhæftninger og lokal konfiguration ligger derfor på brugerens egen maskine i stedet for i en database eller cloud-backend.

## Funktionalitet

WorkBoard understøtter i dag:

- Projekter med aktive og arkiverede visninger
- Opgaver med titel, beskrivelse, ansvarlig, deadline, prioritet og status
- Kanban-board med kolonnerne `Backlog`, `Ready`, `Doing` og `Done`
- Drag and drop mellem stadier med gemt rækkefølge
- Detaljepanel for opgaver med redigering, kommentarer og vedhæftninger
- Filtrering på prioritet og ansvarlig samt fritekstsøgning
- Workspace-valg og gendannelse af senest valgte mappe
- Sticky-note-lignende noter gemt i workspace-mappen
- Browser-notifikationer for deadlines
- Valgfri AI-funktioner med brugerens egen OpenAI API-nøgle
- AI-hjælp til beskrivelser, morning brief og opdeling af tekst i flere opgaver
- Lys/mørk tema-toggle og onboarding-tour

## Arkitektur

Kodebasen er organiseret som en lille frontend-monolit med tydelig opdeling mellem app-shell, features og infrastruktur.

### Hovedprincipper

- `src/app/` samler den globale app-sammensætning, layout, styling og i18n
- `src/features/` indeholder feature-logik for tasks, workspace og notes
- `src/infrastructure/` håndterer filpersistens og AI-integration
- `src/types.ts` samler de centrale TypeScript-domænetyper
- Appen er local-first: UI'et arbejder mod filsystemet, ikke mod en server

### Vigtige runtime-flow

1. Brugeren vælger en arbejdsmappe.
2. Appen opretter eller læser sin egen datastruktur i den mappe.
3. `storage.ts` læser og skriver projekter, tasks, attachments, noter og config som filer.
4. `loadAllDataModel.ts` bygger den samlede view-model for det aktive workspace.
5. `App.tsx` orkestrerer global state, mens feature-hooks håndterer task- og projektoperationer.

## Aktuel mappestruktur

```text
WorkBoard/
  public/
  src/
    app/
      App.tsx
      main.tsx
      styles.css
      i18n/
      layout/
    assets/
    features/
      notes/
      tasks/
      workspace/
    infrastructure/
      aiClient.ts
      storage.ts
    types.ts
  tests/
  dist-client/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  README.md
```

### Hvad de vigtigste mapper gør

- `src/app/`: app entrypoint, globale modaler, shell-komponenter, tema og tekster
- `src/features/tasks/`: task-board, task-detaljer, filtre, toolbar og task-actions
- `src/features/workspace/`: workspace-valg, projekthåndtering og afledte view-models
- `src/features/notes/`: notes-modal og note-redigering
- `src/infrastructure/storage.ts`: filbaseret persistence via File System Access API
- `src/infrastructure/aiClient.ts`: klient til AI-funktioner, når API-nøgle er sat op
- `tests/`: testfiler for udvalgte dele af logikken
- `dist-client/`: produktionsbuild genereret af Vite

## Data-layout i brugerens workspace

Når brugeren vælger en arbejdsmappe, opretter WorkBoard sin egen undermappestruktur der.

```text
<valgt-mappe>/
  aipops.config.json
  aipops.notes.json
  project-data/
    projects/
      <project-slug>/
        project.json
        tasks/
          <task-slug>.json
        attachments/
          <task-id>/
            <filer>
```

### Hvad filerne bruges til

- `aipops.config.json`: lokal konfiguration som AI-indstillinger og notifikationsvalg
- `aipops.notes.json`: frie noter for workspace'et
- `project-data/projects/<project>/project.json`: projektmetadata
- `project-data/projects/<project>/tasks/*.json`: én fil pr. opgave
- `project-data/projects/<project>/attachments/`: vedhæftede filer pr. opgave

## Udvikling

Kør fra projektroden:

```bash
npm install
npm run dev
```

Det starter Vite dev server med hot reload.

## Build

```bash
npm run build
```

Bygget output lander i:

```text
dist-client/
```

Projektet bruger `vite-plugin-singlefile`, så builden genererer en samlet `index.html` med inline JS og CSS.

## Krav og begrænsninger

- Kræver en browser med File System Access API, typisk Chromium-baseret
- Data synkroniseres ikke automatisk mellem computere
- Der er ingen backend eller central brugerhåndtering
- AI-funktioner virker kun, hvis brugeren selv tilføjer en OpenAI API-nøgle
- Browser-notifikationer afhænger af brugerens tilladelser

## Teknisk stack

- React 19
- TypeScript
- Vite
- vite-plugin-singlefile
- Browser File System Access API

## Status på repoet

Repoet er nu gjort enklere end tidligere:

- appen ligger direkte i projektroden og ikke længere i en `client/`-mappe
- gamle eksempeldata under `data/` er fjernet
- projektnavnet er konsolideret til `WorkBoard`

## Fremtidige oplagte forbedringer

- Flere tests omkring storage, workspace-flow og drag-and-drop
- Mere præcis reorder mellem kort i samme kolonne
- Yderligere opdeling af `tasks`-feature i mindre komponent- og hook-områder
- Hærdning af AI-klienten med bedre validering og fejlscenarier
