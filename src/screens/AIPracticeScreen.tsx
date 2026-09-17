import type { Lesson } from "~/data/latinLessons";
import type { Language } from "~/data/languages";
import type { PronMode } from "~/lib/pronunciation";
import AIPractice from "~/components/AIPractice";
import WindowFrame from "~/components/WindowFrame";
import type { Recommendation } from "~/engine/recommendation";
interface Props {
  lesson: Lesson;
  pronMode: PronMode;
  onBack: () => void;
  aiEnabled: boolean;
  /** Language of the lesson; defaults to latin inside AIPractice. */
  language?: Language;
  /** Curriculum used for fallback distractors (English passes englishLessons). */
  distractorLessons?: Lesson[];
  /** Free-zone "do the recommended" idle callout (optional — absent → byte-identical). */
  recommendation?: Recommendation | null;
  onDoRecommended?: () => void;
}
export default function AIPracticeScreen({lesson,pronMode,onBack,aiEnabled,language,distractorLessons,recommendation,onDoRecommended}:Props){
  return (
    <WindowFrame title="AI Practice" onBack={onBack}>
      {/* key={lesson.id}: "do the recommended" can retarget AI practice to a
          different lesson mid-screen (idle-only jump) — the remount forces the
          internal idle/practicing state back to fresh for the new lesson. */}
      <AIPractice
        key={lesson.id}
        lesson={lesson}
        pronMode={pronMode}
        onBack={onBack}
        aiEnabled={aiEnabled}
        language={language}
        distractorLessons={distractorLessons}
        recommendation={recommendation}
        onDoRecommended={onDoRecommended}
      />
    </WindowFrame>
  );
}
