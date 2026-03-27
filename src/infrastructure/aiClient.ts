import { getStoredTextCatalog } from "../app/i18n/catalog";

export type AiProvider = "openai";

export type AiClientOptions = {
  apiKey: string;
  provider?: AiProvider;
  model?: string;
};

export type SplitTaskSuggestion = {
  title: string;
  description: string;
};

function getAiLocaleTexts() {
  return getStoredTextCatalog().aiClient;
}

async function callOpenAiChat(opts: AiClientOptions, messages: { role: "system" | "user"; content: string }[]) {
  const t = getAiLocaleTexts();
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
    throw new Error(text || t.callFailed);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(t.emptyResponse);
  }
  console.log("[AI response]", { model, content });
  return content;
}

export async function suggestTaskTitle(
  opts: AiClientOptions & { description?: string; currentTitle?: string },
): Promise<string> {
  const t = getAiLocaleTexts();
  const description = opts.description?.trim();
  const currentTitle = opts.currentTitle?.trim();

  const promptParts: string[] = [];
  if (description) {
    promptParts.push(`${t.titleDescription}:\n${description}`);
  }
  if (currentTitle) {
    promptParts.push(`${t.titleCurrent}:\n${currentTitle}`);
  }

  const content =
    (promptParts.join("\n\n") || t.titleFallback) +
    `\n\n${t.titleAnswerRule}`;

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content: t.titleSystem,
    },
    { role: "user", content },
  ]);

  return result.split("\n")[0].trim();
}

export async function summarizeDescription(
  opts: AiClientOptions & { text: string },
): Promise<{ shorter: string }> {
  const t = getAiLocaleTexts();
  const text = opts.text.trim();
  if (!text) {
    throw new Error(t.noSummaryText);
  }

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content: t.summarySystem,
    },
    {
      role: "user",
      content: `${t.summaryUser}\n\n${text}`,
    },
  ]);

  return { shorter: result.trim() };
}

export async function summarizeDescriptionFromMessage(
  opts: AiClientOptions & { text: string },
): Promise<{ shorter: string }> {
  const t = getAiLocaleTexts();
  const text = opts.text.trim();
  if (!text) {
    throw new Error(t.noWorkText);
  }

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content: t.fromMessageSystem,
    },
    {
      role: "user",
      content: `${t.fromMessageUser}\n\n${text}`,
    },
  ]);

  return { shorter: result.trim() };
}

export async function suggestTaskDescription(
  opts: AiClientOptions & { title?: string; currentDescription?: string },
): Promise<string> {
  const t = getAiLocaleTexts();
  const title = opts.title?.trim();
  const current = opts.currentDescription?.trim();

  const userParts: string[] = [];
  if (title) {
    userParts.push(`${t.descTitle}:\n${title}`);
  }
  if (current) {
    userParts.push(`${t.descCurrent}:\n${current}`);
  }

  let baseInstruction: string;
  if (!current) {
    baseInstruction = t.descNoCurrent;
  } else if (current.length < 80) {
    baseInstruction = t.descShort;
  } else {
    baseInstruction = t.descLong;
  }

  const content =
    `${baseInstruction} ${t.descAnswerRule}\n\n` +
    (userParts.join("\n\n") || "");

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content: t.descSystem,
    },
    { role: "user", content },
  ]);

  const raw = result.trim();
  if (title && raw) {
    const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
    const nTitle = normalize(title);
    const nRaw = normalize(raw);
    if (nRaw === nTitle || nRaw.startsWith(nTitle)) {
      return `${title}. ${t.descFallbackSuffix}`;
    }
  }

  return raw || current || title || "";
}

export async function optimizeTaskTitle(
  opts: AiClientOptions & { title: string; description?: string; deadlineLabel?: string },
): Promise<string> {
  const t = getAiLocaleTexts();
  const title = opts.title.trim();
  const description = opts.description?.trim();
  const deadlineLabel = opts.deadlineLabel?.trim();

  const parts: string[] = [`${t.optimizeCurrentTitle}:\n${title}`];
  if (description) {
    parts.push(`${t.optimizeDescription}:\n${description}`);
  }
  if (deadlineLabel) {
    parts.push(`${t.optimizeDeadline}:\n${deadlineLabel}`);
  }

  const userContent = `${t.optimizeUser}\n\n${parts.join("\n\n")}`;

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content: t.optimizeSystem,
    },
    { role: "user", content: userContent },
  ]);

  const raw = result.split("\n")[0]?.trim() || "";
  return raw || title || "";
}

export async function generateMorningBrief(
  opts: AiClientOptions & { context: string },
): Promise<string> {
  const t = getAiLocaleTexts();
  const { context, ...rest } = opts;

  const result = await callOpenAiChat(rest, [
    {
      role: "system",
      content: t.briefSystem,
    },
    {
      role: "user",
      content: `${t.briefUser}\n\n${context}`,
    },
  ]);

  return result.trim();
}

export async function splitIntoTasks(
  opts: AiClientOptions & { text: string },
): Promise<SplitTaskSuggestion[]> {
  const t = getAiLocaleTexts();
  const text = opts.text.trim();
  if (!text) return [];

  const result = await callOpenAiChat(opts, [
    {
      role: "system",
      content: t.splitSystem,
    },
    {
      role: "user",
      content: `${t.splitUser}${text}`,
    },
  ]);

  const raw = result.trim();
  try {
    const parsed = JSON.parse(raw) as SplitTaskSuggestion[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && item.title && item.description)
      .map((item) => ({
        title: item.title.trim(),
        description: item.description.trim(),
      }));
  } catch {
    console.warn(t.splitParseWarning, raw);
    return [];
  }
}
