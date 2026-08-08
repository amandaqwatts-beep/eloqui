import { latinToIPA, type LatinMode } from "~/engine/ipaConverter";

let voices: SpeechSynthesisVoice[] | null = null;
let listening = false;
function available(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  if (voices === null) {
    voices = window.speechSynthesis.getVoices();
    if (!listening) {
      window.speechSynthesis.addEventListener("voiceschanged", () => { voices = window.speechSynthesis.getVoices(); });
      listening = true;
    }
  }
  return voices;
}
function speak(text: string, language: "latin" | "english"): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const list = available();
  const voice = language === "latin"
    ? list.find(v => v.lang.toLowerCase().startsWith("it"))
      ?? list.find(v => v.lang.toLowerCase().startsWith("la"))
      ?? list.find(v => v.lang.toLowerCase().startsWith("en"))
    : list.find(v => v.lang.toLowerCase().startsWith("en"));
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.lang = language === "latin" ? "it-IT" : "en-US";
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
export function speakLatin(text: string, mode: LatinMode = "ecclesiastical"): void {
  // IPA speech quality depends on browser voice support. Italian voices
  // produce the closest phoneme match for Ecclesiastical Latin IPA.
  speak(latinToIPA(text, mode), "latin");
}
export function speakEnglish(text: string): void { speak(text, "english"); }
export function stopSpeech(): void { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); }
