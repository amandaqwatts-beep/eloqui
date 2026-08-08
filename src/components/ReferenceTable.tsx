import { getPronunciation, type PronMode } from "~/lib/pronunciation";

/** Extract the first Latin word from a cell like "puella, puellae" → "puella" */
function extractFirstWord(text: string): string {
  return text.split(/[,/\s]+/)[0] ?? text;
}

export default function ReferenceTable({
  title,
  headers,
  rows,
  highlightRows,
  pronMode = "ecclesiastical",
}: {
  title: string;
  headers: string[];
  rows: string[][];
  highlightRows?: number[];
  pronMode?: PronMode;
}) {
  const highlightSet = new Set(highlightRows ?? []);
  // Find pronunciation column index
  const pronColIdx = headers.findIndex(
    (h) => h.toLowerCase() === "pronunciation",
  );

  return (
    <div className="rounded-xl border border-burgundy-200 bg-cream-50 overflow-hidden">
      <div className="bg-burgundy-100 px-4 py-2 text-sm font-semibold text-burgundy-800">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-burgundy-200 bg-burgundy-50/50">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-left font-semibold text-burgundy-700 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              // Auto-generate pronunciation for this row if it has a pronunciation column
              const autoPron =
                pronColIdx >= 0
                  ? getPronunciation(
                      extractFirstWord(row[0] ?? ""),
                      pronMode,
                    )
                  : null;

              return (
                <tr
                  key={ri}
                  className={`border-b border-burgundy-100 last:border-0 ${
                    highlightSet.has(ri)
                      ? "bg-gold-50 font-semibold text-burgundy-900"
                      : "text-gray-700"
                  }`}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-3 py-2 whitespace-nowrap ${
                        ci === pronColIdx
                          ? "text-sm italic text-gray-500 font-normal"
                          : ""
                      }`}
                    >
                      {ci === pronColIdx && autoPron ? autoPron : cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
