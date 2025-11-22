import express, { Request, Response, NextFunction } from 'express';
import { ApplicationException } from './exceptions/ApplicationException';
import { ReservationService } from './services/ReservationService';
import { ReservationValidator } from './validators/ReservationValidator';
import { ReservationRepository } from './repositories/ReservationRepository';
import { InMemoryRepository } from './repositories/InMemoryRepository';
import { User } from './models/User';
import { Caravan } from './models/Caravan';

// --- Composition Root / Dependency Injection Container ---
// In a larger application, this would be handled by a DI library like InversifyJS or TypeDI.
const userRepo = new InMemoryRepository<User>();
const caravanRepo = new InMemoryRepository<Caravan>();
const reservationRepo = new ReservationRepository();

const reservationValidator = new ReservationValidator(reservationRepo, userRepo, caravanRepo);
const reservationService = new ReservationService(reservationRepo, caravanRepo, reservationValidator);
// --- End of Composition Root ---

// --- Pre-populate with some data for demonstration ---
const setupDemoData = async () => {
  console.log('Seeding database with demo data...');
  try {
    await userRepo.save({ id: 'guest-1', name: 'Test Guest', role: 'guest', contact: 'guest@test.com', isVerified: true });
    await caravanRepo.save({ 
      id: 'caravan-1',
      hostId: 'host-1',
      capacity: 4,
      amenities: ['Kitchen', 'Wi-Fi'],
      photos: [],
      location: 'Seoul, South Korea',
      status: 'available',
      dailyRate: 150
    });
    console.log('Demo data seeded successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};
// --- End of Demo Data ---


const app = express();
app.use(express.json());

// --- Routes ---
app.post('/reservations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { guestId, caravanId, startDate, endDate } = req.body;
    
    // Basic input validation
    if (!guestId || !caravanId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields: guestId, caravanId, startDate, endDate' });
    }
    
    const request = {
      guestId,
      caravanId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const newReservation = await reservationService.createReservation(request);
    res.status(201).json(newReservation);
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
});

// --- Global Error Handler Middleware ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  if (err instanceof ApplicationException) {
    res.status(err.status).json({ name: err.name, message: err.message });
  } else {
    res.status(500).json({ name: 'InternalServerError', message: 'An unexpected error occurred.' });
  }
});


const PORT = process.env.PORT || 3000;

const startServer = async () => {
    await setupDemoData();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

startServer();
