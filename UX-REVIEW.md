## 1. Executive UX summary

Overordnet fremstår AIPOPS Workboard som et roligt, relativt konsistent og produktmodent lille web‑board. Branding i sidebaren, det nye info‑panel i topbaren og den enkle struktur (venstre: workspace/projekter, midt: board, højre: detaljer) gør, at en ny bruger nogenlunde hurtigt kan afkode, hvad produktet gør. Samtidig er der flere steder, hvor førstehåndsforståelsen og de vigtigste flows kan gøres endnu klarere – især omkring “første gang uden arbejdsmappe”, forskellen på projekter og workspace, samt tydelig feedback på handlinger.  

Den samlede UX‑kvalitet er god for en teknisk bruger, men kan løftes et niveau ved (1) en skarpere onboarding/”første 30 sekunder”, (2) små tekstjusteringer der taler mere om værdi end teknik, og (3) en endnu strammere guidet vej gennem de vigtigste trin: vælg mappe → opret projekt → opret opgave → se detaljer.


## 2. De 10 vigtigste UX‑problemer

### 1) Førstegangsoplevelse uden arbejdsmappe er stadig lidt teknisk  
- **Problem**: Når man lander uden valgt arbejdsmappe, forstår man efter lidt tid, at man skal “vælge mappe”, men ikke nødvendigvis hvorfor – og hvad der sker med ens data.  
- **Hvorfor det skader**: En ny, ikke‑teknisk bruger kan tøve ved at give filsystem‑adgang og være usikker på, om det er nødvendigt eller “farligt”.  
- **Forbedring**: Udbyg tom‑tilstandens tekst en anelse mere narrativt: kort sætning om “Vi gemmer dine opgaver som filer i en mappe, kun på din egen computer. Vælg en mappe for at komme i gang.” og evt. et lille ikon/piktogram der illustrerer mappe → board. Eventuelt en 1‑2 trins “micro‑tour” der kun kører første gang.  
- **Prioritet**: **Høj**

### 2) Forholdet mellem “arbejdsmappe” og “projekter” kræver forklaring  
- **Problem**: Konceptet “Arbejdsmappe” (filesystem‑niveau) og “Projekter” (domæne‑niveau) er vist godt visuelt, men semantisk lidt tæt på hinanden; en ny bruger kan tro, at arbejdsmappe = projekt.  
- **Hvorfor det skader**: Man kan være i tvivl om, hvor man skal starte: skal jeg have én mappe per projekt, eller kan én mappe rumme mange projekter?  
- **Forbedring**: Tilføj en kort forklaring i workspace‑kortets microcopy, fx: “En arbejdsmappe kan indeholde flere projekter. Tænk på den som en ‘root‑mappe’ for alle dine boards.” Evt. tilføj en lille hjælpetekst eller tooltip på “Projekter”‑sektionen, der siger det samme.  
- **Prioritet**: **Høj**

### 3) Ingen eksplicit forklaring af task‑statusser og kolonner  
- **Problem**: Kolonnerne Backlog/Klar/I gang/Færdig er intuitive, men en førstegangsbruger ser ikke nogen forklaring på, hvordan en opgave flyttes gennem flowet, eller hvad forskellen er på “Backlog” og “Klar”.  
- **Hvorfor det skader**: Det kan skabe usikkerhed om, hvor en ny opgave “burde” starte, og hvordan man bedst bruger boardet.  
- **Forbedring**: En lille, kort “hjælp” som tooltip eller microcopy over boardet: “Backlog = idéer, Klar = klar til arbejde, I gang, Færdig”. Alternativt en meget kort tour‑step der peger på kolonnerne første gang.  
- **Prioritet**: **Medium**

### 4) Workspace‑ og projekt‑kort kan virke lidt tunge på små skærme (desktop‑vindue)  
- **Problem**: De nye kort med branding, billede og skygger ser flotte ud, men fylder relativt meget vertikalt, især når der er få projekter.  
- **Hvorfor det skader**: Mindre viewport‑højde på laptop kan gøre, at man skal scrolle for at se hele projektlisten, selv om der kun er få projekter.  
- **Forbedring**: Justér vertikal spacing en anelse (reducer padding mellem sektionstitel og kort‑indhold) og overvej at komprimere workspace‑kortet, når der allerede er valgt mappe (fx mindre microcopy eller collapsible tekst).  
- **Prioritet**: **Medium**

