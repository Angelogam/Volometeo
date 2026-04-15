export default function LoadingOverlay() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-12 flex flex-col items-center gap-4 card-shadow">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🪂</div>
      </div>
      <div className="text-center">
        <div className="font-black text-gray-800 text-base">Caricamento dati meteo…</div>
        <div className="text-sm text-gray-400 mt-1">Connessione a Open-Meteo API</div>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-400"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
