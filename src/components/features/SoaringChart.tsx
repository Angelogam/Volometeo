import { WeatherData } from "@/types/weather";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area,
} from "recharts";

export default function SoaringChart({ data }: { data: WeatherData }) {
  const flight = data.hourly.filter(h => h.hour >= 7 && h.hour <= 21);

  const chartData = flight.map(h => ({
    ora: `${String(h.hour).padStart(2, "0")}h`,
    vento: Math.round(h.windKmh),
    raffica: Math.round(h.gust),
    volabilità: parseFloat(h.volability.toFixed(1)),
    cape: Math.round(h.cape),
    shear: Math.round(h.shear),
    baseTermiche: Math.round(h.thermalBase / 100) * 100,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-lg text-xs">
        <div className="font-bold text-gray-800 mb-1.5">{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span style={{ color: p.color }} className="font-medium">{p.name}</span>
            <span className="font-bold text-gray-900">{p.value}{p.dataKey === "volabilità" ? "/10" : p.dataKey === "baseTermiche" ? "m" : " km/h"}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Wind chart */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 card-shadow">
        <div className="font-black text-gray-900 mb-1">💨 Vento & Raffiche (km/h)</div>
        <div className="text-xs text-gray-400 mb-4">07:00 – 21:00 · dati orari Open-Meteo</div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="ora" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Area dataKey="raffica" name="Raffiche" fill="#fde68a" stroke="#d97706" strokeWidth={1.5} fillOpacity={0.4} />
            <Line dataKey="vento" name="Vento" stroke="#2563eb" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volability chart */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 card-shadow">
        <div className="font-black text-gray-900 mb-1">🪂 Indice Volabilità (/10)</div>
        <div className="text-xs text-gray-400 mb-4">Verde ≥7 · Ambra 4–7 · Rosso &lt;4</div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="ora" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volabilità" name="Volabilità" radius={[4, 4, 0, 0]}
              fill="#16a34a"
              label={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* CAPE + Shear */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 card-shadow">
        <div className="font-black text-gray-900 mb-1">⛈️ CAPE & Wind Shear</div>
        <div className="text-xs text-gray-400 mb-4">CAPE in J/kg · Shear in km/h (diff 10m→80m)</div>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="ora" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="left" dataKey="cape" name="CAPE" fill="#dc2626" opacity={0.6} radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" dataKey="shear" name="Shear" stroke="#7c3aed" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
