import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository'; // Assuming UserRepository is accessible
import { User } from '../models/User';
import { NotFoundException } from '../exceptions/NotFoundException'; // Import NotFoundException

const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret'; // Use the same secret as AuthService

// Extend the Request object to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
    }
  }
}

export const authMiddleware = (userRepository: UserRepository) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      let user: Omit<User, 'password'> | null = null;
      try {
        const foundUser = await userRepository.findById(decoded.id, 'users');
        const { password, ...userWithoutPassword } = foundUser;
        user = userWithoutPassword;
      } catch (findError) {
        if (findError instanceof NotFoundException) {
          return res.status(401).json({ message: 'User not found' });
        }
        throw findError; // Re-throw other errors
      }
      
      if (!user) { // Should ideally be caught by NotFoundException, but as a fallback
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      next(error); // Pass other errors to the global error handler
    }
  };
};
