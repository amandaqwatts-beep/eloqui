import type { Exercise, Lesson } from "~/data/latinLessons";
import type { PronMode } from "~/lib/pronunciation";
import type { ExerciseResultDetail } from "~/engine/types";
import NavBar from "~/components/NavBar"; import ReferenceTable from "~/components/ReferenceTable"; import ProgressBar from "~/components/ProgressBar"; import MultipleChoice from "~/components/MultipleChoice"; import FillInBlank from "~/components/FillInBlank"; import MatchingPairs from "~/components/MatchingPairs"; import Flashcard from "~/components/Flashcard"; import ReadingPassage from "~/components/ReadingPassage"; import CultureQuestion from "~/components/CultureQuestion";

/**
 * ExerciseRenderer — MC and fill-in-blank forward wrong/expected through the
 * additive onResult hook (diagnostics data-gap fix); the remaining exercise
 * types (matching / flashcard / reading-passage) contribute a bare boolean
 * wrapped as `{ correct }` — their wrong/expected semantics are not defined
 * yet. onComplete stays a boolean everywhere (legacy consumers unchanged).
 */
function ExerciseRenderer({exercise,onComplete,onResult,pronMode}:{exercise:Exercise;onComplete:(detail:ExerciseResultDetail)=>void;onResult:(detail:ExerciseResultDetail)=>void;pronMode:PronMode}){
  switch(exercise.type){
    case "multiple-choice": return <MultipleChoice exercise={exercise} onComplete={(c)=>{onComplete({correct:c})}} onResult={onResult}/>;
    case "fill-in-blank": return <FillInBlank exercise={exercise} onComplete={(c)=>{onComplete({correct:c})}} onResult={onResult}/>;
    case "matching": return <MatchingPairs exercise={exercise} onComplete={(correct)=>{onComplete({correct})}} pronMode={pronMode}/>;
    case "flashcard": return <Flashcard exercise={exercise} onComplete={(correct)=>{onComplete({correct})}}/>;
    case "reading-passage": return <ReadingPassage exercise={exercise} pronMode={pronMode} onComplete={(correct)=>{onComplete({correct})}}/>;
    case "culture-question": return <CultureQuestion exercise={exercise} onComplete={(c)=>{onComplete({correct:c})}} onResult={onResult}/>;
    default: return <p className="text-red-500">Unknown exercise type</p>
  }
}
interface Props {lesson:Lesson;exerciseIdx:number;pronMode:PronMode;onComplete:(detail:ExerciseResultDetail)=>void;onQuit:()=>void}
export default function ExerciseScreen({lesson,exerciseIdx,pronMode,onComplete,onQuit}:Props){const ex=lesson.exercises[exerciseIdx];return <div className="min-h-dvh flex flex-col"><NavBar/><main className="flex-1 px-4 py-4 sm:py-8 flex flex-col"><div className="mx-auto w-full max-w-2xl flex-1 flex flex-col"><div className="mb-6"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500">Lesson {lesson.id} · Exercise {exerciseIdx+1} of {lesson.exercises.length}</span><button onClick={onQuit} className="text-sm text-gray-400 hover:text-burgundy-600 transition">Quit</button></div><ProgressBar current={exerciseIdx} total={lesson.exercises.length}/></div>{lesson.referenceTable&&<details className="mb-5 group"><summary className="text-sm font-medium text-burgundy-600 cursor-pointer hover:text-burgundy-800 transition flex items-center gap-1">▶ Reference Chart</summary><div className="mt-2"><ReferenceTable {...lesson.referenceTable} pronMode={pronMode}/></div></details>}<div className="flex-1"><ExerciseRenderer key={`${lesson.id}-${exerciseIdx}`} exercise={ex} onComplete={onComplete} onResult={onComplete} pronMode={pronMode}/></div></div></main></div>}
