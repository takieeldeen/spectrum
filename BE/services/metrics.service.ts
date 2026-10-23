import mongoose from "mongoose";
import MetricBucket from "../models/metric-bucket.model";
import MetricHourly from "../models/metric-hourly.model";
import MetricDaily from "../models/metric-daily.model";
import Plug from "../models/plug.model";

export interface TelemetryOutletInput {
  power_W: number;
  energy_kwh: number;
  current_A?: number;
  on?: boolean;
}

interface BufferEntry {
  stripId: string;
  outletNumber: number;
  bucketTimestamp: Date;
  count: number;
  sumWatts: number;
  maxWatts: number;
  minWatts: number;
  firstEnergyKwh: number;
  latestEnergyKwh: number;
  voltageSum: number;
}

export class MetricsService {
  private buffer = new Map<string, BufferEntry>();
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 30000; // Flush micro-batches every 30 seconds
  private readonly DEFAULT_TARIFF_RATE = 0.68; // EGP per kWh

  constructor() {
    this.startAutoFlush();
  }

  private startAutoFlush() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        console.error("❌ Metrics buffer auto-flush error:", err);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Rounds a date down to the nearest 5-minute bucket floor
   */
  public get5MinBucketTime(date: Date = new Date()): Date {
    const ms = 5 * 60 * 1000;
    return new Date(Math.floor(date.getTime() / ms) * ms);
  }

  /**
   * Records raw telemetry from TCP socket in the in-memory sliding buffer.
   * Throttles database writes into 5-minute pre-aggregated buckets.
   */
  public recordTelemetry(
    stripId: string,
    outlets: Record<string, TelemetryOutletInput>,
    voltage: number = 220,
    timestamp: Date = new Date()
  ) {
    if (!stripId || !outlets) return;

    const bucketTime = this.get5MinBucketTime(timestamp);

    let totalWatts = 0;
    let totalLatestEnergy = 0;
    let totalFirstEnergy = 0;

    // Process each individual outlet (1 to 4)
    for (let i = 1; i <= 4; i++) {
      const outletData = outlets[`outlet${i}`];
      if (!outletData) continue;

      const watts = Math.max(0, outletData.power_W || 0);
      const energy = Math.max(0, outletData.energy_kwh || 0);
      totalWatts += watts;
      totalLatestEnergy += energy;

      const key = `${stripId}:${i}:${bucketTime.getTime()}`;
      const existing = this.buffer.get(key);

      if (existing) {
        existing.count += 1;
        existing.sumWatts += watts;
        existing.maxWatts = Math.max(existing.maxWatts, watts);
        existing.minWatts = Math.min(existing.minWatts, watts);
        existing.latestEnergyKwh = energy;
        existing.voltageSum += voltage;
      } else {
        this.buffer.set(key, {
          stripId,
          outletNumber: i,
          bucketTimestamp: bucketTime,
          count: 1,
          sumWatts: watts,
          maxWatts: watts,
          minWatts: watts,
          firstEnergyKwh: energy,
          latestEnergyKwh: energy,
          voltageSum: voltage,
        });
      }
    }

    // Process total strip metrics (outletNumber = 0)
    const totalKey = `${stripId}:0:${bucketTime.getTime()}`;
    const existingTotal = this.buffer.get(totalKey);

    if (existingTotal) {
      existingTotal.count += 1;
      existingTotal.sumWatts += totalWatts;
      existingTotal.maxWatts = Math.max(existingTotal.maxWatts, totalWatts);
      existingTotal.minWatts = Math.min(existingTotal.minWatts, totalWatts);
      existingTotal.latestEnergyKwh = totalLatestEnergy;
      existingTotal.voltageSum += voltage;
    } else {
      this.buffer.set(totalKey, {
        stripId,
        outletNumber: 0,
        bucketTimestamp: bucketTime,
        count: 1,
        sumWatts: totalWatts,
        maxWatts: totalWatts,
        minWatts: totalWatts,
        firstEnergyKwh: totalLatestEnergy,
        latestEnergyKwh: totalLatestEnergy,
        voltageSum: voltage,
      });
    }

    // If buffer gets too large (> 50,000 entries), trigger an early asynchronous flush
    if (this.buffer.size > 50000) {
      this.flush().catch((err) => {
        console.error("Early flush error:", err);
      });
    }
  }

