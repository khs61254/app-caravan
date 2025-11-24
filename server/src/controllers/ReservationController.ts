import { Router, Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/ReservationService';
import { ReservationValidator } from '../validators/ReservationValidator';
import { User } from '@models/User';

export const createReservationRouter = (
  reservationService: ReservationService,
  reservationValidator: ReservationValidator,
) => {
  const router = Router();

  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { cavanId, startDate, endDate } = req.body;
        const guestId = req.user?.id; // guestId from authenticated user

        if (!guestId) {
          return res.status(401).json({ message: 'Authentication required for reservation' });
        }
        
        // Basic input validation
        if (!cavanId || !startDate || !endDate) {
          return res.status(400).json({ message: 'Missing required fields: cavanId, startDate, endDate' });
        }
        
        const request = {
          guestId,
          cavanId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        };

        const newReservation = await reservationService.createReservation(request);
        res.status(201).json(newReservation);
      } catch (error) {
        next(error); // Pass error to the global error handler
      }
    }
  );

  return router;
};
