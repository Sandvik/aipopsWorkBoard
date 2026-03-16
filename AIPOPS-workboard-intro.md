### Hvad er AIPOPS Workboard?

Jeg har lavet et lille værktøj til os, der drukner i mails og Teams‑beskeder, men stadig skal have styr på “rigtige” opgaver.

**Kort fortalt**:  
Du kopierer en mail eller Teams‑tråd ind, trykker én knap – og får konkrete opgaver op på et simpelt board, som dette:

```text
[ Projekt X ]
┌───────────────┬───────────────┬───────────────┐
│   To do       │   I gang      │   Færdig      │
├───────────────┼───────────────┼───────────────┤
│ ▢ Læs specs   │ ▢ Møde med    │ ☑ Godkendt    │
│ ▢ Lav udkast  │   leverandør  │   udkast      │
└───────────────┴───────────────┴───────────────┘
```

### Hvad kan du bruge det til?

- **Rydde op i lange mails og chats**
  - Kopiér en lang besked ind, og få foreslået flere, konkrete delopgaver.
  - Du vælger selv, hvilke forslag du vil oprette som opgaver.

- **Samle arbejde i projekter**
  - Opgaver grupperes i projekter, så du kan se:
    - Hvad der venter  
    - Hvad der er i gang  
    - Hvad der er færdigt  

- **Arbejde uden at være låst til en cloud‑tjeneste**
  - Alt gemmes som filer **lokalt på din egen computer**.
  - Du kan når som helst:
    - Flytte mappen til en anden maskine
    - Lægge den i OneDrive, Dropbox, Git osv., hvis du selv vil
  - Der er ingen konto, login eller “ny platform” du skal ind i.

### Hvordan bruger den AI – og hvad sendes hvor hen?

- AI‑delen er **helt valgfri**.
- Hvis du vil bruge den, skriver du din egen **OpenAI API‑nøgle** ind.
- Når du trykker på en AI‑knap (f.eks. “Hjælp til beskrivelse” eller “Lav flere opgaver”):
  - Den tekst, du har skrevet ind i opgaven, sendes midlertidigt til OpenAI,  
    og du får et forslag retur (titel, beskrivelse, delopgaver).
  - Du kan **altid redigere eller slette** forslaget bagefter.
- Hvis du ikke sætter en nøgle op, virker boardet stadig fint – bare uden AI‑hjælp.

Enkelt overblik:

```text
[ Din PC ]  --(lokale filer)-->  [ Projekter og opgaver ]
      \
       \--(kun hvis du trykker AI-knap + har nøgle)--> [ OpenAI forslag ]
```

### Hvem er det til?

- Travle projektledere, konsulenter, freelancere, studerende osv., som:
  - Får mange opgaver via mail/Teams
  - Ikke gider tunge projektværktøjer
  - Vil have et **enkelt board** og mulighed for lidt AI‑hjælp, når det giver mening

### Hvorfor ikke bare bruge en almindelig to‑do app?

De fleste to‑do apps starter med et tomt felt.  
AIPOPS Workboard starter der, **hvor dit arbejde faktisk kommer fra**: lange beskeder og tråde.

- I stedet for at du manuelt:
  - læser, fortolker, omskriver og opretter 5–10 opgaver
- kan du:
  - indsætte teksten  
  - lade AI’en foreslå opgaver  
  - godkende/rette dem, og så er boardet klar.

### Hvis du vil prøve det

Jeg kan sende dig:
- **Selve webappen** (kører i browser – kræver Chromium‑baseret browser pga. lokal filadgang).
- En kort guide til, hvordan du:
  - vælger en mappe til dine data
  - opretter dit første projekt
  - tester AI‑funktionen (valgfrit).

Hvis du har lyst, kan du prøve det på et enkelt lille projekt (f.eks. “næste uge” eller “nyt initiativ”) og se, om det hjælper dig med at få ro på opgaverne. 