### 5) “Slet projekt” ligger meget tæt på almindelig navigation  
- **Problem**: Knappen “Slet projekt” ligger direkte under projektlisten og er visuelt relativt diskret, men stadig tekstlig – en bruger kan være usikker på, hvor farligt klik er.  
- **Hvorfor det skader**: Risiko for utilsigtet sletning (selvom der er confirm), og mental friktion fordi destruktive handlinger ikke er stærkt adskilt fra neutrale.  
- **Forbedring**: Gør “Slet projekt” mere åbenlyst destruktiv: fx lille skraldespands‑ikon + rød tekst, evt. i en egen lille “farezone”‑sektion (tynd separatorlinje over, mindre visuel vægt).  
- **Prioritet**: **Høj**

### 6) Topbarens info‑panel kan blive visuelt tungt ved mange badges  
- **Problem**: Når der er mange opgaver og statuser (i dag, forsinket, høj prioritet, i gang, færdige), kan midterpanelet i toolbaren blive tæt pakket af chips.  
- **Hvorfor det skader**: For mange samtidige tal kan øge kognitiv belastning; man ved ikke, hvilke der er vigtigst at forholde sig til.  
- **Forbedring**: Prioritér: fx vis altid total + “forsinkede” + “i dag”, men vis “i gang/høj prioritet/færdige” kun når deres tal er >0 _og_ der ikke allerede er mange chips. Alternativt fold mindre vigtige tal ind i en tooltip.  
- **Prioritet**: **Medium**

### 7) Feedback‑bjælker (grøn/rød) kan skjule top‑indhold på meget lave skærme  
- **Problem**: Overlay‑banneret ligger fixed i toppen. På meget lav højde kan det overlappe søgefelt/toolbar i længere tid, hvis brugeren ikke venter på auto‑dismiss.  
- **Hvorfor det skader**: Bruger kan opleve, at UI “hopper” eller at noget gemmes bag beskeden.  
- **Forbedring**: Giv mulighed for manuel luk (lille “x” til højre) og evt. begræns højden en smule, så den føles mere som en diskret toast end som et stort overlay.  
- **Prioritet**: **Lav–Medium**

### 8) Mobil‑blokering er meget kategorisk  
- **Problem**: Mobil‑overlay blokerer hele appen uden mulighed for at “se omkring” eller prøve boardet alligevel.  
- **Hvorfor det skader**: Nogle brugere har måske en stor tablet med keyboard eller vil bare “kigge”; en hård blok kan føles unødvendig restriktiv.  
- **Forbedring**: Overvej at tilføje en sekundær link/knap “Vis alligevel (ikke optimeret til mobil)” der skjuler overlayet, så erfarne brugere kan overrule.  
- **Prioritet**: **Medium**

### 9) Ingen tydelig “hjælp”/support‑entry point  
- **Problem**: Der er en pæn “Om AIPOPS Workboard”‑modal, men ikke en oplagt “Sådan bruger du boardet” eller link til hjælp/FAQ.  
- **Hvorfor det skader**: Førstegangsbrugere uden kanban‑erfaring kan sidde fast uden at vide, hvor de kan få en hurtig intro.  
- **Forbedring**: Tilføj et lille “?”‑ikon i topbaren eller i About‑modalen med en sektion “Sådan bruger du AIPOPS Workboard på 1 minut” (pkt‑liste med 3–4 trin).  
- **Prioritet**: **Lav–Medium**

### 10) Tekst på knapper er generelt god, men kunne være lidt mere værdidrevet nogle steder  
- **Problem**: Nogle labels (fx “Vælg mappe”, “Skift mappe”, “Opdater”) er teknisk korrekte, men taler ikke om værdi eller kontekst.  
- **Hvorfor det skader**: Små ordvalg kan gøre forskellen mellem “tool” og “produkt” i brugerens oplevelse.  
- **Forbedring**: Overvej små tweaks som “Vælg arbejdsmappe til dine opgaver”, “Skift arbejdsmappe” eller tooltip‑tekster der nævner formål.  
- **Prioritet**: **Lav**


## 3. Navigation og informationsarkitektur

