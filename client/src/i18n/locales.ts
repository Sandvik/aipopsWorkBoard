export type Locale = "da" | "en";

type DateStrings = {
  dateLocale: string;
  noDeadlineLabel: string;
};

type ToolbarStrings = {
  searchPlaceholder: string;
  themeToggleLight: string;
  themeToggleDark: string;
  filtersOn: string;
  filtersOff: string;
  filtersLabel: string;
  filtersHintActive: string;
  filtersAllPriorities: string;
  filtersAllAssignees: string;
  newTaskTitleLabel: string;
  newTaskProjectLabel: string;
  newTaskAssigneeLabel: string;
  newTaskDescriptionLabel: string;
  newTaskAssigneePlaceholder: string;
  newTaskProjectPlaceholderHasWorkspace: string;
  newTaskProjectPlaceholderNoWorkspace: string;
  newTaskCancelLabel: string;
  newTaskCreateLabel: string;
  newTaskMailHint: string;
  newTaskWithProjects: string;
  newTaskNoProjects: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  aiSplitTooltip: string;
  aiHelpTooltip: string;
  cancelNewTask: string;
  saveNewTask: string;
  resetFilters: string;
  statsSummaryOk: string;
  statsSummaryBusy: string;
  statsSummaryProblems: string;
  statsTotalLabelSingular: string;
  statsTotalLabelPlural: string;
  statsTotalNone: string;
  statsDueTodaySuffix: string;
  statsOverdueSuffixSingular: string;
  statsOverdueSuffixPlural: string;
  statsDoingSuffix: string;
  statsDoneSuffixSingular: string;
  statsDoneSuffixPlural: string;
  statsHighPrioritySuffix: string;
};

type SidebarStrings = {
  yourWorkspace: string;
  chooseWorkspace: string;
  switchWorkspace: string;
  refreshTooltip: string;
  projectsHeader: string;
  newProjectButton: string;
  newProjectTitle: string;
  newProjectDescription: string;
  newProjectFieldLabel: string;
  newProjectPlaceholder: string;
  newProjectCreateLabel: string;
  newProjectCancelLabel: string;
  briefButton: string;
  briefTooltip: string;
  notesButton: string;
  notesTooltip: string;
  noProjects: string;
  switchFolderButton: string;
  refreshButton: string;
  deleteProjectButton: string;
};

type OnboardingStrings = {
  title: string;
  introLine1: string;
  introLine2: string;
  steps: string[];
  asciiHint: string;
  aiNote: string;
  tourLabel: string;
  chooseFolderButton: string;
  emptyBoardTitle: string;
  emptyBoardBody: string;
  mobileWarningTitle: string;
  mobileWarningBody: string;
};

type FooterStrings = {
  aboutLink: string;
  aboutTooltip: string;
  dataLink: string;
  dataTooltip: string;
};

type AboutStrings = {
  title: string;
  p1: string;
  p2: string;
  p3: string;
  p4: string;
  closeLabel: string;
  aiSettingsLabel: string;
};

type AiSettingsStrings = {
  title: string;
  intro: string;
  existingNote: string;
  label: string;
  placeholder: string;
  skipNote: string;
  removeTitle: string;
  removeLabel: string;
  skipTitleWithKey: string;
  skipTitleNoKey: string;
  skipLabelWithKey: string;
  skipLabelNoKey: string;
  saveTitleWithKey: string;
  saveTitleNoKey: string;
  saveLabelWithKey: string;
  saveLabelNoKey: string;
};

type DataHelpStrings = {
  title: string;
  intro: string;
  bulletSamePc: string;
  bulletNewComputer: string;
  bulletMultiple: string;
  outro: string;
  confirmLabel: string;
};

type WorkspaceAlertsStrings = {
  browserNoAccessTitle: string;
  browserNoAccessConfirm: string;
  pickedWorkspaceMessage: string;
  refreshSuccessMessage: string;
  switchTitle: string;
  switchMessage: string;
  switchConfirmLabel: string;
  switchCancelLabel: string;
};

