## AIPOPS Workboard – README

AIPOPS Workboard er et lille, lokalt projekt‑ og opgaveboard bygget med React + Vite.  
Alle projekter og opgaver gemmes som filer i en mappe, du selv vælger på din maskine (via browserens File System Access API).

---

### Funktioner – kort fortalt

- **Arbejdsmappe**  
  - Ved første load bliver du bedt om at vælge en mappe.  
  - Alle data (projekter, opgaver, vedhæftninger, kommentarer) gemmes i en undermappe `project-data` i den valgte mappe.  
  - Arbejdsmappen huskes mellem reloads i browseren (IndexedDB), så du normalt kun skal vælge den én gang.

- **Projekter**
  - Opret et nyt projekt via knappen **“+ Nyt projekt”** i venstre sidebar.  
  - Projekter vises i et kort opdelt i **Aktive projekter** og **Arkiverede projekter**.  
  - Det valgte projekt markeres som **“Aktivt projekt”**.
  - Projekter kan slettes – dette fjerner også tilhørende opgaver.

- **Opgaver**
  - Opret opgaver via **“Ny opgave”** øverst i boardet.  
  - Opgaver har:
    - Titel, beskrivelse  
    - Ansvarlig  
    - Frist (dato)  
    - Prioritet (Lav, Mellem, Høj, Kritisk)  
    - Status: **Backlog, Klar, I gang, Færdig**  
    - Tilhørende projekt  
    - Kommentarer og vedhæftede filer.
  - Boardet viser opgaver i fire kolonner (Backlog, Klar, I gang, Færdig).  
  - Du kan **trække opgaver mellem kolonner** ved at trække i kortet (via drag‑ikon eller kort, afhængigt af seneste UI‑version).

- **Opgave‑detaljer**
  - Klik på et kort for at åbne højre **Opgavedetaljer**‑panel.  
  - Her kan du redigere alle felter, tilføje kommentarer og vedhæftninger.  
  - **“Gem opgave”** (blå knap) gemmer ændringer og lukker panelet.  
  - **“Slet opgave”** (rød knap) sletter opgaven helt (inkl. dens filer) efter bekræftelse.  
  - Nederst i panelet sidder “Slet opgave”/“Gem opgave” altid fast (sticky), så de er synlige selv på små skærme.

- **Filtrering & søgning**
  - Søg i opgaver via feltet **“Søg i opgaver”**.  
  - Under **“Filtre”** kan du filtrere på prioritet og ansvarlig.  
  - Når filtre er aktive, vises en lille grøn indikator samt teksten  
    *“Filtre er aktive. Brug ‘Nulstil’ for at se alle opgaver igen.”*

---

### Teknisk overblik

- **Stack**
  - React + TypeScript
  - Vite (som bundler/dev‑server)
  - Browserens **File System Access API** (kræver Chromium‑baseret browser, f.eks. Chrome / Edge / Vivaldi)

- **Filstruktur (klient)**
  - `client/src/App.tsx` – hoved‑UI og al interaktionslogik.  
  - `client/src/storage.ts` – al filhåndtering: opret/slet projekter, opret/flyt/slet opgaver, vedhæftninger og kommentarer.  
  - `client/src/types.ts` – TypeScript‑typer (`TaskRecord`, `ProjectRecord`, m.m.).  
  - `client/src/styles.css` – global styling.  
  - `client/vite.config.ts` – Vite‑konfiguration.

- **Data‑layout i arbejdsmappe**
  Når du har valgt en arbejdsmappe, oprettes følgende struktur:

  ```text
  <din-arbejdsmappe>/
    project-data/
      projects/
        <project-slug>/
          project.json          # metadata om projektet
          tasks/
            <task-slug>.json   # én fil pr. opgave
          attachments/
            <task-id>/
              <filnavne>       # vedhæftede filer
  ```

---

### Udvikling – sådan kører du app’en lokalt