- **Styrker**
  - **Klar tredeling**: Venstre (struktur), midt (board), højre (detaljer) er en velkendt og logisk layoutstruktur.
  - **Få navigationsniveauer**: Man er stort set altid “på samme side”; navigation er primært valg af workspace/projekt/opgave.
  - **Tydelig kontekst**: Valgt projekt og opgave er tydelige via aktive tilstande og højre‑panel.

- **Svagheder / muligheder**
  - **Arbejdsmappe vs. projekter** kan forveksles: IA’en kunne forstærke forskellen med små forklaringer og måske ikoner.
  - **Tour/empty state** er lidt “skjult” efter første brug: når man har en mappe, er der ingen easy‑entry til at gense en kort intro til IA’en.
  - **Ingen global navigation** (bevidst): fint for et lille board, men hvis produktet vokser, skal topbaren tænkes som nav‑ramme.

**Forslag**
- Bevar den enkle “one‑page IA”, men styrk _lokal_ navigation med microcopy og tooltips, især i venstre sidebar.
- Overvej et lille “breadcrumb‑agtigt” element i topbaren, kun tekst: `Arbejdsmappe: <navn> · Projekt: <navn eller 'intet valgt'>`.


## 4. Brugerflows

### 4.1 Landing → forståelse → handling

- **Flow i dag**
  - Land på siden → se branding i venstre side + tom‑tilstand i midten, hvis ingen arbejdsmappe.
  - Lære, at man skal “Vælg mappe” → vælge (eller oprette) mappe → board og projekter loader.
  - Opret projekt → opret opgave → se opgave i board.

- **Potentiel friktion**
  - Bruger kan være i tvivl om, hvorfor en “lokal mappe” overhovedet er nødvendig.
  - Onboarding baserer sig primært på tekst; ingen visuelt guidet tur i standardflowet.

**Forbedring**  
Tilføj et meget kort “first‑run overlay” (3 trin) som vises første gang en mappe er valgt:
1. Peg på venstre workspace‑kort: “Her vælger du hvor dine data bor (kun lokalt).”
2. Peg på projekter: “Her opretter du projekter i den valgte mappe.”
3. Peg på boardet: “Her arbejder du med opgaverne – træk dem mellem kolonner.”


### 4.2 Opret og arbejde med opgaver

- **Flow**
  - I topbaren: tryk `+ Ny opgave` → kompakt inline formular åbnes.
  - Indtast titel, vælg projekt, evt. ansvarlig → `Opret opgave` → kortet dukker op i boardet og kan åbnes i højre panel.

- **Styrker**
  - Inline formularen er nu kompakt og let at overskue.
  - “Opret opgave” som primær knap er tydelig.

- **Mulig forbedring**
  - Når der kun er ét projekt, kunne projekt‑feltet autovælges og evt. skjules for at reducere friktion.
  - Overvej at tilføje en lille note: “Opgaven starter i kolonnen Backlog/Klar” for at skabe forventningsafstemning.


### 4.3 Refresh / samarbejde på delt mappe

- **Flow**
  - I workspace‑kortet: `Opdater` + tooltip forklarer delt mappe.

- **Problem**
  - Det er en avanceret use‑case; en førstegangsbruger vil sjældent forstå værdien uden et konkret eksempel.

**Forbedring**  
Hold teksten meget kort (som nu), men link evt. fra About‑modalen til en lille forklaring: “Hvis I deler mappen på et netværksdrev, kan I bruge Opdater til at se hinandens ændringer.”


## 5. Klarhed og læsbarhed

- **Positivt**
  - Typografi og farver er rolige, med god kontrast.
  - Labels som “Arbejdsmappe”, “Projekter”, “Aktive projekter” er klare.
  - Boardkortene har tydelig hierarki (titel, meta, badges).

- **Forbedringsmuligheder**
  - Nogle tekster kan kortes en smule uden at miste mening (for at give mere luft på små skærme).
  - Microcopy omkring workspace/projekter kan gøres en tand mere brugernær (“dine filer”, “dit board”) i stedet for teknisk.


## 6. Call‑to‑actions og konvertering

- **Primære CTA’er**
  - `Vælg/Skift mappe`
  - `+ Nyt projekt`
  - `+ Ny opgave` / `Opret opgave`

- **Styrker**
  - CTA‑knapper er konsekvent formgivet (primær/sekundær).
  - Teksterne er handlingsorienterede, især på opgave‑ og projekt‑niveau.

