import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { PronMode } from "~/lib/pronunciation";
import AIPractice from "~/components/AIPractice";
import WindowFrame from "~/components/WindowFrame";
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
    <WindowFrame title="AI Practice" onBack={onBack}>
      <AIPractice
        lesson={lesson}
        pronMode={pronMode}
        onBack={onBack}
        aiEnabled={aiEnabled}
        language={language}
        distractorLessons={distractorLessons}
      />
    </WindowFrame>
  );
}
