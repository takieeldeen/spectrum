import { Request, Response } from "express";
import metricsService from "../services/metrics.service";
import Plug from "../models/plug.model";

export class AnalyticsController {
  /**
   * Helper to resolve authenticated user ID
   */
  private getUserId(req: Request): string | null {
    return (
      req.userId ||
      req.user?._id?.toString() ||
      (req.user as any)?.id ||
      null
    );
  }

  /**
   * GET /analytics/day
   * Supports either:
   * 1. Specific strip: ?stripId=XYZ&outlet=0
   * 2. User-wide (all user strips combined + per-strip breakdown): no stripId needed
   */
  public async getDay(req: Request, res: Response) {
    try {
      const { stripId, outlet, date } = req.query;
      const targetDate = date ? new Date(date as string) : new Date();

      // If no specific strip requested, aggregate across all strips owned by user
      if (!stripId || typeof stripId !== "string") {
        const userId = this.getUserId(req);
        if (!userId) {
          return res.status(401).json({ success: false, message: "User authentication required" });
        }

        const data = await metricsService.getUserDayGraph(userId, targetDate);
        return res.status(200).json({ success: true, data });
      }

      const outletNum = outlet !== undefined ? parseInt(outlet as string, 10) : 0;
      const data = await metricsService.getDayGraph(stripId, outletNum, targetDate);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      console.error("Error in getDay analytics:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch day metrics",
      });
    }
  }

  /**
   * GET /analytics/week
   * Supports either:
   * 1. Specific strip: ?stripId=XYZ&outlet=0
   * 2. User-wide (all user strips combined + per-strip comparison): no stripId needed
   */
  public async getWeek(req: Request, res: Response) {
    try {
      const { stripId, outlet } = req.query;

      if (!stripId || typeof stripId !== "string") {
        const userId = this.getUserId(req);
        if (!userId) {
          return res.status(401).json({ success: false, message: "User authentication required" });
        }

        const data = await metricsService.getUserWeekGraph(userId);
        return res.status(200).json({ success: true, data });
      }

      const outletNum = outlet !== undefined ? parseInt(outlet as string, 10) : 0;
      const data = await metricsService.getWeekGraph(stripId, outletNum);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      console.error("Error in getWeek analytics:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch week metrics",
      });
    }
  }

  /**
   * GET /analytics/month
   */
  public async getMonth(req: Request, res: Response) {
    try {
      const { stripId, outlet } = req.query;

      if (!stripId || typeof stripId !== "string") {
        return res.status(400).json({
          success: false,
          message: "stripId query parameter is required for month graph",
        });
      }

      const outletNum = outlet !== undefined ? parseInt(outlet as string, 10) : 0;
      const data = await metricsService.getMonthGraph(stripId, outletNum);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      console.error("Error in getMonth analytics:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch month metrics",
      });
    }
  }

  /**
   * GET /analytics/strips
   * Returns a card-ready summary of ALL strips owned by the authenticated user
   * (today kWh, week kWh, month kWh, estimated cost, peak watts)
   */
  public async getStripsSummary(req: Request, res: Response) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        return res.status(401).json({ success: false, message: "User authentication required" });
      }

      const data = await metricsService.getUserStripsSummary(userId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      console.error("Error in getStripsSummary:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch strips summary",
      });
    }
  }

  /**
   * GET /analytics/breakdown?stripId=...&period=day|week|month
   */
  public async getBreakdown(req: Request, res: Response) {
    try {
      const { stripId, period } = req.query;

      if (!stripId || typeof stripId !== "string") {
        return res.status(400).json({
          success: false,
          message: "stripId query parameter is required",
        });
      }

      const validPeriod =
        period === "week" || period === "month" ? period : "day";
      const data = await metricsService.getBreakdown(stripId, validPeriod);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      console.error("Error in getBreakdown analytics:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to fetch breakdown metrics",
      });
    }
  }

  /**
   * POST /analytics/flush
   * Force flush in-memory micro-batch to MongoDB (admin/testing)
   */
  public async triggerFlush(req: Request, res: Response) {
    try {
      const count = await metricsService.flush();
      return res.status(200).json({
        success: true,
        message: `Flushed ${count} metric buckets to database`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * POST /analytics/rollup
   * Triggers rollups for hourly and daily downsampling
   */
  public async triggerRollup(req: Request, res: Response) {
    try {
      const hourlyCount = await metricsService.rollupHourly();
      const dailyCount = await metricsService.rollupDaily();

      return res.status(200).json({
        success: true,
        message: "Rollup completed successfully",
        hourlyCount,
        dailyCount,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
export default analyticsController;
