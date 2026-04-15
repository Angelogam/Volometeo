import { SunInfo } from "@/types/weather";

export default function SunBar({ sun, siteName }: { sun: SunInfo; siteName: string }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  // Parse sunrise/sunset for progress bar
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
    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 card-shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm">
          <span>🌅</span>
          <span className="font-bold text-gray-700">{sun.sunrise}</span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-500">alba {siteName}</span>
        </div>

        <div className="flex-1 relative h-2 bg-gray-100 rounded-full overflow-hidden mx-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            style={{ width: `${pct}%`, transition: "width 1s ease" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white shadow"
            style={{ left: `calc(${pct}% - 7px)` }}
          />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-xs text-gray-500">{isDay ? "🌞 Ora: " + timeStr : "🌙"}</span>
          <span className="text-gray-300">·</span>
          <span className="font-bold text-gray-700">{sun.sunset}</span>
          <span>🌇</span>
        </div>
      </div>
    </div>
  );
}
