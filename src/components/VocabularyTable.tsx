import type { VocabularyItem } from "~/data/latinLessons";
import { getPronunciation, type PronMode } from "~/lib/pronunciation";
import { speakLatin, speakEnglish } from "~/engine/speech";

interface Props {
  title: string;
  items: VocabularyItem[];
  pronMode?: PronMode;
  leftHeader?: string;
  rightHeader?: string;
  onSpeakLeft?: (text: string) => void;
}

export default function VocabularyTable({ title, items, pronMode = "ecclesiastical", leftHeader = "Latin", rightHeader = "English", onSpeakLeft = speakLatin }: Props) {
  return (
    <div className="rounded-xl border border-burgundy-200 bg-cream-50 overflow-hidden">
      <div className="bg-burgundy-100 px-4 py-2 text-sm font-semibold text-burgundy-800">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-burgundy-200 bg-burgundy-50/50">
              <th className="px-3 py-2 text-left font-semibold text-burgundy-700 whitespace-nowrap">
                {leftHeader}
              </th>
              <th className="px-3 py-2 text-left font-semibold text-burgundy-700 whitespace-nowrap">
                {rightHeader}
              </th>
              <th className="px-3 py-2 text-left font-semibold text-burgundy-700 whitespace-nowrap">
                Pronunciation
              </th>
              {(items.some((i) => i.gender) || items.some((i) => i.type)) && (
                <th className="px-3 py-2 text-left font-semibold text-burgundy-700 whitespace-nowrap">
                  {items.some((i) => i.gender) ? "Gender" : "Type"}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, ri) => {
              const displayPron =
                item.pronunciation ?? getPronunciation(item.latin, pronMode);
              return (
                <tr
                  key={ri}
                  className="border-b border-burgundy-100 last:border-0 text-gray-700 hover:bg-burgundy-50/30 transition-colors"
                >
                  <td className="px-3 py-2 font-medium text-burgundy-900 whitespace-nowrap">
                    {item.latin} <button type="button" onClick={() => onSpeakLeft(item.latin)} aria-label={`Hear ${item.latin}`} className="ml-1">🔊</button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.english} <button type="button" onClick={() => speakEnglish(item.english)} aria-label={`Hear ${item.english}`} className="ml-1">🔊</button>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-sm italic text-gray-500">
                      {displayPron}
                    </span>
                  </td>
                  {(item.gender || item.type) && (
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                      {item.gender || item.type}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
