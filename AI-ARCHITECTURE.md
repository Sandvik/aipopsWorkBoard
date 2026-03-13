## AI-arkitektur for AIPOPS Workboard

Denne fil beskriver en mulig arkitektur for at tilføje AI/LLM-funktioner til AIPOPS Workboard, så:

- Brugeren **selv ejer og kontrollerer** sin API-nøgle (f.eks. OpenAI-key).
- Nøglen gemmes **kun lokalt i arbejds­mappen** sammen med projekter/opgaver.
- AI-funktioner er **valgfri** og kun synlige i UI, når der er en nøgle.
- Opsætning af AI sker **i samme flow** som valg af arbejdsmappe (første gang for en mappe).

Målet er at udvide appen med AI-hjælp uden at ændre dens grundlæggende filosofi: rolig, enkel, filbaseret og uden central server.


## 1. Overordnet arkitektur

### 1.1 Grundidé

1. Brugeren vælger en arbejdsmappe (som i dag).  
2. I denne mappe kan der ligge en lille config-fil, f.eks. `aipops.config.json`.  
3. Hvis config-filen indeholder en AI-konfiguration med en API-nøgle, kan UI’et vise AI-knapper (f.eks. “Foreslå titel”).  
4. Hvis der ikke er nogen nøgle, vises AI-knapper **ikke** – AI er usynlig, indtil brugeren aktivt sætter det op.
5. Lige efter første valg af arbejdsmappe (eller når en ny mappe vælges) tilbyder appen en lille, valgfri “AI-opsætning” i samme flow.

Der er ingen central backend i denne model. Al kommunikation med AI-udbyderen sker direkte fra browseren ved brug af brugerens egen nøgle.


### 1.2 Komponenter og filer

**`aipops.config.json` (ny fil i arbejds­mappen)**  

Eksempelstruktur:

```json
{
  "ai": {
    "provider": "openai",
    "apiKey": "sk-..."
  }
}
```

**`storage.ts` (infrastruktur)**  

Tilføj helper-funktioner:

- `loadConfig(workspaceHandle): Promise<Config | null>`  
- `saveConfig(workspaceHandle, config: Config): Promise<void>`  

De bruger File System Access API til at læse/skrive `aipops.config.json` i roden af den valgte arbejdsmappe.

**`App.tsx` (page shell)**  

Ny state:

- `const [aiApiKey, setAiApiKey] = useState<string | null>(null);`
- Evt. `const [showAiSetup, setShowAiSetup] = useState(false);`

Når arbejdsmappe er valgt eller gendannet:

1. Kald `loadConfig(handle)`.  
2. Hvis `config?.ai?.apiKey` findes → `setAiApiKey(apiKey)`.  
3. Hvis ikke → `setAiApiKey(null)` og **efter første valg** af denne mappe: `setShowAiSetup(true)` for at åbne AI-opsætningsmodalen.

**`useWorkspace.ts`**  

`pickWorkspaceAndLoad()` kaldes allerede når brugeren vælger/skifter mappe. Efter `loadAllData(handle)` kan hook’et:

- Informere `App` om, at ny arbejdsmappe er valgt (f.eks. via callback), så `App` kan:
  - Læse config
  - Vise AI-setup-modal hvis nødvendig.

**`aiClient.ts` (nyt modul)**  

Abstraherer kald til AI-udbyder(e), fx OpenAI:

- `suggestTaskTitle({ apiKey, title, description }): Promise<string>`  
- `summarizeDescription({ apiKey, text }): Promise<string>`  

I første version kan dette modul ligge direkte i client-koden, med alt hvad det indebærer; senere kan man flytte det bag en serverless-proxy, hvis man vil.


## 2. Dataflow for AI-nøglen

### 2.1 Første gang mappe vælges

1. Brugeren klikker “Vælg mappe” (`handlePickWorkspace`).  
2. `useWorkspace.pickWorkspaceAndLoad` henter et `FileSystemDirectoryHandle`, kalder `loadAllData(handle)` osv.  
3. Når `App` får besked om, at en ny arbejdsmappe er valgt, gør den:
   - `const config = await loadConfig(handle);`
   - Hvis `config?.ai?.apiKey` → `setAiApiKey(config.ai.apiKey)` og ingen modal.  
   - Hvis ikke → `setAiApiKey(null)` og `setShowAiSetup(true)`.

4. AI-opsætningsmodalen vises:
   - Kort forklaring af hvad AI gør, og at nøglen kun gemmes lokalt i arbejdsmappe.  
   - Inputfelt til API-nøglen.  
   - Knapper:  
     - `Gem nøgle`  
     - `Spring over (uden AI)`

5. Hvis brugeren klikker `Gem nøgle`:
   - `saveConfig(handle, mergedConfig)` kaldes (hvis der allerede er anden config, merges den).  
   - `setAiApiKey(apiKey)` opdateres.  
   - Modal lukkes, AI-knapper bliver synlige.

6. Hvis brugeren klikker `Spring over`:
   - Modal lukkes, `aiApiKey` forbliver `null`.  
   - AI-knapper vises ikke. Brugeren kan senere åbne AI-indstillinger manuelt (f.eks. via link i About-modal).


### 2.2 Senere brug / skift af mappe