type TaskPanelStrings = {
  title: string;
  closeLabel: string;
  closeTitle: string;
  detailsSectionTitle: string;
  basicsSectionTitle: string;
  attachmentsSectionTitle: string;
  commentsSectionTitle: string;
  descriptionLabel: string;
  assigneeLabel: string;
  deadlineLabel: string;
  priorityLabel: string;
  statusLabel: string;
  projectLabel: string;
  projectPlaceholder: string;
  addFileLabel: string;
  attachmentNote: string;
  removeAttachmentTitle: string;
  deleteTaskLabel: string;
  deleteTaskTitle: string;
  saveTaskLabel: string;
  saveTaskTitle: string;
  taskSavedMessage: string;
  noAttachments: string;
  noComments: string;
  commentPlaceholder: string;
};

type BoardStrings = {
  columnTitles: {
    backlog: string;
    todo: string;
    doing: string;
    done: string;
  };
  columnSubtitles: {
    backlog: string;
    todo: string;
    doing: string;
    done: string;
  };
  emptyColumn: string;
  assigneeNone: string;
};

type ProjectTooltipStrings = {
  empty: string;
  prefixTotal: string;
  labelBacklog: string;
  labelTodo: string;
  labelDoing: string;
  labelDone: string;
  labelOverdue: string;
  labelHighPriority: string;
};

type NotesStrings = {
  title: string;
  subtitle: string;
  closeLabel: string;
  newNoteLabel: string;
  newNoteTitle: string;
  savingLabel: string;
  savedLabel: string;
  emptyLabel: string;
  listAriaLabel: string;
  emptyListHint: string;
  emptyEditorHint: string;
  untitledLabel: string;
  pinnedTitle: string;
  pinLabel: string;
  unpinLabel: string;
  pinTitle: string;
  unpinTitle: string;
  colorLabel: string;
  colorNames: Record<"yellow" | "orange" | "green" | "blue" | "pink" | "gray", string>;
  deleteLabel: string;
  deleteTitle: string;
  noteTitleLabel: string;
  noteTitlePlaceholder: string;
  noteBodyLabel: string;
  noteBodyPlaceholder: string;
};

export type UiStrings = {
  toolbar: ToolbarStrings;
  sidebar: SidebarStrings;
  onboarding: OnboardingStrings;
  footer: FooterStrings;
  about: AboutStrings;
  aiSettings: AiSettingsStrings;
  dataHelp: DataHelpStrings;
  taskPanel: TaskPanelStrings;
  board: BoardStrings;
  workspaceAlerts: WorkspaceAlertsStrings;
  projectTooltips: ProjectTooltipStrings;
  date: DateStrings;
  notes: NotesStrings;
};

