# Analyse: Flerbrugere på samme datagrundlag (delt drev)

## Formål

Denne note beskriver, hvordan AIPOPS Workboard i dag håndterer data, og hvad der sker, når **flere personer arbejder i samme arbejdsmappe** – fx når mappen ligger på et **delt netværksdrev**, **OneDrive/SharePoint** eller **Google Drive**.

---

## 1. Sådan fungerer appen i dag

### 1.1 Datakilde og lagring

- Brugeren vælger **én mappe** (File System Access API). Alt data ligger **lokalt i den mappe**.
- Struktur: `project-data/projects/<projekt-slug>/project.json`, `.../tasks/<opgave-slug>.json`, osv.
- **Ingen server**, ingen central database. Hver browser-session læser og skriver direkte til filerne.

### 1.2 Læsning og skrivning

- **Læsning**: Ved start og efter hver handling kaldes `loadAllData()` → `listProjects()` + `listTasks()` per projekt. Data hentes **fra disk** hver gang.
- **Skrivning**: Ved gem opgave, ny opgave, slet, kommentar osv. skrives **hele den berørte fil** (fx én `*.json` per opgave) med `writeJsonFile()` – dvs. **fuld overskrivning** af filen.
- Der er **ingen fil-låsning**, **ingen versionsnummer** og **ingen konfliktdetektion**. Appen antager effektivt **én aktiv bruger** per mappe.

---

## 2. Hvad sker der på et delt drev?

Når arbejdsmappen ligger et sted, som **flere brugere har adgang til** (delt drev, synkroniseret mappe), kan to (eller flere) personer åbne **samme mappe** i hver sin browser. Hver bruger har sin egen **kopi af data i hukommelsen** og læser/skriver til **de samme filer** (når synk er opdateret).

### 2.1 Samme opgave redigeres af to brugere

- **Bruger A** åbner opgave X og ændrer frist.
- **Bruger B** åbner opgave X og ændrer ansvarlig.
- A gemmer først → opgavens JSON fil overskrives med A’s version (frist opdateret, ansvarlig uændret).
- B gemmer bagefter → opgavens JSON fil overskrives med B’s version (ansvarlig opdateret, **frist er nu B’s gamle værdi**).

**Resultat: “Last write wins”** – B’s gem overwriter A’s. A’s ændring (frist) **går tabt** uden advarsel.

### 2.2 To brugere opretter opgaver/projekter “samtidigt”

- **Unikke slugs**: Appen bruger `ensureUniqueTaskSlug` / `ensureUniqueProjectSlug` (navn + tidsstempel). Hvis to brugere laver “Ny opgave” med samme titel på næsten samme tid, kan begge læse samme liste (før den andens fil er synkroniseret) og få **forskellige** slugs (fx `opg-123` og `opg-123-1234567890`). Det er ok.
- **Værre**: Hvis det delte drev har **forsinket synk**, kan den ene bruger ikke se den andens nye fil med det samme. De ser forskellige “verdensbilleder” indtil de manuelt opdaterer (eller genindlæser).

### 2.3 Én bruger sletter, en anden redigerer

- Bruger A sletter opgave Y (filen fjernes).
- Bruger B har stadig opgave Y åben og gemmer. Afhængigt af implementering kan B’s gem **overskrive** eller **genskabe** filen, eller give fejl. I nuværende kode vil B’s `saveTask` **oprette filen igen** (create: true), så opgaven “kommer tilbage” med B’s indhold. A’s sletning er i praksis overskrevet.

### 2.4 Synkroniseringsforsinkelse (OneDrive, Google Drive, netværksdrev)

- Ændringer sker **ikke øjeblikkeligt** på tværs af maskiner. Der kan være sekunders til minuters forsinkelse.
- Bruger A gemmer; Bruger B ser **ikke** A’s ændringer, før B enten **genindlæser** (fx ved at skifte projekt og tilbage) eller der kommer en **automatisk opdatering** (som appen i dag ikke har).

---

## 3. Opsummering af risici

