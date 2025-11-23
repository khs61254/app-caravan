import { Router, Request, Response, NextFunction } from 'express';
import { CavanService } from '../services/CavanService';
import { User } from '@models/User';

// This function returns a new router instance with the cavan routes.
export const createCavanRouter = (cavanService: CavanService): Router => {
  const router = Router();

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In a real app, hostId would come from the authenticated user's session/token
      const { name, dailyRate, location, hostId, photos, amenities, capacity } = req.body;
      
      // Basic validation
      if (!name || !dailyRate || !location || !hostId || !photos || !amenities || !capacity) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const newCavan = await cavanService.createCavan({ name, dailyRate, location, hostId, photos, amenities, capacity });
      res.status(201).json(newCavan);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
