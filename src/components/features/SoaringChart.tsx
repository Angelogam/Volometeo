import { WeatherData, HourlySlot } from "@/types/weather";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, Cell,
} from "recharts";

function volColor(l: string) { return l === "GO" ? "#34d399" : l === "CAUTION" ? "#fbbf24" : "#f87171"; }

interface Props {
  data: WeatherData;
  selectedHour?: HourlySlot | null;
  activeHourly?: HourlySlot[];
  dayLabel?: string;
  dayDate?: string;
}

export default function SoaringChart({ data, selectedHour, activeHourly, dayLabel: dayLabelProp, dayDate }: Props) {
  // Use activeHourly (selected day) if provided
  const source = activeHourly ?? data.hourly;
  const flight = source.filter(h => h.hour >= 7 && h.hour <= 21);

  const chartData = flight.map(h => ({
    ora: `${String(h.hour).padStart(2, "0")}h`,
    hour: h.hour,
    time: h.time,
    vento: Math.round(h.windKmh),
    raffica: Math.round(h.gust),
    vento80: Math.round(h.wind80Kmh),
    volabilità: parseFloat(h.volability.toFixed(1)),
    label: h.volLabel,
    cape: Math.round(h.cape),
    shear: Math.round(h.shear),
    baseTermiche: Math.round(h.thermalBase / 100) * 100,
    vario: parseFloat(h.thermalMs.toFixed(1)),
  }));

  // Day label for charts — prefer passed prop, else derive from activeHourly
  const dayLabel = dayLabelProp
    ? (() => {
        if (!dayDate) return dayLabelProp;
        const d = new Date(dayDate + "T12:00");
        const full = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
        return (dayLabelProp === "Oggi" || dayLabelProp === "Domani")
          ? `${dayLabelProp} — ${full}`
          : full.charAt(0).toUpperCase() + full.slice(1);
      })()
    : (activeHourly && activeHourly.length > 0
        ? (() => {
            const d = new Date(activeHourly[0].time);
            return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
          })()
        : "Oggi");

  const darkTooltip = (label: string, payload: any[]) => (
    <div style={{
      background: "rgba(15,20,30,0.95)",
      border: "1px solid rgba(56,189,248,0.2)",
      borderRadius: "12px",
      padding: "10px 14px",
      fontSize: "11px",
      color: "#e2e8f0",
    }}>
      <div style={{ fontWeight: 900, marginBottom: 8, color: "#38bdf8" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: "#fff" }}>
            {p.value}{p.dataKey === "volabilità" ? "/10" : p.dataKey === "baseTermiche" ? "m" : p.dataKey === "vario" ? " m/s" : " km/h"}
          </span>
        </div>
      ))}
    </div>
  );

  const axisStyle = { fontSize: 10, fill: "#475569" };
  const gridStyle = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)" };

  const cardStyle: React.CSSProperties = {
    background: "rgba(15,20,30,0.85)",
    border: "1px solid rgba(56,189,248,0.12)",
    borderRadius: "24px",
    padding: "20px",
    backdropFilter: "blur(12px)",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Prominent day header */}
      <div className="rounded-2xl px-5 py-4"
        style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)" }}>
        <div className="text-xs font-bold text-sky-500 uppercase tracking-widest mb-0.5">🪂 Grafici Soaring</div>
        <div className="font-black text-white text-xl sm:text-2xl capitalize">{dayLabel}</div>
        {selectedHour && (
          <div className="text-base font-black text-sky-400 mt-0.5">
            ora selezionata: {String(selectedHour.hour).padStart(2, "00")}:00 · evidenziata nei grafici
          </div>
        )}
      </div>

      {/* Wind */}
      <div style={cardStyle}>
        <div className="font-black text-white mb-1">💨 Vento Meteo & Raffica (km/h)</div>
        <div className="text-xs text-slate-500 mb-4">Suolo (10m) e +80m</div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="ora" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? darkTooltip(label, payload) : null} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
            <Area dataKey="raffica" name="Raffica" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" strokeWidth={1.5} fillOpacity={1} />
            <Line dataKey="vento" name="Vento 10m" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
            <Line dataKey="vento80" name="Vento 80m" stroke="#818cf8" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volability */}
      <div style={cardStyle}>
        <div className="font-black text-white mb-1">🪂 Indice Volabilità (/10)</div>
        <div className="text-xs text-slate-500 mb-4">Verde ≤3 · Ambra 4–6 · Rosso &gt;6{selectedHour ? " · colonna attiva evidenziata" : ""}</div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="ora" tick={axisStyle} />
            <YAxis domain={[0, 10]} tick={axisStyle} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? darkTooltip(label, payload) : null} />
            <Bar dataKey="volabilità" name="Volabilità" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, idx) => {
                const isSel = selectedHour?.time === entry.time;
                return (
                  <Cell
                    key={idx}
                    fill={volColor(entry.label)}
                    opacity={selectedHour && !isSel ? 0.3 : 0.85}
                    stroke={isSel ? "#38bdf8" : "none"}
                    strokeWidth={isSel ? 2 : 0}
                  />
                );
              })}
            </Bar>
            <Line dataKey="vario" name="Vario (m/s)" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* CAPE + Shear */}
      <div style={cardStyle}>
        <div className="font-black text-white mb-1">⛈️ CAPE & Wind Shear</div>
        <div className="text-xs text-slate-500 mb-4">CAPE in J/kg · Shear diff vento 10m→80m</div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="ora" tick={axisStyle} />
            <YAxis yAxisId="left" tick={axisStyle} />
            <YAxis yAxisId="right" orientation="right" tick={axisStyle} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? darkTooltip(label, payload) : null} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
            <Bar yAxisId="left" dataKey="cape" name="CAPE" fill="#f87171" opacity={0.6} radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" dataKey="shear" name="Shear" stroke="#a78bfa" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Base termiche */}
      <div style={cardStyle}>
        <div className="font-black text-white mb-1">☁️ Base Cumulo (m slm)</div>
        <div className="text-xs text-slate-500 mb-4">Formula Espy: (T–Td)×125 + Alt.Decollo</div>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="ora" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? darkTooltip(label, payload) : null} />
            <Area
              dataKey="baseTermiche" name="Base Cumulo"
              fill="rgba(14,165,233,0.12)" stroke="#38bdf8" strokeWidth={2} fillOpacity={1}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
