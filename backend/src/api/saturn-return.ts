// INPUT: Saturn Return calculator API route.
// OUTPUT: Exports Express router for /api/saturn-return endpoint.
// POS: Saturn Return API; update this header and FOLDER.md if modified.

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { calculateSaturnReturn } from "../services/saturn-return.js";

export const saturnReturnRouter = Router();

// P1 fix: dedicated rate limit for compute-heavy endpoint
const saturnReturnLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

saturnReturnRouter.use(saturnReturnLimiter);

// GET /api/saturn-return?date=YYYY-MM-DD&time=HH:mm&timezone=...&lat=...&lon=...
saturnReturnRouter.get("/", async (req, res) => {
  const { date, time, timezone, lat, lon, city } = req.query;

  if (!date || typeof date !== "string") {
    res
      .status(400)
      .json({ error: "Missing required parameter: date (YYYY-MM-DD)" });
    return;
  }

  // P1 fix: validate lat/lon before passing to service
  const parsedLat = lat ? Number(lat) : undefined;
  const parsedLon = lon ? Number(lon) : undefined;

  if (lat && (!Number.isFinite(parsedLat) || parsedLat! < -90 || parsedLat! > 90)) {
    res
      .status(400)
      .json({ error: "Invalid latitude. Must be a number between -90 and 90." });
    return;
  }

  if (lon && (!Number.isFinite(parsedLon) || parsedLon! < -180 || parsedLon! > 180)) {
    res
      .status(400)
      .json({ error: "Invalid longitude. Must be a number between -180 and 180." });
    return;
  }

  try {
    const result = await calculateSaturnReturn({
      date,
      time: typeof time === "string" ? time : undefined,
      timezone: typeof timezone === "string" ? timezone : undefined,
      lat: parsedLat,
      lon: parsedLon,
      city: typeof city === "string" ? city : undefined,
    });

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calculation failed";

    // Only expose known validation errors; hide internal errors
    const isValidationError =
      message.includes("Invalid date") ||
      message.includes("Invalid time") ||
      message.includes("Invalid lat") ||
      message.includes("Invalid lon") ||
      message.includes("future");

    if (isValidationError) {
      res.status(400).json({ error: message });
      return;
    }

    // P1 fix: generic error for 500 cases, don't leak internals
    res.status(500).json({ error: "Calculation failed. Please try again." });
  }
});
