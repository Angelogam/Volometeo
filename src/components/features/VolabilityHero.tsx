import { WeatherData } from "@/types/weather";

const wmoLabel: Record<number, string> = {
  0: "Sereno", 1: "Poco nuvoloso", 2: "Parzialmente nuvoloso", 3: "Coperto",
  45: "Nebbia", 48: "Nebbia con brina", 51: "Pioviggine leggera", 53: "Pioviggine",
  61: "Pioggia leggera", 63: "Pioggia moderata", 65: "Pioggia intensa",
  71: "Neve leggera", 73: "Neve", 75: "Neve intensa", 80: "Rovesci",
  95: "Temporale", 96: "Temporale con grandine",
};

const wmoIcon: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "❄️", 75: "❄️", 80: "🌦️", 95: "⛈️", 96: "⛈️",
};

function getWmoLabel(code: number) {
  return wmoLabel[code] ?? "N/D";
}
function getWmoIcon(code: number) {
  return wmoIcon[code] ?? "🌡️";
}

const volColor = (v: number) =>
  v >= 7 ? "#16a34a" : v >= 4 ? "#d97706" : "#dc2626";

const volBg = (v: number) =>
  v >= 7 ? "from-emerald-50 to-teal-50 border-emerald-200" :
  v >= 4 ? "from-amber-50 to-yellow-50 border-amber-200" :
  "from-red-50 to-rose-50 border-red-200";

const volEmoji = (v: number) => v >= 7 ? "🪂" : v >= 4 ? "⚠️" : "🚫";
const volText = (v: number) => v >= 7 ? "VOLA!" : v >= 4 ? "VALUTA" : "STOP";

export default function VolabilityHero({ data }: { data: WeatherData }) {
  const { current, site, todayBestHour, thermalStrength } = data;
  const vol = current.volability;
  const pct = (vol / 10) * 100;

  const thermalColor: Record<string, string> = {
    debole: "text-blue-600", moderata: "text-amber-600",
    forte: "text-orange-600", esplosiva: "text-red-600",
  };

  return (
    <div className={`bg-gradient-to-br ${volBg(vol)} border-2 rounded-3xl p-5 sm:p-6 card-shadow`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">

        {/* Score */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={volColor(vol)} strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl sm:text-3xl font-black leading-none" style={{ color: volColor(vol) }}>
                {vol.toFixed(1)}
              </div>
              <div className="text-[10px] text-gray-400 font-bold">/10</div>
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl">{volEmoji(vol)}</div>
            <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: volColor(vol) }}>{volText(vol)}</div>
            <div className="text-xs text-gray-500 mt-0.5 font-medium">{site.name}</div>
            <div className="text-[10px] text-gray-400">{site.altitude}m · {site.zone}</div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Vento", value: `${Math.round(current.windKmh)} km/h`, sub: current.windDirLabel, icon: "💨" },
            { label: "Raffiche", value: `${Math.round(current.gust)} km/h`, sub: "max", icon: "🌬️" },
            { label: "Crosswind", value: `${Math.round(current.crosswind)} km/h`, sub: "componente laterale", icon: "↔️" },
            { label: "CAPE", value: `${Math.round(current.cape)} J/kg`, sub: current.cape > 800 ? "⚠️ instabile" : "stabile", icon: "⛈️" },
            { label: "Shear", value: `${Math.round(current.shear)} km/h`, sub: "10m→80m", icon: "📐" },
            { label: "Base termiche", value: `${current.thermalBase}m`, sub: `${thermalStrength}`, icon: "🌀" },
          ].map((s) => (
            <div key={s.label} className="bg-white/70 rounded-2xl px-3 py-2.5 flex items-start gap-2.5">
              <span className="text-lg shrink-0 mt-0.5">{s.icon}</span>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{s.label}</div>
                <div className="text-sm font-black text-gray-900 leading-tight">{s.value}</div>
                <div className={`text-[10px] font-medium mt-0.5 ${s.label === "Termiche" ? thermalColor[thermalStrength] : "text-gray-400"}`}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best hour */}
      {todayBestHour && (
        <div className="mt-4 flex items-center gap-3 bg-white/60 rounded-2xl px-4 py-2.5 border border-white/80">
          <span className="text-lg">🏆</span>
          <div>
            <span className="text-xs font-bold text-gray-700">Miglior orario oggi: </span>
            <span className="text-xs font-black text-gray-900">
              {String(todayBestHour.hour).padStart(2, "0")}:00
            </span>
            <span className="text-xs text-gray-500 ml-2">
              · Volabilità {todayBestHour.volability.toFixed(1)}/10
              · Vento {Math.round(todayBestHour.windKmh)} km/h {todayBestHour.windDirLabel}
            </span>
          </div>
        </div>
      )}

      {/* Weather description */}
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
        <span className="text-xl">{getWmoIcon(current.weatherCode)}</span>
        <span className="font-medium">{getWmoLabel(current.weatherCode)}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">{Math.round(current.tempC)}°C</span>
        <span className="text-gray-400">·</span>
        <span className="text-[11px] text-gray-400">Copertura nubi: {current.cloudCover}%</span>
      </div>
    </div>
  );
}
