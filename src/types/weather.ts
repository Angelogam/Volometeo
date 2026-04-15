export interface LaunchSite {
  id: string;
  name: string;
  icon: string;
  lat: number;
  lon: number;
  altitude: number;
  zone: string;
  region: "CN" | "TO" | "AL" | "BI" | "VB";
  orientation: string; // preferred wind direction e.g. "N-NE"
  maxWindKmh: number;
  minWindKmh: number;
  /** compass degrees of the ideal launch direction */
  launchBearing: number;
}

export interface HourlySlot {
  hour: number; // 0–23
  time: string; // ISO string
  tempC: number;
  dewpointC: number;
  windKmh: number;          // 10m
  windDir: number;          // degrees 10m
  windDirLabel: string;
  wind80Kmh: number;        // 80m
  windDir80: number;
  wind120Kmh: number;       // 120m
  windDir120: number;
  gust: number;
  cloudCover: number;
  precip: number;
  cape: number;
  shear: number;            // km/h diff 10m vs 80m
  shear120: number;         // km/h diff 10m vs 120m
  crosswind: number;        // crosswind component vs launch bearing
  volability: number;       // 1=perfetto, 10=pericolo
  volLabel: "GO" | "CAUTION" | "STOP";
  thermalBase: number;      // base cumulo Espy (m asl)
  thermalMs: number;        // forza termica stimata m/s
  boundaryLayerHeight: number; // altezza strato limite (m agl)
  liftedIndex: number;      // indice sollevamento (neg = instabile)
  weatherCode: number;
  isFlightWindow: boolean;  // 09–19h
}

export interface DailyDay {
  date: string;
  label: string;
  tempMax: number;
  tempMin: number;
  windMax: number;
  precipSum: number;
  weatherCode: number;
  volability: number;
  volLabel: "GO" | "CAUTION" | "STOP";
  capeMax: number;
  sunrise: string;
  sunset: string;
}

export interface WindgramLevel {
  alt: number; // metres asl
  windKmh: number;
  windDir: number;
  tempC: number;
}

export interface SunInfo {
  sunrise: string; // HH:MM
  sunset: string;
  goldenHour: string;
  dayLengthH: number;
}

export interface Alert {
  id: string;
  type: "danger" | "warning" | "info";
  icon: string;
  title: string;
  body: string;
}

export interface WeatherData {
  site: LaunchSite;
  fetchedAt: Date;
  current: HourlySlot;
  hourly: HourlySlot[];       // oggi
  allHourly: HourlySlot[];   // tutti i 7 giorni
  daily: DailyDay[];
  windgram: WindgramLevel[];
  sun: SunInfo;
  alerts: Alert[];
  todayBestHour: HourlySlot | null;
  thermalStrength: "debole" | "moderata" | "forte" | "esplosiva";
}

export interface SiteRanking {
  site: LaunchSite;
  volability: number;
  label: "GO" | "CAUTION" | "STOP";
  wind: string;
  loading: boolean;
}
