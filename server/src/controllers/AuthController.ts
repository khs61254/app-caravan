import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';

// This function returns a new router instance with the auth routes.
// It takes the AuthService as a dependency, allowing us to inject it from our main application file.
export const createAuthRouter = (authService: AuthService): Router => {
  const router = Router();

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

  return router;
};