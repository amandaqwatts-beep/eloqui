import { useEffect, useState, type ReactNode } from "react";
import type { Exercise, Lesson } from "~/data/latinLessons";
import type { PronMode } from "~/lib/pronunciation";
import type { ExerciseResultDetail, ExplanationResult, ExplanationPoint } from "~/engine/types";
import { getExplanation } from "~/engine/errorAnalysis";
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

/**
 * ExplanationPanel — rule-generated error analysis (getExplanation) rendered
 * BELOW the exercise's canned feedback box (lead decision C1). Title, body,
 * points (highlight substrings emphasized), static drill suggestion + related
 * concept lines. Pure presentation — receives a ready ExplanationResult.
 */
function highlightText(text: string, highlights: string[] = []): ReactNode {
  let nodes: ReactNode[] = [text];
  for (const h of highlights) {
    if (!h) continue;
    const next: ReactNode[] = [];
    for (const node of nodes) {
      if (typeof node !== "string") { next.push(node); continue; }
      const parts = node.split(h);
      if (parts.length === 1) { next.push(node); continue; }
      parts.forEach((part, i) => {
        if (i > 0) next.push(<strong key={`${h}-${i}`} className="text-burgundy-800">{h}</strong>);
        if (part) next.push(part);
      });
    }
    nodes = next;
  }
  return nodes;
}

function renderPoint(point: ExplanationPoint): ReactNode {
  return highlightText(point.text, point.highlight ?? []);
}

function ExplanationPanel({ explanation }: { explanation: ExplanationResult }) {
  return (
    <div className="rounded-2xl border border-gold-300 bg-gold-50 p-4">
      <p className="text-sm font-bold text-burgundy-900">{explanation.title}</p>
      <p className="mt-1 text-sm text-gray-700">{explanation.body}</p>
      {explanation.points.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          {explanation.points.map((p, i) => (
            <li key={i}>• {renderPoint(p)}</li>
          ))}
        </ul>
      )}
      {explanation.drillSuggestion && (
        <p className="mt-2 text-sm font-semibold text-burgundy-700">
          Drill: {explanation.drillSuggestion.label}
        </p>
      )}
      {explanation.relatedConcept && (
        <p className="mt-1 text-xs text-gray-400">
          Related: {explanation.relatedConcept.label}
        </p>
      )}
    </div>
  );
}

interface Props {lesson:Lesson;exerciseIdx:number;pronMode:PronMode;onComplete:(detail:ExerciseResultDetail)=>void;onQuit:()=>void;allLessons?:Lesson[]}
export default function ExerciseScreen({lesson,exerciseIdx,pronMode,onComplete,onQuit,allLessons}:Props){
  const ex=lesson.exercises[exerciseIdx];
  // Error analysis (engine: getExplanation) — wrong MC/fill answers get a
  // rule-generated what/why/correct/why-correct panel; everything else stays
  // byte-identical. Reset per exercise: ExerciseScreen persists across
  // exerciseIdx changes within a run.
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  useEffect(() => { setExplanation(null); }, [lesson.id, exerciseIdx]);
  const handleResult = (detail: ExerciseResultDetail) => {
    if (!detail.correct && (ex.type === "multiple-choice" || ex.type === "fill-in-blank")) {
      setExplanation(getExplanation({ detail, exercise: ex, lesson, allLessons }));
    }
  };
  return <div className="min-h-dvh flex flex-col"><NavBar/><main className="paper-desk flex-1 px-4 py-4 sm:py-8 flex flex-col"><div className="paper-page flex-1 flex flex-col pt-6 pr-6 pb-6 pl-8 sm:pt-8 sm:pr-8 sm:pb-8 sm:pl-10"><div className="mb-6"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500">Lesson {lesson.id} · Exercise {exerciseIdx+1} of {lesson.exercises.length}</span><button onClick={onQuit} className="text-sm text-gray-400 hover:text-burgundy-600 transition">Quit</button></div><ProgressBar current={exerciseIdx} total={lesson.exercises.length}/></div>{lesson.referenceTable&&<details className="mb-5 group"><summary className="text-sm font-medium text-burgundy-600 cursor-pointer hover:text-burgundy-800 transition flex items-center gap-1">▶ Reference Chart</summary><div className="mt-2"><ReferenceTable {...lesson.referenceTable} pronMode={pronMode}/></div></details>}<div className="flex-1"><ExerciseRenderer key={`${lesson.id}-${exerciseIdx}`} exercise={ex} onComplete={onComplete} onResult={handleResult} pronMode={pronMode}/></div>{explanation && <div className="mt-4"><ExplanationPanel explanation={explanation}/></div>}</div></main></div>}
