// INPUT: Geo API 路由。
// OUTPUT: 导出 geo 路由。
// POS: Geo 端点；若更新此文件，务必更新本头注释与所属文件夹的 FOLDER.md。

import { Router } from 'express';
import { searchCities } from '../services/geocoding.js';

export const geoRouter = Router();

// GET /api/geo/search - 城市模糊搜索
geoRouter.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = Math.min(Number(req.query.limit) || 5, 10);

    if (!query || query.length < 2) {
      return res.json({ cities: [] });
    }

    const cities = await searchCities(query, limit);
    res.json({ cities });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
