// INPUT: Astro events API routes.
// OUTPUT: Return curated astrological events for a given date.
// POS: Astro events endpoint.

import { Router, Request, Response } from 'express';
import { loadAstroEvents } from '../data/astro-events.js';

export const astroRouter = Router();

const resolveDate = (value?: string) => {
  if (!value) return new Date();
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoMatch.test(value)) return new Date();
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

astroRouter.get('/events', async (req: Request, res: Response) => {
  try {
    const dateParam = req.query.date as string | undefined;
    const target = resolveDate(dateParam);
    const targetKey = target.toISOString().slice(0, 10);
    const events = await loadAstroEvents();
    const filtered = events.filter(event => event.startDate <= targetKey && event.endDate >= targetKey);
    res.json({ events: filtered });
  } catch (error) {
    console.error('Get astro events error:', error);
    res.status(500).json({ error: 'Failed to get astro events' });
  }
});
