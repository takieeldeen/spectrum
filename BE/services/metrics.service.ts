import mongoose from "mongoose";
import { IMetric, Metric } from "../models/metric.model";
import plugModel from "../models/plug.model";
import { IMetricInput } from "../types/metric.type";

/** Truncates a Date down to the UTC top of the hour (e.g. 14:27:32 -> 14:00:00.000Z) */
function toHourSlot(d: Date): Date {
  return new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      0,
      0,
      0,
    ),
  );
}

/** Truncates a Date down to UTC midnight (e.g. 2026-10-28 14:27 -> 2026-10-28 00:00:00.000Z) */
function toDaySlot(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

export default class metricsService {
  /**
   * Registry mapping stripId to its last measured hourly metric
   */
  private static hourMetricRegistry: Map<string, IMetric> = new Map();

  /**
   * Registry mapping stripId to its last measured daily metric
   */
  private static dailyMetricRegistry: Map<string, IMetric> = new Map();

  /**
   * In-flight lock per stripId to serialize telemetry updates and prevent race conditions
   */
  private static inFlightLock: Map<string, Promise<void>> = new Map();

  /**
   * Fetches the latest metric row from the Metric model,
   * loads it to the corresponding registry, and returns the metric.
   */
  private static async getLatestMesurementDate(
    stripId: string,
    type: "hour" | "day" = "hour",
  ): Promise<IMetric | null> {
    const registry =
      type === "hour"
        ? metricsService.hourMetricRegistry
        : metricsService.dailyMetricRegistry;

    if (registry.has(stripId)) {
      return registry.get(stripId)!;
    }

    const latestMetric = await Metric.findOne({ stripId, type })
      .sort({ hourTimestamp: -1 })
      .lean();

    if (latestMetric) {
      const metricDoc = latestMetric as unknown as IMetric;
      registry.set(stripId, metricDoc);
      return metricDoc;
    }

    return null;
  }

  private static getMetricPayload(
    stripId: string,
    outlets: any,
    type: "hour" | "day" = "hour",
    slotTimestamp?: Date,
  ): IMetricInput {
    const now = new Date();
    const slot =
      slotTimestamp || (type === "hour" ? toHourSlot(now) : toDaySlot(now));

    const cumulativeKwh =
      (outlets?.outlet1?.energy_kwh || 0) +
      (outlets?.outlet2?.energy_kwh || 0) +
      (outlets?.outlet3?.energy_kwh || 0) +
      (outlets?.outlet4?.energy_kwh || 0);

    const newMetricPayload = {
      stripId,
      outlet1: outlets?.outlet1?.energy_kwh || 0,
      outlet2: outlets?.outlet2?.energy_kwh || 0,
      outlet3: outlets?.outlet3?.energy_kwh || 0,
      outlet4: outlets?.outlet4?.energy_kwh || 0,
      hourTimestamp: slot,
      type,
      kwh: 0,
      cumulativeKwh,
    };
    return newMetricPayload;
  }

  private static async addMetric(
    stripId: string,
    outlets: any,
    type: "hour" | "day" = "hour",
    slotTimestamp?: Date,
  ): Promise<IMetric> {
    const lastMetric = await this.getLatestMesurementDate(stripId, type);
    const cumulativeKwh =
      (outlets?.outlet1?.energy_kwh || 0) +
      (outlets?.outlet2?.energy_kwh || 0) +
      (outlets?.outlet3?.energy_kwh || 0) +
      (outlets?.outlet4?.energy_kwh || 0);

    const prevCumulative = lastMetric ? lastMetric.cumulativeKwh : 0;
    const kwh = Math.max(0, cumulativeKwh - prevCumulative);

    const maxCap = type === "hour" ? 24 : 30;
    const count = await Metric.countDocuments({ stripId, type });
    if (count >= maxCap) {
      const oldest = await Metric.findOne({ stripId, type })
        .sort({ hourTimestamp: 1 })
        .select("_id")
        .lean();
      if (oldest) {
        await Metric.findByIdAndDelete(oldest._id);
      }
    }

    const now = new Date();
    const slot =
      slotTimestamp || (type === "hour" ? toHourSlot(now) : toDaySlot(now));

    const newMetricPayload: IMetricInput = {
      stripId,
      outlet1: outlets?.outlet1?.energy_kwh || 0,
      outlet2: outlets?.outlet2?.energy_kwh || 0,
      outlet3: outlets?.outlet3?.energy_kwh || 0,
      outlet4: outlets?.outlet4?.energy_kwh || 0,
      hourTimestamp: slot,
      type,
      kwh,
      cumulativeKwh,
    };

    try {
      const created = await Metric.create(newMetricPayload);
      if (type === "hour") {
        this.hourMetricRegistry.set(stripId, created);
      } else {
        this.dailyMetricRegistry.set(stripId, created);
      }
      return created;
    } catch (err: any) {
      if (err?.code === 11000) {
        const existing = await Metric.findOne({ stripId, type })
          .sort({ hourTimestamp: -1 })
          .lean();
        if (existing) {
          const doc = existing as unknown as IMetric;
          if (type === "hour") {
            this.hourMetricRegistry.set(stripId, doc);
          } else {
            this.dailyMetricRegistry.set(stripId, doc);
          }
          return doc;
        }
      }
      throw err;
    }
  }

  private static async updateHourlyTelemetry(stripId: string, outlets?: any) {
    const now = new Date();
    const currentHourSlot = toHourSlot(now);
    const latestMeasurement = await metricsService.getLatestMesurementDate(
      stripId,
      "hour",
    ); // First Time to measure this strip
    if (!latestMeasurement) {
      const newMetricPayload = this.getMetricPayload(
        stripId,
        outlets,
        "hour",
        currentHourSlot,
      );
      try {
        const created = await Metric.create(newMetricPayload);
        this.hourMetricRegistry.set(stripId, created);
      } catch (err: any) {
        if (err?.code === 11000) {
          const existing = await Metric.findOne({ stripId, type: "hour" })
            .sort({ hourTimestamp: -1 })
            .lean();
          if (existing) {
            this.hourMetricRegistry.set(stripId, existing as unknown as IMetric);
          }
        } else {
          throw err;
        }
      }
    } else {
      const lastHourSlot = toHourSlot(
        new Date(latestMeasurement.hourTimestamp),
      );
      // New calendar hour reached
      if (currentHourSlot.getTime() > lastHourSlot.getTime()) {
        await this.addMetric(stripId, outlets, "hour", currentHourSlot);
      }
    }
  }

  private static async updateDailyTelemetry(stripId: string, outlets?: any) {
    const now = new Date();
    const currentDaySlot = toDaySlot(now);
    const latestMeasurement = await metricsService.getLatestMesurementDate(
      stripId,
      "day",
    ); // First Time to measure this strip
    if (!latestMeasurement) {
      const newMetricPayload = this.getMetricPayload(
        stripId,
        outlets,
        "day",
        currentDaySlot,
      );
      try {
        const created = await Metric.create(newMetricPayload);
        this.dailyMetricRegistry.set(stripId, created);
      } catch (err: any) {
        if (err?.code === 11000) {
          const existing = await Metric.findOne({ stripId, type: "day" })
            .sort({ hourTimestamp: -1 })
            .lean();
          if (existing) {
            this.dailyMetricRegistry.set(stripId, existing as unknown as IMetric);
          }
        } else {
          throw err;
        }
      }
    } else {
      const lastDaySlot = toDaySlot(new Date(latestMeasurement.hourTimestamp));
      // New calendar day reached
      if (currentDaySlot.getTime() > lastDaySlot.getTime()) {
        await this.addMetric(stripId, outlets, "day", currentDaySlot);
      }
    }
  }

  private static getLatest12Hours(metrics: IMetric[]) {
    // Base reference is always the current hour
    const baseDate = toHourSlot(new Date());

    // Group available metrics by normalized hour slot timestamp
    const metricsBySlot = new Map<number, IMetric[]>();
    if (Array.isArray(metrics)) {
      for (const m of metrics) {
        if (!m?.hourTimestamp) continue;
        const slotMs = toHourSlot(new Date(m.hourTimestamp)).getTime();
        const list = metricsBySlot.get(slotMs) || [];
        list.push(m);
        metricsBySlot.set(slotMs, list);
      }
    }

    // Generate the 12 hours counting backward from baseDate
    return Array.from({ length: 12 }, (_, i) => {
      const slotDate = new Date(baseDate.getTime() - i * 60 * 60 * 1000);
      const slotMetrics = metricsBySlot.get(slotDate.getTime());

      if (slotMetrics && slotMetrics.length > 0) {
        if (slotMetrics.length === 1) {
          return slotMetrics[0];
        }
        // If multiple strips have data for this hour, combine them
        return {
          _id: `combined-${slotDate.getTime()}`,
          hourTimestamp: slotDate,
          type: "hour" as const,
          kwh: slotMetrics.reduce((sum, m) => sum + (m.kwh || 0), 0),
          cumulativeKwh: slotMetrics.reduce(
            (sum, m) => sum + (m.cumulativeKwh || 0),
            0,
          ),
          outlet1: slotMetrics.reduce((sum, m) => sum + (m.outlet1 || 0), 0),
          outlet2: slotMetrics.reduce((sum, m) => sum + (m.outlet2 || 0), 0),
          outlet3: slotMetrics.reduce((sum, m) => sum + (m.outlet3 || 0), 0),
          outlet4: slotMetrics.reduce((sum, m) => sum + (m.outlet4 || 0), 0),
        };
      }

      // Zero placeholder when no record exists for this hour
      return {
        _id: `zeroObject-${i}`,
        hourTimestamp: slotDate,
        type: "hour" as const,
        kwh: 0,
        cumulativeKwh: 0,
        outlet1: 0,
        outlet2: 0,
        outlet3: 0,
        outlet4: 0,
      };
    });
  }
  private static getLatest7Days(metrics: IMetric[]) {
    // Base reference is always the current day (UTC midnight)
    const baseDate = toDaySlot(new Date());

    // Group available metrics by normalized day slot timestamp
    const metricsBySlot = new Map<number, IMetric[]>();
    if (Array.isArray(metrics)) {
      for (const m of metrics) {
        if (!m?.hourTimestamp) continue;
        const slotMs = toDaySlot(new Date(m.hourTimestamp)).getTime();
        const list = metricsBySlot.get(slotMs) || [];
        list.push(m);
        metricsBySlot.set(slotMs, list);
      }
    }

    // Generate the 7 days counting backward from baseDate
    return Array.from({ length: 7 }, (_, i) => {
      const slotDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
      const slotMetrics = metricsBySlot.get(slotDate.getTime());

      if (slotMetrics && slotMetrics.length > 0) {
        if (slotMetrics.length === 1) {
          return slotMetrics[0];
        }
        // If multiple strips have data for this day, combine them
        return {
          _id: `combined-${slotDate.getTime()}`,
          hourTimestamp: slotDate,
          type: "day" as const,
          kwh: slotMetrics.reduce((sum, m) => sum + (m.kwh || 0), 0),
          cumulativeKwh: slotMetrics.reduce(
            (sum, m) => sum + (m.cumulativeKwh || 0),
            0,
          ),
          outlet1: slotMetrics.reduce((sum, m) => sum + (m.outlet1 || 0), 0),
          outlet2: slotMetrics.reduce((sum, m) => sum + (m.outlet2 || 0), 0),
          outlet3: slotMetrics.reduce((sum, m) => sum + (m.outlet3 || 0), 0),
          outlet4: slotMetrics.reduce((sum, m) => sum + (m.outlet4 || 0), 0),
        };
      }

      // Zero placeholder when no record exists for this day
      return {
        _id: `zeroObject-${i}`,
        hourTimestamp: slotDate,
        type: "day" as const,
        kwh: 0,
        cumulativeKwh: 0,
        outlet1: 0,
        outlet2: 0,
        outlet3: 0,
        outlet4: 0,
      };
    });
  }

  public static async updateLiveTelemetry(
    stripId: string,
    outlets?: any,
    voltage?: number,
  ): Promise<void> {
    const prevLock = this.inFlightLock.get(stripId) || Promise.resolve();
    const currentRun = (async () => {
      await prevLock.catch(() => {});
      try {
        await this.updateHourlyTelemetry(stripId, outlets);
        await this.updateDailyTelemetry(stripId, outlets);
      } catch (err: any) {
        if (err?.code !== 11000) {
          console.error("Error updating telemetry metrics:", err);
        }
      }
    })();

    this.inFlightLock.set(stripId, currentRun);
    await currentRun;
    if (this.inFlightLock.get(stripId) === currentRun) {
      this.inFlightLock.delete(stripId);
    }
  }

  public static async getUserDayGraph(userId: string, stripId?: string) {
    let stripIds: mongoose.Types.ObjectId[] = [];

    if (stripId) {
      stripIds = [new mongoose.Types.ObjectId(stripId)];
    } else {
      const userStrips = await plugModel
        .find({ user: new mongoose.Types.ObjectId(userId) })
        .select("_id")
        .lean();
      stripIds = userStrips.map((s) => s._id);
    }

    const metrics = await Metric.find({
      stripId: { $in: stripIds },
      type: "hour",
    })
      .lean()
      .sort({
        hourTimestamp: -1,
      });

    const last12Hours = this.getLatest12Hours(metrics as unknown as IMetric[]);
    return last12Hours;
  }
  public static async getUserWeekGraph(userId: string, stripId?: string) {
    let stripIds: mongoose.Types.ObjectId[] = [];

    if (stripId) {
      stripIds = [new mongoose.Types.ObjectId(stripId)];
    } else {
      const userStrips = await plugModel
        .find({ user: new mongoose.Types.ObjectId(userId) })
        .select("_id")
        .lean();
      stripIds = userStrips.map((s) => s._id);
    }

    const metrics = await Metric.find({
      stripId: { $in: stripIds },
      type: "day",
    })
      .lean()
      .sort({
        hourTimestamp: -1,
      });

    const last7Days = this.getLatest7Days(metrics as unknown as IMetric[]);
    return last7Days;
  }

  private static getLatest30Days(metrics: IMetric[]) {
    // Base reference is always the current day (UTC midnight)
    const baseDate = toDaySlot(new Date());

    // Group available metrics by normalized day slot timestamp
    const metricsBySlot = new Map<number, IMetric[]>();
    if (Array.isArray(metrics)) {
      for (const m of metrics) {
        if (!m?.hourTimestamp) continue;
        const slotMs = toDaySlot(new Date(m.hourTimestamp)).getTime();
        const list = metricsBySlot.get(slotMs) || [];
        list.push(m);
        metricsBySlot.set(slotMs, list);
      }
    }

    // Generate the 30 days counting backward from baseDate
    return Array.from({ length: 30 }, (_, i) => {
      const slotDate = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
      const slotMetrics = metricsBySlot.get(slotDate.getTime());

      if (slotMetrics && slotMetrics.length > 0) {
        if (slotMetrics.length === 1) {
          return slotMetrics[0];
        }
        // If multiple strips have data for this day, combine them
        return {
          _id: `combined-${slotDate.getTime()}`,
          hourTimestamp: slotDate,
          type: "day" as const,
          kwh: slotMetrics.reduce((sum, m) => sum + (m.kwh || 0), 0),
          cumulativeKwh: slotMetrics.reduce(
            (sum, m) => sum + (m.cumulativeKwh || 0),
            0,
          ),
          outlet1: slotMetrics.reduce((sum, m) => sum + (m.outlet1 || 0), 0),
          outlet2: slotMetrics.reduce((sum, m) => sum + (m.outlet2 || 0), 0),
          outlet3: slotMetrics.reduce((sum, m) => sum + (m.outlet3 || 0), 0),
          outlet4: slotMetrics.reduce((sum, m) => sum + (m.outlet4 || 0), 0),
        };
      }

      // Zero placeholder when no record exists for this day
      return {
        _id: `zeroObject-${i}`,
        hourTimestamp: slotDate,
        type: "day" as const,
        kwh: 0,
        cumulativeKwh: 0,
        outlet1: 0,
        outlet2: 0,
        outlet3: 0,
        outlet4: 0,
      };
    });
  }

  public static async getUserMonthGraph(userId: string, stripId?: string) {
    let stripIds: mongoose.Types.ObjectId[] = [];

    if (stripId) {
      stripIds = [new mongoose.Types.ObjectId(stripId)];
    } else {
      const userStrips = await plugModel
        .find({ user: new mongoose.Types.ObjectId(userId) })
        .select("_id")
        .lean();
      stripIds = userStrips.map((s) => s._id);
    }

    const metrics = await Metric.find({
      stripId: { $in: stripIds },
      type: "day",
    })
      .lean()
      .sort({
        hourTimestamp: -1,
      });

    const last30Days = this.getLatest30Days(metrics as unknown as IMetric[]);
    return last30Days;
  }
}
