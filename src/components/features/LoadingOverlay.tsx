export default function LoadingOverlay() {
  return (
    <div className="rounded-3xl p-12 text-center cockpit-card-glow">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "rgba(56,189,248,0.3)", borderTopColor: "#38bdf8" }} />
        <div>
          <div className="font-black text-white text-base">Caricamento dati meteo</div>
          <div className="text-xs text-slate-500 mt-1">Open-Meteo API · icon_seamless</div>
        </div>
      </div>
    </div>
  );
}
