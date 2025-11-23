import 'dotenv/config';
import 'module-alias/register';
import express, { Request, Response, NextFunction } from 'express';
import { ApplicationException } from './exceptions/ApplicationException';
import { ReservationService } from './services/ReservationService';
import { ReservationValidator } from './validators/ReservationValidator';
import { ReservationRepository } from './repositories/ReservationRepository';
import { User } from './models/User';
import { Cavan } from './models/Cavan';
import { CavanRepository } from './repositories/CavanRepository';
import { CavanService, CavanSortBy } from './services/CavanService';
import { GoogleMapsService, Location } from './services/GoogleMapsService';
import { UserRepository } from './repositories/UserRepository';
import { AuthService } from './services/AuthService';
import { createAuthRouter } from './controllers/AuthController';
import { createCavanRouter } from './controllers/CavanController';
import { authMiddleware } from './middleware/authMiddleware';

// Extend the Request object to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
    }
  }
}

// --- Composition Root / Dependency Injection Container ---
// In a larger application, this would be handled by a DI library like InversifyJS or TypeDI.
const userRepo = new UserRepository();
const cavanRepo = new CavanRepository();
const reservationRepo = new ReservationRepository();
const googleMapsService = new GoogleMapsService(); // Instantiate the new service
const authService = new AuthService(userRepo);

const reservationValidator = new ReservationValidator(reservationRepo, userRepo, cavanRepo);
const reservationService = new ReservationService(reservationRepo, cavanRepo, reservationValidator);
// Inject GoogleMapsService into CavanService
const cavanService = new CavanService(cavanRepo, userRepo, reservationRepo, googleMapsService);
// --- End of Composition Root ---

// --- Pre-populate with some data for demonstration ---
const setupDemoData = async () => {
  console.log('Seeding database with demo data...');
  try {
    // Register users and get their new IDs
    const guest = await authService.register({ name: 'Test Guest', email: 'guest@test.com', password: 'password' });
    const host1 = await authService.register({ name: 'Host One', email: 'host1@test.com', password: 'password', role: 'host' });
    const host2 = await authService.register({ name: 'Host Two', email: 'host2@test.com', password: 'password', role: 'host' });
    
    await cavanRepo.save({ 
      id: 'cavan-1',
      name: 'Modern & Cozy Cavan',
      hostId: host1.id, // Use the new host ID
      capacity: 4,
      amenities: ['Kitchen', 'Wi-Fi', 'Air Conditioner'],
      photos: [
        'https://picsum.photos/seed/cavan-1-A/800/600',
        'https://picsum.photos/seed/cavan-1-B/800/600',
        'https://picsum.photos/seed/cavan-1-C/800/600',
      ],
      location: { lat: 37.5665, lng: 126.9780 }, // Seoul
      status: 'available',
      dailyRate: 150,
      likes: 25,
    });
    await cavanRepo.save({ 
      id: 'cavan-2',
      name: 'Vintage Style Camper',
      hostId: host2.id, // Use the new host ID
      capacity: 2,
      amenities: ['Kitchen'],
      photos: [
        'https://picsum.photos/seed/cavan-2-A/800/600',
        'https://picsum.photos/seed/cavan-2-B/800/600',
        'https://picsum.photos/seed/cavan-2-C/800/600',
      ],
      location: { lat: 35.1796, lng: 129.0756 }, // Busan
      status: 'available',
      dailyRate: 120,
      likes: 40,
    });
    await cavanRepo.save({ 
      id: 'cavan-3',
      name: 'Family Friendly RV',
      hostId: host1.id, // Use the new host ID
      capacity: 6,
      amenities: ['Kitchen', 'Wi-Fi', 'TV'],
      photos: [
        'https://picsum.photos/seed/cavan-3-A/800/600',
        'https://picsum.photos/seed/cavan-3-B/800/600',
        'https://picsum.photos/seed/cavan-3-C/800/600',
      ],
      location: { lat: 33.4996, lng: 126.5312 }, // Jeju
      status: 'available',
      dailyRate: 200,
      likes: 15,
    });
    console.log('Demo data seeded successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};
// --- End of Demo Data ---


const app = express();
app.use(express.json());

// Initialize authMiddleware with userRepo
const authenticate = authMiddleware(userRepo);

// --- Routes ---
app.use('/api/auth', createAuthRouter(authService, userRepo));
app.use('/api/cavans', authenticate, createCavanRouter(cavanService)); // Apply authentication to cavan routes
app.post('/api/reservations', authenticate, async (req: Request, res: Response, next: NextFunction) => { // Apply authentication to reservation creation
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
});
app.get('/api/cavans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sortBy = (req.query.sortBy as CavanSortBy) || 'distance';
    const lat = req.query.lat as string | undefined;
    const lng = req.query.lng as string | undefined;
    
    // Basic validation for sortBy parameter
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

app.get('/api/cavans/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const details = await cavanService.getCavanDetails(id);
    res.status(200).json(details);
  } catch (error) {
    next(error);
  }
});


// --- Global Error Handler Middleware ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`Error: ${err.name} - ${err.message}\nStack: ${err.stack}`);
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

