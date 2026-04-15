import { HourlySlot } from "@/types/weather";
import { useState } from "react";
import { cn } from "@/lib/utils";

const volColor = (l: string) =>
  l === "GO" ? "#16a34a" : l === "CAUTION" ? "#d97706" : "#dc2626";
const volBg = (l: string) =>
  l === "GO" ? "bg-emerald-50" : l === "CAUTION" ? "bg-amber-50" : "bg-red-50";
const volBadge = (l: string) =>
  l === "GO" ? "bg-emerald-100 text-emerald-700" : l === "CAUTION" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

function WindArrow({ deg }: { deg: number }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: `rotate(${deg}deg)`, display: "inline" }}>
      <line x1="7" y1="11" x2="7" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="4,6 7,3 10,6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type SortKey = "hour" | "volability" | "windKmh" | "cape" | "shear";

export default function InteractiveHourlyTable({ hourly, siteAlt }: { hourly: HourlySlot[]; siteAlt: number }) {
  const [sortKey, setSortKey] = useState<SortKey>("hour");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "GO" | "CAUTION" | "STOP">("ALL");

  const flightHours = hourly.filter(h => h.hour >= 9 && h.hour <= 19);

  const filtered = filter === "ALL" ? flightHours : flightHours.filter(h => h.volLabel === filter);
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortAsc ? av - bv : bv - av;
  });

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortAsc(!sortAsc);
    else { setSortKey(k); setSortAsc(false); }
  }

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      onClick={() => toggleSort(k)}
      className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 transition-colors select-none whitespace-nowrap"
    >
      {label} {sortKey === k ? (sortAsc ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2 flex-wrap card-shadow">
        <span className="text-xs font-bold text-gray-500 mr-1">Filtra:</span>
        {(["ALL", "GO", "CAUTION", "STOP"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
              filter === f
                ? f === "ALL" ? "bg-gray-900 text-white border-gray-900"
                  : f === "GO" ? "bg-emerald-600 text-white border-emerald-600"
                  : f === "CAUTION" ? "bg-amber-500 text-white border-amber-500"
                  : "bg-red-600 text-white border-red-600"
                : "text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            {f === "ALL" ? "Tutti" : f === "GO" ? "🪂 Vola" : f === "CAUTION" ? "⚠️ Valuta" : "🚫 Stop"}
          </button>
        ))}
        <div className="ml-auto text-[10px] text-gray-400">{sorted.length} ore · siteAlt {siteAlt}m</div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th k="hour" label="Ora" />
                <Th k="volability" label="Volabilità" />
                <Th k="windKmh" label="Vento" />
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Raffica</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">Dir.</th>
                <Th k="cape" label="CAPE" />
                <Th k="shear" label="Shear" />
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">Temp</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nubi%</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide">Pioggia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((h) => (
                <tr
                  key={h.hour}
                  className={cn("transition-colors hover:bg-gray-50/80", volBg(h.volLabel), "hover:opacity-90")}
                >
                  <td className="px-3 py-3">
                    <div className="font-black text-gray-900 text-sm">{String(h.hour).padStart(2, "0")}:00</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-black" style={{ color: volColor(h.volLabel) }}>{h.volability.toFixed(1)}</div>
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", volBadge(h.volLabel))}>{h.volLabel}</span>
                    </div>
                    <div className="mt-1 h-1 bg-gray-200 rounded-full w-16 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(h.volability / 10) * 100}%`, background: volColor(h.volLabel) }} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-bold text-gray-800">{Math.round(h.windKmh)} km/h</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-gray-600">{Math.round(h.gust)} km/h</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                      <WindArrow deg={h.windDir} />
                      <span className="font-bold">{h.windDirLabel}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={cn("text-xs font-bold", h.cape > 1000 ? "text-red-600" : h.cape > 500 ? "text-amber-600" : "text-gray-700")}>
                      {Math.round(h.cape)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className={cn("text-xs font-bold", h.shear > 20 ? "text-red-600" : h.shear > 10 ? "text-amber-600" : "text-gray-700")}>
                      {Math.round(h.shear)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">{Math.round(h.tempC)}°C</td>
                  <td className="px-3 py-3 text-xs text-gray-600">{h.cloudCover}%</td>
                  <td className="px-3 py-3">
                    <div className={cn("text-xs font-bold", h.precip > 0.5 ? "text-blue-600" : "text-gray-400")}>
                      {h.precip.toFixed(1)} mm
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">
                    Nessuna ora trovata per il filtro selezionato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
