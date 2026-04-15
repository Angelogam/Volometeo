import { SunInfo } from "@/types/weather";

export default function SunBar({ sun, siteName }: { sun: SunInfo; siteName: string }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  function parseTime(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  }

  const riseMin = parseTime(sun.sunrise);
  const setMin = parseTime(sun.sunset);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dayLen = setMin - riseMin;
  const pct = dayLen > 0 ? Math.min(100, Math.max(0, ((nowMin - riseMin) / dayLen) * 100)) : 0;
  const isDay = nowMin >= riseMin && nowMin <= setMin;

  return (
    <div className="rounded-2xl px-4 py-3 cockpit-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm shrink-0">
          <span>🌅</span>
          <span className="font-bold text-slate-300">{sun.sunrise}</span>
          <span className="text-slate-600 text-xs hidden sm:inline">alba {siteName}</span>
        </div>

        <div className="flex-1 relative h-2 rounded-full overflow-hidden mx-2"
          style={{ background: "rgba(255,255,255,0.07)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(to right, #fb923c, #fbbf24)",
              transition: "width 1s ease",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white/20 shadow"
            style={{
              left: `calc(${pct}% - 7px)`,
              background: "#fbbf24",
              boxShadow: "0 0 8px #fbbf2488"
            }}
          />
        </div>

        <div className="flex items-center gap-2 text-sm shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">{isDay ? `🌞 ${timeStr}` : "🌙"}</span>
          <span className="font-bold text-slate-300">{sun.sunset}</span>
          <span>🌇</span>
        </div>
      </div>
    </div>
  );
}
