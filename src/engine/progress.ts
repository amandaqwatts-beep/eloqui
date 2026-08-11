import type { Language } from "~/data/languages";
import type { DiagnosticEvent } from "~/engine/types";
import { getWeakSpots } from "~/engine/diagnostics";
export interface LessonProgress { lessonId:number; completed:boolean; bestScore:number; lastAttemptedAt:string|null; timesCompleted:number }
export interface DashboardStats { lessonsCompleted:number; totalLessons:number; overallAccuracy:number; currentStreak:number; bestStreak:number; totalExercisesAnswered:number; totalCorrect:number; weakConcepts:{conceptId:string;accuracy:number}[] }
const KEY='verbum-progress'; const TOTAL='verbum-progress-totals';
const scoped=(key:string, language:Language='latin') => `${key}-${language}`;
export function loadProgress(language:Language='latin'):LessonProgress[]{if(typeof window==='undefined')return [];try{const raw=localStorage.getItem(scoped(KEY,language)) ?? (language==='latin'?localStorage.getItem(KEY):null);return JSON.parse(raw||'[]')}catch{return []}}
export function saveProgress(lessonId:number,score:number,total:number,language:Language='latin'){if(typeof window==='undefined')return;const list=loadProgress(language);const i=list.findIndex(x=>x.lessonId===lessonId);const entry={lessonId,completed:true,bestScore:Math.max(0,Math.min(100,Math.round(score/Math.max(1,total)*100))),lastAttemptedAt:new Date().toISOString(),timesCompleted:(i>=0?list[i].timesCompleted:0)+1};if(i>=0)list[i]={...list[i],...entry,bestScore:Math.max(list[i].bestScore,entry.bestScore)};else list.push(entry);localStorage.setItem(scoped(KEY,language),JSON.stringify(list));const totalKey=scoped(TOTAL,language);let t={answered:0,correct:0};try{t=JSON.parse(localStorage.getItem(totalKey)||'{"answered":0,"correct":0}')}catch{};t.answered+=total;t.correct+=score;localStorage.setItem(totalKey,JSON.stringify(t))}
/**
 * Optional 4th param (diagnostics): when `events` is given, weakConcepts is
 * populated from getWeakSpots (limit 10) instead of the dead accuracy-0
 * placeholder. Without it, behavior is byte-identical to before.
 */
export function getDashboardStats(totalLessons:number,concepts:string[]=[],language:Language='latin',events?:DiagnosticEvent[]):DashboardStats{const p=loadProgress(language);let t={answered:0,correct:0};try{t=JSON.parse(localStorage.getItem(scoped(TOTAL,language))||'{"answered":0,"correct":0}')}catch{};let weakConcepts=concepts.map(c=>({conceptId:c,accuracy:0}));if(events&&events.length>0){weakConcepts=getWeakSpots(events,[],{limit:10}).map(w=>({conceptId:w.conceptId,accuracy:w.accuracy}))}return {lessonsCompleted:p.filter(x=>x.completed).length,totalLessons,overallAccuracy:t.answered?Math.round(t.correct/t.answered*100):0,currentStreak:0,bestStreak:0,totalExercisesAnswered:t.answered,totalCorrect:t.correct,weakConcepts}}
