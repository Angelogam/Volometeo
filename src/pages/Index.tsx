import { useState, useMemo } from "react";
import { SITES } from "@/constants/sites";
import { useWeather, useAllSiteRankings } from "@/hooks/useWeather";
import { SiteRanking, LaunchSite, HourlySlot } from "@/types/weather";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";
import VolabilityHero from "@/components/features/VolabilityHero";
import AlertsPanel from "@/components/features/AlertsPanel";
import DailyForecast from "@/components/features/DailyForecast";
import ThermalCard from "@/components/features/ThermalCard";
import WindgramChart from "@/components/features/WindgramChart";
import SoaringChart from "@/components/features/SoaringChart";
import SunBar from "@/components/features/SunBar";
import LoadingOverlay from "@/components/features/LoadingOverlay";
import InteractiveHourlyTable from "@/components/features/InteractiveHourlyTable";
import BriefingCard from "@/components/features/BriefingCard";

type Tab = "orario" | "windgram" | "termiche" | "settimanale" | "soaring";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "settimanale", label: "7 Giorni", icon: "📅" },
  { id: "orario", label: "Orario 09–19h", icon: "⏱️" },
  { id: "soaring", label: "Grafici", icon: "📈" },
  { id: "termiche", label: "Termiche", icon: "🌀" },
  { id: "windgram", label: "Windgram", icon: "📊" },
];

function volColor(l: string) { return l === "GO" ? "#34d399" : l === "CAUTION" ? "#fbbf24" : "#f87171"; }
function volBorder(l: string) {
  return l === "GO" ? "rgba(52,211,153,0.3)" : l === "CAUTION" ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)";
}
function volBg(l: string) {
  return l === "GO" ? "rgba(52,211,153,0.06)" : l === "CAUTION" ? "rgba(251,191,36,0.06)" : "rgba(248,113,113,0.06)";
}
function volBadgeSx(l: string) {
  return l === "GO"
    ? { background: "rgba(52,211,153,0.15)", color: "#34d399" }
    : l === "CAUTION"
    ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }
    : { background: "rgba(248,113,113,0.15)", color: "#f87171" };
}

// Format a date string for display
function formatDateLabel(dateStr: string, label: string): string {
  const d = new Date(dateStr + "T12:00");
  const fullDay = d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  return label === "Oggi" || label === "Domani" ? `${label} — ${fullDay}` : fullDay.charAt(0).toUpperCase() + fullDay.slice(1);
}

/* ── Selected Day/Hour Banner ───────────────────────────────────── */
function SelectionBanner({
  selectedHour,
  selectedDayLabel,
  selectedDayDate,
  onClear,
}: {
  selectedHour: HourlySlot | null;
  selectedDayLabel: string;
  selectedDayDate: string;
  onClear: () => void;
}) {
  if (!selectedHour) return null;
  const col = volColor(selectedHour.volLabel);
  const formatted = formatDateLabel(selectedDayDate, selectedDayLabel);
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3 fade-up"
      style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)" }}
    >
      <span className="text-sky-400 text-lg">📍</span>
      <div className="flex-1 min-w-0">
        <div className="font-black text-white text-base leading-tight">
          {formatted} · <span style={{ color: col }}>{String(selectedHour.hour).padStart(2, "0")}:00</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Tutte le sezioni mostrano i dati per questo momento ·{" "}
          <span className="font-bold" style={{ color: col }}>{selectedHour.volLabel}</span>
          {" "}— Volabilità {selectedHour.volability.toFixed(1)}/10
        </div>
      </div>
      <button
        onClick={onClear}
        className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        ✕ Ora corrente
      </button>
    </div>
  );
}

