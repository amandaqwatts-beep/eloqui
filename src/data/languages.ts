export type Language = "latin" | "greek" | "hebrew" | "english";

export interface LanguageConfig {
  id: Language;
  name: string;
  description: string;
  hasCharacterQuizzer: boolean;
  hasPlacement: boolean;
  pronunciationModes: string[];
  rtl: boolean;
}

export const LANGUAGES: Record<Language, LanguageConfig> = {
  latin: { id: "latin", name: "Latin", description: "Read the language of Rome and the roots of Western learning.", hasCharacterQuizzer: false, hasPlacement: true, pronunciationModes: ["ecclesiastical", "classical"], rtl: false },
  greek: { id: "greek", name: "Biblical Greek", description: "Explore the language of the New Testament and early Christianity.", hasCharacterQuizzer: true, hasPlacement: false, pronunciationModes: ["erasmian", "koine"], rtl: false },
  hebrew: { id: "hebrew", name: "Biblical Hebrew", description: "Encounter the language and texts of the Hebrew Bible.", hasCharacterQuizzer: true, hasPlacement: false, pronunciationModes: ["traditional", "modern"], rtl: true },
  english: { id: "english", name: "English", description: "Build formal register, academic vocabulary, and classical roots.", hasCharacterQuizzer: false, hasPlacement: true, pronunciationModes: ["standard"], rtl: false },
};
