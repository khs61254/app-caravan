import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { authMiddleware } from '../middleware/authMiddleware'; // Import the authMiddleware

// This function returns a new router instance with the auth routes.
// It takes the AuthService and UserRepository as dependencies, allowing us to inject them from our main application file.
export const createAuthRouter = (authService: AuthService, userRepository: UserRepository): Router => {
  const router = Router();
  const authenticate = authMiddleware(userRepository); // Initialize authMiddleware with userRepository

  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', authenticate, (req: Request, res: Response) => {
    // req.user is populated by the authMiddleware
    if (req.user) {
      res.status(200).json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  return router;
};