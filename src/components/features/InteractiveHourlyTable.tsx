import { HourlySlot } from "@/types/weather";
import { cn } from "@/lib/utils";

function WindArrow({ deg, color }: { deg: number; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14"
      style={{ transform: `rotate(${deg}deg)`, display: "inline" }}>
      <line x1="7" y1="11" x2="7" y2="3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="4,6 7,3 10,6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function volColor(l: string) { return l === "GO" ? "#34d399" : l === "CAUTION" ? "#fbbf24" : "#f87171"; }
function volBadgeSx(l: string) {
  return l === "GO"
    ? { background: "rgba(52,211,153,0.15)", color: "#34d399" }
    : l === "CAUTION"
    ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }
    : { background: "rgba(248,113,113,0.15)", color: "#f87171" };
}

type SortKey = "hour" | "volability" | "windKmh" | "cape" | "shear";

interface Props {
  hourly: HourlySlot[];
  siteAlt: number;
  selectedHour?: HourlySlot | null;
  onSelectHour?: (h: HourlySlot) => void;
}

export default function InteractiveHourlyTable({ hourly, siteAlt, selectedHour, onSelectHour }: Props) {
  const flightHours = hourly.filter(h => h.hour >= 9 && h.hour <= 19);

  const Th = ({ label }: { label: string }) => (
    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
      {label}
    </th>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Info */}
      <div className="rounded-2xl px-4 py-2.5 flex items-center gap-2 cockpit-card">
        <span className="text-[10px] font-bold text-slate-500 mr-1">Clicca su una riga per selezionare l&apos;ora</span>
        <div className="ml-auto text-[10px] text-slate-600">{flightHours.length} ore · siteAlt {siteAlt}m</div>
      </div>

      {/* Table */}
      <div className="rounded-3xl overflow-hidden cockpit-card-glow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <tr>
                <Th label="Ora" />
                <Th label="Volabilità" />
                <Th label="Vento" />
                <Th label="Raffica" />
                <Th label="Dir." />
                <Th label="CAPE" />
                <Th label="Shear" />
                <Th label="Temp" />
                <Th label="Nubi%" />
                <Th label="Pioggia" />
                <Th label="Vario" />
                <Th label="Base" />
              </tr>
            </thead>
            <tbody style={{ divide: "none" }}>
              {flightHours.map((h) => {
                const isSelected = selectedHour?.hour === h.hour;
                const col = volColor(h.volLabel);
                const badge = volBadgeSx(h.volLabel);
                return (
                  <tr
                    key={h.hour}
                    onClick={() => onSelectHour?.(h)}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: isSelected
                        ? "rgba(56,189,248,0.08)"
                        : "transparent",
                      borderLeft: isSelected ? "3px solid #38bdf8" : "3px solid transparent",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                    }}
                  >
                    <td className="px-3 py-3">
                      <div className="font-black text-white text-sm">{String(h.hour).padStart(2, "0")}:00</div>
                      {isSelected && <div className="text-[9px] font-bold text-sky-400">● selezionata</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-black" style={{ color: col }}>{h.volability.toFixed(1)}</div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={badge}>{h.volLabel}</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full w-16 overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                        <div className="h-full rounded-full" style={{ width: `${(h.volability / 10) * 100}%`, background: col }} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-bold text-slate-200">{Math.round(h.windKmh)} km/h</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-slate-400">{Math.round(h.gust)} km/h</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-300">
                        <WindArrow deg={h.windDir} color={col} />
                        <span className="font-bold">{h.windDirLabel}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className={cn("text-xs font-bold",
                        h.cape > 1000 ? "text-red-400" : h.cape > 500 ? "text-amber-400" : "text-slate-400")}>
                        {Math.round(h.cape)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className={cn("text-xs font-bold",
                        h.shear > 20 ? "text-red-400" : h.shear > 10 ? "text-amber-400" : "text-slate-400")}>
                        {Math.round(h.shear)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{Math.round(h.tempC)}°C</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{h.cloudCover}%</td>
                    <td className="px-3 py-3">
                      <div className={cn("text-xs font-bold", h.precip > 0.5 ? "text-sky-400" : "text-slate-600")}>
                        {h.precip.toFixed(1)} mm
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-bold"
                        style={{ color: h.thermalMs > 3 ? "#f87171" : h.thermalMs > 1.5 ? "#fbbf24" : "#34d399" }}>
                        {h.thermalMs.toFixed(1)} m/s
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400">{h.thermalBase}m</td>
                  </tr>
                );
              })}
              {flightHours.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-sm text-slate-600">
                    Nessuna ora disponibile nella finestra di volo 09–19h.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