  /**
   * Flushes the in-memory buffer to MongoDB using bulkWrite
   */
  public async flush(): Promise<number> {
    if (this.buffer.size === 0) return 0;

    const entries = Array.from(this.buffer.values());
    this.buffer.clear(); // Clear immediately so incoming traffic populates a fresh buffer

    const bulkOps = entries.map((entry) => {
      const avgWatts = Math.round((entry.sumWatts / entry.count) * 100) / 100;
      const deltaKwh = Math.max(0, entry.latestEnergyKwh - entry.firstEnergyKwh);
      const voltageAvg = Math.round(entry.voltageSum / entry.count);

      return {
        updateOne: {
          filter: {
            stripId: new mongoose.Types.ObjectId(entry.stripId),
            outletNumber: entry.outletNumber,
            timestamp: entry.bucketTimestamp,
          },
          update: {
            $set: {
              energyKwhEnd: entry.latestEnergyKwh,
              voltageAvg,
            },
            $inc: {
              count: entry.count,
              sumWatts: entry.sumWatts,
              deltaKwh: deltaKwh,
            },
            $max: { maxWatts: entry.maxWatts },
            $min: { minWatts: entry.minWatts },
            $setOnInsert: {
              avgWatts: avgWatts,
            },
          },
          upsert: true,
        },
      };
    });

    try {
      const result = await MetricBucket.bulkWrite(bulkOps, { ordered: false });
      return result.upsertedCount + result.modifiedCount;
    } catch (err) {
      console.error("Error writing bulk metrics buckets:", err);
      return 0;
    }
  }

