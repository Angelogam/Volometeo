import { DailyDay, HourlySlot } from "@/types/weather";
import { useState } from "react";
import { cn } from "@/lib/utils";

const wmoIcon: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️",
  51: "🌦️", 53: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 80: "🌦️", 95: "⛈️",
};
function icon(code: number) {
  const keys = Object.keys(wmoIcon).map(Number).sort((a, b) => b - a);
  const k = keys.find(k => code >= k) ?? 0;
  return wmoIcon[k] ?? "🌡️";
}

const volColor = (l: string) =>
  l === "GO" ? "#16a34a" : l === "CAUTION" ? "#d97706" : "#dc2626";
const volBg = (l: string) =>
  l === "GO" ? "bg-emerald-50 border-emerald-200" :
  l === "CAUTION" ? "bg-amber-50 border-amber-200" :
  "bg-red-50 border-red-200";

export default function DailyForecast({ daily, hourly }: { daily: DailyDay[]; hourly: HourlySlot[] }) {
  const [expanded, setExpanded] = useState<string | null>(daily[0]?.date ?? null);

  return (
    <div className="flex flex-col gap-2">
      {daily.map((d) => {
        const isOpen = expanded === d.date;
        const dayHourly = hourly.filter(h => h.time.startsWith(d.date) && h.hour >= 9 && h.hour <= 19);

        return (
          <div key={d.date} className={cn("rounded-2xl border transition-all overflow-hidden card-shadow", volBg(d.volLabel))}>
            {/* Row */}
            <button
              onClick={() => setExpanded(isOpen ? null : d.date)}
              className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 text-left hover:bg-white/30 transition-colors"
            >
              <div className="w-14 shrink-0">
                <div className="font-black text-gray-900 text-sm">{d.label}</div>
                <div className="text-[10px] text-gray-400">
                  {new Date(d.date + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                </div>
              </div>

              <div className="text-2xl shrink-0">{icon(d.weatherCode)}</div>

              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <div className="text-[10px] text-gray-500">Temp</div>
                  <div className="text-xs font-bold text-gray-900">{Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Vento max</div>
                  <div className="text-xs font-bold text-gray-900">{Math.round(d.windMax)} km/h</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-[10px] text-gray-500">Pioggia</div>
                  <div className="text-xs font-bold text-gray-900">{d.precipSum.toFixed(1)} mm</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-[10px] text-gray-500">CAPE</div>
                  <div className="text-xs font-bold text-gray-900">{Math.round(d.capeMax)} J/kg</div>
                </div>
              </div>

              <div className="shrink-0 text-right flex items-center gap-2">
                <div>
                  <div className="text-lg font-black" style={{ color: volColor(d.volLabel) }}>{d.volability.toFixed(1)}</div>
                  <div className="text-[9px] text-gray-400">/10</div>
                </div>
                <div className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</div>
              </div>
            </button>

            {/* Expanded: sunrise/sunset + mini hourly */}
            {isOpen && (
              <div className="border-t border-white/60 px-4 pb-4 pt-3 bg-white/40">
                <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                  <span>🌅 Alba: <strong>{d.sunrise}</strong></span>
                  <span>🌇 Tramonto: <strong>{d.sunset}</strong></span>
                </div>

                {dayHourly.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-max pb-1">
                      {dayHourly.map((h) => (
                        <div key={h.hour}
                          className="flex flex-col items-center gap-1 bg-white/70 rounded-xl px-2.5 py-2 min-w-[56px]"
                          style={{ borderLeft: `3px solid ${volColor(h.volLabel)}` }}>
                          <div className="text-[10px] font-bold text-gray-700">{String(h.hour).padStart(2, "0")}:00</div>
                          <div className="text-xs font-black" style={{ color: volColor(h.volLabel) }}>{h.volability.toFixed(1)}</div>
                          <div className="text-[9px] text-gray-500">{Math.round(h.windKmh)} km/h</div>
                          <div className="text-[9px] text-gray-400">{h.windDirLabel}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">Dati orari non disponibili per questo giorno.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
