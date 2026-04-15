const LINKS = [
  { label: "Open-Meteo", url: "https://open-meteo.com", icon: "🌐", desc: "Dati meteo fonte" },
  { label: "FIVL", url: "https://www.fivl.it", icon: "🪂", desc: "Fed. Italiana Volo Libero" },
  { label: "Meteo Piemonte", url: "https://www.arpa.piemonte.it", icon: "🌩️", desc: "ARPA Piemonte" },
  { label: "XContest", url: "https://www.xcontest.org", icon: "🏆", desc: "Gare e tracce GPS" },
  { label: "Paraglidingearth", url: "https://www.paraglidingearth.com", icon: "🗺️", desc: "Mappa decolli mondo" },
];

export default function ExternalLinks() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-5 card-shadow">
      <div className="font-black text-gray-900 mb-3">🔗 Link utili</div>
      <div className="flex flex-col gap-2">
        {LINKS.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
          >
            <span className="text-xl">{l.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 group-hover:text-emerald-700">{l.label}</div>
              <div className="text-xs text-gray-400">{l.desc}</div>
            </div>
            <span className="text-gray-300 group-hover:text-emerald-500 text-sm">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
