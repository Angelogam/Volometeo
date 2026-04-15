import { WeatherData } from "@/types/weather";

function ratingBar(val: number, max: number, color: string) {
  const pct = Math.min(100, (val / max) * 100);
  return (
    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex-1">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function BriefingCard({ data }: { data: WeatherData }) {
  const { current, site, todayBestHour, thermalStrength, daily } = data;
  const today = daily[0];

  const flightWindow = data.hourly.filter(h => h.isFlightWindow);
  const goHours = flightWindow.filter(h => h.volLabel === "GO").length;
  const cautionHours = flightWindow.filter(h => h.volLabel === "CAUTION").length;
  const stopHours = flightWindow.filter(h => h.volLabel === "STOP").length;

  const maxVol = flightWindow.length ? Math.max(...flightWindow.map(h => h.volability)) : 0;
  const avgWind = flightWindow.length
    ? Math.round(flightWindow.reduce((s, h) => s + h.windKmh, 0) / flightWindow.length)
    : 0;

  const overallLabel =
    goHours >= 4 ? "GO" : goHours + cautionHours >= 3 ? "CAUTION" : "STOP";

  const volColor = (l: string) => l === "GO" ? "#16a34a" : l === "CAUTION" ? "#d97706" : "#dc2626";
  const volBg = (l: string) =>
    l === "GO" ? "from-emerald-50 to-teal-50 border-emerald-300" :
    l === "CAUTION" ? "from-amber-50 to-yellow-50 border-amber-300" :
    "from-red-50 to-rose-50 border-red-300";

  const briefText = () => {
    if (overallLabel === "GO") {
      return `Buone condizioni per volare a ${site.name} oggi. Finestra ottimale ${todayBestHour ? `intorno alle ${String(todayBestHour.hour).padStart(2, "0")}:00` : "al mattino"}. Vento medio ${avgWind} km/h, termiche ${thermalStrength}.`;
    }
    if (overallLabel === "CAUTION") {
      return `Condizioni marginali. Valuta le ore con volabilità ≥4. Vento medio ${avgWind} km/h. Controllare CAPE e raffiche prima del decollo.`;
    }
    return `Condizioni sfavorevoli per ${site.name} oggi. Vento ${avgWind > site.maxWindKmh ? "troppo forte" : "insufficiente o instabile"}. Non decollare.`;
  };

  return (
    <div className={`bg-gradient-to-br ${volBg(overallLabel)} border-2 rounded-3xl p-5 card-shadow`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">📋</div>
        <div>
          <div className="font-black text-gray-900 text-base">Briefing del giorno</div>
          <div className="text-xs text-gray-500">{site.name} · {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
        <div className="ml-auto text-right shrink-0">
          <div className="text-xl font-black" style={{ color: volColor(overallLabel) }}>{overallLabel}</div>
          <div className="text-[10px] text-gray-400">valutazione giornaliera</div>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-4">{briefText()}</p>

      {/* Hour distribution */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "🪂 VOLA", n: goHours, color: "#16a34a", bg: "#f0fdf4" },
          { label: "⚠️ VALUTA", n: cautionHours, color: "#d97706", bg: "#fffbeb" },
          { label: "🚫 STOP", n: stopHours, color: "#dc2626", bg: "#fef2f2" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl py-2 px-3 text-center" style={{ background: s.bg }}>
            <div className="text-xl font-black" style={{ color: s.color }}>{s.n}</div>
            <div className="text-[9px] font-bold text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-[9px] text-gray-400">ore (09-19h)</div>
          </div>
        ))}
      </div>

      {/* Key metrics */}
      <div className="space-y-2.5">
        {[
          { label: "Volabilità max", val: maxVol, max: 10, color: volColor(overallLabel), display: `${maxVol.toFixed(1)}/10` },
          { label: "Vento medio", val: avgWind, max: site.maxWindKmh, color: "#2563eb", display: `${avgWind} km/h` },
          { label: "Temp max", val: today?.tempMax ?? 0, max: 40, color: "#d97706", display: `${Math.round(today?.tempMax ?? 0)}°C` },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className="w-28 text-xs font-bold text-gray-600 shrink-0">{m.label}</div>
            {ratingBar(m.val, m.max, m.color)}
            <div className="w-16 text-xs font-black text-right shrink-0" style={{ color: m.color }}>{m.display}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/60 text-[10px] text-gray-400">
        ⚠️ Questo briefing è generato automaticamente da dati Open-Meteo. Verifica sempre le condizioni locali e consulta piloti esperti prima del decollo.
      </div>
    </div>
  );
}
