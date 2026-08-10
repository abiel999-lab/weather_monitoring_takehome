export type Station = {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number | null;
  region: string;
  readings_count?: number;
  last_reading_at?: string | null;
};

export type Reading = {
  id: number;
  station_id: number;
  station?: Pick<Station, "id" | "code" | "name">;
  recorded_at: string;
  temperature_c: number;
  humidity_percent: number;
  rainfall_mm: number;
  wind_speed_mps: number;
};

export type DailyAverage = {
  date: string;
  avg_temperature_c: number;
  avg_humidity_percent: number;
  avg_rainfall_mm: number;
  total_rainfall_mm: number;
  avg_wind_speed_mps: number;
  sample_count: number;
};

export type AiInsight = {
  station_id: number;
  period_days: number;
  provider: string;
  summary: string;
  statistics: Record<string, { mean: number; min: number; max: number; stddev: number }>;
  trend?: Record<string, { direction: "up" | "down" | "stable"; delta: number }>;
  anomalies: Array<{
    metric: string;
    label: string;
    value: number;
    z_score: number;
    recorded_at: string;
  }>;
};

export type AiChatResponse = {
  provider: string;
  answer: string;
  context: {
    period_days: number;
    from?: string;
    to?: string;
    station_count: number;
    selected_station_id: number | null;
  };
};

export type Paginated<T> = {
  data: T[];
  links?: unknown;
  meta?: { current_page?: number; last_page?: number; total?: number };
};
