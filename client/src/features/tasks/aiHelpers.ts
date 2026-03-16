export function looksLikeMailOrChat(text: string): boolean {
  if (!text) return false;
  if (text.length <= 120) return false;

  const lower = text.toLowerCase();

  const hasMailMarkers =
    /@(.*)\./.test(text) ||
    /from:|fra:|sent:|sendt:/i.test(text) ||
    /subject:|emne:/i.test(text);

  const hasSignOff =
    /mvh|med venlig hilsen|venlig hilsen|best regards|bedste hilsner|venlige hilsner/.test(
      lower,
    );

  return hasMailMarkers || hasSignOff;
}

export function ensureNonEmptyText(
  raw: string,
  notify: (message: string) => void,
  message = "Skriv mindst en titel eller lidt tekst først.",
): string | null {
  const text = raw.trim();
  if (!text) {
    notify(message);
    return null;
  }
  return text;
}

