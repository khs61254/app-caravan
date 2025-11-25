import { Router, Request, Response, NextFunction } from 'express';
import { CavanService, CavanSortBy } from '../services/CavanService';
import { User } from '@models/User';
import { Location } from '../services/GoogleMapsService';
import { authMiddleware } from '../middleware/authMiddleware';
import { UserRepository } from '@repositories/UserRepository';

// This function returns a new router instance with the cavan routes.
export const createCavanRouter = (cavanService: CavanService, userRepository: UserRepository): Router => {
  const router = Router();
  const authenticate = authMiddleware(userRepository);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sortBy = (req.query.sortBy as CavanSortBy) || 'distance';
      const lat = req.query.lat as string | undefined;
      const lng = req.query.lng as string | undefined;
      
      const validSortOptions: CavanSortBy[] = ['distance', 'likes', 'price'];
      if (!validSortOptions.includes(sortBy)) {
        return res.status(400).json({ message: `Invalid sortBy parameter. Must be one of: ${validSortOptions.join(', ')}` });
      }

      let origin: Location | undefined;
      if (sortBy === 'distance') {
        if (!lat || !lng) {
          return res.status(400).json({ message: 'lat and lng query parameters are required for distance sorting.' });
        }
        origin = { lat: parseFloat(lat), lng: parseFloat(lng) };
        if (isNaN(origin.lat) || isNaN(origin.lng)) {
          return res.status(400).json({ message: 'Invalid lat or lng parameters. Must be numbers.' });
        }
      }
      
      const cavans = await cavanService.getCavans(sortBy, origin);
      res.status(200).json(cavans);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hostId = req.user?.id; // Get hostId from authenticated user
      
      if (!hostId) {
        // This case should ideally not be hit if `authenticate` middleware is working correctly
        return res.status(401).json({ message: 'Authentication failed, user ID not available.' });
      }
      
      // Check if the user has the 'host' role
      if (req.user?.role !== 'host') {
        return res.status(403).json({ message: 'Only hosts can create cavans' });
      }

      const { name, dailyRate, location, photos, amenities, capacity } = req.body;

      // Basic validation
      if (!name || !dailyRate || !location || !photos || !amenities || !capacity) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const newCavan = await cavanService.createCavan({ name, dailyRate, location, hostId, photos, amenities, capacity });
      res.status(201).json(newCavan);
    } catch (error) {
      next(error);
    }
  });

  router.get('/liked', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const likedCavans = await cavanService.getLikedCavans(userId);
      res.status(200).json(likedCavans);
    } catch (error) {
      next(error);
    }
  });

  router.get('/my-cavans', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (req.user?.role !== 'host') {
        return res.status(403).json({ message: 'Only hosts can view their registered cavans' });
      }

      const registeredCavans = await cavanService.getRegisteredCavans(userId);
      res.status(200).json(registeredCavans);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const details = await cavanService.getCavanDetails(id);
      res.status(200).json(details);
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/like', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: cavanId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const updatedCavan = await cavanService.toggleLike(cavanId, userId);
      res.status(200).json(updatedCavan);
    } catch (error) {
      next(error);
    }
  });


  router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: cavanId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      await cavanService.deleteCavan(cavanId, userId);
      res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
      next(error);
    }
  });


  return router;
};
