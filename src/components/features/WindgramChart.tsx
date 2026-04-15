import { WindgramLevel, HourlySlot } from "@/types/weather";

function WindArrow({ deg, color, size = 16 }: { deg: number; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20"
      style={{ transform: `rotate(${deg}deg)`, display: "inline-block", flexShrink: 0 }}>
      <line x1="10" y1="17" x2="10" y2="3" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <polyline points="5,8 10,3 15,8" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function windClass(kmh: number): string {
  if (kmh < 10) return "wg-calm";
  if (kmh < 18) return "wg-light";
  if (kmh < 25) return "wg-mod";
  if (kmh < 35) return "wg-strong";
  return "wg-danger";
}
function windColor(kmh: number): string {
  if (kmh < 10) return "#38bdf8";
  if (kmh < 18) return "#34d399";
  if (kmh < 25) return "#fbbf24";
  if (kmh < 35) return "#f87171";
  return "#c4b5fd";
}

const LEVEL_LABELS = ["Decollo (10m)", "+80m bassa", "+500m cross", "+1000m quota", "+2000m alta"];

interface WindgramProps {
  windgram: WindgramLevel[];
  siteAlt: number;
  hourly?: HourlySlot[];
  selectedHour?: HourlySlot | null;
  onSelectHour?: (h: HourlySlot) => void;
  dayLabel?: string;
  dayDate?: string;
}

export default function WindgramChart({ windgram, siteAlt, hourly, selectedHour, onSelectHour, dayLabel, dayDate }: WindgramProps) {
  const levels = [...windgram].sort((a, b) => b.alt - a.alt);
  const flightHours = hourly ? hourly.filter(h => h.hour >= 9 && h.hour <= 19) : [];

  return (
    <div className="flex flex-col gap-4">

      {/* ── Vertical profile grid ── */}
      <div className="rounded-3xl p-5 cockpit-card-glow">
        <div className="font-black text-white text-base mb-0.5">🪂 Windgram — Profilo verticale vento</div>
        <div className="text-xs text-slate-500 mb-4">Snapshot ore 12:00 locali · Open-Meteo · dal suolo a +2000m</div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-[10px] text-slate-500 font-bold text-left px-2 pb-1 w-32">Quota slm</th>
                <th className="text-[10px] text-slate-500 font-bold text-center px-1 pb-1">Vento</th>
                <th className="text-[10px] text-slate-500 font-bold text-center px-1 pb-1">Dir.</th>
                <th className="text-[10px] text-slate-500 font-bold text-center px-1 pb-1">Temp</th>
                <th className="text-[10px] text-slate-500 font-bold text-center px-1 pb-1">Intensità</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((w, i) => {
                const label = LEVEL_LABELS[windgram.length - 1 - i] ?? LEVEL_LABELS[0];
                const isLaunch = w.alt === siteAlt;
                const col = windColor(w.windKmh);
                const cls = windClass(w.windKmh);
                return (
                  <tr key={w.alt}>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        {isLaunch && <span className="text-[9px] font-black text-emerald-400">🪂</span>}
                        <div>
                          <div className="text-xs font-black text-white">{w.alt}m</div>
                          <div className="text-[9px] text-slate-500">{label.split(" ").slice(0, 2).join(" ")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-1 py-0.5">
                      <div className={`rounded-lg px-3 py-2 text-center font-black text-sm ${cls}`} style={{ minWidth: "64px" }}>
                        {Math.round(w.windKmh)}<span className="text-[9px] font-normal ml-0.5">km/h</span>
                      </div>
                    </td>
                    <td className="px-1 py-0.5">
                      <div className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        <WindArrow deg={w.windDir} color={col} size={18} />
                        <span className="text-[10px] text-slate-400">{w.windDir}°</span>
                      </div>
                    </td>
                    <td className="px-1 py-0.5">
                      <div className="text-center text-xs font-bold text-slate-300">{Math.round(w.tempC)}°C</div>
                    </td>
                    <td className="px-1 py-0.5 w-32">
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (w.windKmh / 50) * 100)}%`, background: col, boxShadow: `0 0 6px ${col}66` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-[10px]">
          {[
            { cls: "wg-calm", label: "< 10 km/h ottimale" },
            { cls: "wg-light", label: "10–18 km/h leggero" },
            { cls: "wg-mod", label: "18–25 km/h moderato" },
            { cls: "wg-strong", label: "25–35 km/h forte" },
            { cls: "wg-danger", label: "> 35 km/h pericolo" },
          ].map(l => (
            <div key={l.label} className={`px-2 py-0.5 rounded-full font-bold ${l.cls}`}>{l.label}</div>
          ))}
        </div>
      </div>

      {/* ── Hourly wind grid ── */}
      {flightHours.length > 0 && (
        <div className="rounded-3xl p-5 cockpit-card-glow">
          {/* Prominent day header */}
          <div className="mb-3 rounded-2xl px-4 py-3"
            style={{ background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.2)" }}>
            <div className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-0.5">🪂 Vento per ora — 09:00–19:00</div>
            <div className="font-black text-white text-xl sm:text-2xl capitalize">
              {(() => {
                if (!dayDate) return dayLabel ?? "Oggi";
                const d = new Date(dayDate + "T12:00");
                const full = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
                return (dayLabel === "Oggi" || dayLabel === "Domani")
                  ? `${dayLabel} — ${full}`
                  : full.charAt(0).toUpperCase() + full.slice(1);
              })()}
            </div>
            {selectedHour && (
              <div className="text-base font-black text-sky-400 mt-0.5">
                ora selezionata: {String(selectedHour.hour).padStart(2, "00")}:00
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500 mb-4">Colore = intensità · Freccia = direzione · Clicca cella per selezionare</div>

          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-1 min-w-max">
              <thead>
                <tr>
                  <th className="text-[10px] text-slate-500 font-bold text-left px-2 pb-1 w-20">Quota</th>
                  {flightHours.map(h => {
                    const isSel = selectedHour?.time === h.time;
                    return (
                      <th key={h.time}
                        className="text-[10px] font-bold text-center pb-1 min-w-[50px] cursor-pointer transition-colors"
                        style={{ color: isSel ? "#38bdf8" : "#475569" }}
                        onClick={() => onSelectHour?.(h)}
                      >
                        {String(h.hour).padStart(2, "0")}h
                        {isSel && <div className="text-[8px] text-sky-400">●</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* 10m row */}
                <tr>
                  <td className="px-2 py-0.5 text-[10px] text-slate-400 font-bold">10m (suolo)</td>
                  {flightHours.map(h => {
                    const col = windColor(h.windKmh);
                    const cls = windClass(h.windKmh);
                    const isSel = selectedHour?.time === h.time;
                    return (
                      <td key={h.time} className="py-0.5 px-0.5 cursor-pointer" onClick={() => onSelectHour?.(h)}>
                        <div className={`rounded-lg p-1.5 flex flex-col items-center gap-0.5 ${cls} transition-all`}
                          style={{ boxShadow: isSel ? `0 0 0 2px #38bdf8` : "none", opacity: isSel ? 1 : 0.75 }}>
                          <WindArrow deg={h.windDir} color={col} size={12} />
                          <span className="text-[9px] font-black">{Math.round(h.windKmh)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {/* 80m row */}
                <tr>
                  <td className="px-2 py-0.5 text-[10px] text-slate-400 font-bold">80m</td>
                  {flightHours.map(h => {
                    const col = windColor(h.wind80Kmh);
                    const cls = windClass(h.wind80Kmh);
                    const isSel = selectedHour?.time === h.time;
                    return (
                      <td key={h.time} className="py-0.5 px-0.5 cursor-pointer" onClick={() => onSelectHour?.(h)}>
                        <div className={`rounded-lg p-1.5 flex flex-col items-center gap-0.5 ${cls} transition-all`}
                          style={{ boxShadow: isSel ? `0 0 0 2px #38bdf8` : "none", opacity: isSel ? 1 : 0.75 }}>
                          <WindArrow deg={h.windDir80} color={col} size={12} />
                          <span className="text-[9px] font-black">{Math.round(h.wind80Kmh)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {/* 120m row */}
                <tr>
                  <td className="px-2 py-0.5 text-[10px] text-slate-400 font-bold">120m</td>
                  {flightHours.map(h => {
                    const col = windColor(h.wind120Kmh);
                    const cls = windClass(h.wind120Kmh);
                    const isSel = selectedHour?.time === h.time;
                    return (
                      <td key={h.time} className="py-0.5 px-0.5 cursor-pointer" onClick={() => onSelectHour?.(h)}>
                        <div className={`rounded-lg p-1.5 flex flex-col items-center gap-0.5 ${cls} transition-all`}
                          style={{ boxShadow: isSel ? `0 0 0 2px #38bdf8` : "none", opacity: isSel ? 1 : 0.75 }}>
                          <WindArrow deg={h.windDir120} color={col} size={12} />
                          <span className="text-[9px] font-black">{Math.round(h.wind120Kmh)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {/* Shear row */}
                <tr>
                  <td className="px-2 py-0.5 text-[10px] text-slate-400 font-bold">Shear</td>
                  {flightHours.map(h => {
                    const shearCol = h.shear > 20 ? "#f87171" : h.shear > 12 ? "#fbbf24" : "#34d399";
                    const isSel = selectedHour?.time === h.time;
                    return (
                      <td key={h.time} className="py-0.5 px-0.5 cursor-pointer" onClick={() => onSelectHour?.(h)}>
                        <div className="rounded-lg p-1.5 text-center transition-all"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            boxShadow: isSel ? `0 0 0 2px #38bdf8` : "none",
                          }}>
                          <span className="text-[9px] font-black" style={{ color: shearCol }}>{Math.round(h.shear)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {/* Volability row */}
                <tr>
                  <td className="px-2 py-0.5 text-[10px] text-slate-400 font-bold">Vol.</td>
                  {flightHours.map(h => {
                    const vCol = h.volLabel === "GO" ? "#34d399" : h.volLabel === "CAUTION" ? "#fbbf24" : "#f87171";
                    const isSel = selectedHour?.time === h.time;
                    return (
                      <td key={h.time} className="py-0.5 px-0.5 cursor-pointer" onClick={() => onSelectHour?.(h)}>
                        <div className="rounded-lg p-1.5 text-center transition-all"
                          style={{
                            background: `${vCol}15`,
                            boxShadow: isSel ? `0 0 0 2px #38bdf8` : "none",
                          }}>
                          <span className="text-[9px] font-black" style={{ color: vCol }}>{h.volability.toFixed(1)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-slate-600 mt-2">Shear = differenza vento 10m→80m km/h · Vol. = indice volabilità /10</div>
        </div>
      )}

      <div className="text-[10px] text-slate-600 text-center pb-1">
        Vento a 10m, 80m e 120m da Open-Meteo icon_seamless · Quote superiori estrapolate
      </div>
    </div>
  );
}
