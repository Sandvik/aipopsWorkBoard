import type { Locale } from "./locales";

const LOCALE_STORAGE_KEY = "aipops.locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    return stored === "da" || stored === "en" ? stored : "en";
  } catch {
    return "en";
  }
}

type TextCatalog = {
  confirmModal: {
    cancel: string;
    confirm: string;
  };
  notificationSettings: {
    title: string;
    intro: string;
    enabledLabel: string;
    yes: string;
    no: string;
    remindLabel: string;
    minutesBefore: string;
    close: string;
    save: string;
  };
  splitTasks: {
    title: string;
    intro: string;
    markOriginal: string;
    cancel: string;
    confirm: string;
    footer: string;
    footerMarkOriginal: string;
  };
  morningBriefModal: {
    title: string;
    intro: string;
    close: string;
  };
  errorBoundary: {
    title: string;
    body: string;
  };
  workspaceGhost: {
    brandAlt: string;
    noFolderSelected: string;
    activeProjects: string;
    archivedProjects: string;
    newProjectTitle: string;
    sampleWorkspace: string;
    sampleProjectA: string;
    sampleProjectB: string;
    backlog1: string;
    backlog2: string;
    todo1: string;
    doing1: string;
    done1: string;
  };
  asyncFeedback: {
    fallbackError: string;
  };
  priorityLabels: {
    low: string;
    medium: string;
    high: string;
    critical: string;
  };
  storage: {
    browserNoAccess: string;
    projectNameRequired: string;
    projectNameUnique: string;
    taskTitleRequired: string;
    taskNotFound: string;
    commentRequired: string;
    attachmentNotFound: string;
  };
  appLogs: {
    restoreWorkspace: string;
    saveNotes: string;
  };
  aiClient: {
    callFailed: string;
    emptyResponse: string;
    noSummaryText: string;
    noWorkText: string;
    titleDescription: string;
    titleCurrent: string;
    titleFallback: string;
    titleAnswerRule: string;
    titleSystem: string;
    summarySystem: string;
    summaryUser: string;
    fromMessageSystem: string;
    fromMessageUser: string;
    descTitle: string;
    descCurrent: string;
    descNoCurrent: string;
    descShort: string;
    descLong: string;
    descAnswerRule: string;
    descSystem: string;
    descFallbackSuffix: string;
    optimizeCurrentTitle: string;
    optimizeDescription: string;
    optimizeDeadline: string;
    optimizeUser: string;
    optimizeSystem: string;
    briefSystem: string;
    briefUser: string;
    splitSystem: string;
    splitUser: string;
    splitParseWarning: string;
  };
};