export const STRINGS: Record<Locale, UiStrings> = {
  da: {
    toolbar: {
      searchPlaceholder: "Søg...",
      themeToggleLight: "Skift til mørkt, hvis skærmen larmer",
      themeToggleDark: "Skift til lyst, hvis hovedet gør",
      filtersOn: "Filtre er tændt – sluk dem for at se virkeligheden igen",
      filtersOff: "Skru ned for støjen med et par filtre",
      filtersLabel: "Filtre",
      filtersHintActive: 'Filtre er aktive. Brug "Nulstil" for at se alle opgaver igen.',
      filtersAllPriorities: "Alle prioriteter",
      filtersAllAssignees: "Alle ansvarlige",
      newTaskTitleLabel: "Titel",
      newTaskProjectLabel: "Projekt",
      newTaskAssigneeLabel: "Ansvarlig",
      newTaskDescriptionLabel: "Beskrivelse (valgfri)",
      newTaskAssigneePlaceholder: "Navn (valgfrit)",
      newTaskProjectPlaceholderHasWorkspace: "Vælg projekt",
      newTaskProjectPlaceholderNoWorkspace: "Vælg arbejdsmappe først",
      newTaskCancelLabel: "Annuller",
      newTaskCreateLabel: "Opret opgave",
      newTaskMailHint:
        "Tip: Får du opgaven pr. mail, kan du indsætte emnelinjen i titel og teksten fra mailen i beskrivelsen.",
      newTaskWithProjects: "Opret en ny opgave på boardet",
      newTaskNoProjects: "Opret et projekt før du laver opgaver",
      titlePlaceholder: "Hvad skal gøres? (emnet fra mailen virker fint)",
      descriptionPlaceholder:
        "Kort tekst om opgaven – eller bare hele mailen, så tager vi den derfra.",
      aiSplitTooltip: "Lav flere konkrete opgaver ud fra tekstmuren, du lige indsatte",
      aiHelpTooltip:
        "Få hjælp til at skrive noget, der lyder mindre som en lynnote til dig selv",
      cancelNewTask: "Luk uden at oprette opgaven",
      saveNewTask: "Gem den nye opgave på boardet",
      resetFilters: "Fjern alle filtre og vis hele boardet igen",
      statsSummaryOk: "Du har fint styr på tingene",
      statsSummaryBusy: "God arbejdsdag i gang",
      statsSummaryProblems: "Lidt at indhente i dag",
      statsTotalLabelSingular: "opgave",
      statsTotalLabelPlural: "opgaver",
      statsTotalNone: "Ingen",
      statsDueTodaySuffix: "i dag",
      statsOverdueSuffixSingular: "forsinket",
      statsOverdueSuffixPlural: "forsinkede",
      statsDoingSuffix: "i gang",
      statsDoneSuffixSingular: "færdig",
      statsDoneSuffixPlural: "færdige",
      statsHighPrioritySuffix: "høj prioritet",
    },
    sidebar: {
      yourWorkspace: "Din arbejdsmappe",
      chooseWorkspace: "Vælg en arbejdsmappe på din computer for at komme i gang",
      switchWorkspace: "Skift til en anden arbejdsmappe (ny placering, ny PC eller bare oprydning)",
      refreshTooltip:
        "Ved delt mappe: klik for at hente andres ændringer (og se hvad de har lavet siden sidst)",
      projectsHeader: "Dine projekter",
      newProjectButton: "+ Nyt projekt",
      newProjectTitle: "Nyt projekt",
      newProjectDescription: "Giv projektet et navn, der er unikt i denne arbejdsmappe.",
      newProjectFieldLabel: "Projektnavn",
      newProjectPlaceholder: "F.eks. Kundeprojekter, Personlige opgaver …",
      newProjectCreateLabel: "Opret projekt",
      newProjectCancelLabel: "Annuller",
      briefButton: "✨ Brief",
      briefTooltip: "Få et kort morgen-overblik uden at åbne alle mails først",
      notesButton: "📝 Noter",
      notesTooltip: "Sticky Notes-agtige noter, der gemmes i arbejds­mappen",
      noProjects: "Ingen aktive projekter endnu. Start med ét – flere skal nok selv melde sig.",
      switchFolderButton: "Skift mappe",
      refreshButton: "Opdater",
      deleteProjectButton: "Slet projekt",
    },
    onboarding: {
      title: "Få ét overblik over dine opgaver",
      introLine1:
        "AIPOPS Workboard er et enkelt board til dine projekter og opgaver – især dem, der starter som lange mails eller chats.",
      introLine2:
        "Alt gemmes som filer i en mappe på din egen computer – ingen servere, ingen login.",
      steps: [
        "Vælg en arbejdsmappe til dine data (en almindelig mappe på din disk).",
        "Opret dit første projekt i sidebaren – arbejde, privat eller noget midt imellem.",
        "Tilføj opgaver og træk dem mellem kolonnerne (Backlog / Klar / I gang / Færdig).",
        "Får du opgaver via mail eller Teams? Kopiér emne og tekst ind i en ny opgave, og træk vedhæftninger hertil.",
      ],
      asciiHint: `Fra tekst til board:\n\n[ Mail / Teams ]  -->  [ To do | I gang | Færdig ]`,
      aiNote:
        "AI-hjælp til titler, beskrivelser og delopgaver er valgfrit. Hvis du vil bruge det, kan du senere tilføje din egen OpenAI-nøgle – dine opgaver gemmes stadig som filer i arbejds­mappen på din egen computer.",
      tourLabel: "Vis en kort rundtur efter valg af mappe",
      chooseFolderButton: "Vælg mappe",
      emptyBoardTitle: "Ingen opgaver endnu.",
      emptyBoardBody:
        "Nyd det et øjeblik – eller klik \"Ny opgave\" og begynd at være ærlig om din indbakke.",
      mobileWarningTitle: "AIPOPS Workboard virker bedst på en computer",
      mobileWarningBody:
        "Dette board er designet til større skærme. Åbn siden på en bærbar eller desktop for at arbejde med dine projekter og opgaver.",
    },
    footer: {
      aboutLink: "Om AIPOPS Workboard",
      aboutTooltip: "Læs lidt mere om, hvad AIPOPS Workboard er (og ikke er)",
      dataLink: "Data og flytning",
      dataTooltip:
        "Se hvordan dine data gemmes lokalt, og hvordan du flytter dem til en ny PC",
    },
    about: {
      title: "Om AIPOPS Workboard",
      p1: "AIPOPS Workboard er til dig, der får arbejde ind via mail og chats – ikke via flotte Gantt-diagrammer. Det er et lille board, hvor du kan samle projekter og opgaver ét sted, så du slipper for at lede efter ting i indbakken.",
      p2: "Du vælger selv en arbejdsmappe på din computer (eller et delt drev), og alt data – projekter, opgaver, kommentarer og vedhæftninger – gemmes kun der. Ingen cloud, ingen konto; du har fuld kontrol over dine data og kan flytte mappen, hvis du får ny computer.",
      p3: "Appen kører i browseren og bruger filsystem-API'en til at vælge en arbejdsmappe. Det betyder, at du skal bruge en moderne browser (fx Chrome eller Edge), og at det er en god idé at klikke på \"Opdater\" indimellem, hvis flere deler den samme mappe – så alle ser de samme ændringer.",
      p4: "Hvis du har lyst, kan du også tilføje din egen OpenAI API-nøgle. Så kan AIPOPS hjælpe med at foreslå titler, beskrivelser og delopgaver ud fra dine mails og noter. AI-delen er helt valgfri: dine opgaver ligger stadig som almindelige filer i din arbejdsmappe, og du godkender altid selv, hvad der oprettes.",
      closeLabel: "Luk",
      aiSettingsLabel: "AI-indstillinger",
    },
    aiSettings: {
      title: "AI-indstillinger (valgfrit)",
      intro:
        "Hvis du vil bruge AI-hjælp til titler og små tekstopgaver, kan du indtaste din egen OpenAI API-nøgle her. Nøglen gemmes kun som en fil i din arbejdsmappe og bruges kun, når du selv trykker på en AI-knap.",
      existingNote:
        "Der er allerede sat en AI-nøgle op for denne arbejdsmappe. Du kan ændre den herunder eller fjerne den helt.",
      label: "Din OpenAI API-nøgle",
      placeholder: "sk-...",
      skipNote:
        'Du kan altid springe dette over nu og tilføje nøglen senere fra "Om AIPOPS Workboard".',
      removeTitle: "Fjern AI-nøglen, så denne arbejdsmappe igen kører helt uden AI",
      removeLabel: "Fjern nøgle",
      skipTitleWithKey: "Luk uden at ændre noget",
      skipTitleNoKey: "Spring AI-opsætning over for nu",
      skipLabelWithKey: "Luk",
      skipLabelNoKey: "Spring over",
      saveTitleWithKey: "Opdater AI-nøglen for denne arbejdsmappe",
      saveTitleNoKey: "Gem din AI-nøgle, så AIPOPS kan hjælpe med tekster",
      saveLabelWithKey: "Opdater nøgle",
      saveLabelNoKey: "Gem nøgle",
    },
    dataHelp: {
      title: "Hvordan gemmes og flyttes dine data?",
      intro:
        "AIPOPS Workboard gemmer alle projekter og opgaver som almindelige filer i den arbejdsmappe, du har valgt. Der er ingen skjult database eller server.",
      bulletSamePc:
        'Skifte mappe på samme PC: Kopiér/ flyt hele arbejds­mappen til et nyt sted, og klik derefter på "Skift mappe" i sidebaren og peg på den nye placering.',
      bulletNewComputer:
        "Ny computer: Kopiér arbejds­mappen til den nye maskine (fx via USB, OneDrive eller andre steder), og vælg den derefter som arbejdsmappe i AIPOPS Workboard.",
      bulletMultiple:
        'Flere workspaces: Du kan have flere mapper (fx arbejde/privat) og skifte mellem dem med "Skift mappe".',
      outro:
        "Din AI‑nøgle gemmes også kun i arbejds­mappen. Flytter du mappen, følger AI‑opsætningen med.",
      confirmLabel: "OK",
    },
    taskPanel: {
      title: "Opgavedetaljer",
      closeLabel: "Luk",
      closeTitle: "Luk detaljevisningen og gå tilbage til boardet",
      detailsSectionTitle: "Opgavedetaljer",
      basicsSectionTitle: "Basisinfo",
      attachmentsSectionTitle: "Vedhæftninger",
      commentsSectionTitle: "Kommentarer",
      descriptionLabel: "Beskrivelse",
      assigneeLabel: "Ansvarlig",
      deadlineLabel: "Frist",
      priorityLabel: "Prioritet",
      statusLabel: "Status",
      projectLabel: "Projekt",
      projectPlaceholder: "Vælg projekt",
      addFileLabel: "Tilføj fil",
      attachmentNote: "(Evt. træk vedhæftninger hertil direkte fra din mail.)",
      removeAttachmentTitle: "Fjern denne vedhæftning fra opgaven",
      deleteTaskLabel: "Slet opgave",
      deleteTaskTitle: "Slet denne opgave (kan ikke fortrydes)",
      saveTaskLabel: "Gem opgave",
      saveTaskTitle: "Gem ændringerne til opgaven",
      taskSavedMessage: "Opgaven er gemt.",
      noAttachments: "Ingen vedhæftninger endnu.",
      noComments: "Ingen kommentarer endnu.",
      commentPlaceholder: "Skriv en kommentar",
    },
    board: {
      columnTitles: {
        backlog: "Backlog",
        todo: "Klar",
        doing: "I gang",
        done: "Færdig",
      },
      columnSubtitles: {
        backlog: "Idéer / senere",
        todo: "Klar til at starte",
        doing: "Arbejdet er i gang",
        done: "Færdigt arbejde",
      },
      emptyColumn: "Ingen opgaver i denne kolonne.",
      assigneeNone: "Ingen ansvarlig",
    },
    workspaceAlerts: {
      browserNoAccessTitle: "Din browser mangler mappeadgang",
      browserNoAccessConfirm: "OK",
      pickedWorkspaceMessage: "Arbejdsmappe valgt.",
      refreshSuccessMessage: "Data opdateret.",
      switchTitle: "Skift arbejdsmappe",
      switchMessage:
        "Når du skifter arbejdsmappe, ser du kun projekter og opgaver fra den nye mappe. De gamle data bliver liggende i den tidligere mappe.",
      switchConfirmLabel: "Skift arbejdsmappe",
      switchCancelLabel: "Behold nuværende",
    },
    projectTooltips: {
      empty: "Ingen opgaver endnu i dette projekt.",
      prefixTotal: "Opgaver i alt",
      labelBacklog: "Backlog",
      labelTodo: "Klar",
      labelDoing: "I gang",
      labelDone: "Færdige",
      labelOverdue: "Forsinkede",
      labelHighPriority: "Høj prioritet",
    },
    date: {
      dateLocale: "da-DK",
      noDeadlineLabel: "Ingen frist",
    },
    notes: {
      title: "Noter",
      subtitle: "Små post-its til ting, du lige skal huske – uden at de hører til en opgave.",
      closeLabel: "Luk",
      newNoteLabel: "+ Ny note",
      newNoteTitle: "Opret en ny sticky note",
      savingLabel: "Gemmer…",
      savedLabel: "Gemt",
      emptyLabel: "Ingen noter endnu",
      listAriaLabel: "Liste over noter",
      emptyListHint: "Ingen noter endnu. Opret en ny, når du får en tanke.",
      emptyEditorHint: "Vælg en note i listen, eller opret en ny.",
      untitledLabel: "Uden titel",
      pinnedTitle: "Fastgjort",
      pinLabel: "Fastgør",
      unpinLabel: "Løsn",
      pinTitle: "Fastgør denne note øverst",
      unpinTitle: "Fjern fastgørelse",
      colorLabel: "Farve",
      colorNames: {
        yellow: "Gul",
        orange: "Orange",
        green: "Grøn",
        blue: "Blå",
        pink: "Pink",
        gray: "Grå",
      },
      deleteLabel: "Slet",
      deleteTitle: "Slet denne note",
      noteTitleLabel: "Titel",
      noteTitlePlaceholder: "Kort titel (valgfri)",
      noteBodyLabel: "Note",
      noteBodyPlaceholder: "Skriv din note her…",
    },
  },
  en: {
    toolbar: {
      searchPlaceholder: "Search",
      themeToggleLight: "Switch to dark if the screen is shouting at you",
      themeToggleDark: "Switch to light if your head is",
      filtersOn: "Filters are on – turn them off to see reality again",
      filtersOff: "Turn down the noise with a couple of filters",
      filtersLabel: "Filters",
      filtersHintActive: 'Filters are active. Use "Reset" to see all tasks again.',
      filtersAllPriorities: "All priorities",
      filtersAllAssignees: "All assignees",
      newTaskTitleLabel: "Title",
      newTaskProjectLabel: "Project",
      newTaskAssigneeLabel: "Assignee",
      newTaskDescriptionLabel: "Description (optional)",
      newTaskAssigneePlaceholder: "Name (optional)",
      newTaskProjectPlaceholderHasWorkspace: "Choose project",
      newTaskProjectPlaceholderNoWorkspace: "Choose workspace first",
      newTaskCancelLabel: "Cancel",
      newTaskCreateLabel: "Create task",
      newTaskMailHint:
        "Tip: If the task came by email, paste the subject as the title and the body into the description.",
      newTaskWithProjects: "Create a new task on the board",
      newTaskNoProjects: "Create a project before you start adding tasks",
      titlePlaceholder: "What needs doing? (the email subject usually works fine)",
      descriptionPlaceholder:
        "Short description of the task – or just paste the whole email and we’ll go from there.",
      aiSplitTooltip: "Let AI suggest smaller tasks from that wall of text you pasted",
      aiHelpTooltip: "Get help writing something that sounds less like a note to yourself",
      cancelNewTask: "Close without creating the task",
      saveNewTask: "Save the new task on the board",
      resetFilters: "Clear all filters and show the full board again",
      statsSummaryOk: "You’re on top of things",
      statsSummaryBusy: "A solid workday in progress",
      statsSummaryProblems: "A bit to catch up on today",
      statsTotalLabelSingular: "task",
      statsTotalLabelPlural: "tasks",
      statsTotalNone: "No",
      statsDueTodaySuffix: "today",
      statsOverdueSuffixSingular: "overdue",
      statsOverdueSuffixPlural: "overdue",
      statsDoingSuffix: "in progress",
      statsDoneSuffixSingular: "done",
      statsDoneSuffixPlural: "done",
      statsHighPrioritySuffix: "high priority",
    },
    sidebar: {
      yourWorkspace: "Your workspace",
      chooseWorkspace: "Pick a folder on your computer to get started",
      switchWorkspace:
        "Switch to another workspace folder (new location, new machine, or just tidying up)",
      refreshTooltip:
        "On shared folders: click to pull in everyone else’s changes (see what they’ve been up to)",
      projectsHeader: "Your projects",
      newProjectButton: "+ New project",
      newProjectTitle: "New project",
      newProjectDescription: "Give the project a name that’s unique in this workspace.",
      newProjectFieldLabel: "Project name",
      newProjectPlaceholder: "E.g. Client projects, Personal tasks …",
      newProjectCreateLabel: "Create project",
      newProjectCancelLabel: "Cancel",
      briefButton: "✨ Brief",
      briefTooltip: "Get a quick morning overview without opening every email first",
      notesButton: "📝 Notes",
      notesTooltip: "Sticky-note style notes stored in your workspace folder",
      noProjects:
        "No active projects yet. Start with one – more will show up on their own soon enough.",
      switchFolderButton: "Switch folder",
      refreshButton: "Refresh",
      deleteProjectButton: "Delete project",
    },
    onboarding: {
      title: "Get a single view of your work",
      introLine1:
        "AIPOPS Workboard is a simple board for your projects and tasks – especially the ones that start as long emails or chats.",
      introLine2:
        "Everything is stored as files in a folder on your own computer – no servers, no login.",
      steps: [
        "Choose a folder for your data (a regular folder on your disk).",
        "Create your first project in the sidebar – work, personal, or something in between.",
        "Add tasks and drag them between columns (Backlog / Ready / Doing / Done).",
        "Get tasks via email or chat? Paste subject and text into a new task and drag attachments over.",
      ],
      asciiHint: `From text to board:\n\n[ Mail / Chat ]  -->  [ To do | Doing | Done ]`,
      aiNote:
        "AI help for titles, descriptions and subtasks is optional. If you want it, add your own OpenAI key later – your tasks still live as files in your workspace folder.",
      tourLabel: "Show a short tour after choosing a folder",
      chooseFolderButton: "Choose folder",
      emptyBoardTitle: "No tasks yet.",
      emptyBoardBody:
        'Enjoy it for a moment – or click "New task" and get honest about your inbox.',
      mobileWarningTitle: "AIPOPS Workboard works best on a computer",
      mobileWarningBody:
        "This board is designed for larger screens. Open it on a laptop or desktop to work comfortably with your projects and tasks.",
    },
    footer: {
      aboutLink: "About AIPOPS Workboard",
      aboutTooltip: "Read a bit about what AIPOPS Workboard is (and isn’t)",
      dataLink: "Data & moving it",
      dataTooltip:
        "See how your data is stored locally and how to move it to a new machine",
    },
    about: {
      title: "About AIPOPS Workboard",
      p1: "AIPOPS Workboard is for people who get work through emails and chats – not fancy Gantt charts. It’s a small board where you collect projects and tasks in one place instead of hunting through your inbox.",
      p2: "You pick a workspace folder on your computer (or a shared drive), and all data – projects, tasks, comments and attachments – lives only there. No cloud, no account; you stay in full control and can move the folder if you get a new machine.",
      p3: "The app runs in your browser and uses the File System Access API to select a workspace folder. That means you need a modern browser (like Chrome or Edge), and it’s a good idea to click “Refresh” once in a while if several people share the same folder – so everyone sees the latest changes.",
      p4: "If you want to, you can add your own OpenAI API key. Then AIPOPS can help with titles, descriptions and subtasks based on your emails and notes. The AI part is completely optional: your tasks still live as regular files in your workspace folder, and you always decide what gets created.",
      closeLabel: "Close",
      aiSettingsLabel: "AI settings",
    },
    aiSettings: {
      title: "AI settings (optional)",
      intro:
        "If you want AI help for titles and small text tasks, you can enter your own OpenAI API key here. The key is stored only as a file in your workspace and is only used when you click an AI button.",
      existingNote:
        "There is already an AI key configured for this workspace. You can change it below or remove it completely.",
      label: "Your OpenAI API key",
      placeholder: "sk-...",
      skipNote:
        'You can always skip this for now and add the key later from "About AIPOPS Workboard".',
      removeTitle: "Remove the AI key so this workspace runs fully without AI again",
      removeLabel: "Remove key",
      skipTitleWithKey: "Close without changing anything",
      skipTitleNoKey: "Skip AI setup for now",
      skipLabelWithKey: "Close",
      skipLabelNoKey: "Skip",
      saveTitleWithKey: "Update the AI key for this workspace",
      saveTitleNoKey: "Save your AI key so AIPOPS can help with text",
      saveLabelWithKey: "Update key",
      saveLabelNoKey: "Save key",
    },
    dataHelp: {
      title: "How is your data stored and moved?",
      intro:
        "AIPOPS Workboard stores all projects and tasks as regular files in the workspace folder you chose. There’s no hidden database or server.",
      bulletSamePc:
        'Switch folder on the same PC: Copy/move the entire workspace folder to a new location, then click "Switch folder" in the sidebar and point to the new place.',
      bulletNewComputer:
        "New computer: Copy the workspace folder to the new machine (via USB, OneDrive or somewhere else), then choose it as your workspace folder in AIPOPS Workboard.",
      bulletMultiple:
        'Multiple workspaces: You can keep several folders (e.g. work/personal) and switch between them using "Switch folder".',
      outro:
        "Your AI key also only lives inside the workspace folder. If you move the folder, the AI setup comes along.",
      confirmLabel: "OK",
    },
    taskPanel: {
      title: "Task details",
      closeLabel: "Close",
      closeTitle: "Close the detail view and go back to the board",
      detailsSectionTitle: "Task details",
      basicsSectionTitle: "Basics",
      attachmentsSectionTitle: "Attachments",
      commentsSectionTitle: "Comments",
      descriptionLabel: "Description",
      assigneeLabel: "Assignee",
      deadlineLabel: "Due date",
      priorityLabel: "Priority",
      statusLabel: "Status",
      projectLabel: "Project",
      projectPlaceholder: "Choose project",
      addFileLabel: "Add file",
      attachmentNote: "(You can also drag attachments here directly from your email.)",
      removeAttachmentTitle: "Remove this attachment from the task",
      deleteTaskLabel: "Delete task",
      deleteTaskTitle: "Delete this task (cannot be undone)",
      saveTaskLabel: "Save task",
      saveTaskTitle: "Save your changes to the task",
      taskSavedMessage: "Task saved.",
      noAttachments: "No attachments yet.",
      noComments: "No comments yet.",
      commentPlaceholder: "Write a comment",
    },
    board: {
      columnTitles: {
        backlog: "Backlog",
        todo: "Ready",
        doing: "Doing",
        done: "Done",
      },
      columnSubtitles: {
        backlog: "Ideas / later",
        todo: "Ready to start",
        doing: "Work in progress",
        done: "Finished work",
      },
      emptyColumn: "No tasks in this column.",
      assigneeNone: "No assignee",
    },
    workspaceAlerts: {
      browserNoAccessTitle: "Your browser does not support folder access",
      browserNoAccessConfirm: "OK",
      pickedWorkspaceMessage: "Workspace folder selected.",
      refreshSuccessMessage: "Data refreshed.",
      switchTitle: "Switch workspace folder",
      switchMessage:
        "When you switch workspace folder, you only see projects and tasks from the new folder. The old data stays in the previous folder.",
      switchConfirmLabel: "Switch folder",
      switchCancelLabel: "Keep current",
    },
    projectTooltips: {
      empty: "No tasks in this project yet.",
      prefixTotal: "Tasks total",
      labelBacklog: "Backlog",
      labelTodo: "Ready",
      labelDoing: "Doing",
      labelDone: "Done",
      labelOverdue: "Overdue",
      labelHighPriority: "High priority",
    },
    date: {
      dateLocale: "en-US",
      noDeadlineLabel: "No due date",
    },
    notes: {
      title: "Notes",
      subtitle: "Small sticky notes for things you need to remember – not tied to tasks or projects.",
      closeLabel: "Close",
      newNoteLabel: "+ New note",
      newNoteTitle: "Create a new sticky note",
      savingLabel: "Saving…",
      savedLabel: "Saved",
      emptyLabel: "No notes yet",
      listAriaLabel: "Notes list",
      emptyListHint: "No notes yet. Create one when a thought pops up.",
      emptyEditorHint: "Select a note from the list, or create a new one.",
      untitledLabel: "Untitled",
      pinnedTitle: "Pinned",
      pinLabel: "Pin",
      unpinLabel: "Unpin",
      pinTitle: "Pin this note to the top",
      unpinTitle: "Remove pin",
      colorLabel: "Color",
      colorNames: {
        yellow: "Yellow",
        orange: "Orange",
        green: "Green",
        blue: "Blue",
        pink: "Pink",
        gray: "Gray",
      },
      deleteLabel: "Delete",
      deleteTitle: "Delete this note",
      noteTitleLabel: "Title",
      noteTitlePlaceholder: "Short title (optional)",
      noteBodyLabel: "Note",
      noteBodyPlaceholder: "Write your note here…",
    },
  },
};

