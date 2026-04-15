import { WeatherData, HourlySlot } from "@/types/weather";

const wmoLabel: Record<number, string> = {
  0: "Sereno", 1: "Poco nuvoloso", 2: "Parzialmente nuvoloso", 3: "Coperto",
  45: "Nebbia", 51: "Pioviggine", 61: "Pioggia leggera", 63: "Pioggia",
  71: "Neve", 80: "Rovesci", 95: "Temporale",
};
const wmoIcon: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️",
  51: "🌦️", 61: "🌧️", 63: "🌧️", 71: "🌨️", 80: "🌦️", 95: "⛈️",
};
function wLabel(c: number) { return wmoLabel[c] ?? "N/D"; }
function wIcon(c: number) {
  const k = Object.keys(wmoIcon).map(Number).sort((a, b) => b - a).find(k => c >= k) ?? 0;
  return wmoIcon[k] ?? "🌡️";
}

function volColor(v: number) { return v <= 3 ? "#34d399" : v <= 6 ? "#fbbf24" : "#f87171"; }
function volLabel(v: number) { return v <= 3 ? "VOLA!" : v <= 6 ? "VALUTA" : "STOP"; }
function volEmoji(v: number) { return v <= 3 ? "🪂" : v <= 6 ? "⚠️" : "🚫"; }

function cockpitClass(v: number) {
  if (v <= 3) return "cockpit-go";
  if (v <= 6) return "cockpit-caution";
  return "cockpit-stop";
}

interface Props {
  data: WeatherData;
  selectedHour?: HourlySlot | null;
}

export default function VolabilityHero({ data, selectedHour }: Props) {
  const { site, todayBestHour, thermalStrength } = data;
  const slot = selectedHour ?? data.current;
  const vol = slot.volability;
  const pct = (vol / 10) * 100;
  const strokeColor = volColor(vol);
  const circumference = 2 * Math.PI * 42;

  // Windsock animation intensity
  const flapDur = slot.windKmh > 30 ? "0.5s" : slot.windKmh > 15 ? "1s" : "2.5s";

  // Lightning for high CAPE
  const showLightning = slot.cape > 500;

  const thermalColor: Record<string, string> = {
    debole: "#38bdf8", moderata: "#fbbf24", forte: "#fb923c", esplosiva: "#f87171",
  };

  return (
    <div className={`rounded-3xl p-5 sm:p-6 ${cockpitClass(vol)}`}
      style={{ background: vol <= 3 ? "rgba(16,185,129,0.07)" : vol <= 6 ? "rgba(245,158,11,0.07)" : "rgba(239,68,68,0.08)" }}>

      {/* Top row: score + site info */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">

        {/* Score circle */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={strokeColor} strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - pct / 100)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 8px ${strokeColor}88)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl sm:text-3xl font-black leading-none" style={{ color: strokeColor }}>
                {vol.toFixed(1)}
              </div>
              <div className="text-[10px] font-bold text-slate-400">/10</div>
            </div>
          </div>

          <div>
            {/* Windsock */}
            <div className="flex items-center gap-2 mb-1">
              <svg width="28" height="14" viewBox="0 0 28 14">
                <line x1="0" y1="7" x2="6" y2="7" stroke="#94a3b8" strokeWidth="1.5" />
                <polygon
                  points="6,2 22,4 20,10 6,12"
                  fill={strokeColor}
                  opacity="0.85"
                  className="windsock-flap"
                  style={{ animationDuration: flapDur }}
                />
              </svg>
              {showLightning && <span className="text-yellow-400 lightning-blink text-sm">⚡</span>}
            </div>
            <div className="text-2xl sm:text-3xl font-black" style={{ color: strokeColor }}>
              {volEmoji(vol)} {volLabel(vol)}
            </div>
            <div className="text-sm font-bold text-slate-300 mt-1">{site.name}</div>
            <div className="text-[11px] text-slate-500">{site.altitude}m slm · {site.zone}</div>
            {selectedHour && (
              <div className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block"
                style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)" }}>
                📍 {String(slot.hour).padStart(2, "0")}:00 selezionata
              </div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Vento Meteo", value: `${Math.round(slot.windKmh)} km/h`, sub: slot.windDirLabel, icon: "💨" },
            { label: "Raffica", value: `${Math.round(slot.gust)} km/h`, sub: "max istantanea", icon: "🌬️" },
            { label: "Crosswind", value: `${Math.round(slot.crosswind)} km/h`, sub: "comp. laterale", icon: "↔️" },
            { label: "CAPE", value: `${Math.round(slot.cape)} J/kg`, sub: slot.cape > 800 ? "⚡ instabile" : "stabile", icon: slot.cape > 500 ? "⛈️" : "🌡️" },
            { label: "Gradiente", value: `${Math.round(slot.shear)} km/h`, sub: "wind shear 10→80m", icon: "📐" },
            { label: "Base Cumulo", value: `${slot.thermalBase}m`, sub: thermalStrength, icon: "☁️" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl px-3 py-2.5 flex items-start gap-2.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-lg shrink-0 mt-0.5">{s.icon}</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.label}</div>
                <div className="text-sm font-black text-white leading-tight">{s.value}</div>
                <div className="text-[10px] mt-0.5"
                  style={{ color: s.label === "Base Cumulo" ? thermalColor[thermalStrength] : "#64748b" }}>
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best hour */}
      {todayBestHour && !selectedHour && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-lg">🏆</span>
          <div className="text-xs">
            <span className="font-bold text-slate-300">Miglior orario oggi: </span>
            <span className="font-black text-white">{String(todayBestHour.hour).padStart(2, "0")}:00</span>
            <span className="text-slate-400 ml-2">
              · Volabilità {todayBestHour.volability.toFixed(1)}/10
              · Vento {Math.round(todayBestHour.windKmh)} km/h {todayBestHour.windDirLabel}
            </span>
          </div>
        </div>
      )}

      {/* Weather desc */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-xl">{wIcon(slot.weatherCode)}</span>
        <span className="font-medium text-slate-300">{wLabel(slot.weatherCode)}</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">{Math.round(slot.tempC)}°C</span>
        <span className="text-slate-600">·</span>
        <span className="text-[11px] text-slate-500">Nubi: {slot.cloudCover}%</span>
        {slot.liftedIndex !== undefined && (
          <>
            <span className="text-slate-600">·</span>
            <span className={`text-[11px] font-bold ${slot.liftedIndex < -3 ? "text-red-400" : slot.liftedIndex < 0 ? "text-amber-400" : "text-emerald-400"}`}>
              LI: {slot.liftedIndex.toFixed(1)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
