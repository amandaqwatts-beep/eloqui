import type { Lesson } from "~/data/latinLessons";
import type { PronMode } from "~/lib/pronunciation";
import AIPractice from "~/components/AIPractice";
interface Props { lesson: Lesson; pronMode: PronMode; onBack:()=>void; aiEnabled: boolean; }
export default function AIPracticeScreen({lesson,pronMode,onBack,aiEnabled}:Props){return <AIPractice lessonId={lesson.id} lessonTitle={lesson.title} pronMode={pronMode} onBack={onBack} aiEnabled={aiEnabled}/>}
