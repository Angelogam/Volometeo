import { WindgramLevel } from "@/types/weather";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// Wind arrow SVG
function WindArrow({ deg, color }: { deg: number; color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ transform: `rotate(${deg}deg)`, display: "inline-block" }}>
      <line x1="9" y1="15" x2="9" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <polyline points="5,7 9,3 13,7" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LEVEL_COLORS = {
  ground: "#16a34a",   // green – suolo
  m80: "#2563eb",      // blue – +80m
  m500: "#d97706",     // amber – +500m
  m1000: "#dc2626",    // red – +1000m
  m2000: "#7c3aed",    // purple – +2000m
};

const LEVEL_LABELS: Record<string, string> = {
  ground: "Decollo (suolo)",
  m80: "+80m (termica bassa)",
  m500: "+500m (cross)",
  m1000: "+1000m (cross alto)",
  m2000: "+2000m (alta quota)",
};

function windBg(kmh: number): string {
  if (kmh > 45) return "#fef2f2";
  if (kmh > 30) return "#fffbeb";
  if (kmh > 15) return "#eff6ff";
  return "#f0fdf4";
}
function windText(kmh: number): string {
  if (kmh > 45) return "#dc2626";
  if (kmh > 30) return "#d97706";
  if (kmh > 15) return "#2563eb";
  return "#16a34a";
}

// Build hourly-style data for the chart: we have 5 altitude levels
// We'll show them as a bar-per-altitude horizontal view
function buildChartData(windgram: WindgramLevel[]) {
  // Each entry is one altitude level with wind at ground, +80m, +500m, +1000m, +2000m
  return windgram.map((w, i) => ({
    alt: `${w.alt}m`,
    altNum: w.alt,
    wind: Math.round(w.windKmh),
    temp: Math.round(w.tempC),
    dir: w.windDir,
    level: Object.keys(LEVEL_COLORS)[i] as keyof typeof LEVEL_COLORS,
  }));
}

export default function WindgramChart({ windgram, siteAlt }: { windgram: WindgramLevel[]; siteAlt: number }) {
  const maxWind = Math.max(...windgram.map(w => w.windKmh), 1);
  const levelKeys = Object.keys(LEVEL_COLORS) as Array<keyof typeof LEVEL_COLORS>;

  // Build recharts data: one row per altitude, wind value
  const chartData = windgram.map((w, i) => {
    const key = levelKeys[i] ?? "ground";
    return {
      alt: `${w.alt}m`,
      altNum: w.alt,
      windKmh: Math.round(w.windKmh),
      tempC: Math.round(w.tempC),
      dir: w.windDir,
      color: LEVEL_COLORS[key],
    };
  }).sort((a, b) => a.altNum - b.altNum); // low → high

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs min-w-[140px]">
        <div className="font-black text-gray-900 mb-1.5">{label}</div>
        <div className="flex items-center gap-2 mb-1">
          <WindArrow deg={d.dir} color={d.color} />
          <span className="font-bold" style={{ color: d.color }}>{d.windKmh} km/h</span>
        </div>
        <div className="text-gray-500">Temp: <strong>{d.tempC}°C</strong></div>
        <div className="text-gray-400 mt-0.5">Dir: {d.dir}°</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 card-shadow">
        <div className="mb-1 font-black text-gray-900 text-base">📊 Windgram — Profilo verticale vento</div>
        <div className="text-xs text-gray-500 mb-4">Ore 12:00 locali · Open-Meteo · dal suolo a +2000m</div>

        {/* Colored legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {windgram.map((w, i) => {
            const key = levelKeys[i] ?? "ground";
            const col = LEVEL_COLORS[key];
            return (
              <div key={w.alt} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: col }} />
                <span className="text-[10px] text-gray-600">{LEVEL_LABELS[key] ?? `${w.alt}m`}</span>
              </div>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, Math.ceil(maxWind * 1.2)]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v) => `${v} km/h`}
            />
            <YAxis
              type="category"
              dataKey="alt"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={15} stroke="#16a34a" strokeDasharray="4 4" opacity={0.5} />
            <ReferenceLine x={30} stroke="#d97706" strokeDasharray="4 4" opacity={0.5} />
            <ReferenceLine x={45} stroke="#dc2626" strokeDasharray="4 4" opacity={0.5} />
            <Line
              dataKey="windKmh"
              name="Vento"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={payload.alt}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={payload.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 8 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Wind zones legend */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
          <div className="flex items-center gap-1"><div className="w-6 border-t-2 border-dashed border-emerald-500" /> &lt;15 km/h ottimale</div>
          <div className="flex items-center gap-1"><div className="w-6 border-t-2 border-dashed border-amber-500" /> 30 km/h limite</div>
          <div className="flex items-center gap-1"><div className="w-6 border-t-2 border-dashed border-red-500" /> 45 km/h pericolo</div>
        </div>
      </div>

      {/* Altitude cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {windgram.map((w, i) => {
          const key = levelKeys[i] ?? "ground";
          const col = LEVEL_COLORS[key];
          const isLaunch = w.alt === siteAlt;
          const bg = windBg(w.windKmh);
          const textCol = windText(w.windKmh);

          return (
            <div
              key={w.alt}
              className={`rounded-2xl border-2 p-4 transition-all ${isLaunch ? "shadow-md ring-2 ring-emerald-300" : "card-shadow"}`}
              style={{ background: bg, borderColor: col + "55" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-gray-500">{LEVEL_LABELS[key]?.split(" ")[0] ?? "Quota"}</div>
                  <div className="font-black text-gray-900 text-sm">{w.alt}m slm</div>
                  {isLaunch && <div className="text-[9px] font-bold text-emerald-600 mt-0.5">🪂 DECOLLO</div>}
                </div>
                <WindArrow deg={w.windDir} color={col} />
              </div>

              <div className="text-2xl font-black leading-none mt-1" style={{ color: textCol }}>
                {Math.round(w.windKmh)}
                <span className="text-xs font-bold ml-1">km/h</span>
              </div>

              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (w.windKmh / 60) * 100)}%`, background: col }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                <span>🌡️ {Math.round(w.tempC)}°C</span>
                <span>↗ {w.windDir}°</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-gray-400 text-center pb-1">
        Vento estratto da Open-Meteo a 10m e 80m · quote superiori per estrapolazione.
        Per analisi professionali usa sondaggi AROME/ECMWF.
      </div>
    </div>
  );
}
