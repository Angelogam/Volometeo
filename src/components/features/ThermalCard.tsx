import { WeatherData, HourlySlot } from "@/types/weather";

const strengthMeta = {
  debole:   { color: "#38bdf8", icon: "🌀", desc: "Termiche deboli < 1 m/s. Condizioni calme." },
  moderata: { color: "#fbbf24", icon: "↑",  desc: "Termiche moderate 1–2 m/s. Buone per soaring." },
  forte:    { color: "#fb923c", icon: "🔥", desc: "Termiche forti 2–4 m/s. Attenzione turbolenza." },
  esplosiva:{ color: "#f87171", icon: "⚡", desc: "CAPE elevato. Rischio temporali! Max prudenza." },
};

interface Props {
  data: WeatherData;
  selectedHour?: HourlySlot | null;
}

export default function ThermalCard({ data, selectedHour }: Props) {
  const { thermalStrength, current, hourly } = data;
  const meta = strengthMeta[thermalStrength];
  const slot = selectedHour ?? current;
  const flightHourly = hourly.filter(h => h.isFlightWindow);

  const avgBase = flightHourly.length
    ? Math.round(flightHourly.reduce((s, h) => s + h.thermalBase, 0) / flightHourly.length)
    : current.thermalBase;
  const maxBase = flightHourly.length
    ? Math.max(...flightHourly.map(h => h.thermalBase))
    : current.thermalBase;
  const maxCape = flightHourly.length
    ? Math.max(...flightHourly.map(h => h.cape))
    : current.cape;
  const avgMs = flightHourly.length
    ? (flightHourly.reduce((s, h) => s + h.thermalMs, 0) / flightHourly.length).toFixed(1)
    : current.thermalMs.toFixed(1);

  // Ceiling: Boundary Layer Height above launch
  const ceiling = slot.boundaryLayerHeight > 0
    ? Math.round(data.site.altitude + slot.boundaryLayerHeight)
    : maxBase + 500;

  // Vario previsto (m/s) for selected hour
  const vario = slot.thermalMs;

  // Lifted Index color
  const liColor = slot.liftedIndex < -4 ? "#f87171" : slot.liftedIndex < -1 ? "#fbbf24" : "#34d399";
  const liLabel = slot.liftedIndex < -4 ? "Pericolo temporali"
    : slot.liftedIndex < -1 ? "Instabile"
    : slot.liftedIndex < 1 ? "Lievemente instabile"
    : "Stabile";

  return (
    <div className="rounded-3xl p-5 cockpit-card-glow">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl w-12 h-12 rounded-2xl flex items-center justify-center font-black"
          style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}44`, color: meta.color }}>
          {meta.icon}
        </div>
        <div>
          <div className="font-black text-white text-base">Analisi Termiche</div>
          <div className="text-sm font-bold capitalize" style={{ color: meta.color }}>
            Forza: {thermalStrength}
          </div>
        </div>
        {selectedHour && (
          <div className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)" }}>
            📍 {String(slot.hour).padStart(2, "0")}:00
          </div>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-4 leading-relaxed">{meta.desc}</p>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          {
            label: "Vario Previsto",
            value: `${vario.toFixed(1)} m/s`,
            sub: "velocità termica",
            icon: "↑",
            color: vario > 3 ? "#f87171" : vario > 1.5 ? "#fbbf24" : "#34d399",
          },
          {
            label: "Base Cumulo",
            value: `${slot.thermalBase}m`,
            sub: "Formula Espy",
            icon: "☁️",
            color: "#38bdf8",
          },
          {
            label: "Ceiling",
            value: `${ceiling}m`,
            sub: "quota max (BLH)",
            icon: "⬆️",
            color: "#a78bfa",
          },
          {
            label: "Lifted Index",
            value: slot.liftedIndex !== undefined ? slot.liftedIndex.toFixed(1) : "N/D",
            sub: liLabel,
            icon: "📊",
            color: liColor,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl px-3 py-3 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xl mb-1" style={{ color: s.color }}>{s.icon}</div>
            <div className="text-lg font-black leading-none" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] text-slate-500 mt-0.5">{s.sub}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Secondary: averages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: "Base media (09–19h)", value: `${avgBase}m`, icon: "⛅" },
          { label: "Base massima", value: `${maxBase}m`, icon: "🌤️" },
          { label: "Vario medio (m/s)", value: `${avgMs}`, icon: "🌀" },
          { label: "CAPE max", value: `${Math.round(maxCape)} J/kg`, icon: maxCape > 1000 ? "⚡" : "🌡️" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl px-3 py-2 text-center"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-base">{s.icon}</div>
            <div className="text-sm font-black text-white leading-none mt-1">{s.value}</div>
            <div className="text-[9px] text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CAPE bar chart */}
      {flightHourly.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-slate-400">CAPE per ora (09–19h)</div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: "#fbbf24" }} />stabile</span>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: "#fb923c" }} />&gt;500</span>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: "#f87171" }} />&gt;1000</span>
            </div>
          </div>
          <div className="relative h-24 flex items-end gap-1 overflow-hidden">
            {flightHourly.map((h) => {
              const pct = Math.min(100, (h.cape / Math.max(maxCape, 1)) * 100);
              const col = h.cape > 1000 ? "#f87171" : h.cape > 500 ? "#fb923c" : "#fbbf24";
              const glow = h.cape > 1000 ? "rgba(248,113,113,0.4)" : h.cape > 500 ? "rgba(251,146,60,0.35)" : "rgba(251,191,36,0.3)";
              const isSelected = selectedHour?.hour === h.hour;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center justify-end gap-0.5" style={{ height: "100%" }}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-300"
                    style={{
                      height: `${Math.max(4, pct)}%`,
                      background: `linear-gradient(to top, ${col}, ${col}bb)`,
                      opacity: isSelected ? 1 : 0.6,
                      boxShadow: isSelected ? `0 0 10px ${glow}` : "none",
                      border: isSelected ? `1px solid ${col}` : "1px solid transparent",
                    }}
                  />
                  <div className="text-[8px] text-slate-500 shrink-0">{h.hour}h</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
