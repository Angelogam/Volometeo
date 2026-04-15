import { useState } from "react";
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

interface MetricTooltip {
  label: string;
  value: string;
  unit: string;
  explanation: string;
  color: string;
}

interface Props {
  data: WeatherData;
  selectedHour?: HourlySlot | null;
  selectedDayDate?: string;
  selectedDayLabel?: string;
}

function MetricCard({
  icon, label, value, sub, color, tooltip
}: {
  icon: string; label: string; value: string; sub: string; color?: string; tooltip: MetricTooltip;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl px-3 py-2.5 flex items-start gap-2.5 cursor-pointer transition-all hover:brightness-125 relative"
      style={{ background: "rgba(255,255,255,0.04)", border: open ? "1px solid rgba(56,189,248,0.35)" : "1px solid rgba(255,255,255,0.06)" }}
      onClick={() => setOpen(o => !o)}
    >
      <span className="text-lg shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-sm font-black text-white leading-tight" style={color ? { color } : {}}>{value}</div>
        <div className="text-[10px] mt-0.5 text-slate-500">{sub}</div>
      </div>
      <div className="shrink-0 text-[10px] text-slate-600">ℹ️</div>

      {open && (
        <div
          className="absolute z-20 left-0 top-full mt-2 rounded-2xl p-3 text-left min-w-[200px] max-w-[260px] shadow-2xl"
          style={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(56,189,248,0.25)" }}
        >
          <div className="font-black text-white text-sm mb-1">{tooltip.label}</div>
          <div className="text-lg font-black mb-1" style={{ color: tooltip.color }}>
            {tooltip.value} <span className="text-xs font-normal text-slate-400">{tooltip.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">{tooltip.explanation}</div>
        </div>
      )}
    </div>
  );
}

export default function VolabilityHero({ data, selectedHour, selectedDayDate, selectedDayLabel }: Props) {
  const { site, todayBestHour, thermalStrength } = data;
  const slot = selectedHour ?? data.current;
  const vol = slot.volability;
  const pct = (vol / 10) * 100;
  const strokeColor = volColor(vol);
  const circumference = 2 * Math.PI * 42;

  const flapDur = slot.windKmh > 30 ? "0.5s" : slot.windKmh > 15 ? "1s" : "2.5s";
  const showLightning = slot.cape > 500;

  const thermalColor: Record<string, string> = {
    debole: "#38bdf8", moderata: "#fbbf24", forte: "#fb923c", esplosiva: "#f87171",
  };

  // Date/time label for display
  const hasSelection = !!(selectedHour && selectedDayDate);
  const dateLabel = hasSelection
    ? (() => {
        const d = new Date(selectedDayDate + "T12:00");
        const fullDay = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
        const label = selectedDayLabel === "Oggi" || selectedDayLabel === "Domani"
          ? `${selectedDayLabel} — ${fullDay}`
          : fullDay.charAt(0).toUpperCase() + fullDay.slice(1);
        return label;
      })()
    : null;

  const bgStyle = vol <= 3
    ? "rgba(16,185,129,0.07)"
    : vol <= 6
    ? "rgba(245,158,11,0.07)"
    : "rgba(239,68,68,0.08)";

  const metrics: Array<{
    icon: string; label: string; value: string; sub: string; color?: string;
    tooltip: MetricTooltip;
  }> = [
    {
      icon: "💨", label: "Vento Meteo", value: `${Math.round(slot.windKmh)} km/h`, sub: slot.windDirLabel,
      tooltip: {
        label: "Vento Meteo (10m)",
        value: `${Math.round(slot.windKmh)}`, unit: "km/h",
        explanation: `Vento a 10m dal suolo, direzione ${slot.windDirLabel} (${slot.windDir}°). Limite sito: ${site.maxWindKmh} km/h. ${slot.windKmh > site.maxWindKmh ? "⚠️ Oltre il limite!" : "Entro il limite."}`,
        color: slot.windKmh > site.maxWindKmh ? "#f87171" : "#38bdf8",
      },
    },
    {
      icon: "🌬️", label: "Raffica", value: `${Math.round(slot.gust)} km/h`, sub: "max istantanea",
      tooltip: {
        label: "Raffica (Gust)",
        value: `${Math.round(slot.gust)}`, unit: "km/h",
        explanation: `Velocità massima istantanea del vento. Differenza dalla media: ${Math.round(slot.gust - slot.windKmh)} km/h. Raffiche ${slot.gust > 30 ? "⚠️ pericolose (>30 km/h)" : "accettabili"}.`,
        color: slot.gust > 30 ? "#f87171" : "#fbbf24",
      },
    },
    {
      icon: "↔️", label: "Crosswind", value: `${Math.round(slot.crosswind)} km/h`, sub: "comp. laterale",
      tooltip: {
        label: "Vento Laterale",
        value: `${Math.round(slot.crosswind)}`, unit: "km/h",
        explanation: `Componente del vento perpendicolare alla direzione di decollo (${site.orientation}). Più è alto, più il decollo è difficile. <10 km/h ideale.`,
        color: slot.crosswind > 15 ? "#f87171" : slot.crosswind > 8 ? "#fbbf24" : "#34d399",
      },
    },
    {
      icon: slot.cape > 500 ? "⛈️" : "🌡️", label: "CAPE", value: `${Math.round(slot.cape)} J/kg`,
      sub: slot.cape > 800 ? "⚡ instabile" : "stabile",
      color: slot.cape > 800 ? "#f87171" : slot.cape > 400 ? "#fbbf24" : undefined,
      tooltip: {
        label: "CAPE (Instabilità)",
        value: `${Math.round(slot.cape)}`, unit: "J/kg",
        explanation: `Energia potenziale disponibile per la convezione. <200: stabile. 200–500: moderata. >500: rischio temporali. >1000: ⚠️ pericolo immediato.`,
        color: slot.cape > 800 ? "#f87171" : slot.cape > 400 ? "#fbbf24" : "#34d399",
      },
    },
    {
      icon: "📐", label: "Gradiente", value: `${Math.round(slot.shear)} km/h`, sub: "wind shear 10→80m",
      color: slot.shear > 20 ? "#f87171" : slot.shear > 12 ? "#fbbf24" : undefined,
      tooltip: {
        label: "Wind Shear Verticale",
        value: `${Math.round(slot.shear)}`, unit: "km/h",
        explanation: `Differenza di velocità del vento tra 10m e 80m dal suolo. >12: turbolenza moderata. >20: ⚠️ turbolenza forte, rischio collasso vela.`,
        color: slot.shear > 20 ? "#f87171" : slot.shear > 12 ? "#fbbf24" : "#34d399",
      },
    },
    {
      icon: "☁️", label: "Base Cumulo", value: `${slot.thermalBase}m`, sub: thermalStrength,
      color: thermalColor[thermalStrength],
      tooltip: {
        label: "Base Cumulo (Espy)",
        value: `${slot.thermalBase}`, unit: "m slm",
        explanation: `Calcolata con formula Espy: (Temperatura - Punto di rugiada) × 125 + Altitudine decollo. Indica la quota minima delle nuvole e la cima potenziale delle termiche.`,
        color: thermalColor[thermalStrength],
      },
    },
  ];

  return (
    <div
      className="rounded-3xl p-5 sm:p-6"
      style={{
        background: bgStyle,
        border: `1px solid ${vol <= 3 ? "rgba(52,211,153,0.3)" : vol <= 6 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.35)"}`,
      }}
    >
      {/* If a future day+hour is selected: show prominent date banner */}
      {hasSelection && dateLabel && (
        <div className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)" }}>
          <span className="text-sky-400 text-xl">📍</span>
          <div>
            <div className="text-xl font-black text-white leading-tight">
              {dateLabel}
            </div>
            <div className="text-base font-black mt-0.5" style={{ color: strokeColor }}>
              ore {String(slot.hour).padStart(2, "0")}:00 &nbsp;·&nbsp; {volEmoji(vol)} {volLabel(vol)}
            </div>
          </div>
        </div>
      )}

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
            <div className="flex items-center gap-2 mb-1">
              <svg width="28" height="14" viewBox="0 0 28 14">
                <line x1="0" y1="7" x2="6" y2="7" stroke="#94a3b8" strokeWidth="1.5" />
                <polygon
                  points="6,2 22,4 20,10 6,12"
                  fill={strokeColor} opacity="0.85"
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
            {!hasSelection && selectedHour && (
              <div className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block"
                style={{ background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)" }}>
                📍 {String(slot.hour).padStart(2, "0")}:00 selezionata
              </div>
            )}
          </div>
        </div>

        {/* Stats grid — interactive, click for tooltip */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      </div>

      {/* Best hour (only for today without selection) */}
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
      <div className="mt-3 flex items-center gap-2 text-sm flex-wrap">
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
        <span className="text-slate-600">·</span>
        <span className="text-[11px] text-slate-500">💧 Punto rugiada: {Math.round(slot.dewpointC)}°C</span>
      </div>

      <div className="mt-2 text-[10px] text-slate-600">
        💡 Clicca su ogni metrica per maggiori informazioni sul valore
      </div>
    </div>
  );
}
