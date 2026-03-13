// Enkel AI-klient til små hjælpefunktioner i UI'et.
// Al logik her er valgfri og kræver en gyldig API-nøgle i config.

export type AiProvider = "openai";

export type AiClientOptions = {
  apiKey: string;
  provider?: AiProvider;
};

async function callOpenAiChat(opts: AiClientOptions, messages: { role: "system" | "user"; content: string }[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.4,
      max_tokens: 120,
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
        "Du hjælper med korte, præcise opgavetitler til et enkelt, roligt kanban-board. Svar altid kort og på dansk.",
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
        "Gør denne tekst kortere og mere klar. Svar kun med den nye tekst, uden forklaring eller punktopstilling:\n\n" +
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
    // Ingen beskrivelse endnu – skriv en kort, rolig beskrivelse ud fra titlen.
    baseInstruction = "Skriv en kort opgavebeskrivelse ud fra titlen.";
  } else if (current.length < 80) {
    // Meget kort beskrivelse – gør den lidt mere fyldig og forklarende.
    baseInstruction =
      "Gør denne opgavebeskrivelse lidt mere fyldig og forklarende, men stadig relativt kort og klar.";
  } else {
    // Længere tekst – fokusér på at gøre den lidt kortere og tydeligere.
    baseInstruction =
      "Forbedr denne opgavebeskrivelse, så den bliver lidt kortere og klarere.";
  }

  const content =
    baseInstruction +
    " Svar kun med selve beskrivelsen på dansk, uden forklaring, overskrifter eller punktopstilling.\n\n" +
    (userParts.join("\n\n") || "");

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content:
        "Du hjælper med korte, klare opgavebeskrivelser til et kanban-board. Svar altid på dansk og undgå marketing-sprog.",
    },
    { role: "user", content },
  ]);

  return result.trim();
}