- Når brugeren skifter til en **anden** arbejdsmappe:
  - Samme flow gentages:
    - Læs config → hvis ingen nøgle → tilbyd AI-setup-modal igen.

- Når brugeren **redigerer** AI-nøglen senere (fra en manuel “AI-indstillinger”-adgang):
  - `saveConfig` opdaterer config-filen.  
  - `setAiApiKey` opdateres i runtime.


## 3. UI-synlighed for AI-knapper

AI skal føles som et tilvalg; det betyder:

- **Kun når `aiApiKey` findes**, må AI-knapper vises.  
- Hvis `aiApiKey === null`:
  - Ingen AI-ikoner/knapper ved titel, beskrivelse, kommentarer osv.  
  - Eventuelt kun et lille link “Opsæt AI” et diskret sted (f.eks. i About-modal eller i en indstillingssektion).

Eksempel – `TaskToolbar`:

```tsx
<TaskToolbar
  ...
  hasAi={Boolean(aiApiKey)}
/>
```

Inde i `TaskToolbar`:

```tsx
{hasAi && (
  <button type="button" onClick={handleSuggestTitle}>
    ✨ Foreslå titel
  </button>
)}
```

Tilsvarende i `TaskDetailsPanel` for “Forbedr tekst” eller “Opsummer”.


## 4. Hvor AI giver mest mening i denne app

Arkitekturen ovenfor er generel; her er de første, konkrete steder, hvor AI-funktioner er oplagte at starte:

### 4.1 Ny opgave fra mail/tekst

- **Sted**: `TaskToolbar` (ny opgave-formular).  
- **Funktioner**:
  - “Foreslå titel” ud fra nuværende (`title`, `description`).  
  - “Opsummer tekst” ud fra den indsatte mailtekst i beskrivelsesfeltet.

Flow:

1. Brugeren indsætter mailens tekst i beskrivelsen.  
2. Klikker `✨ Foreslå titel`.  
3. `aiClient.suggestTaskTitle({ apiKey: aiApiKey, title, description })` kaldes.  
4. Forslaget vises som preview (evt. i en lille dropdown eller direkte i feltet, men med mulighed for at fortryde).

### 4.2 Forbedring af opgave-beskrivelser

- **Sted**: `TaskDetailsPanel` (beskrivelse).  
- **Funktioner**:
  - “Gør teksten kortere”  
  - “Gør teksten klarere”

Flow:

1. Brugeren skriver en lidt rodet tekst.  
2. Klikker f.eks. “✨ Gør teksten kortere”.  
3. `aiClient.summarizeDescription({ apiKey, text })` kaldes.  
4. Resultatet vises som forslag, som brugeren kan erstatte eller afvise.


## 5. Sikkerhed og privatliv

### 5.1 Nøgleopbevaring

- API-nøglen gemmes kun i `aipops.config.json` i arbejds­mappen.  
- Arbejds­mappen er i forvejen brugerens eget domæne (den kan ligge i Dokumenter, på et delt drev, i en cloud-sync-mappe osv.).  
- Enhver der har filsystem-adgang til arbejds­mappen kan i princippet læse nøglen – men det er samme trusselsmodel som for resten af brugerens filer.

### 5.2 Netværk

- LLM-kald sker direkte fra browseren til udbyderen (f.eks. `api.openai.com`), med brugerens egen key.  
- AIPOPS Workboard agerer **kun klient**, ikke proxy, i denne model.  
- Det er vigtigt i UI-tekster at gøre det klart:
  - Hvad der sendes til AI (titel/tekst)  
  - At det sker med brugerens egen nøgle.


## 6. Brugertekster (microcopy)

Forslag til tekster i UI:

- I AI-setup-modal:
  - “Hvis du vil have hjælp til at lave titler, opsummere tekst m.m., kan du indtaste din egen OpenAI API-nøgle.”  
  - “Nøglen gemmes kun i din arbejdsmappe og bruges kun på din egen computer, når du selv trykker på en AI-knap.”

- Ved AI-knapper (tooltip):
  - “Bruger din egen API-nøgle til at foreslå en bedre titel.”  
  - “Bruger din egen API-nøgle til at opsummere denne tekst.”


## 7. Implementeringsplan (kort)

1. **Data & storage**
   - Tilføj `Config`-type i `storage.ts`.  
   - Implementer `loadConfig`/`saveConfig` til `aipops.config.json`.

2. **App-state**
   - Tilføj `aiApiKey`/`aiConfig` i `App.tsx`.  
   - Integrer læsning af config i workspace-load-flowet.

3. **AI-setup-modal**
   - Lav en lille modal-komponent til indtastning/gem af API-nøgle.  
   - Åbn den automatisk efter valg af arbejdsmappe, hvis ingen nøgle findes, og evt. senere via About/indstillinger.

4. **AI-klient**
   - Opret `aiClient.ts` med 1–2 simple kald (titel-forslag, tekst-opsummering).  
   - Håndter fejl pænt i UI’en.

5. **Første AI-knapper**
   - Tilføj AI-knapper i `TaskToolbar` og `TaskDetailsPanel`, bundet til `hasAi = Boolean(aiApiKey)`.  
   - Skjul knapperne helt, når der ikke er en nøgle.

6. **Finpudsning**
   - Justér microcopy, så det er tydeligt, hvad der sker, og at AI er et valgfrit ekstra lag oven på den eksisterende funktionalitet.