Forudsætninger:

- Node.js (seneste LTS anbefales)
- npm

Fra projektroden `simple-project-app`:

```bash
cd client
npm install
npm run dev
```

Vite vil typisk starte på `http://localhost:5173/`.  
Første gang du åbner app’en, vil den bede om at vælge en arbejdsmappe.

---

### Build – generér en enkelt HTML‑fil

Projektet er konfigureret med `vite-plugin-singlefile`, så du kan få **én** samlet `index.html` med alt JS/CSS inlinet.

1. Installer plugin (hvis ikke allerede gjort):

   ```bash
   cd client
   npm install -D vite-plugin-singlefile
   ```

2. Build:

   ```bash
   npm run build -w client
   ```

3. Output:

   - Den samlede fil ligger her:

     ```text
     simple-project-app/dist-client/index.html
     ```

   - Denne `index.html` indeholder både HTML, JS og CSS og kan flyttes/bruges som én selvstændig fil (f.eks. på en intern webserver eller som en “lokal” app via browser).

> Bemærk: For at File System Access API virker, skal filen serveres via en browser, der understøtter API’et, og typisk over `https` eller `http://localhost` (afhængigt af browser‑indstillinger).

---

### Kørsel af almindelig multi‑fil build (alternativ)

Hvis du **ikke** vil bruge single‑file‑pluginet, kan du stadig bygge normalt (Vite standard) ved at fjerne `viteSingleFile()` i `vite.config.ts`.  
Så vil output være:

```text
dist-client/
  index.html
  assets/
    main-xxxxx.js
    style-xxxxx.css
    ...
```

I det tilfælde skal du flytte hele `dist-client`‑mappen, ikke kun `index.html`.

---

### Kendte begrænsninger

- Kræver en Chromium‑baseret browser pga. File System Access API.  
- Data er **lokale** til den arbejdsmappe, du vælger – ingen server/sky‑synkronisering.  
- Hvis du skifter arbejdsmappe, ser du ikke de gamle projekter (de ligger stadig i den gamle mappe).

---

### Support / videreudvikling

- UI/UX er optimeret til at være meget simpelt for ikke‑tekniske brugere.  
- Forslag til forbedringer:
  - flere tastatur‑genveje,  
  - flere filtermuligheder (tags, tekst‑labels),  
  - mulighed for at eksportere/importere data mellem arbejdsmapper.

# Simple Project App

Statisk projektboard bygget med React og browserens File System Access API.

## Hvad det er nu

- Ingen server
- Ingen Electron eller `.exe`
- Ingen Node/npm paa maalcomputeren efter build
- Data gemmes i en lokal mappe, som brugeren vaelger i browseren

Appen opretter denne struktur i den valgte mappe:

```text
simple-project-data/
  projects/
    <project-slug>/
      project.json
      tasks/
        <task-slug>.json
      attachments/
        <task-id>/
```

## Udvikling

```bash
npm install
npm run dev
```

`npm run dev` starter Vite med hot reload. Aendringer i filer som `client/src/App.tsx` og `client/src/styles.css` vises straks i browseren.

## Build

```bash
npm run build
```

Det bygger den statiske frontend til:

```text
dist-client/
```

Den byggede version har ikke hot reload. Hvis du aendrer koden, skal du koere `npm run build` igen og genindlaese `dist-client/index.html`.

## Brug paa en anden computer

Kopier hele mappen `dist-client` til den anden computer og aabn:

```text
dist-client/index.html
```

Brug en Chromium-baseret browser som Chrome eller Edge, fordi appen bruger File System Access API til at laese og skrive lokale filer.

## Arbejdsgang i appen

1. Aabn `index.html`
2. Klik `Vaelg arbejdsmappe`
3. Vaelg en lokal mappe
4. Opret projekter og opgaver
5. Appen gemmer JSON-filer og vedhaeftninger direkte i den valgte mappe
