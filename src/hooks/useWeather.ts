
import { useQuery } from "@tanstack/react-query";
import { LaunchSite, WeatherData, HourlySlot, DailyDay, WindgramLevel, SunInfo, Alert, SiteRanking } from "@/types/weather";
import { SITES } from "@/constants/sites";

// ── Utility helpers ──────────────────────────────────────────────────────────

function degToCompass(deg: number): string {
  const dirs = ["N", "NE", "NE", "E", "E", "SE", "SE", "S", "S", "SO", "SO", "O", "O", "NO", "NO", "N"];
  return dirs[Math.round(deg / 22.5) % 16];
}

/** Angular difference between two bearings (0–180) */
function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Crosswind component (km/h) given wind speed, wind dir, and launch bearing */
function crosswindComponent(windKmh: number, windDir: number, launchBearing: number): number {
  const angle = angleDiff(windDir, launchBearing);
  return Math.abs(windKmh * Math.sin((angle * Math.PI) / 180));
}

/**
 * Volability score 1–10 where 1 = perfetto, 10 = pericolo.
 * Starts at 1 and adds penalty points:
 * - Pioggia > 0.1mm → 10 (STOP immediato)
 * - Vento > 25km/h o Raffiche > 30km/h → +5
 * - CAPE > 500 J/kg → +3
 * - Direzione vento fuori settore > 60° → +4
 * - Shear elevato → +1–2
 * - Vento oltre limite sito → +3 extra
 */
function calcVolability(
  windKmh: number,
  windDir: number,
  gust: number,
  cape: number,
  shear: number,
  precip: number,
  cloudCover: number,
  launchBearing: number,
  maxWind: number,
  minWind: number
): number {
  // Hard stop: pioggia
  if (precip > 0.1) return 10;

  let penalty = 0;

  // Vento o raffiche eccessive
  if (windKmh > 25 || gust > 30) penalty += 5;
  else if (windKmh > maxWind * 0.75) penalty += 2;

  // Vento oltre il limite massimo del sito
  if (windKmh > maxWind) penalty += 3;

  // CAPE – instabilità convettiva
  if (cape > 500) penalty += 3;
  else if (cape > 200) penalty += 1;

  // Direzione fuori settore
  const dirDiff = angleDiff(windDir, launchBearing);
  if (dirDiff > 60) penalty += 4;
  else if (dirDiff > 40) penalty += 2;
  else if (dirDiff > 25) penalty += 1;

  // Wind shear verticale
  if (shear > 20) penalty += 2;
  else if (shear > 12) penalty += 1;

  // Copertura nuvolosa totale
  if (cloudCover > 90) penalty += 1;

  return Math.min(10, 1 + penalty);
}

/** 1=perfetto, 10=pericolo */
function volLabel(score: number): "GO" | "CAUTION" | "STOP" {
  if (score <= 3) return "GO";
  if (score <= 6) return "CAUTION";
  return "STOP";
}

/**
 * Espy formula: cloud base AGL (m) = (T - Td) × 125
 * Returns metres AMSL (above launch)
 */
function espyCloudBase(tempC: number, dewpointC: number, siteAlt: number): number {
  const spread = Math.max(1, tempC - dewpointC);
  const agl = spread * 125;
  return Math.round(siteAlt + Math.max(300, agl));
}

/**
 * Thermal strength m/s — simplified from CAPE:
 * v ≈ sqrt(2 × CAPE × 0.001) capped at 6 m/s
 */
function thermalStrengthMs(cape: number): number {
  return Math.min(6, Math.round(Math.sqrt(2 * cape * 0.001) * 10) / 10);
}

function parseSunTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function buildAlerts(hourly: HourlySlot[], cape: number): Alert[] {
  const alerts: Alert[] = [];
  const maxWind = Math.max(...hourly.filter(h => h.isFlightWindow).map(h => h.windKmh));
  const maxGust = Math.max(...hourly.filter(h => h.isFlightWindow).map(h => h.gust));
  const rain = hourly.some(h => h.precip > 0.5);

  if (cape > 1000) {
    alerts.push({ id: "cape", type: "danger", icon: "⛈️", title: "CAPE elevato – rischio temporali", body: `Indice CAPE: ${Math.round(cape)} J/kg. Evitare il volo nelle ore centrali.` });
  } else if (cape > 500) {
    alerts.push({ id: "cape-warn", type: "warning", icon: "⚠️", title: "CAPE moderato", body: `CAPE ${Math.round(cape)} J/kg. Possibile sviluppo cumulonembi nel pomeriggio.` });
  }
  if (maxGust > 45) {
    alerts.push({ id: "gust", type: "danger", icon: "💨", title: "Raffiche pericolose", body: `Raffiche fino a ${Math.round(maxGust)} km/h nelle ore di volo.` });
  } else if (maxGust > 30) {
    alerts.push({ id: "gust-warn", type: "warning", icon: "💨", title: "Raffiche sostenute", body: `Raffiche fino a ${Math.round(maxGust)} km/h. Vola nelle ore più tranquille.` });
  }
  if (rain) {
    alerts.push({ id: "rain", type: "danger", icon: "🌧️", title: "Precipitazioni previste", body: "Pioggia nelle ore di volo. Rimandare l'uscita." });
  }
  if (alerts.length === 0 && maxWind < 25) {
    alerts.push({ id: "ok", type: "info", icon: "✅", title: "Condizioni favorevoli", body: "Nessun alert attivo. Verifica sempre le condizioni locali prima del decollo." });
  }
  return alerts;
}

// ── Open-Meteo fetcher ───────────────────────────────────────────────────────