  /**
   * Pre-aggregates an hour's worth of 5-minute buckets into MetricHourly
   */
  public async rollupHourly(targetHour: Date = new Date(Date.now() - 3600000)): Promise<number> {
    const startOfHour = new Date(targetHour);
    startOfHour.setMinutes(0, 0, 0);
    const endOfHour = new Date(startOfHour.getTime() + 3600000);

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startOfHour, $lt: endOfHour },
        },
      },
      {
        $group: {
          _id: {
            stripId: "$stripId",
            outletNumber: "$outletNumber",
          },
          avgWatts: { $avg: "$avgWatts" },
          maxWatts: { $max: "$maxWatts" },
          minWatts: { $min: "$minWatts" },
          totalKwh: { $sum: "$deltaKwh" },
          samplesCount: { $sum: "$count" },
        },
      },
    ];

    const aggregates = await MetricBucket.aggregate(pipeline);
    if (!aggregates || aggregates.length === 0) return 0;

    const bulkOps = aggregates.map((item) => {
      const totalKwh = Math.round((item.totalKwh || 0) * 1000) / 1000;
      const estimatedCost = Math.round(totalKwh * this.DEFAULT_TARIFF_RATE * 100) / 100;

      return {
        updateOne: {
          filter: {
            stripId: item._id.stripId,
            outletNumber: item._id.outletNumber,
            hourTimestamp: startOfHour,
          },
          update: {
            $set: {
              avgWatts: Math.round(item.avgWatts * 100) / 100,
              maxWatts: item.maxWatts,
              minWatts: item.minWatts,
              totalKwh,
              estimatedCost,
              samplesCount: item.samplesCount,
            },
          },
          upsert: true,
        },
      };
    });

    const res = await MetricHourly.bulkWrite(bulkOps, { ordered: false });
    return res.upsertedCount + res.modifiedCount;
  }

  /**
   * Pre-aggregates 24 hours into MetricDaily
   */
  public async rollupDaily(targetDate: Date = new Date(Date.now() - 86400000)): Promise<number> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const dateStr = startOfDay.toISOString().split("T")[0];

    const pipeline = [
      {
        $match: {
          hourTimestamp: { $gte: startOfDay, $lt: endOfDay },
        },
      },
      {
        $group: {
          _id: {
            stripId: "$stripId",
            outletNumber: "$outletNumber",
          },
          avgWatts: { $avg: "$avgWatts" },
          peakWatts: { $max: "$maxWatts" },
          totalKwh: { $sum: "$totalKwh" },
        },
      },
    ];

    const aggregates = await MetricHourly.aggregate(pipeline);
    if (!aggregates || aggregates.length === 0) return 0;

    const bulkOps = aggregates.map((item) => {
      const totalKwh = Math.round((item.totalKwh || 0) * 1000) / 1000;
      const estimatedCost = Math.round(totalKwh * this.DEFAULT_TARIFF_RATE * 100) / 100;

      return {
        updateOne: {
          filter: {
            stripId: item._id.stripId,
            outletNumber: item._id.outletNumber,
            date: dateStr,
          },
          update: {
            $set: {
              dateTimestamp: startOfDay,
              avgWatts: Math.round(item.avgWatts * 100) / 100,
              peakWatts: item.peakWatts,
              totalKwh,
              estimatedCost,
            },
          },
          upsert: true,
        },
      };
    });

    const res = await MetricDaily.bulkWrite(bulkOps, { ordered: false });
    return res.upsertedCount + res.modifiedCount;
  }

  /**
   * Day Graph Query: Fetches 24 hourly points in < 5ms
   */
  public async getDayGraph(stripId: string, outletNumber: number = 0, date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const hourlyRecords = await MetricHourly.find({
      stripId: new mongoose.Types.ObjectId(stripId),
      outletNumber,
      hourTimestamp: { $gte: startOfDay, $lt: endOfDay },
    })
      .sort({ hourTimestamp: 1 })
      .lean();

    // Map into 24-hour array (0 to 23)
    const points = Array.from({ length: 24 }).map((_, hour) => {
      const found = hourlyRecords.find(
        (r) => new Date(r.hourTimestamp).getHours() === hour
      );
      return {
        hour,
        label: `${hour % 12 || 12} ${hour >= 12 ? "م" : "ص"}`,
        avgWatts: found ? found.avgWatts : 0,
        maxWatts: found ? found.maxWatts : 0,
        kwh: found ? found.totalKwh : 0,
        cost: found ? found.estimatedCost : 0,
      };
    });

    const totalKwh = points.reduce((acc, p) => acc + p.kwh, 0);
    const peakWatts = Math.max(...points.map((p) => p.maxWatts), 0);
    const avgWatts = points.reduce((acc, p) => acc + p.avgWatts, 0) / (points.filter(p => p.avgWatts > 0).length || 1);

    return {
      period: "day",
      date: startOfDay.toISOString().split("T")[0],
      totalKwh: Math.round(totalKwh * 1000) / 1000,
      peakWatts: Math.round(peakWatts),
      avgWatts: Math.round(avgWatts),
      estimatedCost: Math.round(totalKwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
      points,
    };
  }

  /**
   * Week Graph Query: Fetches 7 daily points in < 2ms
   */
  public async getWeekGraph(stripId: string, outletNumber: number = 0) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);

    const dailyRecords = await MetricDaily.find({
      stripId: new mongoose.Types.ObjectId(stripId),
      outletNumber,
      dateTimestamp: { $gte: sevenDaysAgo, $lte: today },
    })
      .sort({ dateTimestamp: 1 })
      .lean();

    const arabicDays = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

    // Generate past 7 days chronologically
    const points = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const dayIndex = d.getDay();
      const dayName = arabicDays[dayIndex];

      const found = dailyRecords.find((r) => r.date === dateStr);
      const kwh = found ? found.totalKwh : 0;

      return {
        id: `day-${i}`,
        date: dateStr,
        dayName,
        value: kwh,
        avgWatts: found ? found.avgWatts : 0,
        cost: found ? found.estimatedCost : 0,
        isToday: i === 6,
      };
    });

    const maxValue = Math.max(...points.map((p) => p.value), 0.01);
    const pointsWithRatio = points.map((p) => ({
      ...p,
      heightRatio: Math.max(0.1, Math.min(1, p.value / maxValue)),
    }));

    const totalKwh = points.reduce((acc, p) => acc + p.value, 0);

    return {
      period: "week",
      totalKwh: Math.round(totalKwh * 1000) / 1000,
      estimatedCost: Math.round(totalKwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
      data: pointsWithRatio,
    };
  }

  /**
   * Month Graph Query: Fetches 30 days grouped into 4 weekly intervals in < 3ms
   */
  public async getMonthGraph(stripId: string, outletNumber: number = 0) {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);

    const dailyRecords = await MetricDaily.find({
      stripId: new mongoose.Types.ObjectId(stripId),
      outletNumber,
      dateTimestamp: { $gte: thirtyDaysAgo, $lte: today },
    })
      .sort({ dateTimestamp: 1 })
      .lean();

    // Group into 4 quarters
    const quarters = [
      { id: "q1", label: "أسبوع 1", totalKwh: 0, daysCount: 0 },
      { id: "q2", label: "أسبوع 2", totalKwh: 0, daysCount: 0 },
      { id: "q3", label: "أسبوع 3", totalKwh: 0, daysCount: 0 },
      { id: "q4", label: "الآن", totalKwh: 0, daysCount: 0 },
    ];

    dailyRecords.forEach((record, index) => {
      const qIndex = Math.min(3, Math.floor(index / 8));
      quarters[qIndex].totalKwh += record.totalKwh || 0;
      quarters[qIndex].daysCount += 1;
    });

    const totalKwh = dailyRecords.reduce((acc, r) => acc + (r.totalKwh || 0), 0);

    return {
      period: "month",
      totalKwh: Math.round(totalKwh * 1000) / 1000,
      estimatedCost: Math.round(totalKwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
      quarters: quarters.map((q) => ({
        ...q,
        totalKwh: Math.round(q.totalKwh * 100) / 100,
      })),
      daily: dailyRecords,
    };
  }

  /**
   * Consumption Breakdown Query: Computes outlet-by-outlet power & energy share
   */
  public async getBreakdown(stripId: string, period: "day" | "week" | "month" = "day") {
    let startDate: Date;
    const now = new Date();

    if (period === "day") {
      startDate = new Date(now.getTime() - 86400000);
    } else if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 86400000);
    } else {
      startDate = new Date(now.getTime() - 30 * 86400000);
    }

    const outletRecords = await MetricHourly.aggregate([
      {
        $match: {
          stripId: new mongoose.Types.ObjectId(stripId),
          outletNumber: { $in: [1, 2, 3, 4] },
          hourTimestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$outletNumber",
          totalKwh: { $sum: "$totalKwh" },
          avgWatts: { $avg: "$avgWatts" },
          maxWatts: { $max: "$maxWatts" },
        },
      },
    ]);

    const totalEnergy = outletRecords.reduce((acc, o) => acc + (o.totalKwh || 0), 0) || 0.001;

    const outlets = [1, 2, 3, 4].map((outletNum) => {
      const found = outletRecords.find((o) => o._id === outletNum);
      const kwh = found ? Math.round(found.totalKwh * 1000) / 1000 : 0;
      const percentage = Math.round((kwh / totalEnergy) * 100);

      return {
        outletNumber: outletNum,
        name: `مخرج ${outletNum}`,
        kwh,
        percentage,
        avgWatts: found ? Math.round(found.avgWatts) : 0,
      };
    });

    return {
      period,
      totalKwh: Math.round(totalEnergy * 1000) / 1000,
      outlets,
    };
  }

  /**
   * User Day Graph: Aggregates across ALL strips owned by the user
   * Returns combined 24-hour curve + per-strip breakdown list
   */
  public async getUserDayGraph(userId: string, date: Date = new Date()) {
    const userPlugs = await Plug.find({ user: new mongoose.Types.ObjectId(userId) })
      .select("_id name arabicName")
      .lean();

    if (!userPlugs || userPlugs.length === 0) {
      return {
        period: "day",
        totalKwh: 0,
        peakWatts: 0,
        avgWatts: 0,
        estimatedCost: 0,
        points: Array.from({ length: 24 }).map((_, hour) => ({
          hour,
          label: `${hour % 12 || 12} ${hour >= 12 ? "م" : "ص"}`,
          avgWatts: 0,
          maxWatts: 0,
          kwh: 0,
          cost: 0,
        })),
        strips: [],
      };
    }

    const stripIds = userPlugs.map((p) => p._id);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    // Fetch total-strip hourly records (outletNumber: 0) for all user's strips
    const hourlyRecords = await MetricHourly.find({
      stripId: { $in: stripIds },
      outletNumber: 0,
      hourTimestamp: { $gte: startOfDay, $lt: endOfDay },
    }).lean();

    // Group into 24-hour points combining all strips
    const points = Array.from({ length: 24 }).map((_, hour) => {
      const hourRecords = hourlyRecords.filter(
        (r) => new Date(r.hourTimestamp).getHours() === hour
      );

      const kwh = hourRecords.reduce((acc, r) => acc + (r.totalKwh || 0), 0);
      const avgWatts = hourRecords.reduce((acc, r) => acc + (r.avgWatts || 0), 0);
      const maxWatts = hourRecords.reduce((acc, r) => acc + (r.maxWatts || 0), 0);
      const cost = Math.round(kwh * this.DEFAULT_TARIFF_RATE * 100) / 100;

      return {
        hour,
        label: `${hour % 12 || 12} ${hour >= 12 ? "م" : "ص"}`,
        avgWatts: Math.round(avgWatts * 10) / 10,
        maxWatts: Math.round(maxWatts * 10) / 10,
        kwh: Math.round(kwh * 1000) / 1000,
        cost,
      };
    });

    const totalKwh = Math.round(points.reduce((acc, p) => acc + p.kwh, 0) * 1000) / 1000;
    const peakWatts = Math.max(...points.map((p) => p.maxWatts), 0);
    const avgWatts = Math.round(points.reduce((acc, p) => acc + p.avgWatts, 0) / 24);

    // Compute per-strip breakdown
    const strips = userPlugs.map((plug) => {
      const records = hourlyRecords.filter(
        (r) => r.stripId.toString() === plug._id.toString()
      );
      const stripKwh = Math.round(records.reduce((acc, r) => acc + (r.totalKwh || 0), 0) * 1000) / 1000;
      const percentage = totalKwh > 0 ? Math.round((stripKwh / totalKwh) * 100) : 0;
      const stripAvgWatts = Math.round(
        records.reduce((acc, r) => acc + (r.avgWatts || 0), 0) / (records.length || 1)
      );

      return {
        stripId: plug._id,
        name: plug.arabicName || plug.name,
        kwh: stripKwh,
        percentage,
        avgWatts: stripAvgWatts,
        cost: Math.round(stripKwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
      };
    });

    return {
      period: "day",
      date: startOfDay.toISOString().split("T")[0],
      totalKwh,
      peakWatts: Math.round(peakWatts),
      avgWatts,
      estimatedCost: Math.round(totalKwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
      points,
      strips,
    };
  }

  /**
   * User Week Graph: Aggregates across ALL strips owned by the user
   * Returns combined 7-day curve + per-strip comparison
   */
  public async getUserWeekGraph(userId: string) {
    const userPlugs = await Plug.find({ user: new mongoose.Types.ObjectId(userId) })
      .select("_id name arabicName")
      .lean();

    if (!userPlugs || userPlugs.length === 0) {
      return {
        period: "week",
        totalKwh: 0,
        estimatedCost: 0,
        data: [],
        strips: [],
      };
    }

    const stripIds = userPlugs.map((p) => p._id);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);

    const dailyRecords = await MetricDaily.find({
      stripId: { $in: stripIds },
      outletNumber: 0,
      dateTimestamp: { $gte: sevenDaysAgo, $lte: today },
    }).lean();

    const arabicDays = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

    // 7 days combined
    const points = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const dateStr = d.toISOString().split("T")[0];
      const dayIndex = d.getDay();
      const dayName = arabicDays[dayIndex];

      const records = dailyRecords.filter((r) => r.date === dateStr);
      const kwh = Math.round(records.reduce((acc, r) => acc + (r.totalKwh || 0), 0) * 1000) / 1000;
      const avgWatts = Math.round(records.reduce((acc, r) => acc + (r.avgWatts || 0), 0));

      return {
        id: `day-${i}`,
        date: dateStr,
        dayName,
        value: kwh,
        avgWatts,
        cost: Math.round(kwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
        isToday: i === 6,
      };
    });

    const maxValue = Math.max(...points.map((p) => p.value), 0.01);
    const pointsWithRatio = points.map((p) => ({
      ...p,
      heightRatio: Math.max(0.1, Math.min(1, p.value / maxValue)),
    }));

    const totalKwh = Math.round(points.reduce((acc, p) => acc + p.value, 0) * 1000) / 1000;

    // Per-strip summary for the week
    const strips = userPlugs.map((plug) => {
      const records = dailyRecords.filter(
        (r) => r.stripId.toString() === plug._id.toString()
      );
      const stripKwh = Math.round(records.reduce((acc, r) => acc + (r.totalKwh || 0), 0) * 1000) / 1000;
      const percentage = totalKwh > 0 ? Math.round((stripKwh / totalKwh) * 100) : 0;

      return {
        stripId: plug._id,
        name: plug.arabicName || plug.name,
        kwh: stripKwh,
        percentage,
        cost: Math.round(stripKwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
      };
    });

    return {
      period: "week",
      totalKwh,
      estimatedCost: Math.round(totalKwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
      data: pointsWithRatio,
      strips,
    };
  }

  /**
   * User Strips Summary: Returns a dashboard overview of ALL strips owned by the user
   */
  public async getUserStripsSummary(userId: string) {
    const userPlugs = await Plug.find({ user: new mongoose.Types.ObjectId(userId) })
      .select("_id name arabicName serialNumber roomId")
      .lean();

    if (!userPlugs || userPlugs.length === 0) {
      return [];
    }

    const stripIds = userPlugs.map((p) => p._id);
    const todayStr = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    // Fetch today's metrics
    const todayRecords = await MetricDaily.find({
      stripId: { $in: stripIds },
      outletNumber: 0,
      date: todayStr,
    }).lean();

    // Fetch 30-day metrics
    const monthRecords = await MetricDaily.find({
      stripId: { $in: stripIds },
      outletNumber: 0,
      dateTimestamp: { $gte: thirtyDaysAgo },
    }).lean();

    return userPlugs.map((plug) => {
      const today = todayRecords.find((r) => r.stripId.toString() === plug._id.toString());
      const pMonthRecords = monthRecords.filter((r) => r.stripId.toString() === plug._id.toString());
      const pWeekRecords = pMonthRecords.filter((r) => new Date(r.dateTimestamp) >= sevenDaysAgo);

      const todayKwh = today ? today.totalKwh : 0;
      const weekKwh = Math.round(pWeekRecords.reduce((acc, r) => acc + (r.totalKwh || 0), 0) * 1000) / 1000;
      const monthKwh = Math.round(pMonthRecords.reduce((acc, r) => acc + (r.totalKwh || 0), 0) * 1000) / 1000;

      return {
        stripId: plug._id,
        name: plug.arabicName || plug.name,
        serialNumber: plug.serialNumber,
        roomId: plug.roomId,
        todayKwh,
        todayCost: Math.round(todayKwh * this.DEFAULT_TARIFF_RATE * 100) / 100,
        weekKwh,
        monthKwh,
        avgWatts: today ? today.avgWatts : 0,
        peakWatts: today ? today.peakWatts : 0,
      };
    });
  }
}

export const metricsService = new MetricsService();
export default metricsService;