- **Forbedringer**
  - Overvej at fremhæve `+ Ny opgave` en smule mere visuelt (fx always‑visible på boardet selv, ikke kun i topbaren).
  - Tooltip for `Vælg mappe` kunne nævne “kun lokalt, ikke i skyen” for at øge tryghed og dermed “konvertering” til at vælge en mappe.


## 7. Konsistens og UI‑mønstre

- **Konsistent**
  - Knapstørrelser og rundinger ligner hinanden (primær/sekundær).
  - Cards, modaler og paneler bruger den samme “bløde” stil med afrundede hjørner og skygger.
  - Tekststørrelser og farver er nogenlunde ens på tværs.

- **Små inkonsistenser**
  - Nogle badges og chips (i toolbar/statistik) er mere farverige end resten; det er fint, men de skal ikke kæmpe mod boardkortenes visuelle vægt.
  - Formularer (ny opgave vs. detaljerpanel) har små forskelle i spacing; ikke kritisk, men kan strammes.


## 8. Mobiloplevelse

- **Aktuel strategi**
  - Appen er bevidst **ikke** brugbar på mobil: overlay blokerer, når viewport + pointer tyder på mobil.

- **UX‑vurdering**
  - Det er en legitim beslutning for et produkt, der kræver stor skærm, men bør følges af en “escape hatch” for power users.

**Forslag**
- Tilføj en lille, nedtonet link/knap på overlayet: “Vis boardet alligevel (ikke optimeret til mobil)”, der fjerner blokeringen.


## 9. Hurtige forbedringer (quick wins)

1. Tilføj 1–2 linjers microcopy i workspace‑kortet, der forklarer forholdet workspace ↔ projekter.  
2. Gør “Slet projekt” mere tydeligt destruktiv og visuelt adskilt.  
3. Reducér antallet af samtidige stats‑chips i toolbaren ved at prioritere de vigtigste.  
4. Tilføj en lille “hjælp/guide” i About‑modalen om standardflowet.  
5. Giv feedback‑banneret et lille “x” til manuel lukning.


## 10. Prioriteret UX‑forbedringsplan

### Fase 1 – Kritisk/Høj (forståelse og sikkerhed)

1. **Forholdet workspace ↔ projekter**  
   - Microcopy + evt. lille hjælpetekst.  
2. **Slet projekt‑oplevelsen**  
   - Gør tydeligt destruktiv og separer den visuelt.  
3. **Førstegangsforståelse (“hvorfor mappe?”)**  
   - Opdatér tom‑tilstand + evt. kort micro‑tour.

### Fase 2 – Medium (flow og belastning)

4. **Topbar stats‑panel**  
   - Prioritér og evt. sammenlæg nogle badges.  
5. **Kort intro til kolonner/status**  
   - Tooltip eller miniguide.  
6. **Mulighed for at tilsidesætte mobil‑blokering**  
   - “Vis alligevel” for power users.

### Fase 3 – Lav (polish)

7. **Tekstjusteringer på knapper/tooltips**  
   - Mere værdidrevne og tryghedsskabende formuleringer.  
8. **Små spacing‑justeringer**  
   - Let komprimering af workspace/projektkort, så mere af boardet er synligt på små laptops.


## De 3 største UX‑risici

1. **Uklarhed omkring arbejdsmappe og lokal lagring**  
   - Kan få førstegangsbrugere til at afbryde flowet, før de overhovedet ser boardets værdi.  
2. **Utilsigtet eller utryg håndtering af projekter (sletning)**  
   - Skaber nervøsitet for at miste data og reducerer lysten til at eksperimentere.  
3. **Manglende kort “hvordan bruger jeg det her?”**  
   - Bruger kan misforstå kolonner og arbejdsgang og dermed ikke opleve styrken ved produktet.


## De 3 vigtigste ændringer der vil forbedre oplevelsen mest

1. **En ultra‑kort guided intro til første brug** (3 trin: arbejdsmappe → projekter → board/kolonner).  
2. **Klare og tryghedsskabende forklaringer omkring lokal lagring og delt mappe**, inkl. tooltips og About‑sektion.  
3. **Strammere prioritering i topbarens info‑panel og tydelig destruktions‑UX for “Slet projekt”**, så brugeren både føler overblik og kontrol uden kognitiv overload.  