async function fetchWeather(site: LaunchSite): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: site.lat.toString(),
    longitude: site.lon.toString(),
    hourly: [
      "temperature_2m", "dewpoint_2m",
      "wind_speed_10m", "wind_speed_80m", "wind_speed_120m",
      "wind_direction_10m", "wind_direction_80m", "wind_direction_120m",
      "wind_gusts_10m", "cloud_cover", "precipitation",
      "cape", "weather_code", "visibility",
      "boundary_layer_height", "lifted_index"
    ].join(","),
    daily: [
      "temperature_2m_max", "temperature_2m_min", "precipitation_sum",
      "wind_speed_10m_max", "weather_code", "sunrise", "sunset", "cape_max"
    ].join(","),
    models: "icon_seamless",
    timezone: "Europe/Rome",
    wind_speed_unit: "kmh",
    forecast_days: "7",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error("Open-Meteo API error");
  const raw = await res.json();

  const now = new Date();
  const nowH = now.getHours();

  // Build hourly slots
  const hourlySlots: HourlySlot[] = raw.hourly.time.map((t: string, i: number) => {
    const date = new Date(t);
    const hour = date.getHours();
    const dateStr = date.toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);
    const isToday = dateStr === todayStr;

    const w10 = raw.hourly.wind_speed_10m[i] ?? 0;
    const w80 = raw.hourly.wind_speed_80m[i] ?? 0;
    const w120 = raw.hourly.wind_speed_120m[i] ?? 0;
    const dir10 = raw.hourly.wind_direction_10m[i] ?? 0;
    const dir80 = raw.hourly.wind_direction_80m[i] ?? 0;
    const dir120 = raw.hourly.wind_direction_120m[i] ?? 0;
    const gust = raw.hourly.wind_gusts_10m[i] ?? 0;
    const cape = raw.hourly.cape[i] ?? 0;
    const precip = raw.hourly.precipitation[i] ?? 0;
    const cloud = raw.hourly.cloud_cover[i] ?? 0;
    const temp = raw.hourly.temperature_2m[i] ?? 0;
    const dewpoint = raw.hourly.dewpoint_2m[i] ?? (temp - 5);
    const blh = raw.hourly.boundary_layer_height[i] ?? 0;
    const li = raw.hourly.lifted_index[i] ?? 0;
    const shear = Math.abs(w80 - w10);
    const shear120 = Math.abs(w120 - w10);
    const xw = crosswindComponent(w10, dir10, site.launchBearing);
    const vol = calcVolability(w10, dir10, gust, cape, shear, precip, cloud, site.launchBearing, site.maxWindKmh, site.minWindKmh);
    const cloudBase = espyCloudBase(temp, dewpoint, site.altitude);
    const thermalMs = thermalStrengthMs(cape);

    return {
      hour,
      time: t,
      tempC: temp,
      dewpointC: dewpoint,
      windKmh: w10,
      windDir: dir10,
      windDirLabel: degToCompass(dir10),
      wind80Kmh: w80,
      windDir80: dir80,
      wind120Kmh: w120,
      windDir120: dir120,
      gust,
      cloudCover: cloud,
      precip,
      cape,
      shear,
      shear120,
      crosswind: xw,
      volability: vol,
      volLabel: volLabel(vol),
      thermalBase: cloudBase,
      thermalMs,
      boundaryLayerHeight: blh,
      liftedIndex: li,
      weatherCode: raw.hourly.weather_code[i] ?? 0,
      isFlightWindow: isToday && hour >= 9 && hour <= 19,
    };
  });

  // Filter today's hours
  const todayStr = now.toISOString().slice(0, 10);
  const todayHourly = hourlySlots.filter(h => h.time.startsWith(todayStr));
  const flightWindow = todayHourly.filter(h => h.hour >= 9 && h.hour <= 19);

  // Current: nearest hour
  const current = todayHourly.find(h => h.hour === nowH) ?? todayHourly[nowH > 0 ? nowH - 1 : 0] ?? hourlySlots[0];

  // Best flight hour today
  const todayBestHour = flightWindow.length
    ? [...flightWindow].sort((a, b) => b.volability - a.volability)[0]
    : null;

  // Daily
  const daily: DailyDay[] = raw.daily.time.map((d: string, i: number) => {
    const date = new Date(d);
    const labels = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    const label = i === 0 ? "Oggi" : i === 1 ? "Domani" : labels[date.getDay()];
    const wCode = raw.daily.weather_code[i] ?? 0;
    const wMax = raw.daily.wind_speed_10m_max[i] ?? 0;
    const cape = raw.daily.cape_max?.[i] ?? 0;
    const precip = raw.daily.precipitation_sum[i] ?? 0;
    // Simplified daily volability
    let dvol = 10;
    if (precip > 2) dvol -= 5;
    else if (precip > 0.5) dvol -= 2;
    if (cape > 1000) dvol -= 3;
    else if (cape > 500) dvol -= 1;
    if (wMax > (site.maxWindKmh * 0.8)) dvol -= 2;
    dvol = Math.max(0, Math.min(10, dvol));

    return {
      date: d,
      label,
      tempMax: raw.daily.temperature_2m_max[i] ?? 0,
      tempMin: raw.daily.temperature_2m_min[i] ?? 0,
      windMax: wMax,
      precipSum: precip,
      weatherCode: wCode,
      volability: dvol,
      volLabel: volLabel(dvol),
      capeMax: cape,
      sunrise: parseSunTime(raw.daily.sunrise[i]),
      sunset: parseSunTime(raw.daily.sunset[i]),
    };
  });

  // Windgram: altitudini reali 10m, 80m, 120m + estrapolazione
  const todayIdx = hourlySlots.findIndex(h => h.time.startsWith(todayStr) && h.hour === 12);
  const idx12 = todayIdx >= 0 ? todayIdx : 12;
  const w10_noon = raw.hourly.wind_speed_10m?.[idx12] ?? 10;
  const w80_noon = raw.hourly.wind_speed_80m?.[idx12] ?? 12;
  const w120_noon = raw.hourly.wind_speed_120m?.[idx12] ?? 14;
  const d10_noon = raw.hourly.wind_direction_10m?.[idx12] ?? 180;
  const d80_noon = raw.hourly.wind_direction_80m?.[idx12] ?? 185;
  const d120_noon = raw.hourly.wind_direction_120m?.[idx12] ?? 190;
  const t_noon = raw.hourly.temperature_2m?.[idx12] ?? 15;

  const windgram: WindgramLevel[] = [
    { alt: site.altitude,        windKmh: Math.round(w10_noon),  windDir: d10_noon,  tempC: Math.round(t_noon) },
    { alt: site.altitude + 500,  windKmh: Math.round(w80_noon),  windDir: d80_noon,  tempC: Math.round(t_noon - 3.25) },
    { alt: site.altitude + 1000, windKmh: Math.round(w120_noon), windDir: d120_noon, tempC: Math.round(t_noon - 6.5) },
    { alt: site.altitude + 2000, windKmh: Math.round(w120_noon * 1.2), windDir: (d120_noon + 15) % 360, tempC: Math.round(t_noon - 13) },
    { alt: site.altitude + 3000, windKmh: Math.round(w120_noon * 1.4), windDir: (d120_noon + 25) % 360, tempC: Math.round(t_noon - 19.5) },
  ];

  // Sun
  const sun: SunInfo = {
    sunrise: daily[0]?.sunrise ?? "--:--",
    sunset: daily[0]?.sunset ?? "--:--",
    goldenHour: daily[0]?.sunset ?? "--:--",
    dayLengthH: 0,
  };

  // Thermal strength
  const avgCape = flightWindow.reduce((s, h) => s + h.cape, 0) / Math.max(flightWindow.length, 1);
  const avgThermalMs = flightWindow.reduce((s, h) => s + (h.thermalMs ?? 0), 0) / Math.max(flightWindow.length, 1);
  const thermalStrength =
    avgCape > 1500 ? "esplosiva" :
    avgCape > 600 ? "forte" :
    avgCape > 200 ? "moderata" : "debole";
  void avgThermalMs; // disponibile in hourly slots per uso nei componenti

  const alerts = buildAlerts(flightWindow.length ? flightWindow : todayHourly, avgCape);

  return {
    site,
    fetchedAt: now,
    current,
    hourly: todayHourly,
    allHourly: hourlySlots,
    daily,
    windgram,
    sun,
    alerts,
    todayBestHour,
    thermalStrength,
  };
}