| Scenario | Risiko |
|---------|--------|
| To redigerer samme opgave | Tab af den enes ændringer (“last write wins”). |
| Én sletter, anden redigerer | Sletning kan blive overskrevet ved gem fra anden bruger. |
| Delt mappe med synk-forsinkelse | Brugere ser forskellige data; forvirring og dobbeltarbejde. |
| Samme projekt/opgave-navn på samme tid | Kan give forskellige slugs (ok) eller i ekstreme tilfælde uens opførslen afhængigt af synk. |

**Kort sagt:** Appen er **ikke designet til sikkert flerbrug** på samme datagrundlag. Den forventer **én bruger per mappe** eller at brugere **ikke redigerer samme ting samtidigt**.

---

## 4. Hvordan appen *kunne* håndtere delt brug bedre

### 4.1 Kortsigtet (uden backend)

- **Manuel opdatering**: Knap “Opdater data” / “Genindlæs mappe”, der kalder `loadAllData()`, så brugere kan hente andre brugeres ændringer.
- **Advarsel i UI**: Besked når mappen åbnes: “Ved delt mappe (fx netværksdrev): Undgå at flere redigerer samme opgave samtidigt. Brug ‘Opdater’ for at se andre brugeres ændringer.”
- **Vær diskret med “Gem”**: Fx kort “Opdateret” uden at lukke panelet, så brugeren kan opdatere igen efter andres ændringer.

Disse tiltag **fjerner ikke** “last write wins”, men gør brugerne opmærksomme og giver mulighed for at trække seneste data.

### 4.2 Middel/lang sigt (med ændringer i data-lag)

- **Versionsnummer per fil**: Fx `version: number` i hver `project.json` / task-JSON. Ved gem: læs fil → tjek at `version` er uændret → skriv med `version+1`. Hvis version er ændret, **afvis gem** og vis “Opgaven er ændret af en anden – genindlæs og prøv igen.” (optimistic locking).
- **Konflikthåndtering**: Ved konflikt vise “Din version” vs “Version på disk” og lade brugeren vælge eller flette (kræver mere UI og evt. felt-for-felt sammenligning).
- **Periodisk opdatering**: Fx hvert 30. sekund læse projekter/opgaver fra disk og opdatere UI hvis data er ændret (evt. kun når panelet er lukket eller fanen har fokus), så man hurtigere ser andre brugeres ændringer.

### 4.3 Backend-baseret løsning (helt andet arkitektur)

- **Server** (eller serverløs API) ejer data; alle klienter læser/skriver via API.
- **Locking eller optimistic concurrency** på serveren; konflikter håndteres der.
- Delt drev bruges så **ikke** som fælles datakilde – kun som valgfri eksport/backup.

---

## 5. Anbefaling

- **I dag**: Anse appen som **single-user per mappe** eller “brug med forsigtighed på delt drev”. Hvis mappen alligevel deles (fx på netværksdrev):
  - Tilføj en **“Opdater data”**-knap og en kort **brugeradvarsel** om at undgå samtidig redigering af samme opgave.
- **Næste skridt** (hvis flerbrug bliver vigtig): Indfør **versionsnummer** og **optimistic locking** i `storage.ts` (læs → tjek version → skriv ellers fejl), og vis en tydelig fejlbesked i UI ved konflikt med opfordring til at genindlæse og gemme igen.
- **Ved behov for rigtig samtidighed og konflikthåndtering**: Overvej backend med fælles datastruktur og evt. realtidsopdateringer (WebSocket/SSE), i stedet for at læne sig tungt på et delt filsystem.

---

## 6. Teknisk reference (nuværende flow)

- **Læs**: `readJsonFile()` → `file.text()` → `JSON.parse`.
- **Skriv**: `writeJsonFile()` → `createWritable()` → `write(JSON.stringify(...))` → `close()`. Ingen tjek af indhold før overskrivning.
- **Opdater opgave**: `loadTaskById()` → byg opdateret objekt → `saveTask()` (overskriver hele task-filen). Ingen sammenligning med nuværende fil-indhold før skriv.

En mulig tilføjelse til `updateTask` / `saveTask` kunne være:

1. Læs fil igen lige før skriv (eller brug en `version` fra første læsning).
2. Sammenlign med forventet tilstand (fx `version` eller hash).
3. Hvis uoverensstemmelse → returner fejl til UI (“Opgaven er ændret af en anden – opdater og prøv igen”).
4. Hvis overensstemmelse → skriv med ny version.

