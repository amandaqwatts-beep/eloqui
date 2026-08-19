import { useEffect, useMemo, useState } from "react";
import type { Lesson } from "~/data/latinLessons";
import { createAudioLoop, type AudioLoopState, type AudioLoopItem } from "~/engine/audioPlayer";
import WindowFrame from "~/components/WindowFrame";

interface Props {
  lessons: Lesson[];
  unlockedLessons: number;
  onBack: () => void;
}

export default function AudioPlayerScreen({ lessons, unlockedLessons, onBack }: Props) {
  const [lessonId, setLessonId] = useState(1);
  const [kind, setKind] = useState("current");
  const [repeat, setRepeat] = useState(3);
  const [pause, setPause] = useState(800);
  const [rate, setRate] = useState(0.85);
  const [loop, setLoop] = useState(false);
  const [includeEnglish, setIncludeEnglish] = useState(true);
  const [state, setState] = useState<AudioLoopState>({
    playing: false,
    currentItemIndex: 0,
    currentRepeat: 0,
  });
  const available = lessons.slice(0, unlockedLessons);
  const items = useMemo(() => {
    const vals =
      kind === "current"
        ? (lessons.find((l) => l.id === lessonId)?.vocabulary ?? []).map((v) => ({
            text: v.latin,
            english: v.english,
          }))
        : kind === "vocab"
          ? available.flatMap((l) =>
              (l.vocabulary ?? []).map((v) => ({ text: v.latin, english: v.english })),
            )
          : kind === "sentences"
            ? available.flatMap((l) =>
                (l.teachingSteps ?? []).map((s) => ({
                  text: s.exampleLatin,
                  english: s.exampleEnglish,
                })),
              )
            : available.flatMap((l) =>
                (l.referenceTable?.rows ?? []).map((r) => ({ text: r.join(", "), english: "" })),
              );
    return vals.flatMap((v) =>
      includeEnglish && v.english
        ? [
            { text: v.text, language: "latin" as const },
            { text: v.english, language: "english" as const },
          ]
        : [{ text: v.text, language: "latin" as const }],
    );
  }, [kind, lessonId, lessons, unlockedLessons, includeEnglish]);
  const player = useMemo(
    () =>
      createAudioLoop({
        items: items as AudioLoopItem[],
        repeatEach: repeat,
        pauseBetweenMs: pause,
        loopForever: loop,
        rate,
      }),
    [items, repeat, pause, loop, rate],
  );
  useEffect(() => {
    const off = player.onStateChange(setState);
    return () => {
      off();
      player.stop();
    };
  }, [player]);
  const current = items[state.currentItemIndex];
  return (
    <WindowFrame title="Listen" onBack={onBack} variant="overlay">
      <main className="px-4 py-8 text-burgundy-900">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-black">🎧 Listen &amp; Learn</h1>
          <div className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow">
            <label className="block font-bold">
              Content
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3"
              >
                <option value="current">Current vocab</option>
                <option value="vocab">All unlocked vocab</option>
                <option value="charts">Declension charts</option>
                <option value="sentences">Example sentences</option>
              </select>
            </label>
            {kind === "current" && (
              <select
                value={lessonId}
                onChange={(e) => setLessonId(+e.target.value)}
                className="w-full rounded-lg border p-3"
              >
                {available.map((l) => (
                  <option key={l.id} value={l.id}>
                    Lesson {l.id}: {l.title}
                  </option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={includeEnglish}
                onChange={(e) => setIncludeEnglish(e.target.checked)}
              />{" "}
              Include English
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5].map((x) => (
                <button
                  onClick={() => setRepeat(x)}
                  className={`rounded-lg px-3 py-2 ${repeat === x ? "bg-gold-400" : "bg-gray-100"}`}
                  key={x}
                >
                  {x}x
                </button>
              ))}
              {[500, 1000, 2000].map((x) => (
                <button
                  onClick={() => setPause(x)}
                  className={`rounded-lg px-3 py-2 ${pause === x ? "bg-gold-400" : "bg-gray-100"}`}
                  key={x}
                >
                  {x / 1000}s
                </button>
              ))}
              {[0.7, 0.85, 1].map((x) => (
                <button
                  onClick={() => setRate(x)}
                  className={`rounded-lg px-3 py-2 ${rate === x ? "bg-gold-400" : "bg-gray-100"}`}
                  key={x}
                >
                  {x}x
                </button>
              ))}
              <button
                onClick={() => setLoop(!loop)}
                className={`rounded-lg px-3 py-2 ${loop ? "bg-gold-400" : "bg-gray-100"}`}
              >
                🔁 Loop All
              </button>
            </div>
            <div className="my-8 text-center">
              <div className="text-3xl font-black">{current?.text ?? "Ready"}</div>
              {state.language && (
                <p className="mt-2 font-bold">
                  {/* No longer a hardcoded Italian voice (speech.ts speaks
                      mode-matched Latin via the voice ladder — voice-tts
                      improvement audit 1.5). */}
                  {state.language === "latin" ? "🗣️ Latin voice" : "🇬🇧 English voice"}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Item {items.length ? state.currentItemIndex + 1 : 0} of {items.length}, repeat{" "}
                {state.currentRepeat} of {repeat}
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => (state.playing ? player.stop() : player.start())}
                className="rounded-xl bg-burgundy-800 px-8 py-4 text-xl font-black text-white"
              >
                {state.playing ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                onClick={player.stop}
                className="rounded-xl border-2 border-burgundy-200 px-6 py-4 font-bold"
              >
                ■ Stop
              </button>
            </div>
          </div>
        </div>
      </main>
    </WindowFrame>
  );
}
