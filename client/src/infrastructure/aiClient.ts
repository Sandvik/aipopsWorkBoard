// Enkel AI-klient til små hjælpefunktioner i UI'et.
// Al logik her er valgfri og kræver en gyldig API-nøgle i config.

export type AiProvider = "openai";

export type AiClientOptions = {
  apiKey: string;
  provider?: AiProvider;
  model?: string;
};

async function callOpenAiChat(opts: AiClientOptions, messages: { role: "system" | "user"; content: string }[]) {
  const model = opts.model || "gpt-4.1";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "AI-kald mislykkedes.");
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI-svaret var tomt.");
  }
  // Simpel debug-log – kan slås fra igen senere.
  // eslint-disable-next-line no-console
  console.log("[AI response]", { model, content });
  return content;
}

export async function suggestTaskTitle(
  opts: AiClientOptions & { description?: string; currentTitle?: string },
): Promise<string> {
  const description = opts.description?.trim();
  const currentTitle = opts.currentTitle?.trim();

  const promptParts: string[] = [];
  if (description) {
    promptParts.push(`Beskrivelse:\n${description}`);
  }
  if (currentTitle) {
    promptParts.push(`Nuværende titel (kan forbedres):\n${currentTitle}`);
  }

  const content =
    (promptParts.join("\n\n") || "Brugeren ønsker en kort, præcis titel til en opgave på et kanban-board.") +
    "\n\nSvar med kun én kort titel på dansk, uden anførselstegn.";

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content:
        "Du hjælper med præcise opgavetitler til et enkelt, roligt kanban-board. Svar altid kort og på dansk.",
    },
    { role: "user", content },
  ]);

  return result.split("\n")[0].trim();
}

export async function summarizeDescription(
  opts: AiClientOptions & { text: string },
): Promise<{ shorter: string }> {
  const text = opts.text.trim();
  if (!text) {
    throw new Error("Der er ingen tekst at opsummere.");
  }

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content:
        "Du hjælper med at gøre opgavebeskrivelser kortere og mere klare. Bevar meningen, men fjern fyld. Svar altid på dansk.",
    },
    {
      role: "user",
      content:
        "Gør denne tekst mere klar. Svar kun med den nye tekst, uden forklaring eller punktopstilling:\n\n" +
        text,
    },
  ]);

  return { shorter: result.trim() };
}

export async function suggestTaskDescription(
  opts: AiClientOptions & { title?: string; currentDescription?: string },
): Promise<string> {
  const title = opts.title?.trim();
  const current = opts.currentDescription?.trim();

  const userParts: string[] = [];
  if (title) {
    userParts.push(`Titel:\n${title}`);
  }
  if (current) {
    userParts.push(`Nuværende beskrivelse (kan forbedres):\n${current}`);
  }

  let baseInstruction: string;
  if (!current) {
    // Ingen beskrivelse endnu – skriv en konkret, forklarende tekst ud fra titlen.
    baseInstruction =
      "Skriv en konkret opgavebeskrivelse ud fra titlen. Skriv mindst én hel sætning (helst 2‑3), hvor du uddyber hvad der præcist skal gøres, og hvorfor, så det er tydeligere end bare titlen. Du MÅ IKKE bare gentage titlen ordret; tilføj altid ekstra detaljer.";
  } else if (current.length < 80) {
    // Meget kort beskrivelse – gør den tydeligt mere fyldig og konkret.
    baseInstruction =
      "Gør denne opgavebeskrivelse tydeligt mere fyldig og konkret. Skriv 1‑3 korte sætninger, der forklarer hvad der præcist skal gøres, og hvad der er vigtigt at huske.";
  } else {
    // Længere tekst – fokusér på at gøre den kortere, mere fokuseret og lettere at skimme.
    baseInstruction =
      "Forbedr denne opgavebeskrivelse, så den bliver bedre, mere fokuseret og lettere at skimme, men uden at fjerne vigtige detaljer.";
  }

  const content =
    baseInstruction +
    " Svar kun med selve beskrivelsen på dansk, uden forklaring, overskrifter eller punktopstilling.\n\n" +
    (userParts.join("\n\n") || "");

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content:
        "Du hjælper med klare, konkrete opgavebeskrivelser til et kanban-board. Du må gerne skrive 1‑3 korte sætninger, der gør det tydeligt hvad der skal gøres, men undgå både salgssprog og unødigt fyld. Svar altid på dansk.",
    },
    { role: "user", content },
  ]);

  const raw = result.trim();

  // Hvis svaret er (næsten) det samme som titlen, så tilføj en ekstra,
  // generisk forklarende sætning, så beskrivelsen altid giver mere kontekst.
  if (title && raw) {
    const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
    const nTitle = normalize(title);
    const nRaw = normalize(raw);
    if (nRaw === nTitle || nRaw.startsWith(nTitle)) {
      return `${title}. Skriv kort hvad der konkret skal gøres, hvad du vil nå i dette arbejde, og hvad der er vigtigt at have med.`;
    }
  }

  return raw || current || title || "";
}

export async function optimizeTaskTitle(
  opts: AiClientOptions & { title: string; description?: string; deadlineLabel?: string },
): Promise<string> {
  const title = opts.title.trim();
  const description = opts.description?.trim();
  const deadlineLabel = opts.deadlineLabel?.trim();

  const parts: string[] = [`Nuværende titel:\n${title}`];
  if (description) {
    parts.push(`Beskrivelse:\n${description}`);
  }
  if (deadlineLabel) {
    parts.push(`Frist (kan nævnes kort i titlen):\n${deadlineLabel}`);
  }

  const userContent =
    "Lav en kort, præcis opgavetitel til et kanban-board ud fra nedenstående. " +
    "Titlen skal være let at skimme, gerne 3‑8 ord. " +
    "Hvis der er en frist, og den ikke allerede er nævnt i titlen, må du gerne tilføje en helt kort dato til sidst i parentes, fx '(12.03)'. " +
    "Du MÅ ikke bare gentage den nuværende titel – forbedr den altid en smule.\n\n" +
    parts.join("\n\n");

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content:
        "Du hjælper med korte, præcise opgavetitler til et kanban-board. Titlerne skal lyde som simple emne‑linjer, ikke marketing. Svar altid kun med selve titlen på dansk.",
    },
    { role: "user", content: userContent },
  ]);

  // Brug kun første linje som ny titel.
  const raw = result.split("\n")[0]?.trim() || "";
  return raw || title || "";
}

export async function generateMorningBrief(
  opts: AiClientOptions & { context: string },
): Promise<string> {
  const { context, ...rest } = opts;

  const result = await callOpenAiChat(rest, [
    {
      role: "system",
      content:
        "Du er en assistent, der hjælper en person med at få overblik over sine projekter og opgaver på et kanban-board. Du skriver korte briefs på dansk.",
    },
    {
      role: "user",
      content:
        "Ud fra følgende overblik over projekter og opgaver skal du skrive en kort brief til brugeren. " +
        "Fokusér på: hvor der er pres (forsinkede eller høj prioritet), hvad der er oplagt at starte med i dag, og eventuelle risici. " +
        "Skriv 3‑7 punktopstillinger eller korte afsnit. Vær konkret men rolig i tonen.\n\n" +
        context,
    },
  ]);

  return result.trim();
}


