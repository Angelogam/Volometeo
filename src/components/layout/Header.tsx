export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg shadow-sm">
            🪂
          </div>
          <div>
            <div className="font-black text-gray-900 text-base leading-tight tracking-tight">MeteoVolo</div>
            <div className="text-[10px] text-emerald-600 font-bold leading-none">PIEMONTE</div>
          </div>
        </div>

        {/* Center badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-emerald-700">Open-Meteo Live</span>
        </div>

        {/* Right info */}
        <div className="flex items-center gap-3 text-right">
          <div className="hidden md:block">
            <div className="text-[11px] text-gray-500">
              {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div className="text-[10px] text-gray-400">Aggiornamento ogni 30 min</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
            🌤️
          </div>
        </div>
      </div>
    </header>
  );
}
