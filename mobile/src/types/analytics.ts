export interface IStripSummary {
  stripId: string;
  name: string;
  serialNumber: string;
  roomId?: string;
  todayKwh: number;
  todayCost: number;
  weekKwh: number;
  monthKwh: number;
  avgWatts: number;
  peakWatts: number;
}

export interface IAnalyticsDayPoint {
  hour: number;
  label: string;
  avgWatts: number;
  maxWatts: number;
  kwh: number;
  cost: number;
}

export interface IAnalyticsDayResponse {
  period: "day";
  date: string;
  totalKwh: number;
  peakWatts: number;
  avgWatts: number;
  estimatedCost: number;
  points: IAnalyticsDayPoint[];
  strips?: {
    stripId: string;
    name: string;
    kwh: number;
    percentage: number;
    avgWatts: number;
    cost: number;
  }[];
}

export interface IAnalyticsWeekDay {
  id: string;
  date: string;
  dayName: string;
  value: number; // in kWh
  heightRatio: number; // 0 to 1
  avgWatts: number;
  cost: number;
  isToday?: boolean;
}

export interface IAnalyticsWeekResponse {
  period: "week";
  totalKwh: number;
  estimatedCost: number;
  data: IAnalyticsWeekDay[];
  strips?: {
    stripId: string;
    name: string;
    kwh: number;
    percentage: number;
    cost: number;
  }[];
}

export interface IAnalyticsBreakdownOutlet {
  outletNumber: number;
  name: string;
  kwh: number;
  percentage: number;
  avgWatts: number;
}

export interface IAnalyticsBreakdownResponse {
  period: "day" | "week" | "month";
  totalKwh: number;
  outlets: IAnalyticsBreakdownOutlet[];
}