/* ── Mobile Site Picker ─────────────────────────────────────────── */
function MobileSitePicker({ rankings, selectedId, onSelect }: {
  rankings: SiteRanking[];
  selectedId: string;
  onSelect: (s: LaunchSite) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = rankings.find((r) => r.site.id === selectedId);

  const filtered = useMemo(() =>
    search.trim()
      ? rankings.filter((r) => r.site.name.toLowerCase().includes(search.toLowerCase()))
      : rankings,
    [rankings, search]
  );

  const col = selected ? volColor(selected.label) : "#64748b";
  const border = selected ? volBorder(selected.label) : "rgba(100,116,139,0.3)";
  const bg = selected ? volBg(selected.label) : "rgba(15,20,30,0.85)";

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition-all"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selected?.site.icon ?? "🏔️"}</span>
          <div className="text-left">
            <div className="font-bold text-white text-sm">{selected?.site.name ?? "Seleziona decollo"}</div>
            <div className="text-xs text-slate-500">⛰️ {selected?.site.altitude}m · {selected?.site.zone}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selected && !selected.loading && (
            <div className="text-right">
              <div className="text-xl font-black" style={{ color: col }}>{selected.volability.toFixed(1)}</div>
              <div className="text-[9px] text-slate-500">/10</div>
            </div>
          )}
          <div className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 text-sm"
            style={{ background: "rgba(255,255,255,0.06)" }}>▼</div>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0a0c10" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <h3 className="font-black text-white">🪂 Scegli Decollo</h3>
            <button onClick={() => setOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 text-lg"
              style={{ background: "rgba(255,255,255,0.06)" }}>✕</button>
          </div>
          <div className="px-4 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <input
              placeholder="🔍 Cerca sito..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div className="overflow-y-auto flex-1 px-3 py-3 flex flex-col gap-2">
            {filtered.map((r) => {
              const isSel = r.site.id === selectedId;
              const rc = volColor(r.label);
              return (
                <button key={r.site.id}
                  onClick={() => { onSelect(r.site); setOpen(false); setSearch(""); }}
                  className="w-full text-left rounded-2xl px-4 py-3 transition-all min-h-[64px]"
                  style={{
                    background: isSel ? volBg(r.label) : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isSel ? volBorder(r.label) : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{r.site.icon}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate">{r.site.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{r.site.altitude}m · {r.site.zone}</div>
                        <div className="text-[10px] text-slate-600">🧭 {r.site.orientation} · max {r.site.maxWindKmh} km/h</div>
                      </div>
                    </div>
                    {r.loading ? (
                      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                        style={{ borderColor: "rgba(56,189,248,0.3)", borderTopColor: "#38bdf8" }} />
                    ) : (
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-black" style={{ color: rc }}>{r.volability.toFixed(1)}</div>
                        <div className="text-[10px] text-slate-500">💨 {r.wind} km/h</div>
                      </div>
                    )}
                  </div>
                  {!r.loading && (
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(r.volability / 10) * 100}%`, background: rc }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Desktop Site List ───────────────────────────────────────────── */
function SiteList({ rankings, selectedId, onSelect }: {
  rankings: SiteRanking[];
  selectedId: string;
  onSelect: (s: LaunchSite) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "CN" | "TO">("ALL");
  const [sortBy, setSortBy] = useState<"vol" | "name" | "alt">("vol");
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    let list = [...rankings];
    if (filter !== "ALL") list = list.filter((r) => r.site.region === filter);
    if (search.trim()) list = list.filter((r) => r.site.name.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "vol") list.sort((a, b) => b.volability - a.volability);
    else if (sortBy === "name") list.sort((a, b) => a.site.name.localeCompare(b.site.name));
    else list.sort((a, b) => b.site.altitude - a.site.altitude);
    return list;
  }, [rankings, filter, sortBy, search]);

  const goCount = rankings.filter((r) => r.label === "GO").length;
  const cautionCount = rankings.filter((r) => r.label === "CAUTION").length;
  const stopCount = rankings.filter((r) => r.label === "STOP").length;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="rounded-2xl p-4 cockpit-card-glow">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-black text-white text-base">🪂 Decolli Piemonte</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{SITES.length} siti · Open-Meteo Live</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
            <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "🪂 VOLA", n: goCount, color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.25)" },
            { l: "⚠️ VALUTA", n: cautionCount, color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)" },
            { l: "🚫 STOP", n: stopCount, color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
          ].map((s) => (
            <div key={s.l} className="text-center rounded-xl border py-2"
              style={{ color: s.color, background: s.bg, borderColor: s.border }}>
              <div className="text-2xl font-black leading-none">{s.n}</div>
              <div className="text-[9px] font-bold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-3 cockpit-card flex flex-col gap-2">
        <input
          placeholder="🔍 Cerca decollo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none min-h-[36px]"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <div className="flex gap-1">
          {(["ALL", "CN", "TO"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all border")}
              style={filter === f
                ? { background: "#e2e8f0", color: "#0a0c10", borderColor: "#e2e8f0" }
                : { color: "#64748b", borderColor: "rgba(255,255,255,0.08)", background: "transparent" }
              }>
              {f === "ALL" ? "Tutti" : f === "CN" ? "Cuneo" : "Torino"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ k: "vol", l: "Volabilità" }, { k: "alt", l: "Quota" }, { k: "name", l: "Nome" }].map((s) => (
            <button key={s.k} onClick={() => setSortBy(s.k as typeof sortBy)}
              className="flex-1 py-1 rounded text-[10px] font-bold transition-all border"
              style={sortBy === s.k
                ? { background: "rgba(255,255,255,0.08)", color: "#e2e8f0", borderColor: "rgba(255,255,255,0.15)" }
                : { color: "#475569", borderColor: "rgba(255,255,255,0.05)", background: "transparent" }
              }>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {(() => {
        const best = [...rankings].filter(r => !r.loading).sort((a, b) => b.volability - a.volability)[0];
        if (!best) return null;
        return (
          <button onClick={() => onSelect(best.site)}
            className="w-full text-left rounded-2xl px-3 py-2.5 transition-all hover:brightness-125"
            style={{ background: volBg(best.label), border: `1px solid ${volBorder(best.label)}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-amber-400">🏆 Miglior decollo oggi</div>
                <div className="font-black text-white text-sm mt-0.5">{best.site.name}</div>
                <div className="text-[10px] text-slate-500">{best.site.altitude}m · {best.site.zone}</div>
              </div>
              <div className="text-2xl font-black" style={{ color: volColor(best.label) }}>{best.volability.toFixed(1)}</div>
            </div>
          </button>
        );
      })()}

      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
        {sorted.map((r, idx) => {
          const isSelected = r.site.id === selectedId;
          const rc = volColor(r.label);
          return (
            <button key={r.site.id} onClick={() => onSelect(r.site)}
              className={cn("w-full text-left rounded-xl px-3 py-2.5 transition-all cursor-pointer rank-in")}
              style={isSelected
                ? { background: volBg(r.label), border: `2px solid ${volBorder(r.label)}` }
                : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }
              }>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 w-4 shrink-0 font-mono">{idx + 1}</span>
                <span className="text-lg shrink-0">{r.site.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-xs truncate">{r.site.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {r.site.region} · {r.site.altitude}m {!r.loading && `· 💨${r.wind}`}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {r.loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "rgba(56,189,248,0.3)", borderTopColor: "#38bdf8" }} />
                  ) : (
                    <>
                      <div className="text-sm font-black" style={{ color: rc }}>{r.volability.toFixed(1)}</div>
                      <span className="text-[9px] font-bold px-1 rounded-full" style={volBadgeSx(r.label)}>{r.label}</span>
                    </>
                  )}
                </div>
              </div>
              {!r.loading && (
                <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(r.volability / 10) * 100}%`, background: rc }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Tab Bar ─────────────────────────────────────────────────────── */
function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="rounded-2xl p-1.5 flex gap-1 overflow-x-auto cockpit-card">
      {TABS.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px]"
          style={active === tab.id
            ? { background: "#e2e8f0", color: "#0a0c10" }
            : { color: "#64748b" }
          }>
          <span className="text-sm">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function Index() {
  const rankings = useAllSiteRankings();
  const [selectedSite, setSelectedSite] = useState<LaunchSite>(SITES[0]);
  const [activeTab, setActiveTab] = useState<Tab>("settimanale");

  // Global time selection: day (date string) + hour slot
  const [selectedDayDate, setSelectedDayDate] = useState<string>("");
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState<HourlySlot | null>(null);

  const { data, isLoading, isError } = useWeather(selectedSite);

  // Hourly slots for the currently selected day (or today as default)
  const activeHourly = useMemo(() => {
    if (!data) return [];
    const targetDate = selectedDayDate || data.daily[0]?.date || "";
    return targetDate
      ? data.allHourly.filter(h => h.time.startsWith(targetDate) && h.hour >= 9 && h.hour <= 19)
      : data.hourly.filter(h => h.hour >= 9 && h.hour <= 19);
  }, [data, selectedDayDate]);

  // Sun info for selected day
  const activeSun = useMemo(() => {
    if (!data) return data?.sun;
    if (!selectedDayDate) return data.sun;
    const dayData = data.daily.find(d => d.date === selectedDayDate);
    if (!dayData) return data.sun;
    return { ...data.sun, sunrise: dayData.sunrise, sunset: dayData.sunset };
  }, [data, selectedDayDate]);

  function handleSiteSelect(site: LaunchSite) {
    setSelectedSite(site);
    setSelectedHour(null);
    setSelectedDayDate("");
    setSelectedDayLabel("");
  }

  function handleDayHourSelect(date: string, dayLabel: string, h: HourlySlot) {
    setSelectedDayDate(date);
    setSelectedDayLabel(dayLabel);
    setSelectedHour(h);
    // Switch to orario tab so user sees the full context
    setActiveTab("orario");
  }

  function handleHourSelect(h: HourlySlot) {
    setSelectedHour(prev => prev?.hour === h.hour && prev?.time === h.time ? null : h);
  }

  function clearSelection() {
    setSelectedHour(null);
    setSelectedDayDate("");
    setSelectedDayLabel("");
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0c10" }}>
      <Header />

      <div className="max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-5 py-4 flex flex-col lg:flex-row gap-4">

        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 max-h-[calc(100vh-72px)] sticky top-[72px]">
          <SiteList rankings={rankings} selectedId={selectedSite.id} onSelect={handleSiteSelect} />
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Mobile picker */}
          <MobileSitePicker rankings={rankings} selectedId={selectedSite.id} onSelect={handleSiteSelect} />

          {isLoading && <LoadingOverlay />}

          {isError && (
            <div className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-bold text-red-400 text-lg">Errore caricamento dati</div>
              <div className="text-sm text-red-500/70 mt-2">Impossibile raggiungere Open-Meteo API. Verifica la connessione.</div>
              <button onClick={() => window.location.reload()}
                className="mt-4 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                Riprova
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Selection banner */}
              <SelectionBanner
                selectedHour={selectedHour}
                selectedDayLabel={selectedDayLabel}
                selectedDayDate={selectedDayDate}
                onClear={clearSelection}
              />

              {/* Hero — reacts to selectedHour */}
              <VolabilityHero
                data={data}
                selectedHour={selectedHour}
                selectedDayDate={selectedDayDate}
                selectedDayLabel={selectedDayLabel}
              />

              {/* Sun */}
              {activeSun && <SunBar sun={activeSun} siteName={data.site.name} />}

              {/* Alerts */}
              <AlertsPanel alerts={data.alerts} />

              {/* Tabs */}
              <TabBar active={activeTab} onChange={setActiveTab} />

              {/* Tab content */}
              <div className="fade-up">
                {activeTab === "settimanale" && (
                  <DailyForecast
                    daily={data.daily}
                    allHourly={data.allHourly}
                    selectedDayDate={selectedDayDate}
                    selectedHour={selectedHour}
                    onSelectDayHour={handleDayHourSelect}
                  />
                )}
                {activeTab === "orario" && (
                  <InteractiveHourlyTable
                    hourly={activeHourly}
                    siteAlt={data.site.altitude}
                    selectedHour={selectedHour}
                    onSelectHour={handleHourSelect}
                    dayLabel={selectedDayLabel || "Oggi"}
                    dayDate={selectedDayDate || data.daily[0]?.date || ""}
                  />
                )}
                {activeTab === "soaring" && (
                  <SoaringChart data={data} selectedHour={selectedHour} activeHourly={activeHourly} />
                )}
                {activeTab === "termiche" && (
                  <div className="flex flex-col gap-4">
                    <BriefingCard
                      data={data}
                      selectedHour={selectedHour}
                      activeHourly={activeHourly}
                      selectedDayLabel={selectedDayLabel}
                      selectedDayDate={selectedDayDate}
                    />
                    <ThermalCard
                      data={data}
                      selectedHour={selectedHour}
                      activeHourly={activeHourly}
                    />
                  </div>
                )}
                {activeTab === "windgram" && (
                  <WindgramChart
                    windgram={data.windgram}
                    siteAlt={data.site.altitude}
                    hourly={activeHourly}
                    selectedHour={selectedHour}
                    onSelectHour={handleHourSelect}
                    dayLabel={selectedDayLabel || "Oggi"}
                  />
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-4 py-4 border-t text-center text-xs" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="font-bold text-slate-400 mb-1">MeteoVolo Piemonte — Dati reali Open-Meteo API</div>
            <div className="text-slate-600">
              Fonte: <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer"
                className="text-emerald-500 hover:underline">open-meteo.com</a>
              {" "}· Modello: icon_seamless · Aggiornamento ogni 30 minuti
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
