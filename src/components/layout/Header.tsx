export default function Header() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="sticky top-0 z-40 border-b border-sky-900/30"
      style={{ background: "rgba(10,12,16,0.95)", backdropFilter: "blur(16px)" }}>
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#10b981)", boxShadow: "0 0 14px rgba(14,165,233,0.4)" }}>
            🪂
          </div>
          <div>
            <div className="font-black text-white text-base leading-tight tracking-tight">MeteoVolo</div>
            <div className="text-[10px] font-bold leading-none" style={{ color: "#38bdf8" }}>PIEMONTE</div>
          </div>
        </div>

        {/* Center — live badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
          <span className="text-xs font-bold text-emerald-400">Open-Meteo Live</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 text-right">
          <div className="hidden md:block">
            <div className="text-[11px] text-slate-400 capitalize">{dateStr}</div>
            <div className="text-[10px] text-slate-500">Agg. ogni 30 min · {timeStr}</div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(56,189,248,0.15)" }}>
            🌤️
          </div>
        </div>
      </div>
    </header>
  );
}