Det kræver at **alle** steder der skriver til samme fil (opdater opgave, tilføj kommentar, vedhæftning, osv.) læser-tjekker-skriver på samme måde, så konsistens er bevaret.

---

## 7. Analyse: Versionsnummer og optimistic locking uden at forstyrre brugeren

Denne sektion beskriver **konkret**, hvordan versionsnummer og optimistic locking kan indføres, så brugeren ikke forstyrres unødigt: tydelig fejlbesked ved konflikt og en enkel mulighed for at hente nyeste og gemme igen.

### 7.1 Formål

- **Undgå “last write wins”**: Hvis en anden bruger (eller en anden fane) har gemt opgaven/projektet siden vi læste den, skal vi **ikke** overskrive. I stedet afvises gem, og brugeren får besked.
- **Minimal forstyrrelse**: Panelet lukkes ikke. Brugeren får én tydelig besked og én handling: “Hent nyeste”, hvorefter opgaven vises med den seneste data, og brugeren kan lave sine ændringer igen og gemme.

### 7.2 Datamodel

- **TaskRecord** og **ProjectRecord** får et valgfrit felt **`version?: number`**.
- **Eksisterende filer** uden `version` behandles som `version = 1` ved læsning (bagudkompatibilitet).
- **Nye opgaver/projekter** oprettes med `version: 1`.
- Ved **gem**: den version vi har i hukommelsen (fx 5) skal matche den version der står på filen lige nu. Hvis filen i mellemtiden er blevet gemt af en anden, har den fx version 6 → vi kaster en **konfliktfejl** i stedet for at skrive. Hvis version matcher, skriver vi med **version + 1** (fx 6).

### 7.3 Ændringer i storage-lag (storage.ts)

**Central skrivning – opgaver**

- **`saveTask(workspace, task, previousSlug?)`** er det eneste sted, der skriver en opgavens JSON-fil. Her skal:
  1. **Før skriv**: Hvis filen findes (`task.slug` + `.json`), læs den igen fra disk.
  2. Sammenlign **på-disk version** med **`task.version`** (eller 1 hvis undefined).
  3. Hvis **forskellige** → kast en **særskilt konfliktfejl** (fx en `StorageConflictError` eller fejl med kode `"CONFLICT"`), så UI kan skelne den fra andre fejl.
  4. Hvis **ens** → skriv opgaven med **`version: (task.version ?? 1) + 1`**.

Alle steder der ender i `saveTask` (opdater opgave, tilføj kommentar, tilføj vedhæftning, slet vedhæftning, flyt opgave, flyt til andet projekt) får dermed konflikttjek uden ekstra kode i hvert kald.

**Opret opgave**

- **`createTask`**: Den nye opgave skal oprettes med `version: 1`. Ingen tjek før skriv (fil findes ikke endnu).

**Projekter**

- **`updateProject`**: Lige før `writeJsonFile(..., "project.json", updatedProject)`:
  1. Læs `project.json` igen fra den mappe, der skal skrives til (samme projekt-mappe efter evt. omdøbning).
  2. Sammenlign på-disk `version` med den version vi læste i starten af `updateProject`.
  3. Hvis forskellig → kast konfliktfejl. Hvis ens → sæt `updatedProject.version = (project.version ?? 1) + 1` og skriv.

- **`createProject`**: Nyt projekt med `version: 1`.

**Læsning**

- Ved **læsning** (fx `readJsonFile` til task eller project): Sørg for at det objekt der returneres altid har `version` sat (fx `version ?? 1`), så resten af koden kan stole på at `task.version` / `project.version` er defineret. Det kan gøres i `ensureTaskDefaults` for opgaver og tilsvarende ved projekter (eller i læsefunktionerne).

**Særskilt konfliktfejl**

- Lav en fejltype UI kan genkende (fx `class StorageConflictError extends Error` og eksporter den, eller et fejlobjekt med `code: "CONFLICT"`). Tekst på fejlen kan være: *“Opgaven er ændret af en anden. Klik ‘Hent nyeste’ for at indlæse den seneste version – du kan derefter lave dine ændringer igen og gemme.”*

### 7.4 Ændringer i UI (App.tsx)

**Opfång konflikt**