// ── React Query hooks ────────────────────────────────────────────────────────

export function useWeather(site: LaunchSite) {
  return useQuery<WeatherData>({
    queryKey: ["weather", site.id],
    queryFn: () => fetchWeather(site),
    staleTime: 15 * 60 * 1000, // 15 min
    refetchInterval: 30 * 60 * 1000, // 30 min
    retry: 2,
  });
}

/** Lightweight ranking fetch: only wind + volability for sidebar */
async function fetchSiteRanking(site: LaunchSite): Promise<SiteRanking> {
  const params = new URLSearchParams({
    latitude: site.lat.toString(),
    longitude: site.lon.toString(),
    hourly: "wind_speed_10m,wind_direction_10m,wind_gusts_10m,cape,precipitation,cloud_cover,wind_speed_80m,wind_speed_120m",
    models: "icon_seamless",
    timezone: "Europe/Rome",
    wind_speed_unit: "kmh",
    forecast_days: "1",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error("fetch error");
  const raw = await res.json();

  const now = new Date();
  const nowH = now.getHours();
  const idx = Math.max(0, Math.min(nowH, raw.hourly.time.length - 1));

  const w = raw.hourly.wind_speed_10m[idx] ?? 0;
  const dir = raw.hourly.wind_direction_10m[idx] ?? 0;
  const gust = raw.hourly.wind_gusts_10m[idx] ?? 0;
  const cape = raw.hourly.cape[idx] ?? 0;
  const precip = raw.hourly.precipitation[idx] ?? 0;
  const cloud = raw.hourly.cloud_cover[idx] ?? 0;
  const w80 = raw.hourly.wind_speed_80m[idx] ?? 0;
  const shear = Math.abs(w80 - w);

  const vol = calcVolability(w, dir, gust, cape, shear, precip, cloud, site.launchBearing, site.maxWindKmh, site.minWindKmh);

  return {
    site,
    volability: vol,
    label: volLabel(vol),
    wind: `${Math.round(w)}`,
    loading: false,
  };
}

export function useAllSiteRankings(): SiteRanking[] {
  // Return one query per site, merged
  const queries = SITES.map(site => {
    // The error "Definition for rule 'react-hooks/rules-of-hooks' was not found"
    // is an ESLint error, not a TypeScript syntax error.
    // To fix it, we remove the ESLint directive disabling the rule.
    // However, if the `useQuery` call is indeed conditional or not at the top level
    // of a React function component or custom hook, then it *is* a React Hooks rule violation.
    // For this specific case, `useAllSiteRankings` *is* a custom hook, and the `map`
    // is being called inside it, which is the correct place for `useQuery`.
    // The `// eslint-disable-next-line react-hooks/rules-of-hooks` is usually added
    // when ESLint incorrectly flags a valid use case or when a temporary bypass is needed.
    // Removing it and assuming the setup is correct according to React Hooks rules.
    const { data, isLoading } = useQuery<SiteRanking>({
      queryKey: ["ranking", site.id],
      queryFn: () => fetchSiteRanking(site),
      staleTime: 15 * 60 * 1000,
      refetchInterval: 30 * 60 * 1000,
    });

    if (isLoading || !data) {
      return { site, volability: 0, label: "STOP" as const, wind: "--", loading: true };
    }
    return data;
  });

  return queries;
}
