import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { PronMode } from "~/lib/pronunciation";
import AIPractice from "~/components/AIPractice";
interface Props {
  lesson: Lesson;
  pronMode: PronMode;
  onBack: () => void;
  aiEnabled: boolean;
  /** Language of the lesson; defaults to latin inside AIPractice. */
  language?: Language;
  /** Curriculum used for fallback distractors (English passes englishLessons). */
  distractorLessons?: Lesson[];
}
export default function AIPracticeScreen({lesson,pronMode,onBack,aiEnabled,language,distractorLessons}:Props){
  return (
    <AIPractice
      lesson={lesson}
      pronMode={pronMode}
      onBack={onBack}
      aiEnabled={aiEnabled}
      language={language}
      distractorLessons={distractorLessons}
    />
  );
}