- I **`runAction`** (eller i de try/catch der kalder storage): Når der fanges en fejl, tjek om det er **konfliktfejlen** (fx `caught instanceof StorageConflictError` eller `caught?.code === "CONFLICT"`).
- Ved konflikt: Sæt ikke kun den generiske `error`-besked, men evt. en **særskilt state** (fx `conflictForTaskId` eller `isConflictError`) så UI kan vise den rigtige blok med besked + knap.

**Vis fejl uden at forstyrre**

- **Luk ikke** opgave-panelet. Brugeren skal stadig se den opgave, de prøvede at gemme.
- Vis en **tydelig fejlbesked** i den eksisterende fejl-banner (eller i en lille boks tæt på “Gem opgave”), med præcis teksten om at opgaven er ændret af en anden og at man skal hente nyeste og gemme igen.

**“Hent nyeste”-handling**

- Tilføj en knap (fx **“Hent nyeste”**) ved konflikt. Den skal:
  1. Kalde **`loadAllData(handle, selectedProjectSlug, selectedTaskId)`** så data fra disk hentes igen (inkl. den åbne opgave).
  2. Ryd **fejl-state** og evt. **konflikt-state** (`setError("")`, `setConflictForTaskId(null)` osv.).
  3. Panelet forbliver åbent med **samme** `selectedTaskId`, men indholdet kommer nu fra den nyindlæste `tasksByProject` / `selectedTask` – dvs. brugeren ser den **seneste version** af opgaven.
- Brugeren kan derefter **redigere igen** og trykke “Gem opgave”. Der er ingen automatisk overskrivning; brugeren har fuld kontrol.

**Projektkonflikt**

- Hvis konfliktfejl også kastes ved **projekt**-gem, kan samme mønster bruges: fejlbesked + “Hent nyeste” der kalder `loadAllData(handle)` (uden at ændre valgt projekt), så projektlisten og det valgte projekt opdateres.

### 7.5 Brugeroplevelse – kort flow

1. Bruger A og B har samme opgave åben. B gemmer først.
2. A trykker “Gem opgave”. Storage ser at version på disk er nyere → kaster konfliktfejl.
3. A ser én tydelig besked: *“Opgaven er ændret af en anden. Klik ‘Hent nyeste’ for at indlæse den seneste version – du kan derefter lave dine ændringer igen og gemme.”* og en knap **“Hent nyeste”**.
4. A klikker “Hent nyeste”. Data hentes, panelet opdateres med B’s version. Fejlmeldingen forsvinder.
5. A laver evt. sine ændringer igen og gemmer. Nu er version på disk den forventede → gem lykkes.

Brugeren forstyrres ikke ved at panelet lukkes eller at ændringer “forsvinder” uden forklaring; de får en klar forklaring og én simpel handling.

### 7.6 Oversigt over berørte funktioner

| Område | Berørte funktioner / steder |
|--------|-----------------------------|
| **types.ts** | `TaskRecord`, `ProjectRecord`: tilføj `version?: number`. |
| **storage.ts** | `ensureTaskDefaults`: sæt `version: task.version ?? 1`. Ved læsning af projekter: sæt `version ?? 1`. |
| **storage.ts** | `saveTask`: før skriv – læs fil, tjek version, ved uoverensstemmelse kast konfliktfejl; ved skriv brug `version + 1`. |
| **storage.ts** | `createTask` / `createProject`: sæt `version: 1` på nye poster. |
| **storage.ts** | `updateProject`: før skriv – læs project.json igen, tjek version, kast konflikt ved uoverensstemmelse; skriv med `version + 1`. |
| **storage.ts** | Eksporter fx `StorageConflictError` med fast besked (eller kode), så App kan genkende konflikt. |
| **App.tsx** | I `runAction` (eller ved hver storage-kald): fang konfliktfejl, sæt fejlbesked + evt. konflikt-state. |
| **App.tsx** | Fejl-banner: ved konflikt vis den faste besked + knap “Hent nyeste” der kalder `loadAllData(...)` og rydder fejl/konflikt. |

Med denne analyse kan implementeringen laves trinvis uden at forstyrre brugeren, og med én tydelig fejlbesked og én handling (“Hent nyeste”, derefter evt. rediger og gem igen).
