import { WeatherData } from "@/types/weather";

const strengthMeta = {
  debole: { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", icon: "🌀", desc: "Termiche deboli (< 1 m/s). Volo adatto a piloti esperti in condizioni calme." },
  moderata: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: "↑", desc: "Termiche moderate (1–2 m/s). Buone condizioni per soaring e voli di distanza." },
  forte: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", icon: "🔥", desc: "Termiche forti (2–4 m/s). Attenzione a turbolenza in prossimità delle terre." },
  esplosiva: { color: "text-red-600", bg: "bg-red-50 border-red-200", icon: "⚡", desc: "CAPE molto elevato. Rischio temporali! Solo piloti avanzati con massima prudenza." },
};

export default function ThermalCard({ data }: { data: WeatherData }) {
  const { thermalStrength, current, hourly } = data;
  const meta = strengthMeta[thermalStrength];
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
  const avgCape = flightHourly.length
    ? Math.round(flightHourly.reduce((s, h) => s + h.cape, 0) / flightHourly.length)
    : current.cape;

  return (
    <div className={`${meta.bg} border-2 rounded-3xl p-5 card-shadow`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`text-3xl w-12 h-12 rounded-2xl flex items-center justify-center bg-white/60 ${meta.color} font-black`}>
          {meta.icon}
        </div>
        <div>
          <div className="font-black text-gray-900 text-base">Analisi Termiche</div>
          <div className={`text-sm font-bold capitalize ${meta.color}`}>Forza: {thermalStrength}</div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{meta.desc}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Base media", value: `${avgBase}m`, sub: "m slm", icon: "☁️" },
          { label: "Base max", value: `${maxBase}m`, sub: "m slm", icon: "⛅" },
          { label: "CAPE medio", value: `${avgCape}`, sub: "J/kg", icon: "🌡️" },
          { label: "CAPE max", value: `${Math.round(maxCape)}`, sub: "J/kg", icon: "⚠️" },
        ].map((s) => (
          <div key={s.label} className="bg-white/60 rounded-2xl px-3 py-2.5 text-center">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className="text-lg font-black text-gray-900 leading-none">{s.value}</div>
            <div className="text-[9px] text-gray-400 mt-0.5">{s.sub}</div>
            <div className="text-[10px] font-bold text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CAPE bar chart over hours */}
      {flightHourly.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-bold text-gray-700 mb-2">CAPE per ora (09–19h)</div>
          <div className="flex items-end gap-1 h-12">
            {flightHourly.map((h) => {
              const pct = Math.min(100, (h.cape / Math.max(maxCape, 1)) * 100);
              const col = h.cape > 1000 ? "#dc2626" : h.cape > 500 ? "#d97706" : "#16a34a";
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-t" style={{ height: `${Math.max(4, pct * 0.44)}rem`, background: col, opacity: 0.75 }} />
                  <div className="text-[8px] text-gray-400">{h.hour}h</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
