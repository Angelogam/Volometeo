import { DailyDay, HourlySlot } from "@/types/weather";
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

function volColor(l: string) { return l === "GO" ? "#34d399" : l === "CAUTION" ? "#fbbf24" : "#f87171"; }
function volBorder(l: string) {
  return l === "GO" ? "rgba(52,211,153,0.25)" : l === "CAUTION" ? "rgba(251,191,36,0.25)" : "rgba(248,113,113,0.25)";
}
function volBg(l: string) {
  return l === "GO" ? "rgba(52,211,153,0.05)" : l === "CAUTION" ? "rgba(251,191,36,0.05)" : "rgba(248,113,113,0.05)";
}

interface Props {
  daily: DailyDay[];
  allHourly: HourlySlot[];
  selectedDayDate: string;
  selectedHour: HourlySlot | null;
  onSelectDayHour: (date: string, dayLabel: string, hour: HourlySlot) => void;
}

export default function DailyForecast({ daily, allHourly, selectedDayDate, selectedHour, onSelectDayHour }: Props) {
  // Which day is expanded: selectedDayDate if set, else first day
  const expandedDate = selectedDayDate || daily[0]?.date || null;

  return (
    <div className="flex flex-col gap-2">
      {daily.map((d) => {
        const isOpen = expandedDate === d.date;
        const dayHourly = allHourly.filter(h => h.time.startsWith(d.date) && h.hour >= 9 && h.hour <= 19);
        const col = volColor(d.volLabel);
        const border = volBorder(d.volLabel);
        const bg = volBg(d.volLabel);
        const fullDate = new Date(d.date + "T12:00").toLocaleDateString("it-IT", {
          weekday: "long", day: "numeric", month: "long"
        });

        return (
          <div
            key={d.date}
            className="rounded-2xl overflow-hidden transition-all"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            {/* Day row — click expands inline hours */}
            <div
              className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 text-left transition-colors cursor-pointer"
              style={{ background: isOpen ? "rgba(255,255,255,0.03)" : "transparent" }}
            >
              <div className="w-14 shrink-0">
                <div className="font-black text-white text-sm">{d.label}</div>
                <div className="text-[10px] text-slate-500">
                  {new Date(d.date + "T12:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                </div>
              </div>

              <div className="text-2xl shrink-0">{icon(d.weatherCode)}</div>

              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <div className="text-[10px] text-slate-600">Temp</div>
                  <div className="text-xs font-bold text-slate-300">{Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-600">Vento max</div>
                  <div className="text-xs font-bold text-slate-300">{Math.round(d.windMax)} km/h</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-[10px] text-slate-600">Pioggia</div>
                  <div className="text-xs font-bold text-slate-300">{d.precipSum.toFixed(1)} mm</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-[10px] text-slate-600">CAPE</div>
                  <div className={cn("text-xs font-bold", d.capeMax > 500 ? "text-amber-400" : "text-slate-300")}>
                    {Math.round(d.capeMax)} J/kg
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <svg width="20" height="10" viewBox="0 0 20 10">
                  <line x1="0" y1="5" x2="4" y2="5" stroke="#475569" strokeWidth="1.2" />
                  <polygon
                    points="4,1 16,3 15,7 4,9"
                    fill={col}
                    opacity={d.windMax > 25 ? "1" : d.windMax > 12 ? "0.75" : "0.4"}
                  />
                </svg>
                <div className="text-right">
                  <div className="text-lg font-black leading-none" style={{ color: col }}>{d.volability.toFixed(1)}</div>
                  <div className="text-[9px] text-slate-600">/10</div>
                </div>
              </div>
            </div>

            {/* Hourly pills — always visible for expanded day */}
            {isOpen && (
              <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {/* Day header */}
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-white capitalize">{fullDate}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      🌅 Alba: <strong className="text-slate-300">{d.sunrise}</strong>
                      &nbsp;·&nbsp;🌇 Tramonto: <strong className="text-slate-300">{d.sunset}</strong>
                    </div>
                  </div>
                  <div className="text-[10px] text-sky-400 font-bold">Clicca un&apos;ora →</div>
                </div>

                {dayHourly.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="flex gap-1.5 min-w-max pb-1">
                      {dayHourly.map((h) => {
                        const hCol = volColor(h.volLabel);
                        const isSelHour = selectedHour?.time === h.time;
                        return (
                          <button
                            key={h.hour}
                            onClick={() => onSelectDayHour(d.date, d.label, h)}
                            className="flex flex-col items-center gap-1 rounded-xl px-2.5 py-2.5 min-w-[56px] transition-all hover:brightness-125 active:scale-95"
                            style={{
                              background: isSelHour
                                ? "rgba(56,189,248,0.15)"
                                : "rgba(255,255,255,0.04)",
                              borderLeft: `3px solid ${hCol}`,
                              border: isSelHour
                                ? `2px solid rgba(56,189,248,0.5)`
                                : `1px solid transparent`,
                              borderLeftWidth: isSelHour ? "2px" : "3px",
                              borderLeftColor: hCol,
                            }}
                          >
                            <div className="text-[10px] font-bold text-slate-400">
                              {String(h.hour).padStart(2, "0")}h
                            </div>
                            <div className="text-sm font-black" style={{ color: hCol }}>
                              {h.volability.toFixed(1)}
                            </div>
                            <div className="text-[9px] text-slate-400">{Math.round(h.windKmh)} km/h</div>
                            <div className="text-[9px] text-slate-600">{h.windDirLabel}</div>
                            {isSelHour && (
                              <div className="text-[8px] font-black text-sky-400">●</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 italic">Dati orari non disponibili per questo giorno.</div>
                )}
              </div>
            )}

            {/* Other days: collapsed, click to expand by selecting first hour */}
            {!isOpen && (
              <div className="px-4 pb-2">
                <div className="overflow-x-auto">
                  <div className="flex gap-1 min-w-max">
                    {dayHourly.slice(0, 6).map((h) => {
                      const hCol = volColor(h.volLabel);
                      return (
                        <button
                          key={h.hour}
                          onClick={() => onSelectDayHour(d.date, d.label, h)}
                          className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 min-w-[44px] transition-all hover:brightness-125"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <div className="text-[9px] text-slate-500">{String(h.hour).padStart(2, "0")}h</div>
                          <div className="text-[11px] font-black" style={{ color: hCol }}>{h.volability.toFixed(1)}</div>
                        </button>
                      );
                    })}
                    {dayHourly.length > 6 && (
                      <button
                        onClick={() => onSelectDayHour(d.date, d.label, dayHourly[0])}
                        className="flex items-center px-2 text-[9px] text-slate-600 hover:text-slate-400"
                      >
                        +{dayHourly.length - 6} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
