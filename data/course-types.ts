export type Locale = "fr" | "en";

export type Localized = {
  fr: string;
  en: string;
};

export type LessonSection = {
  body: Localized;
  bullets: Record<Locale, string[]>;
  id: string;
  title: Localized;
};

export type LabStep = {
  detail: Localized;
  id: string;
  title: Localized;
};

export type GuidedLab = {
  objective: Localized;
  steps: LabStep[];
  title: Localized;
};

export type ModuleDetails = {
  estimatedTime: Localized;
  examples: Record<Locale, string[]>;
  failureFeedback: Localized;
  guidedLab: GuidedLab;
  lessonSections: LessonSection[];
  objectives: Record<Locale, string[]>;
  prerequisites: Record<Locale, string[]>;
};

export type CourseModule = ModuleDetails & {
  id: string;
  keyPoints: Record<Locale, string[]>;
  practice: Localized;
  summary: Localized;
  tips: Record<Locale, string[]>;
  title: Localized;
};

export type Question = {
  answer: number;
  explanation: Localized;
  id: string;
  options: Record<Locale, string[]>;
  question: Localized;
};

export type Level = {
  duration: Localized;
  goal: Localized;
  id: string;
  modules: CourseModule[];
  name: Localized;
  quiz?: Question[];
  rank: number;
};

export type TrainingContent = {
  capstone: {
    brief: Localized;
    deliverables: Record<Locale, string[]>;
    title: Localized;
  };
  levels: Level[];
  meta: {
    sourceNote: Localized;
    subtitle: Localized;
    title: Localized;
  };
};

export type ModuleQuizBank = Record<string, Question[]>;