export const TEXT_CATALOG: Record<Locale, TextCatalog> = {
  da: {
    confirmModal: {
      cancel: "Annuller",
      confirm: "OK",
    },
    notificationSettings: {
      title: "Notifikationer",
      intro: "Få browser-påmindelser for deadlines. Virker mens appen er åben i browseren.",
      enabledLabel: "Aktiver notifikationer",
      yes: "Ja",
      no: "Nej",
      remindLabel: "Påmind mig",
      minutesBefore: "{count} minutter før deadline",
      close: "Luk",
      save: "Gem",
    },
    splitTasks: {
      title: "Lav flere opgaver ud fra teksten",
      intro: "Vælg de opgaver du vil oprette. Du kan altid ændre eller slette dem bagefter.",
      markOriginal: "Marker den oprindelige opgave som færdig, når disse opgaver er oprettet",
      cancel: "Annuller",
      confirm: "Opret opgaver",
      footer: "Opgaverne oprettes i det samme projekt. Du kan altid ændre eller slette dem bagefter.",
      footerMarkOriginal: "Den oprindelige opgave ændres kun, hvis du sætter fluebenet ovenfor.",
    },
    morningBriefModal: {
      title: "Brief for dine projekter",
      intro: "Genereret ud fra status på dine aktive projekter og deres opgaver. Brug det som støtte til at vælge, hvad du vil starte med i dag.",
      close: "Luk",
    },
    errorBoundary: {
      title: "Noget gik galt i visningen",
      body: "Prøv at genindlæse siden. Hvis fejlen bliver ved, kan du lukke og åbne arbejdsmappen igen.",
    },
    workspaceGhost: {
      brandAlt: "AIPOPS Workboard - ét roligt board til opgaver og projekter",
      noFolderSelected: "Ingen mappe valgt",
      activeProjects: "Aktive projekter",
      archivedProjects: "Arkiverede projekter",
      newProjectTitle: "Opret et nyt projekt i den valgte arbejdsmappe",
      sampleWorkspace: "Eksempel-mappe",
      sampleProjectA: "Projekt A (eksempel)",
      sampleProjectB: "Projekt B (eksempel)",
      backlog1: "Læs lang mail fra kunden",
      backlog2: "Lav overblik over næste uge",
      todo1: "Plan for projekt X",
      doing1: "Opfølgning med teamet",
      done1: "Svar sendt til leder",
    },
    asyncFeedback: {
      fallbackError: "Noget gik galt.",
    },
    priorityLabels: {
      low: "Lav",
      medium: "Mellem",
      high: "Høj",
      critical: "Kritisk",
    },
    storage: {
      browserNoAccess: "Din nuværende browser understøtter ikke mappeadgang. Prøv i stedet i Chrome, Edge, Brave eller en anden moderne browser baseret på Chromium.",
      projectNameRequired: "Projektnavn er påkrævet.",
      projectNameUnique: "Projektnavn skal være unikt.",
      taskTitleRequired: "Opgavetitel er påkrævet.",
      taskNotFound: "Opgaven blev ikke fundet.",
      commentRequired: "Kommentartekst er påkrævet.",
      attachmentNotFound: "Vedhæftning blev ikke fundet.",
    },
    appLogs: {
      restoreWorkspace: "Kunne ikke genskabe arbejdsmappe",
      saveNotes: "Kunne ikke gemme noter",
    },
    aiClient: {
      callFailed: "AI-kald mislykkedes.",
      emptyResponse: "AI-svaret var tomt.",
      noSummaryText: "Der er ingen tekst at opsummere.",
      noWorkText: "Der er ingen tekst at arbejde med.",
      titleDescription: "Beskrivelse",
      titleCurrent: "Nuværende titel (kan forbedres)",
      titleFallback: "Brugeren ønsker en kort, præcis titel til en opgave på et kanban-board.",
      titleAnswerRule: "Svar med kun én kort titel på dansk, uden anførselstegn.",
      titleSystem: "Du hjælper med præcise opgavetitler til et enkelt, roligt kanban-board. Svar altid kort og på dansk.",
      summarySystem: "Du hjælper med at gøre opgavebeskrivelser kortere og mere klare. Bevar meningen, men fjern fyld. Svar altid på dansk.",
      summaryUser: "Gør denne tekst mere klar. Svar kun med den nye tekst, uden forklaring eller punktopstilling:",
      fromMessageSystem: "Du får rå tekst kopieret fra en mail eller en chat (f.eks. Teams). Du skal udlede, hvad opgaven konkret går ud på, og skrive en kort, klar opgavebeskrivelse på dansk. Fjern hilsener, signaturer og uvedkommende detaljer.",
      fromMessageUser: "Ud fra denne tekst skal du skrive en kort opgavebeskrivelse (2-4 sætninger) der forklarer, hvad der konkret skal gøres, og hvad der er vigtigt at huske. Svar kun med selve beskrivelsen, uden forklaring eller punktopstilling:",
      descTitle: "Titel",
      descCurrent: "Nuværende beskrivelse (kan forbedres)",
      descNoCurrent: "Skriv en konkret opgavebeskrivelse ud fra titlen. Skriv mindst én hel sætning (helst 2-3), hvor du uddyber hvad der præcist skal gøres, og hvorfor, så det er tydeligere end bare titlen. Du må ikke bare gentage titlen ordret; tilføj altid ekstra detaljer.",
      descShort: "Gør denne opgavebeskrivelse tydeligt mere fyldig og konkret. Skriv 1-3 korte sætninger, der forklarer hvad der præcist skal gøres, og hvad der er vigtigt at huske.",
      descLong: "Forbedr denne opgavebeskrivelse, så den bliver bedre, mere fokuseret og lettere at skimme, men uden at fjerne vigtige detaljer.",
      descAnswerRule: "Svar kun med selve beskrivelsen på dansk, uden forklaring, overskrifter eller punktopstilling.",
      descSystem: "Du hjælper med klare, konkrete opgavebeskrivelser til et kanban-board. Du må gerne skrive 1-3 korte sætninger, der gør det tydeligt hvad der skal gøres, men undgå både salgssprog og unødigt fyld. Svar altid på dansk.",
      descFallbackSuffix: "Skriv kort hvad der konkret skal gøres, hvad du vil nå i dette arbejde, og hvad der er vigtigt at have med.",
      optimizeCurrentTitle: "Nuværende titel",
      optimizeDescription: "Beskrivelse",
      optimizeDeadline: "Frist (kan nævnes kort i titlen)",
      optimizeUser: "Lav en kort, præcis opgavetitel til et kanban-board ud fra nedenstående. Titlen skal være let at skimme, gerne 3-8 ord. Hvis der er en frist, og den ikke allerede er nævnt i titlen, må du gerne tilføje en helt kort dato til sidst i parentes, fx '(12.03)'. Du må ikke bare gentage den nuværende titel - forbedr den altid en smule.",
      optimizeSystem: "Du hjælper med korte, præcise opgavetitler til et kanban-board. Titlerne skal lyde som simple emnelinjer, ikke marketing. Svar altid kun med selve titlen på dansk.",
      briefSystem: "Du er en assistent, der hjælper en person med at få overblik over sine projekter og opgaver på et kanban-board. Du skriver korte briefs på dansk.",
      briefUser: "Ud fra følgende overblik over projekter og opgaver skal du skrive en kort brief til brugeren. Fokuser på: hvor der er pres (forsinkede eller høj prioritet), hvad der er oplagt at starte med i dag, og eventuelle risici. Skriv 3-7 punktopstillinger eller korte afsnit. Vær konkret men rolig i tonen.",
      splitSystem: "Du hjælper med at udtrække konkrete opgaver fra en lang tekst (ofte en mail eller chat). Du skal kun finde ting der kræver handling, ikke generelle kommentarer. Svar på dansk.",
      splitUser: `Ud fra denne tekst skal du foreslå 3-8 konkrete opgaver. For hver opgave skal du give:
- en kort titel (max ca. 8 ord)
- en kort beskrivelse (1-3 sætninger), der forklarer hvad der skal gøres og hvad der er vigtigt at huske.

Returnér svar som ren JSON-liste, uden ekstra tekst, i formatet:
[{ "title": "...", "description": "..." }, ...]

Tekst:

`,
      splitParseWarning: "Kunne ikke parse splitIntoTasks-svar som JSON",
    },
  },
  en: {
    confirmModal: {
      cancel: "Cancel",
      confirm: "OK",
    },
    notificationSettings: {
      title: "Notifications",
      intro: "Get browser reminders for deadlines. Works while the app is open in the browser.",
      enabledLabel: "Enable notifications",
      yes: "Yes",
      no: "No",
      remindLabel: "Remind me",
      minutesBefore: "{count} minutes before deadline",
      close: "Close",
      save: "Save",
    },
    splitTasks: {
      title: "Create multiple tasks from the text",
      intro: "Choose the tasks you want to create. You can always edit or delete them afterwards.",
      markOriginal: "Mark the original task as done when these tasks have been created",
      cancel: "Cancel",
      confirm: "Create tasks",
      footer: "The tasks are created in the same project. You can always edit or delete them afterwards.",
      footerMarkOriginal: "The original task is only changed if you tick the checkbox above.",
    },
    morningBriefModal: {
      title: "Brief for your projects",
      intro: "Generated from the status of your active projects and their tasks. Use it as support when deciding what to start with today.",
      close: "Close",
    },
    errorBoundary: {
      title: "Something went wrong in the interface",
      body: "Try reloading the page. If the error keeps happening, close and open the workspace folder again.",
    },
    workspaceGhost: {
      brandAlt: "AIPOPS Workboard - one calm board for tasks and projects",
      noFolderSelected: "No folder selected",
      activeProjects: "Active projects",
      archivedProjects: "Archived projects",
      newProjectTitle: "Create a new project in the selected workspace",
      sampleWorkspace: "Example workspace",
      sampleProjectA: "Project A (example)",
      sampleProjectB: "Project B (example)",
      backlog1: "Read long email from the client",
      backlog2: "Map out next week",
      todo1: "Plan for project X",
      doing1: "Follow up with the team",
      done1: "Reply sent to manager",
    },
    asyncFeedback: {
      fallbackError: "Something went wrong.",
    },
    priorityLabels: {
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    },
    storage: {
      browserNoAccess: "Your current browser does not support folder access. Try Chrome, Edge, Brave, or another modern Chromium-based browser instead.",
      projectNameRequired: "Project name is required.",
      projectNameUnique: "Project name must be unique.",
      taskTitleRequired: "Task title is required.",
      taskNotFound: "The task could not be found.",
      commentRequired: "Comment text is required.",
      attachmentNotFound: "Attachment could not be found.",
    },
    appLogs: {
      restoreWorkspace: "Could not restore workspace",
      saveNotes: "Could not save notes",
    },
    aiClient: {
      callFailed: "AI call failed.",
      emptyResponse: "The AI response was empty.",
      noSummaryText: "There is no text to summarize.",
      noWorkText: "There is no text to work with.",
      titleDescription: "Description",
      titleCurrent: "Current title (can be improved)",
      titleFallback: "The user wants a short, precise title for a task on a kanban board.",
      titleAnswerRule: "Reply with only one short title in English, without quotation marks.",
      titleSystem: "You help create precise task titles for a simple, calm kanban board. Always reply briefly and in English.",
      summarySystem: "You help make task descriptions shorter and clearer. Preserve the meaning, but remove filler. Always reply in English.",
      summaryUser: "Make this text clearer. Reply only with the new text, without explanation or bullet points:",
      fromMessageSystem: "You receive raw text copied from an email or a chat. Infer what the actual task is and write a short, clear task description in English. Remove greetings, signatures and irrelevant details.",
      fromMessageUser: "Based on this text, write a short task description (2-4 sentences) that explains what needs to be done and what is important to remember. Reply only with the description itself, without explanation or bullet points:",
      descTitle: "Title",
      descCurrent: "Current description (can be improved)",
      descNoCurrent: "Write a concrete task description based on the title. Write at least one full sentence, preferably 2-3, expanding on what exactly needs to be done and why, so it is clearer than the title alone. Do not just repeat the title verbatim; always add context.",
      descShort: "Make this task description clearly fuller and more concrete. Write 1-3 short sentences that explain what exactly needs to be done and what is important to remember.",
      descLong: "Improve this task description so it becomes better, more focused and easier to skim, without removing important details.",
      descAnswerRule: "Reply only with the description itself in English, without explanation, headings or bullet points.",
      descSystem: "You help create clear, concrete task descriptions for a kanban board. You may write 1-3 short sentences that make it obvious what needs to be done, but avoid both sales language and unnecessary filler. Always reply in English.",
      descFallbackSuffix: "Briefly explain what needs to be done, what you aim to achieve in this work, and what is important to include.",
      optimizeCurrentTitle: "Current title",
      optimizeDescription: "Description",
      optimizeDeadline: "Deadline (may be mentioned briefly in the title)",
      optimizeUser: "Create a short, precise task title for a kanban board based on the information below. The title should be easy to scan, ideally 3-8 words. If there is a deadline and it is not already mentioned in the title, you may add a very short date in parentheses at the end, for example '(03/12)'. Do not simply repeat the current title - always improve it slightly.",
      optimizeSystem: "You help create short, precise task titles for a kanban board. The titles should sound like simple subject lines, not marketing. Always reply only with the title itself in English.",
      briefSystem: "You are an assistant helping a person get an overview of their projects and tasks on a kanban board. You write short briefs in English.",
      briefUser: "Based on the following overview of projects and tasks, write a short brief for the user. Focus on: where there is pressure (overdue or high-priority work), what is most sensible to start today, and any risks. Write 3-7 bullet points or short paragraphs. Be concrete but calm in tone.",
      splitSystem: "You help extract concrete tasks from a long text, often an email or chat. Only identify things that require action, not general comments. Reply in English.",
      splitUser: `Based on this text, suggest 3-8 concrete tasks. For each task, provide:
- a short title (max about 8 words)
- a short description (1-3 sentences) explaining what needs to be done and what is important to remember.

Return the answer as a plain JSON list, with no extra text, in this format:
[{ "title": "...", "description": "..." }, ...]

Text:

`,
      splitParseWarning: "Could not parse splitIntoTasks response as JSON",
    },
  },
};

export function getTextCatalog(locale: Locale): TextCatalog {
  return TEXT_CATALOG[locale];
}

export function getStoredTextCatalog(): TextCatalog {
  return TEXT_CATALOG[getStoredLocale()];
}
