import { WeatherData, HourlySlot } from "@/types/weather";

interface Props {
  data: WeatherData;
  selectedHour?: HourlySlot | null;
}

function ratingBar(val: number, max: number, color: string) {
  const pct = Math.min(100, (val / max) * 100);
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: "rgba(255,255,255,0.07)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}66` }} />
    </div>
  );
}

export default function BriefingCard({ data, selectedHour }: Props) {
  const { site, todayBestHour, thermalStrength, daily } = data;
  const today = daily[0];
  const slot = selectedHour ?? data.current;

  const flightWindow = data.hourly.filter(h => h.isFlightWindow);
  const goHours = flightWindow.filter(h => h.volLabel === "GO").length;
  const cautionHours = flightWindow.filter(h => h.volLabel === "CAUTION").length;
  const stopHours = flightWindow.filter(h => h.volLabel === "STOP").length;

  const avgWind = flightWindow.length
    ? Math.round(flightWindow.reduce((s, h) => s + h.windKmh, 0) / flightWindow.length)
    : 0;

  const overallLabel = goHours >= 4 ? "GO" : goHours + cautionHours >= 3 ? "CAUTION" : "STOP";
  const volColor = (l: string) => l === "GO" ? "#34d399" : l === "CAUTION" ? "#fbbf24" : "#f87171";
  const cockpitBorder = (l: string) =>
    l === "GO" ? "rgba(52,211,153,0.3)" : l === "CAUTION" ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)";

  // Context-aware briefing text
  const briefText = () => {
    if (selectedHour) {
      const h = selectedHour;
      if (h.volLabel === "GO") {
        return `Ore ${String(h.hour).padStart(2,"0")}:00 — Condizioni ideali per XC. Vento ${Math.round(h.windKmh)} km/h ${h.windDirLabel}, base cumulo ${h.thermalBase}m, vario stimato ${h.thermalMs.toFixed(1)} m/s. Termiche ${thermalStrength}.`;
      }
      if (h.volLabel === "CAUTION") {
        if (h.windKmh > 25) return `Ore ${String(h.hour).padStart(2,"0")}:00 — Attenzione: vento forte ${Math.round(h.windKmh)} km/h. Raffica ${Math.round(h.gust)} km/h. Shear verticale ${Math.round(h.shear)} km/h. Rischio turbolenza in sottovento.`;
        if (h.cape > 400) return `Ore ${String(h.hour).padStart(2,"0")}:00 — CAPE ${Math.round(h.cape)} J/kg — rischio sovrasviluppo cumulonembi. Rientra prima del pomeriggio.`;
        return `Ore ${String(h.hour).padStart(2,"0")}:00 — Condizioni marginali. Volabilità ${h.volability.toFixed(1)}/10. Valuta vento e termiche locali.`;
      }
      return `Ore ${String(h.hour).padStart(2,"0")}:00 — STOP. ${h.precip > 0.1 ? "Precipitazioni in atto." : h.windKmh > site.maxWindKmh ? `Vento ${Math.round(h.windKmh)} km/h oltre il limite (${site.maxWindKmh} km/h).` : "Condizioni pericolose."} Non decollare.`;
    }

    // Daily briefing
    if (overallLabel === "GO") {
      return `Buone condizioni per volare a ${site.name} oggi. Finestra ottimale ${todayBestHour ? `ore ${String(todayBestHour.hour).padStart(2, "0")}:00` : "al mattino"}. Vento medio ${avgWind} km/h, termiche ${thermalStrength}. ${goHours} ore GO disponibili.`;
    }
    if (overallLabel === "CAUTION") {
      return `Condizioni marginali a ${site.name}. Vento medio ${avgWind} km/h. Solo ${goHours} ore GO su 11. Controlla CAPE e raffiche prima del decollo.`;
    }
    return `Condizioni sfavorevoli per ${site.name} oggi. ${avgWind > site.maxWindKmh ? `Vento ${avgWind} km/h supera il limite (${site.maxWindKmh} km/h).` : "Instabilità o precipitazioni."} Non decollare.`;
  };

  const label = selectedHour ? selectedHour.volLabel : overallLabel;
  const color = volColor(label);
  const border = cockpitBorder(label);

  return (
    <div className="rounded-3xl p-5" style={{
      background: "rgba(15,20,30,0.85)",
      border: `1px solid ${border}`,
      backdropFilter: "blur(12px)"
    }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">📋</div>
        <div>
          <div className="font-black text-white text-base">
            {selectedHour ? `Briefing ore ${String(slot.hour).padStart(2,"0")}:00` : "Briefing del giorno"}
          </div>
          <div className="text-xs text-slate-500">
            {site.name} · {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <div className="ml-auto text-right shrink-0">
          <div className="text-xl font-black" style={{ color }}>{label}</div>
          <div className="text-[10px] text-slate-500">{selectedHour ? "ora selezionata" : "valutazione giornaliera"}</div>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: "#94a3b8" }}>{briefText()}</p>

      {/* Hour distribution (daily only) */}
      {!selectedHour && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "🪂 VOLA", n: goHours, color: "#34d399", bg: "rgba(52,211,153,0.08)" },
            { label: "⚠️ VALUTA", n: cautionHours, color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
            { label: "🚫 STOP", n: stopHours, color: "#f87171", bg: "rgba(248,113,113,0.08)" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl py-2 px-3 text-center"
              style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <div className="text-xl font-black" style={{ color: s.color }}>{s.n}</div>
              <div className="text-[9px] font-bold text-slate-400 mt-0.5">{s.label}</div>
              <div className="text-[9px] text-slate-600">ore 09–19h</div>
            </div>
          ))}
        </div>
      )}

      {/* Key metrics */}
      <div className="space-y-2.5">
        {[
          { label: "Volabilità", val: slot.volability, max: 10, color, display: `${slot.volability.toFixed(1)}/10` },
          { label: "Vento Meteo", val: slot.windKmh, max: site.maxWindKmh, color: "#38bdf8", display: `${Math.round(slot.windKmh)} km/h` },
          { label: "Temp max oggi", val: today?.tempMax ?? 0, max: 40, color: "#fb923c", display: `${Math.round(today?.tempMax ?? 0)}°C` },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className="w-28 text-xs font-bold text-slate-500 shrink-0">{m.label}</div>
            {ratingBar(m.val, m.max, m.color)}
            <div className="w-16 text-xs font-black text-right shrink-0" style={{ color: m.color }}>{m.display}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-slate-600">
        ⚠️ Briefing generato da Open-Meteo. Verifica sempre le condizioni locali prima del decollo.
      </div>
    </div>
  );
}
